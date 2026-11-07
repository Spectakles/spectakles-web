import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { PlaybackQueue, PresentedProgress } from '../src/gd-audio/playback-core.ts';
import { BrowserPlayback } from '../src/gd-audio/playback.ts';

const frame = (value = 8192) => new Int16Array(480).fill(value);
function filled(rate = 48000, count = 5) {
  const queue = new PlaybackQueue(rate); queue.begin(1);
  for (let i = 0; i < count; i++) queue.push(1, i, i * 480, frame());
  return queue;
}
for (const rate of [24000, 44100, 48000, 96000]) test(`${rate} Hz playback has correct duration and source progress`, () => {
  const queue = filled(rate); queue.end(1, 2400);
  let samples = 0;
  while (!queue.done && samples < rate) { const out = new Float32Array(1); queue.render(out); assert.ok(Math.abs(out[0] - .25) < 1e-5); samples++; }
  assert.ok(Math.abs(samples - rate / 10) <= 1); assert.equal(queue.rendered, 2400);
});
test('underflow renders silence without advancing played-source samples; continuation is ordered', () => {
  const queue = filled(); queue.render(new Float32Array(10000));
  const before = queue.rendered, output = new Float32Array(256);
  queue.render(output); assert.ok(output.every(x => x === 0)); assert.equal(queue.rendered, before);
  queue.push(1, 5, 2400, frame()); queue.end(1, 2880);
  queue.render(new Float32Array(2000)); assert.equal(queue.rendered, 2880);
});
test('cut removes queued audio, rejects old begin/audio/end, and allows a fresh turn', () => {
  const queue = filled(); queue.render(new Float32Array(1000));
  const played = queue.rendered; assert.equal(queue.cut(), true);
  assert.equal(queue.push(1, 5, 2400, frame()), false); assert.equal(queue.end(1, 2400), false);
  assert.equal(queue.begin(1), false); const out = new Float32Array(2000); queue.render(out);
  assert.ok(out.every(x => x === 0)); assert.equal(queue.rendered, played);
  assert.equal(queue.begin(2), true); assert.equal(queue.push(1, 0, 0, frame()), false);
  queue.push(2, 0, 0, frame(-8192)); queue.end(2, 480); queue.render(out);
  assert.equal(out[0], -.25);
});
test('active human speech blocks new bot output until speech ends', () => {
  const queue = new PlaybackQueue(48000); queue.blocked = true;
  assert.equal(queue.begin(1), false); assert.equal(queue.push(1, 0, 0, frame()), false);
  queue.blocked = false; assert.equal(queue.begin(1), false); assert.equal(queue.begin(2), true);
});
test('duplicate/missing frames and mismatched ends fail instead of silently shifting audio', () => {
  const queue = filled();
  assert.throws(() => queue.push(1, 5, 999, frame()));
  assert.throws(() => queue.push(1, 7, 2400, frame()));
  assert.throws(() => queue.end(1, 3000));
});
test('PCM ring refuses more than two seconds rather than growing', () => {
  const queue = filled(48000, 100);
  assert.throws(() => queue.push(1, 100, 48000, frame()), /bound/);
});
test('device-clock checkpoints remain pending until actually presented', () => {
  const progress = new PresentedProgress();
  progress.add({ turn: 1, rendered: 480, frame: 960, cut: false, done: false });
  progress.add({ turn: 1, rendered: 720, frame: 1440, cut: true, done: false });
  assert.deepEqual(progress.take(959), []); assert.equal(progress.take(960)[0].rendered, 480);
  assert.deepEqual(progress.take(1439), []); assert.equal(progress.take(1440)[0].cut, true);
});
test('unpresented checkpoint backlog is bounded', () => {
  const progress = new PresentedProgress(); for (let i = 0; i < 128; i++) progress.add({ frame: i });
  assert.throws(() => progress.add({ frame: 129 }), /behind/);
});
test('actual worklet direct VAD port cuts before another render and old PCM stays silent', () => {
  let Processor;
  const scope = { sampleRate: 48000, currentFrame: 0, Int16Array, Float32Array,
    AudioWorkletProcessor: class { port = { postMessage(value) { this.messages.push(value); }, messages: [] }; },
    registerProcessor: (_name, klass) => { Processor = klass; }, PlaybackQueue };
  const source = fs.readFileSync(new URL('../src/gd-audio/playback.worklet.ts', import.meta.url), 'utf8').replace(/^import .*;\n/, '');
  vm.runInNewContext(ts.transpile(source, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None }), scope);
  const node = new Processor(); const command = data => node.port.onmessage({ data });
  const vad = { start() {}, close() {} }; command({ type: 'connectVad', port: vad }); command({ type: 'init', connection: 'a' });
  command({ type: 'begin', connection: 'a', turn: 1 });
  for (let i = 0; i < 6; i++) command({ type: 'audio', connection: 'a', turn: 1, sequence: i, offset: i * 480, pcm: frame().buffer });
  const output = new Float32Array(128); node.process([], [[output]]); assert.equal(output[0], .25);
  vad.onmessage({ data: { type: 'activity', speaking: true } });
  assert.equal(node.port.messages.at(-1).cut, true);
  command({ type: 'audio', connection: 'a', turn: 1, sequence: 6, offset: 2880, pcm: frame().buffer });
  node.process([], [[output]]); assert.ok(output.every(x => x === 0));
});

