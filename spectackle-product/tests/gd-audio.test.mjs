import test from 'node:test';
import assert from 'node:assert/strict';
import { AUDIO, pcm16, ReferenceVad, Resampler, Utterances } from '../src/gd-audio/dsp.ts';
import { MicrophoneTest } from '../src/gd-audio/microphone.ts';

function convert(rate, channels, block = 128) {
  const result = [];
  const converter = new Resampler(rate);
  for (let i = 0; i < channels[0].length; i += block) converter.push(channels.map((data) => data.subarray(i, i + block)), (sample) => result.push(sample));
  return result;
}

function tone(rate, hz, seconds = 0.3) {
  return Float32Array.from({ length: Math.round(rate * seconds) }, (_, i) => Math.sin(2 * Math.PI * hz * i / rate) * 0.5);
}

test('PCM16 saturates, preserves sign and uses the engine normalization', () => {
  assert.deepEqual([-2, -1, -0.5, 0, 0.5, 1, 2].map(pcm16), [-32768, -32768, -16384, 0, 16384, 32767, 32767]);
});

for (const rate of [16000, 44100, 48000, 96000]) {
  test(`${rate} Hz conversion has correct duration and render-block-independent samples`, () => {
    const input = tone(rate, 1000);
    const a = convert(rate, [input], 128);
    const b = convert(rate, [input], 137);
    assert.deepEqual(a, b);
    assert.ok(Math.abs(a.length - 4800) <= 32, `unexpected output duration ${a.length}`);
    const error = a.slice(100).reduce((sum, value, i) => sum + (value - 0.5 * Math.sin(2 * Math.PI * 1000 * (i + 100) / 16000)) ** 2, 0) / (a.length - 100);
    assert.ok(Math.sqrt(error) < 0.003, `1 kHz distortion ${Math.sqrt(error)}`);
  });
}

test('anti-alias filter rejects 12 kHz while retaining speech-band 1 kHz', () => {
  const rms = (values) => Math.sqrt(values.slice(100).reduce((sum, sample) => sum + sample ** 2, 0) / (values.length - 100));
  const low = rms(convert(48000, [tone(48000, 1000)]));
  const high = rms(convert(48000, [tone(48000, 12000)]));
  assert.ok(high / low < 0.01, `alias attenuation insufficient: ${high / low}`);
});

test('stereo is averaged; opposite channels cancel', () => {
  const a = tone(44100, 1000);
  const b = Float32Array.from(a, (value) => -value);
  assert.ok(convert(44100, [a, b]).every((value) => value === 0));
});

test('resampler reset removes pre-mute filter history', () => {
  const converter = new Resampler(48000);
  converter.push([tone(48000, 1000)], () => {});
  converter.reset();
  const result = [];
  converter.push([new Float32Array(4800)], (value) => result.push(value));
  assert.ok(result.every((value) => value === 0));
});

test('VAD commits immediately and closes after sixteen low frames', () => {
  const detector = new ReferenceVad();
  assert.equal(detector.update(0.899), null);
  assert.equal(detector.update(0.9), 'start');
  for (let i = 0; i < 15; i++) assert.equal(detector.update(0.1), null);
  assert.equal(detector.update(0.1), 'end');
  assert.equal(detector.voicedFrames, 1);
});

test('VAD middle band and voiced-time accounting match the frozen Python trace', () => {
  // gd_engine.audio.SpeechDetector: the middle band retains silence count;
  // a probability >= 0.9 clears it and increments voiced time.
  const detector = new ReferenceVad();
  const values = [0.9, ...Array(10).fill(0.1), 0.8, ...Array(5).fill(0.1), 0.95, ...Array(15).fill(0.1), 0.75, 0.1];
  const events = values.map((value) => detector.update(value));
  assert.deepEqual(events.map((value, i) => value && [i, value]).filter(Boolean), [[0, 'start'], [34, 'end']]);
  assert.equal(detector.voicedFrames * AUDIO.frameMs, 64);
  assert.throws(() => detector.update(NaN), /invalid probability/);
});

