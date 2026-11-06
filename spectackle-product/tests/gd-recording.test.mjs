import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalRecording } from '../src/gd-audio/recording.ts';

const info = () => ({ recording_id: '1'.repeat(32), directory: '/synthetic/recording', manifest_url: '/manifest', created_at: '2026-10-18T00:00:00Z', status: 'recording', incomplete: false, end_reason: null, utterances: [] });
class Socket {
  readyState = 0; bufferedAmount = 0; sent = []; closes = [];
  open() { this.readyState = 1; this.onopen?.({}); }
  send(value) { this.sent.push(value); }
  reply(value) { this.onmessage?.({ data: JSON.stringify(value) }); }
  close(code) { this.readyState = 3; this.closes.push(code); this.onclose?.({ code }); }
}
async function opened() {
  const socket = new Socket(); const snapshots = []; const errors = [];
  const client = new LocalRecording({ url: 'ws://synthetic', socketFactory: () => socket, snapshot: (value) => snapshots.push(value), error: (message) => errors.push(message) });
  const ready = client.open('Synthetic input');
  socket.open(); socket.reply({ type: 'ready', recording: info() }); await ready;
  return { client, socket, snapshots, errors };
}
const boundary = { id: 1, sample: 0, startSample: 0, preRollSamples: 512, voicedMs: 32, durationMs: 0, reason: 'speech', incomplete: false };

test('wire packets preserve PCM16 little endian, ordered commands and saved metadata', async () => {
  const { client, socket, snapshots } = await opened();
  client.push({ type: 'start', boundary }); socket.reply({ type: 'ack', seq: 1 });
  const samples = new Int16Array(512); samples[0] = -32768; samples[1] = 32767; samples[2] = -123;
  client.push({ type: 'audio', id: 1, sample: 0, pcm: samples.buffer });
  const packet = new DataView(socket.sent.at(-1));
  assert.deepEqual(Array.from(new Uint8Array(packet.buffer, 0, 4)), [83, 71, 68, 52]);
  assert.equal(packet.getUint32(4, true), 2);
  assert.equal(packet.getUint32(8, true), 1);
  assert.equal(packet.getUint32(16, true), 512);
  assert.equal(packet.getInt16(20, true), -32768);
  assert.equal(packet.getInt16(24, true), -123);
  socket.reply({ type: 'ack', seq: 2 });
  client.push({ type: 'end', boundary: { ...boundary, sample: 512, reason: 'silence' } });
  const clip = { id: 1, sample_count: 512, file: 'utterance-0001.wav' };
  socket.reply({ type: 'ack', seq: 3, utterance: clip });
  assert.deepEqual(snapshots.at(-1).recording.utterances, [clip]);
  const done = client.finish('stopped', false);
  socket.reply({ type: 'finished', seq: 4, recording: { ...info(), status: 'complete', utterances: [clip] } });
  await done;
  assert.equal(snapshots.at(-1).phase, 'saved');
  assert.equal(socket.closes.at(-1), 1000);
});

test('queue overflow fails once at its bound instead of accumulating utterance audio', async () => {
  const { client, socket, snapshots, errors } = await opened();
  client.push({ type: 'start', boundary });
  for (let i = 0; i < 65; i++) client.push({ type: 'audio', id: 1, sample: i * 512, pcm: new Int16Array(512).buffer });
  assert.equal(socket.sent.filter((value) => value instanceof ArrayBuffer).length, 64);
  assert.equal(snapshots.at(-1).phase, 'error');
  assert.equal(errors.length, 1);
  await assert.rejects(client.finish('failure', true));
});

test('disconnect reports a recording failure while retaining its folder identity', async () => {
  const { client, socket, snapshots, errors } = await opened();
  socket.close(1006);
  assert.equal(errors.length, 1);
  assert.equal(snapshots.at(-1).recording.recording_id, '1'.repeat(32));
  await assert.rejects(client.finish('failure', true));
});

test('out-of-order acknowledgements stop recording', async () => {
  const { client, socket, errors } = await opened();
  client.push({ type: 'start', boundary });
  socket.reply({ type: 'ack', seq: 2 });
  assert.equal(errors.length, 1);
  await assert.rejects(client.finish('failure', true));
});

test('cancelled setup ignores late open and reply callbacks', async () => {
  const socket = new Socket(); const snapshots = []; const errors = [];
  const client = new LocalRecording({ url: 'ws://synthetic', socketFactory: () => socket, snapshot: (value) => snapshots.push(value), error: (value) => errors.push(value) });
  const pending = client.open('Synthetic input');
  const rejected = assert.rejects(pending, /cancelled/);
  await client.finish('stopped', false);
  await rejected;
  socket.open(); socket.reply({ type: 'ready', recording: info() });
  assert.equal(socket.sent.length, 0);
  assert.equal(snapshots.at(-1).phase, 'idle');
  assert.deepEqual(errors, []);
});

test('finish waits for the disk acknowledgement rather than marking saved early', async () => {
  const { client, socket, snapshots } = await opened();
  let complete = false;
  const pending = client.finish('stopped', false).then(() => { complete = true; });
  await Promise.resolve();
  assert.equal(complete, false);
  assert.equal(snapshots.at(-1).phase, 'saving');
  socket.reply({ type: 'finished', seq: 1, recording: { ...info(), status: 'complete' } });
  await pending;
  assert.equal(complete, true);
});
