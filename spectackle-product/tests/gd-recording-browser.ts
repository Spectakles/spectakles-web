import { MicrophoneTest, INITIAL_MICROPHONE } from '../src/gd-audio/microphone';
import captureUrl from '../src/gd-audio/capture.worklet.ts?worker&url';
import { LocalRecording, INITIAL_RECORDING } from '../src/gd-audio/recording';
import type { RecordingEvent, RecordingSink, SavedRecording } from '../src/gd-audio/recording';
import type { Boundary } from '../src/gd-audio/dsp';

const status = document.querySelector<HTMLPreElement>('#status')!;
const run = document.querySelector<HTMLButtonElement>('#run')!;
const list = document.querySelector<HTMLOListElement>('#results')!;
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function result(message: string) { const item = document.createElement('li'); item.textContent = `PASS: ${message}`; list.append(item); }
async function until(check: () => boolean, message: string, timeout = 15000) {
  const end = performance.now() + timeout;
  while (!check()) { if (performance.now() > end) throw new Error(message); await pause(30); }
}
const socketUrl = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/api/recordings/ws`;
async function readManifest(id: string): Promise<SavedRecording> {
  const response = await fetch(`/api/recordings/${id}/manifest`);
  assert(response.ok, 'Manifest unavailable.');
  return response.json();
}
function makeRecording() {
  let snapshot = { ...INITIAL_RECORDING };
  let failure = '';
  const expected = new Map<number, Int16Array[]>();
  const client = new LocalRecording({ url: socketUrl, snapshot: (value) => { snapshot = value; }, error: (message) => { failure = message; } });
  const sink: RecordingSink = {
    open: (device) => client.open(device), finish: (reason, incomplete) => client.finish(reason, incomplete),
    push: (event) => {
      if (event.type === 'audio') {
        const frames = expected.get(event.id) ?? [];
        frames.push(new Int16Array(event.pcm.slice(0))); expected.set(event.id, frames);
      }
      client.push(event);
    },
  };
  return { sink, expected, get snapshot() { return snapshot; }, get failure() { return failure; } };
}
async function verify(recording: ReturnType<typeof makeRecording>) {
  assert(!recording.failure, recording.failure);
  assert(recording.snapshot.phase === 'saved', 'Final disk acknowledgement missing.');
  const manifest = await readManifest(recording.snapshot.recording!.recording_id);
  for (const [index, clip] of manifest.utterances.entries()) {
    assert(clip.order === index + 1 && clip.id === index + 1, 'Unordered utterance manifest.');
    const response = await fetch(`/api/recordings/${manifest.recording_id}/audio/${clip.file}`);
    assert(response.ok, 'Saved WAV unavailable.');
    const bytes = await response.arrayBuffer();
    const view = new DataView(bytes);
    assert(new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8, 12)) === 'WAVE', 'Invalid WAV container.');
    assert(view.getUint32(24, true) === 16000 && view.getUint16(22, true) === 1 && view.getUint16(34, true) === 16, 'Wrong WAV audio format.');
    assert(view.getUint32(40, true) === clip.sample_count * 2 && bytes.byteLength === 44 + clip.sample_count * 2, 'WAV duration/header mismatch.');
    const frames = recording.expected.get(clip.id) ?? [];
    assert(frames.length * 512 === clip.sample_count, 'Lost or duplicated PCM frames.');
    let offset = 44;
    for (const frame of frames) for (const sample of frame) { assert(view.getInt16(offset, true) === sample, 'Saved PCM differs from accepted VAD audio.'); offset += 2; }
    const ranged = await fetch(`/api/recordings/${manifest.recording_id}/audio/${clip.file}`, { headers: { Range: 'bytes=0-43' } });
    assert(ranged.status === 206 && (await ranged.arrayBuffer()).byteLength === 44, 'Browser WAV range playback unavailable.');
  }
  return manifest;
}

run.onclick = async () => {
  run.disabled = true; list.replaceChildren(); status.textContent = 'Running synthetic recording checks…';
  const context = new AudioContext({ sampleRate: 48000 });
  const resume = context.resume();
  let worker: Worker | null = null;
  let controller: MicrophoneTest | null = null;
  let final = '';
  try {
    await resume;
    assert((await fetch('/api/health').then((r) => r.json())).recordings, 'Start the Stage 4 backend first.');
    const pcm = new Int16Array(await fetch('./fixtures/speech.pcm').then((r) => r.arrayBuffer()));
    const recording = makeRecording();
    await recording.sink.open('Synthetic exact-PCM fixture');
    worker = new Worker(new URL('../src/gd-audio/vad.worker.ts', import.meta.url), { type: 'module' });
    let ready = false, drained = false, failure = '';
    const boundaries: Boundary[] = [];
    const pipe = new MessageChannel();
    worker.onmessage = ({ data }) => {
      if (data.type === 'ready') ready = true;
      if (data.type === 'error') failure = data.message;
      if (data.type === 'recording') recording.sink.push(data.event as RecordingEvent);
      if (data.type === 'boundary') boundaries.push(data.boundary);
      if (data.type === 'drained') drained = true;
    };
    worker.onerror = (event) => { failure = event.message; };
    worker.postMessage({ type: 'init', modelUrl: `${location.origin}/gd-audio/silero_vad.onnx`, runtimeUrl: `${location.origin}/gd-audio/ort/`, recordAudio: true });
    await until(() => ready || !!failure, 'Worker initialization timed out.', 30000); assert(!failure, failure);
    worker.postMessage({ type: 'connect', port: pipe.port1 }, [pipe.port1]);
    let ack: (() => void) | null = null;
    pipe.port2.onmessage = () => ack?.(); pipe.port2.start();
    for (let round = 0; round < 2; round++) for (let i = 0; i < pcm.length; i += 512) {
      const frame = pcm.slice(i, i + 512).buffer;
      await Promise.race([
        new Promise<void>((resolve) => { ack = resolve; pipe.port2.postMessage({ type: 'frame', epoch: 0, sequence: round * pcm.length / 512 + i / 512, pcm: frame }, [frame]); }),
        pause(3000).then(() => { throw new Error(failure || 'Frame timeout.'); }),
      ]);
      await pause(5); assert(!recording.failure, recording.failure);
    }
    pipe.port2.postMessage({ type: 'finish', epoch: 0, reason: 'stopped' });
    await until(() => drained || !!failure, 'Worker did not drain.'); assert(!failure, failure);
    await recording.sink.finish('stopped', false);
    worker.terminate(); worker = null; pipe.port2.close();
    const manifest = await verify(recording);
    assert(manifest.utterances.length >= 2 && manifest.utterances.every((clip) => !clip.incomplete), 'Expected multiple naturally ended clips.');
    assert(manifest.utterances.every((clip) => clip.pre_roll_samples === 5120), 'Pre-roll missing.');
    assert(boundaries.filter((b) => b.type === 'end').every((b) => b.reason === 'silence'), 'Unexpected speech endings.');
    result(`Real Silero worker → WebSocket → local disk saves ${manifest.utterances.length} ordered WAVs, including exact pre-roll and end silence; every saved PCM sample matches accepted worker audio.`);
    result('Saved WAV headers, sample counts, manifest order, downloads and HTTP range playback are valid.');

    const short = makeRecording(); await short.sink.open('Synthetic single accepted frame');
    short.sink.push({ type: 'start', boundary: { type: 'start', id: 1, sample: 0, startSample: 0, preRollSamples: 512, voicedMs: 32 } });
    const small = new Int16Array(512); small[0] = -32768; small[511] = 32767;
    short.sink.push({ type: 'audio', id: 1, sample: 0, pcm: small.buffer });
    short.sink.push({ type: 'end', boundary: { type: 'end', id: 1, sample: 512, voicedMs: 32, reason: 'silence', incomplete: false } });
    await short.sink.finish('stopped', false);
    assert((await verify(short)).utterances[0].sample_count === 512, 'Short accepted speech was filtered.');
    result('A 32 ms accepted segment survives storage without a minimum-duration filter.');

    const destination = context.createMediaStreamDestination();
    const buffer = context.createBuffer(1, pcm.length, 16000);
    for (let i = 0; i < pcm.length; i++) buffer.getChannelData(0)[i] = pcm[i] / 32768;
    const source = context.createBufferSource(); source.buffer = buffer; source.loop = true; source.connect(destination);
    const active = makeRecording(); let snapshot = { ...INITIAL_MICROPHONE };
    const makeController = (stream: MediaStream, sink: RecordingSink) => new MicrophoneTest({
      createWorker: () => new Worker(new URL('../src/gd-audio/vad.worker.ts', import.meta.url), { type: 'module' }),
      workletUrl: captureUrl, modelUrl: `${location.origin}/gd-audio/silero_vad.onnx`, runtimeUrl: `${location.origin}/gd-audio/ort/`,
      acquireStream: async () => stream, recording: sink,
      snapshot: (value) => { snapshot = value; }, boundary: () => undefined,
    });
    controller = makeController(destination.stream, active.sink); await controller.start(); source.start();
    await until(() => snapshot.speaking || snapshot.phase === 'error', 'Live synthetic speech not detected.');
    assert(snapshot.phase !== 'error', snapshot.message); await pause(200);
    await controller.stop(); source.stop();
    assert(snapshot.phase === 'idle' && destination.stream.getTracks().every((track) => track.readyState === 'ended'), 'Stop did not release capture.');
    const partial = await verify(active);
    assert(partial.utterances.length === 1 && partial.utterances[0].incomplete && partial.utterances[0].end_reason === 'stopped', 'Mid-speech Stop did not finalize partial WAV.');
    result('Real 48 kHz AudioWorklet capture drains full accepted frames on Stop, releases tracks and saves a playable partial WAV.');

    const quiet = makeRecording(); const silentStream = context.createMediaStreamDestination();
    controller = makeController(silentStream.stream, quiet.sink); await controller.start();
    await until(() => snapshot.frames >= 5 || snapshot.phase === 'error', 'Silence capture did not run.');
    assert(snapshot.phase !== 'error', snapshot.message); await controller.stop();
    const empty = await verify(quiet);
    assert(empty.utterances.length === 0 && empty.recording_id !== partial.recording_id, 'Silence created audio or reused recording identity.');
    result('A fresh silence-only test gets a new folder and manifest with zero WAVs.');

    let socket: WebSocket | null = null, lost = '', disconnectedId = '';
    const interrupted = new LocalRecording({ url: socketUrl, socketFactory: (url) => { socket = new WebSocket(url); return socket; }, snapshot: (value) => { if (value.recording) disconnectedId = value.recording.recording_id; }, error: (message) => { lost = message; } });
    await interrupted.open('Synthetic disconnect');
    interrupted.push({ type: 'start', boundary: { type: 'start', id: 1, sample: 0, startSample: 0, preRollSamples: 512, voicedMs: 32 } });
    interrupted.push({ type: 'audio', id: 1, sample: 0, pcm: new Int16Array(512).buffer });
    interrupted.push({ type: 'audio', id: 1, sample: 512, pcm: new Int16Array(512).buffer });
    await pause(100); (socket as WebSocket | null)?.close(4001, 'synthetic_disconnect');
    await until(() => !!lost, 'Connection loss not reported.');
    let recovered: SavedRecording | null = null;
    for (let i = 0; i < 50; i++) { recovered = await readManifest(disconnectedId); if (recovered.status === 'incomplete') break; await pause(50); }
    assert(recovered?.status === 'incomplete' && recovered.utterances[0].incomplete && recovered.utterances[0].sample_count === 1024, 'Disconnected received audio was not preserved.');
    const library = await fetch('/api/recordings').then((r) => r.json());
    assert(library.recordings.some((item: SavedRecording) => item.recording_id === disconnectedId), 'Interrupted test absent from disk library.');
    result('Disconnect without a finish command preserves received PCM as an incomplete WAV and leaves it discoverable in the saved-test library.');
    final = 'ALL 6 BROWSER RECORDING CHECKS PASSED. Synthetic audio only.';
  } catch (error) { final = `FAILED: ${error instanceof Error ? error.message : String(error)}`; }
  finally { worker?.terminate(); await controller?.stop(); await context.close(); status.textContent = final; run.disabled = false; }
};