test('utterances include bounded pre-roll once, silence padding, and separate ids', () => {
  const tracker = new Utterances();
  const frame = new Int16Array(512);
  for (let i = 0; i < 20; i++) tracker.consume(frame, 0, i * 512);
  const start = tracker.consume(frame, 0.99, 20 * 512);
  assert.equal(start.preRollSamples, 5120);
  assert.equal(start.startSample, 11 * 512);
  for (let i = 21; i < 36; i++) assert.equal(tracker.consume(frame, 0, i * 512), null);
  const end = tracker.consume(frame, 0, 36 * 512);
  assert.equal(end.id, start.id);
  assert.equal(end.sample, 37 * 512);
  assert.equal(end.incomplete, false);
  const next = tracker.consume(frame, 1, 37 * 512);
  assert.equal(next.id, start.id + 1);
  assert.equal(next.preRollSamples, 512);
});

test('mute/stop marks active speech partial and clears old pre-roll', () => {
  const tracker = new Utterances();
  const frame = new Int16Array(512);
  tracker.consume(frame, 1, 0);
  const end = tracker.reset(512, 'muted');
  assert.equal(end.reason, 'muted');
  assert.equal(end.incomplete, true);
  assert.equal(tracker.reset(512, 'stopped'), null);
  const start = tracker.consume(frame, 1, 512);
  assert.equal(start.id, 2);
  assert.equal(start.preRollSamples, 512);
});

let Capture;
globalThis.sampleRate = 48000;
globalThis.AudioWorkletProcessor = class { port = { onmessage: null, postMessage: (data) => this.messages.push(data) }; messages = []; };
globalThis.registerProcessor = (_name, value) => { Capture = value; };
await import('../src/gd-audio/capture.worklet.ts');

function captureFixture() {
  const node = new Capture();
  const sent = [];
  const port = { onmessage: null, start() {}, postMessage(data) { sent.push(data); } };
  node.port.onmessage({ data: { type: 'connect', port } });
  node.port.onmessage({ data: { type: 'resume', epoch: 0 } });
  return { node, port, sent };
}

test('worklet emits mono 512-sample PCM16 frames, never output monitoring', () => {
  const { node, sent } = captureFixture();
  for (let i = 0; i < 100; i++) node.process([[new Float32Array(128).fill(0.5)]]);
  assert.equal(sent.length, 8);
  assert.ok(sent.every((frame) => frame.pcm.byteLength === 1024));
  assert.equal(new Int16Array(sent.at(-1).pcm)[100], 16384);
});

test('worklet enforces its queue bound instead of accumulating stale audio', () => {
  const { node, sent } = captureFixture();
  for (let i = 0; i < 1000; i++) node.process([[new Float32Array(128)]]);
  assert.equal(sent.length, AUDIO.maxPendingFrames);
  assert.match(node.messages[0].message, /fell behind/);
});

test('worklet pause suppresses frames; resume clears held PCM and rejects old acknowledgements', () => {
  const { node, port, sent } = captureFixture();
  for (let i = 0; i < 40; i++) node.process([[new Float32Array(128).fill(1)]]);
  node.port.onmessage({ data: { type: 'pause', epoch: 1 } });
  const before = sent.length;
  for (let i = 0; i < 50; i++) node.process([[new Float32Array(128).fill(1)]]);
  assert.equal(sent.length, before);
  node.port.onmessage({ data: { type: 'resume', epoch: 2 } });
  port.onmessage({ data: { type: 'ack', epoch: 0 } });
  for (let i = 0; i < 40; i++) node.process([[new Float32Array(128)]]);
  assert.ok(sent.slice(before).every((frame) => new Int16Array(frame.pcm).every((sample) => sample === 0)));
});

