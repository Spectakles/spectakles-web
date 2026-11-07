import { MicrophoneTest, INITIAL_MICROPHONE } from '../src/gd-audio/microphone';
import captureUrl from '../src/gd-audio/capture.worklet.ts?worker&url';
import type { Boundary } from '../src/gd-audio/dsp';

const status = document.querySelector<HTMLPreElement>('#status')!;
const run = document.querySelector<HTMLButtonElement>('#run')!;
const list = document.querySelector<HTMLOListElement>('#results')!;
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function result(message: string) { const li = document.createElement('li'); li.textContent = `PASS: ${message}`; list.append(li); }
async function until(check: () => boolean, message: string, timeout = 12000) {
  const end = performance.now() + timeout;
  while (!check()) { if (performance.now() > end) throw new Error(message); await pause(40); }
}

run.onclick = async () => {
  run.disabled = true;
  list.replaceChildren();
  status.textContent = 'Running…';
  const sourceContext = new AudioContext({ sampleRate: 48000 });
  const resume = sourceContext.resume();
  let controller: MicrophoneTest | null = null;
  let worker: Worker | null = null;
  try {
    await resume;
    const [bytes, reference] = await Promise.all([
      fetch('./fixtures/speech.pcm').then((r) => r.arrayBuffer()),
      fetch('./fixtures/speech-reference.json').then((r) => r.json()),
    ]);
    const pcm = new Int16Array(bytes);
    assert(reference.probabilities.some((p: number) => p > 0.9), 'Fixture did not contain detectable speech.');

    // Direct worker comparison uses the exact PCM fed to the Python reference.
    worker = new Worker(new URL('../src/gd-audio/vad.worker.ts', import.meta.url), { type: 'module' });
    let ready = false;
    let workerError = '';
    const probabilities: number[] = [];
    const pipe = new MessageChannel();
    worker.onmessage = ({ data }) => {
      if (data.type === 'ready') ready = true;
      if (data.type === 'error') workerError = data.message;
      if (data.type === 'stats') probabilities[data.sequence] = data.probability;
    };
    worker.onerror = (event) => { workerError = event.message; };
    worker.postMessage({ type: 'init', modelUrl: `${location.origin}/gd-audio/silero_vad.onnx`, runtimeUrl: `${location.origin}/gd-audio/ort/`, diagnosticFrames: true });
    await until(() => ready || !!workerError, 'Speech worker did not initialize.', 30000);
    assert(!workerError, workerError);
    worker.postMessage({ type: 'connect', port: pipe.port1 }, [pipe.port1]);
    let ack: (() => void) | null = null;
    pipe.port2.onmessage = () => ack?.();
    pipe.port2.start();
    for (let i = 0; i < pcm.length; i += 512) {
      const frame = pcm.slice(i, i + 512).buffer;
      await Promise.race([
        new Promise<void>((resolve) => { ack = resolve; pipe.port2.postMessage({ type: 'frame', epoch: 0, sequence: i / 512, pcm: frame }, [frame]); }),
        pause(3000).then(() => { throw new Error(workerError || 'Worker frame acknowledgement timed out.'); }),
      ]);
    }
    await until(() => probabilities.length === reference.probabilities.length, 'Missing VAD probabilities.');
    const maxError = Math.max(...probabilities.map((p, i) => Math.abs(p - reference.probabilities[i])));
    assert(maxError < 0.0001, `ONNX/JIT probability difference ${maxError}`);
    assert(probabilities.every((p, i) => (p >= 0.9) === (reference.probabilities[i] >= 0.9)), 'ONNX/JIT speech threshold decisions differ.');
    result(`Real ONNX worker matches Python JIT on ${probabilities.length} speech/silence frames; max probability error ${maxError.toExponential(2)}.`);
    worker.terminate(); worker = null; pipe.port2.close();

    const destination = sourceContext.createMediaStreamDestination();
    const audio = sourceContext.createBuffer(1, pcm.length, 16000);
    const data = audio.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) data[i] = pcm[i] / 32768;
    const source = sourceContext.createBufferSource();
    source.buffer = audio; source.loop = true; source.connect(destination);
    let snapshot = { ...INITIAL_MICROPHONE };
    const boundaries: Boundary[] = [];
    const makeController = (stream: MediaStream, modelUrl = `${location.origin}/gd-audio/silero_vad.onnx`) => new MicrophoneTest({
      createWorker: () => new Worker(new URL('../src/gd-audio/vad.worker.ts', import.meta.url), { type: 'module' }),
      workletUrl: captureUrl, modelUrl, runtimeUrl: `${location.origin}/gd-audio/ort/`,
      acquireStream: async () => stream,
      snapshot: (value) => { snapshot = value; status.textContent = `${value.phase}: ${value.frames} frames, speech ${value.speaking}, probability ${value.probability.toFixed(4)}\n${value.message}`; },
      boundary: (value) => { boundaries.push(value); },
    });
    controller = makeController(destination.stream);
    await controller.start();
    assert(snapshot.phase === 'listening', snapshot.message || 'Capture did not start.');
    source.start();
    await until(() => boundaries.some((b) => b.type === 'end' && b.reason === 'silence') || snapshot.phase === 'error', 'Speech start/end not detected through the worklet.');
    assert(snapshot.phase !== 'error', snapshot.message);
    assert(boundaries[0].type === 'start' && boundaries[0].preRollSamples === 5120, 'Missing 320 ms pre-roll.');
    result(`Actual 48 kHz Web Audio → AudioWorklet → 16 kHz PCM16 → Silero detects speech and end silence; 320 ms pre-roll retained.`);

    await until(() => snapshot.speaking, 'Second speech segment did not arrive.');
    controller.toggleMute();
    await until(() => boundaries.some((b) => b.reason === 'muted'), 'Mute did not close active speech.');
    const mutedFrames = snapshot.frames;
    await pause(300);
    assert(snapshot.phase === 'muted' && !snapshot.speaking && snapshot.frames === mutedFrames, 'Audio continued after mute.');
    result('Mute stops frame processing, ends active speech as partial, and clears detector state.');
    controller.toggleMute();
    await until(() => snapshot.phase === 'listening' && snapshot.frames > mutedFrames, 'Unmute did not resume clean capture.');
    result('Unmute resumes a fresh capture generation.');
    await Promise.all([controller.stop(), controller.stop()]);
    assert(destination.stream.getTracks().every((track) => track.readyState === 'ended'), 'Stop left a live track.');
    assert(snapshot.phase === 'idle', 'Stop did not return to idle.');
    result('Repeated Stop releases the stream and shuts down cleanly.');
    source.stop();

    const fresh = sourceContext.createMediaStreamDestination();
    controller = makeController(fresh.stream);
    await controller.start();
    assert(snapshot.phase === 'listening', snapshot.message);
    await until(() => snapshot.frames >= 5, 'Fresh start did not process audio.');
    assert(!snapshot.speaking, 'Old speech leaked into the new test.');
    await controller.stop();
    result('A fresh test processes silence with no previous speech state.');

    const bad = sourceContext.createMediaStreamDestination();
    controller = makeController(bad.stream, `${location.origin}/gd-audio/missing-model.onnx`);
    await controller.start();
    assert(snapshot.phase === 'error', 'Missing model did not report an error.');
    assert(bad.stream.getTracks().every((track) => track.readyState === 'ended'), 'Asset failure left microphone tracks alive.');
    result('A missing model produces an error and releases the acquired stream.');
    status.textContent = 'ALL BROWSER AUDIO CHECKS PASSED. No real microphone was opened.';
  } catch (error) {
    status.textContent = `FAILED: ${error instanceof Error ? error.message : String(error)}`;
  } finally {
    worker?.terminate();
    await controller?.stop();
    await sourceContext.close();
    run.disabled = false;
  }
};
