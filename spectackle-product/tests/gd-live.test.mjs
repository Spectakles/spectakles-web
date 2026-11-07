import test from 'node:test';
import assert from 'node:assert/strict';
import { NativeLive } from '../src/gd-audio/live.ts';

class Socket {
  readyState = 1; bufferedAmount = 0; sent = [];
  send(data) { this.sent.push(typeof data === 'string' ? JSON.parse(data) : data); }
  reply(data) { this.onmessage?.({ data: JSON.stringify(data) }); }
  close() { this.readyState = 3; this.onclose?.({}); }
}
class Node {
  constructor() { this.port = { postMessage() {}, close() {} }; }
  connect() {} disconnect() {}
}
async function setup(ready = true) {
  globalThis.document = { addEventListener() {}, removeEventListener() {}, visibilityState: 'visible' };
  globalThis.window = { addEventListener() {}, removeEventListener() {} };
  globalThis.AudioWorkletNode = Node;
  const socket = new Socket(), errors = [];
  const context = { state: 'running', sampleRate: 48000, currentTime: 0, baseLatency: .01,
    outputLatency: .01, getOutputTimestamp: () => ({ contextTime: 0 }),
    resume: async () => {}, close: async function() { this.state = 'closed'; },
    audioWorklet: { addModule: async () => {} }, addEventListener() {}, removeEventListener() {} };
  const native = new NativeLive({ url: 'ws://synthetic', workletUrl: 'synthetic', recordingId: 'r',
    contextFactory: () => context, socketFactory: () => socket, snapshot() {}, error: () => errors.push('failed') });
  const opening = native.open(); await new Promise(resolve => setImmediate(resolve)); socket.onopen?.();
  const finishReady = async () => { socket.reply({ type: 'ready', connection: 'c', rate: 24000, session_url: '/session' }); await opening; };
  if (ready) await finishReady();
  return { native, socket, errors, context, finishReady };
}
const boundary = { type: 'start', id: 7, sample: 4608, startSample: 0, preRollSamples: 5120,
  reason: 'speech', incomplete: false, voicedMs: 32, durationMs: 320 };

test('Live handshake contains only recording identity, never provider credentials', async () => {
  const { native, socket } = await setup();
  try {
    assert.deepEqual(socket.sent[0], { type: 'hello', version: 1, recording_id: 'r' });
    assert.equal(native.snapshot.sessionUrl, '/session'); assert.equal(native.snapshot.phase, 'listening');
  } finally { await native.close(); }
});
test('accepted user PCM preserves samples, global boundaries, strict order and acknowledgements', async () => {
  const { native, socket } = await setup();
  try {
    native.push({ type: 'start', boundary }); socket.reply({ type: 'input_ack', seq: 1 });
    const pcm = new Int16Array(512); pcm[0] = -32768; pcm[511] = 32767;
    native.push({ type: 'audio', id: 7, sample: 0, pcm: pcm.buffer });
    const packet = new DataView(socket.sent.find(item => item instanceof ArrayBuffer));
    assert.equal(packet.getUint32(0, true), 0x36444753); assert.equal(packet.getUint32(4, true), 2);
    assert.equal(packet.getUint32(8, true), 7); assert.equal(packet.getInt16(20, true), -32768);
    assert.equal(packet.getInt16(1042, true), 32767);
    socket.reply({ type: 'input_ack', seq: 2 });
    native.push({ type: 'end', boundary: { ...boundary, type: 'end', sample: 512, reason: 'silence' } });
    socket.reply({ type: 'input_ack', seq: 3 });
    assert.equal(native.snapshot.inputAcknowledged, 3); assert.equal(native.snapshot.inputFrames, 1);
  } finally { await native.close(); }
});
test('speech begun during connection setup is skipped through its end, not sent as a partial utterance', async () => {
  const { native, socket, finishReady } = await setup(false);
  try {
    native.push({ type: 'start', boundary }); await finishReady();
    native.push({ type: 'audio', id: 7, sample: 0, pcm: new Int16Array(512).buffer });
    native.push({ type: 'end', boundary });
    assert.equal(socket.sent.some(item => item instanceof ArrayBuffer), false);
    native.push({ type: 'start', boundary: { ...boundary, id: 8 } });
    assert.equal(socket.sent.at(-1).type, 'input_start'); assert.equal(socket.sent.at(-1).seq, 1);
  } finally { await native.close(); }
});
test('missing Live input ACK fails once, closes output and tells the microphone owner to stop', async () => {
  const { native, socket, errors, context } = await setup();
  native.push({ type: 'start', boundary }); socket.reply({ type: 'input_ack', seq: 2 });
  await native.close(false);
  assert.equal(native.snapshot.phase, 'error'); assert.equal(errors.length, 1); assert.equal(context.state, 'closed');
});
test('Live input pending audio has the same bounded duration as the accepted recorder', async () => {
  const { native, socket, errors } = await setup();
  native.push({ type: 'start', boundary });
  for (let i = 0; i < 65; i++) native.push({ type: 'audio', id: 7, sample: i * 512, pcm: new Int16Array(512).buffer });
  await native.close(false);
  assert.equal(socket.sent.filter(item => item instanceof ArrayBuffer).length, 64);
  assert.equal(native.snapshot.phase, 'error'); assert.equal(errors.length, 1);
});
test('closed Live input ignores old speech callbacks and never restarts output', async () => {
  const { native, socket } = await setup(); await native.close(); const length = socket.sent.length;
  native.push({ type: 'start', boundary }); socket.reply({ type: 'live_status', status: 'awaiting_reply' });
  assert.equal(socket.sent.length, length); assert.equal(native.snapshot.phase, 'idle');
});