class Socket {
  readyState = 1; bufferedAmount = 0; sent = [];
  send(data) { this.sent.push(JSON.parse(data)); }
  close() { this.readyState = 3; this.onclose?.({}); }
  reply(value) { this.onmessage?.({ data: value instanceof ArrayBuffer ? value : JSON.stringify(value) }); }
}
class Node {
  static latest; commands = [];
  constructor() { Node.latest = this; this.port = { postMessage: value => this.commands.push(value), close() {} }; }
  connect() {} disconnect() { this.disconnected = true; }
}
async function opened() {
  globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} };
  globalThis.window = { addEventListener() {}, removeEventListener() {} };
  globalThis.AudioWorkletNode = Node;
  const context = { state: 'running', sampleRate: 48000, currentTime: 0, baseLatency: .01, outputLatency: .02,
    stamp: 0, getOutputTimestamp() { return { contextTime: this.stamp }; },
    resume: async () => {}, close: async function() { this.state = 'closed'; },
    audioWorklet: { addModule: async () => {} }, addEventListener() {}, removeEventListener() {} };
  const socket = new Socket(); const states = [];
  const player = new BrowserPlayback({ url: 'ws://synthetic', workletUrl: 'synthetic', contextFactory: () => context, socketFactory: () => socket, snapshot: value => states.push(value) });
  const ready = player.open(); await new Promise(resolve => setImmediate(resolve));
  socket.reply({ type: 'ready', connection: 'c', rate: 24000 }); await ready;
  return { player, socket, context, states, node: Node.latest };
}
const binary = (turn = 1, sequence = 0, offset = 0) => {
  const buffer = new ArrayBuffer(980); const view = new DataView(buffer);
  [0x35444753, turn, sequence, offset, 480].forEach((n, i) => view.setUint32(i * 4, n, true));
  return buffer;
};
test('browser receives/rendered progress without marking it played before the device clock', async () => {
  const { player, socket, context, node } = await opened();
  try {
    player.play(); socket.reply({ type: 'begin', connection: 'c', turn: 1 }); socket.reply(binary());
    node.port.onmessage({ data: { type: 'checkpoint', connection: 'c', turn: 1, rendered: 480, frame: 48000, done: false, cut: false, dropped: 0, underruns: 0 } });
    assert.equal(player.snapshot.played, 0); assert.equal(player.snapshot.rendered, 480);
    assert.equal(socket.sent.some(x => x.type === 'progress'), false);
    context.stamp = 1; await new Promise(resolve => setTimeout(resolve, 25));
    assert.equal(player.snapshot.played, 480); assert.equal(socket.sent.find(x => x.type === 'progress').played, 480);
  } finally { await player.close(); }
});
test('browser cut rejects delayed output and only acknowledges the presented prefix', async () => {
  const { player, socket, context, node } = await opened();
  try {
    player.play(); socket.reply({ type: 'begin', connection: 'c', turn: 1 }); socket.reply(binary());
    player.userActivity(true); assert.equal(player.snapshot.phase, 'cutting');
    socket.reply(binary(1, 1, 480)); assert.equal(player.snapshot.received, 480); assert.equal(player.snapshot.dropped, 1);
    node.port.onmessage({ data: { type: 'checkpoint', connection: 'c', turn: 1, rendered: 240, frame: 48000, cut: true, done: false, dropped: 1, underruns: 0 } });
    assert.equal(socket.sent.some(x => x.type === 'cut'), false);
    context.stamp = 1; await new Promise(resolve => setTimeout(resolve, 25));
    assert.equal(socket.sent.find(x => x.type === 'cut').played, 240);
  } finally { await player.close(); }
});
test('missing audio frame closes the output and reports failure', async () => {
  const { player, socket, context } = await opened();
  player.play(); socket.reply({ type: 'begin', connection: 'c', turn: 1 }); socket.reply(binary(1, 4));
  await player.close(false); assert.equal(player.snapshot.phase, 'error'); assert.equal(context.state, 'closed');
});
test('old socket callbacks cannot revive a closed playback lifetime', async () => {
  const { player, socket, context } = await opened(); await player.close();
  socket.reply({ type: 'begin', connection: 'c', turn: 99 }); socket.reply(binary(99));
  assert.equal(player.snapshot.phase, 'idle'); assert.equal(player.snapshot.turn, 0); assert.equal(context.state, 'closed');
});