// Resource lifecycle tests use fake hardware, never the real microphone.
class Track extends EventTarget {
  enabled = true; readyState = 'live'; label = 'Test microphone'; stops = 0;
  stop() { this.stops++; this.readyState = 'ended'; }
}
class FakeContext extends EventTarget {
  state = 'suspended'; sampleRate = 48000; destination = {}; closed = false;
  audioWorklet = { addModule: async () => {} };
  resume() { this.state = 'running'; return Promise.resolve(); }
  close() { this.closed = true; this.state = 'closed'; return Promise.resolve(); }
  createMediaStreamSource() { return { connect() {}, disconnect() {} }; }
}
class FakeNode { port = { postMessage() {}, close() {} }; connect() {} disconnect() {} }
class FakeWorker {
  onmessage; onerror; terminated = false; sent = [];
  postMessage(data) {
    this.sent.push(data);
    queueMicrotask(() => this.onmessage?.({ data: data.type === 'init' ? { type: 'ready' } : { type: 'reset-ready', epoch: data.epoch } }));
  }
  terminate() { this.terminated = true; }
}
globalThis.window = Object.assign(new EventTarget(), { isSecureContext: true, AudioContext: FakeContext, AudioWorkletNode: FakeNode, Worker: FakeWorker, WebAssembly });
globalThis.document = Object.assign(new EventTarget(), { visibilityState: 'visible' });
Object.defineProperty(globalThis, 'navigator', { value: { mediaDevices: { getUserMedia() {} } }, configurable: true });
globalThis.AudioContext = FakeContext;
globalThis.AudioWorkletNode = FakeNode;

function lifecycle(acquire) {
  const track = new Track();
  const stream = { getTracks: () => [track], getAudioTracks: () => [track] };
  const snapshots = [];
  const worker = new FakeWorker();
  const microphone = new MicrophoneTest({ createWorker: () => worker, workletUrl: '/capture.js', modelUrl: '/model', runtimeUrl: '/runtime/', acquireStream: acquire ?? (async () => stream), snapshot: (value) => snapshots.push(value), boundary() {} });
  return { microphone, track, stream, snapshots, worker };
}

test('start, mute, unmute, repeated Stop release resources exactly once', async () => {
  const fixture = lifecycle();
  await fixture.microphone.start();
  assert.equal(fixture.snapshots.at(-1).phase, 'listening');
  fixture.microphone.toggleMute();
  assert.equal(fixture.track.enabled, false);
  assert.equal(fixture.snapshots.at(-1).phase, 'muted');
  fixture.microphone.toggleMute();
  await Promise.resolve();
  assert.equal(fixture.track.enabled, true);
  assert.equal(fixture.snapshots.at(-1).phase, 'listening');
  await Promise.all([fixture.microphone.stop(), fixture.microphone.stop()]);
  assert.equal(fixture.track.stops, 1);
  assert.equal(fixture.worker.terminated, true);
  assert.equal(fixture.snapshots.at(-1).phase, 'idle');
});

test('denied permission gives an actionable error and terminates the worker', async () => {
  const fixture = lifecycle(async () => { throw new DOMException('Denied', 'NotAllowedError'); });
  await fixture.microphone.start();
  assert.equal(fixture.worker.terminated, true);
  assert.equal(fixture.snapshots.at(-1).phase, 'error');
  assert.match(fixture.snapshots.at(-1).message, /denied/);
});

test('cancelling a pending permission request stops a late granted stream', async () => {
  let grant;
  const fixture = lifecycle(() => new Promise((resolve) => { grant = resolve; }));
  const starting = fixture.microphone.start();
  await fixture.microphone.stop();
  grant(fixture.stream);
  await starting;
  assert.equal(fixture.track.stops, 1);
  assert.equal(fixture.snapshots.at(-1).phase, 'idle');
});

test('device removal and hidden-tab transitions close the microphone', async () => {
  const removed = lifecycle();
  await removed.microphone.start();
  removed.track.dispatchEvent(new Event('ended'));
  await removed.microphone.stop();
  assert.equal(removed.snapshots.at(-1).phase, 'error');
  const hidden = lifecycle();
  await hidden.microphone.start();
  document.visibilityState = 'hidden';
  document.dispatchEvent(new Event('visibilitychange'));
  await hidden.microphone.stop();
  document.visibilityState = 'visible';
  assert.equal(hidden.track.stops, 1);
  assert.match(hidden.snapshots.at(-1).message, /hidden/);
});
