import { BrowserPlayback, INITIAL_PLAYBACK } from '../src/gd-audio/playback';
import playbackUrl from '../src/gd-audio/playback.worklet.ts?worker&url';
import captureUrl from '../src/gd-audio/capture.worklet.ts?worker&url';
import { MicrophoneTest, INITIAL_MICROPHONE } from '../src/gd-audio/microphone';
import { LocalRecording, INITIAL_RECORDING } from '../src/gd-audio/recording';
const run = document.querySelector<HTMLButtonElement>('#run')!;
const status = document.querySelector<HTMLPreElement>('#status')!;
const results = document.querySelector<HTMLOListElement>('#results')!;
const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function pass(message: string) { const item = document.createElement('li'); item.textContent = `PASS: ${message}`; results.append(item); }
async function until(check: () => boolean, message: string, timeout = 20000) {
  const deadline = performance.now() + timeout;
  while (!check()) { if (performance.now() > deadline) throw new Error(`${message}\n${status.textContent}`); await pause(20); }
}
const url = (path: string) => `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}${path}`;
run.onclick = async () => {
  run.disabled = true; results.replaceChildren();
  let player: BrowserPlayback | null = null;
  let mic: MicrophoneTest | null = null;
  let sourceContext: AudioContext | null = null;
  let outcome = '';
  let value = { ...INITIAL_PLAYBACK };
  let leadObserved = false;
  const makePlayer = () => new BrowserPlayback({ url: url('/api/playback/ws'), workletUrl: playbackUrl, snapshot: (snapshot) => {
    value = snapshot;
    status.textContent = `${value.phase}: turn ${value.turn}, received ${(value.received / 24000).toFixed(2)} s, rendered ${(value.rendered / 24000).toFixed(2)} s, played ${(value.played / 24000).toFixed(2)} s, floor ${value.floor}\n${value.message}`;
    if (value.generated && value.played < value.received && value.floor === 'busy') leadObserved = true;
  } });
  const okay = () => { assert(value.phase !== 'error', value.message); };
  try {
    player = makePlayer(); await player.open(); player.play();
    await until(() => value.phase === 'ended' || value.phase === 'error', 'Normal playback never finished.'); okay();
    assert(value.played === value.received && value.played > 24000 * 5, 'Played duration is incomplete.');
    assert(value.heard.length === 3 && value.floor === 'free', 'Heard markers/floor do not match playback completion.');
    assert(leadObserved, 'No generation-complete/busy-playback interval observed.');
    pass('Real streamed 24 kHz PCM plays to completion; generation finishes earlier, the floor stays busy until device progress catches up, and all three fully played lines are committed.');
    await player.close();

    for (const position of [.15, 3.4, 9.8]) {
      player = makePlayer(); await player.open(); player.play();
      await until(() => value.played >= position * 24000 || value.phase === 'error', `Could not reach ${position}s cut.`); okay();
      const sentAtCut = value.received;
      player.userActivity(true);
      await until(() => value.phase === 'cut' || value.phase === 'error', 'Cut was not acknowledged.'); okay();
      const playedAtCut = value.played;
      await until(() => value.staleProbes >= 1 || value.phase === 'error', 'Delayed stale probe missing.'); okay();
      await pause(200);
      assert(value.played === playedAtCut && value.received <= sentAtCut + 480, 'Old audio advanced after cut.');
      assert(value.dropped >= 2 && value.floor === 'interrupted', 'Delayed audio/end was not rejected.');
      assert(value.heard.length <= (position < 1 ? 0 : position < 4 ? 1 : 2), 'An unheard tail was committed.');
      pass(`Cut at ${position.toFixed(2)} s discards queued audio; deliberately delayed PCM/end cannot resume it, and only fully played lines are retained.`);
      await player.close();
    }

    player = makePlayer(); await player.open(); player.play();
    await until(() => value.played > 2400 || value.phase === 'error', 'First turn did not play.'); okay();
    const firstTurn = value.turn;
    player.userActivity(true);
    await until(() => value.phase === 'cut' || value.phase === 'error', 'First turn did not cut.'); okay();
    player.userActivity(false); player.play();
    await until(() => value.turn === firstTurn + 1 && value.played > 15000 && value.staleProbes >= 1 || value.phase === 'error', 'Fresh turn failed across delayed output.'); okay();
    assert(value.dropped >= 2, 'Old turn audio was not discarded while new turn played.');
    player.interrupt(); await until(() => value.phase === 'cut' || value.phase === 'error', 'Second turn did not cut.'); okay();
    pass('A fresh turn plays while delayed packets from its predecessor are rejected by turn identity.');
    await player.close();

    player = makePlayer(); await player.open();
    sourceContext = new AudioContext({ sampleRate: 48000 }); await sourceContext.resume();
    const destination = sourceContext.createMediaStreamDestination();
    const pcm = new Int16Array(await fetch('./fixtures/speech.pcm').then(r => r.arrayBuffer()));
    const buffer = sourceContext.createBuffer(1, pcm.length, 16000);
    for (let i = 0; i < pcm.length; i++) buffer.getChannelData(0)[i] = pcm[i] / 32768;
    const source = sourceContext.createBufferSource(); source.buffer = buffer; source.connect(destination);
    let capture = { ...INITIAL_MICROPHONE };
    let recording = { ...INITIAL_RECORDING };
    let speechStarts = 0;
    const recorder = new LocalRecording({ url: url('/api/recordings/ws'), snapshot: next => { recording = next; }, error: message => { void mic?.stop(message, true); } });
    mic = new MicrophoneTest({
      createWorker: () => new Worker(new URL('../src/gd-audio/vad.worker.ts', import.meta.url), { type: 'module' }),
      workletUrl: captureUrl, modelUrl: `${location.origin}/gd-audio/silero_vad.onnx`, runtimeUrl: `${location.origin}/gd-audio/ort/`,
      acquireStream: async () => destination.stream, recording: recorder,
      snapshot: next => { capture = next; }, boundary: event => { if (event.type === 'start') speechStarts++; },
      // No UI/main-thread callback cuts playback in this check.
    });
    await mic.start(); assert(capture.phase === 'listening', capture.message);
    const port = player.createVadPort(); assert(port, 'Missing direct VAD port.'); mic.connectPlayback(port);
    player.play(); await until(() => value.played > 12000 || value.phase === 'error', 'Voice did not start.'); okay();
    source.start();
    await until(() => value.phase === 'cut' || value.phase === 'error' || capture.phase === 'error', 'VAD did not directly cut output.'); okay();
    assert(speechStarts > 0 && capture.phase === 'listening', capture.message || 'Capture stopped with playback.');
    const framesAtCut = capture.frames; await until(() => capture.frames > framesAtCut + 5, 'Capture stopped advancing after interruption.');
    await mic.stop();
    assert(recording.phase === 'saved' && recording.recording!.utterances.length > 0, 'User utterance recording failed during playback.');
    pass('Actual 48 kHz synthetic capture → Silero → direct MessagePort cuts playback without a UI boundary callback; capture keeps running and the accepted user utterance still saves to WAV.');
    await player.close(); await sourceContext.close(); sourceContext = null;
    player = makePlayer(); await player.open(); assert(value.turn === 0 && value.played === 0, 'Old lifetime state leaked.');
    await player.close();
    pass('Repeated stop and a new connection/context have fresh turn and playback state.');
    outcome = 'ALL 7 BROWSER PLAYBACK CHECKS PASSED. Synthetic streams only.';
  } catch (error) { outcome = `FAILED: ${error instanceof Error ? error.message : String(error)}`; }
  finally { await mic?.stop(); await player?.close(false); await sourceContext?.close(); status.textContent = outcome; run.disabled = false; }
};
