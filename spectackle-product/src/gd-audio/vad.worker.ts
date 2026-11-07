import * as ort from 'onnxruntime-web/wasm';
import { AUDIO, Utterances } from './dsp';

const scope = self as unknown as {
  postMessage: (message: unknown, transfer?: Transferable[]) => void;
  onmessage: ((event: MessageEvent) => void) | null;
};
let session: ort.InferenceSession;
let audioPort: MessagePort | null = null;
let epoch = 0;
let state = new Float32Array(256);
let context = new Float32Array(64);
type Frame = { type: 'frame'; pcm: Int16Array; epoch: number; sequence: number; received: number };
type Finish = { type: 'finish'; epoch: number; reason: string };
let queue: (Frame | Finish)[] = [];
let running = false;
let failed = false;
let frames = 0;
let nextSample = 0;
let lastStats = 0;
let recordAudio = false;
let ended = false;
let playbackPort: MessagePort | null = null;
const utterances = new Utterances((event) => {
  if (event.type === 'start' || event.type === 'end') playbackPort?.postMessage({ type: 'activity', speaking: event.type === 'start' });
  if (!recordAudio) return;
  if (event.type === 'audio') {
    const pcm = event.pcm.slice().buffer;
    scope.postMessage({ type: 'recording', epoch, event: { ...event, pcm } }, [pcm]);
  } else scope.postMessage({ type: 'recording', epoch, event });
});

function finish(reason: string) {
  if (!ended) {
    ended = true;
    const boundary = utterances.reset(nextSample, reason);
    if (boundary) scope.postMessage({ type: 'boundary', epoch, boundary });
  }
  scope.postMessage({ type: 'drained', epoch });
}

function fail(error: unknown) {
  if (failed) return;
  failed = true;
  queue = [];
  const boundary = utterances.reset(nextSample, 'failure');
  if (boundary) scope.postMessage({ type: 'boundary', epoch, boundary });
  scope.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) });
}

async function infer(pcm: Int16Array) {
  const input = new Float32Array(576);
  input.set(context);
  let power = 0;
  for (let i = 0; i < pcm.length; i++) {
    input[i + 64] = pcm[i] / 32768;
    power += input[i + 64] ** 2;
  }
  const feeds = {
    input: new ort.Tensor('float32', input, [1, 576]),
    state: new ort.Tensor('float32', state, [2, 1, 128]),
    sr: new ort.Tensor('int64', BigInt64Array.of(16000n), []),
  };
  const output = await session.run(feeds);
  try {
    return {
      probability: Number(output.output.data[0]),
      state: new Float32Array(output.stateN.data as Float32Array),
      context: input.slice(-64), rms: Math.sqrt(power / pcm.length),
    };
  } finally {
    Object.values(feeds).forEach((tensor) => tensor.dispose());
    Object.values(output).forEach((tensor) => tensor.dispose());
  }
}

async function drain() {
  if (running) return;
  running = true;
  try {
    while (queue.length && !failed) {
      const frame = queue.shift()!;
      if (frame.epoch !== epoch) continue;
      if (frame.type === 'finish') { finish(frame.reason); continue; }
      if (performance.now() - frame.received > 2000) throw new Error('Speech processing exceeded its two-second queue limit. Start the microphone test again.');
      const began = performance.now();
      const result = await infer(frame.pcm);
      audioPort?.postMessage({ type: 'ack', epoch: frame.epoch });
      if (frame.epoch !== epoch) continue;
      state = result.state;
      context = result.context;
      const sample = frame.sequence * AUDIO.frameSamples;
      nextSample = sample + AUDIO.frameSamples;
      frames++;
      const boundary = utterances.consume(frame.pcm, result.probability, sample);
      if (boundary) scope.postMessage({ type: 'boundary', epoch, boundary });
      if (boundary || performance.now() - lastStats >= 100) {
        lastStats = performance.now();
        scope.postMessage({
          type: 'stats', epoch, frames, probability: result.probability, rms: result.rms,
          speaking: utterances.detector.triggered, queue: queue.length,
          inferenceMs: performance.now() - began,
        });
      }
    }
  } catch (error) { fail(error); }
  finally { running = false; }
}

scope.onmessage = async ({ data }: MessageEvent) => {
  try {
    if (data.type === 'init') {
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.proxy = false;
      ort.env.wasm.wasmPaths = data.runtimeUrl;
      session = await ort.InferenceSession.create(data.modelUrl, {
        executionProviders: ['wasm'], graphOptimizationLevel: 'all',
      });
      await infer(new Int16Array(AUDIO.frameSamples)); // Validate assets/shapes before opening capture.
      state = new Float32Array(256);
      context = new Float32Array(64);
      recordAudio = data.recordAudio === true;
      scope.postMessage({ type: 'ready' });
    } else if (data.type === 'connect') {
      audioPort = data.port;
      audioPort!.onmessage = ({ data: frame }) => {
        if (frame.type === 'finish') {
          if (failed) finish(frame.reason);
          else { queue.push({ ...frame, type: 'finish' }); void drain(); }
          return;
        }
        if (failed || ended || frame.type !== 'frame') return;
        if (frame.epoch !== epoch) {
          audioPort?.postMessage({ type: 'ack', epoch: frame.epoch });
          return;
        }
        if (queue.length >= AUDIO.maxPendingFrames) return fail(new Error('Speech audio queue overflowed. Start the microphone test again.'));
        queue.push({ type: 'frame', pcm: new Int16Array(frame.pcm), epoch: frame.epoch, sequence: frame.sequence, received: performance.now() });
        void drain();
      };
      audioPort!.start();
    } else if (data.type === 'connectPlayback') {
      playbackPort?.close(); playbackPort = data.port;
      playbackPort?.postMessage({ type: 'activity', speaking: utterances.detector.triggered });
    } else if (data.type === 'finish') {
      if (failed) finish(data.reason);
      else { queue.push({ type: 'finish', epoch, reason: data.reason }); void drain(); }
    } else if (data.type === 'reset') {
      epoch = data.epoch;
      ended = false;
      queue = [];
      state = new Float32Array(256);
      context = new Float32Array(64);
      const boundary = utterances.reset(nextSample, data.reason);
      if (boundary) scope.postMessage({ type: 'boundary', epoch, boundary });
      scope.postMessage({ type: 'reset-ready', epoch });
    }
  } catch (error) { fail(error); }
};
