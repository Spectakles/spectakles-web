import { NativeLive, INITIAL_LIVE } from '../src/gd-audio/live';
import { MicrophoneTest, INITIAL_MICROPHONE } from '../src/gd-audio/microphone';
import { LocalRecording, INITIAL_RECORDING } from '../src/gd-audio/recording';
import captureUrl from '../src/gd-audio/capture.worklet.ts?worker&url';
import playbackUrl from '../src/gd-audio/playback.worklet.ts?worker&url';
const run = document.querySelector<HTMLButtonElement>('#run')!;
const status = document.querySelector<HTMLPreElement>('#status')!;
const results = document.querySelector<HTMLOListElement>('#results')!;
const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function pass(message: string) { const item = document.createElement('li'); item.textContent = `PASS: ${message}`; results.append(item); }
const url = (path: string) => `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}${path}`;

run.onclick = async () => {
  run.disabled = true; results.replaceChildren();
  const sourceContext = new AudioContext({ sampleRate: 48000 }); const resume = sourceContext.resume();
  let native: NativeLive | null = null, mic: MicrophoneTest | null = null;
  let value = { ...INITIAL_LIVE }, capture = { ...INITIAL_MICROPHONE }, recording = { ...INITIAL_RECORDING };
  let outcome = '', startCount = 0;
  const sources: AudioBufferSourceNode[] = [];
  async function until(check: () => boolean, message: string, timeout = 45000) {
    const deadline = performance.now() + timeout;
    while (!check()) {
      assert(value.phase !== 'error', value.message); assert(capture.phase !== 'error', capture.message);
      if (performance.now() > deadline) throw new Error(`${message}\n${status.textContent}`);
      await pause(30);
    }
  }
  try {
    await resume;
    const pcm = new Int16Array(await fetch('./fixtures/speech.pcm').then(r => r.arrayBuffer()));
    const audio = sourceContext.createBuffer(1, pcm.length, 16000);
    for (let i = 0; i < pcm.length; i++) audio.getChannelData(0)[i] = pcm[i] / 32768;
    const destination = sourceContext.createMediaStreamDestination();
    const speak = () => { const source = sourceContext.createBufferSource(); source.buffer = audio; source.connect(destination); sources.push(source); source.start(); };
    const recorder = new LocalRecording({ url: url('/api/recordings/ws'), snapshot: next => { recording = next; }, error: message => { void mic?.stop(message, true); } });
    mic = new MicrophoneTest({
      createWorker: () => new Worker(new URL('../src/gd-audio/vad.worker.ts', import.meta.url), { type: 'module' }),
      workletUrl: captureUrl, modelUrl: `${location.origin}/gd-audio/silero_vad.onnx`, runtimeUrl: `${location.origin}/gd-audio/ort/`,
      acquireStream: async () => destination.stream,
      recording: { open: device => recorder.open(device), finish: (reason, incomplete) => recorder.finish(reason, incomplete), push: event => { recorder.push(event); native?.push(event); } },
      snapshot: next => { capture = next; }, boundary: event => { if (event.type === 'start') startCount++; native?.boundary(event); },
    });
    await mic.start(); assert(capture.phase === 'listening', capture.message);
    const makeNative = () => new NativeLive({ url: url('/api/live/ws'), workletUrl: playbackUrl, recordingId: recording.recording!.recording_id,
      snapshot: next => { value = next; status.textContent = `${value.phase}: turn ${value.playback.turn}, input ${value.inputFrames} frames / ${value.inputAcknowledged} commands, played ${(value.playback.played / 24000).toFixed(2)} s, floor ${value.playback.floor}\n${value.message}`; },
      error: () => { void mic?.stop('Live test failed.', true); } });
    native = makeNative(); await native.open();
    assert(value.phase === 'listening' && value.playback.turn === 0, value.message || 'Live connection did not start quietly.');
    const connection = value.playback.connection;
    const port = native.createVadPort(); assert(port, 'Direct VAD port missing.'); mic.connectPlayback(port);
    pass('One provider session connects with shared Arjun settings; it stays quiet until accepted user speech.');

    speak();
    await until(() => value.playback.turn >= 1 && value.playback.floor === 'free', 'First native reply did not finish.');
    assert(value.playback.played > 0 && value.playback.played === value.playback.received, 'First reply did not finish at the device.');
    assert(value.playback.heard.length > 0, 'Complete reply transcript was not credited after playback.');
    let evidence = await fetch(value.sessionUrl).then(r => r.json());
    const manifest = await fetch(recording.recording!.manifest_url).then(r => r.json());
    assert(evidence.input_samples_delivered === manifest.utterances[0].sample_count, 'Live and WAV user samples differ.');
    assert(evidence.events.some((event: { type: string }) => event.type === 'user_transcription'), 'No native user transcription evidence.');
    pass('Actual worklet/Silero speech reaches native ActivityStart/PCM/ActivityEnd; reply plays, transcript follows output, and delivered user samples equal the saved WAV.');

    speak(); await until(() => value.playback.turn >= 2 && value.playback.played > 2400 && value.phase === 'replying', 'Second reply did not start.');
    const before = startCount; speak();
    await until(() => startCount > before && value.playback.floor === 'interrupted', 'Natural speech did not interrupt the native reply.');
    assert(capture.phase === 'listening', 'Capture stopped after cutting Arjun.');
    pass('A fresh accepted utterance cuts native buffered output automatically while capture and recording remain active.');
    await until(() => value.playback.turn >= 3 && value.playback.floor === 'free', 'No fresh native reply after interruption.');
    assert(value.playback.played === value.playback.received, 'Fresh reply playback did not finish.');
    pass('Arjun responds natively after the interruption; the revoked reply does not resume or contaminate the next turn.');

    const sessionUrl = value.sessionUrl;
    await native.close();
    for (let i = 0; i < 60; i++) { evidence = await fetch(sessionUrl).then(r => r.json()); if (evidence.status !== 'active') break; await pause(50); }
    assert(evidence.status === 'complete', 'Session evidence did not finalize.');
    assert(evidence.turns.some((turn: { status: string }) => turn.status === 'interrupted'), 'Cut evidence missing.');
    native = makeNative(); await native.open();
    assert(value.playback.connection !== connection && value.playback.turn === 0 && value.inputFrames === 0, 'Fresh connection reused old state.');
    await native.close(); await mic.stop();
    assert(recording.phase === 'saved' && recording.recording!.utterances.length === 3, 'Accepted user WAVs were lost during Live conversation.');
    pass('Stop finalizes local session evidence; a new connection has fresh state and all three user utterance WAVs remain saved.');
    outcome = 'ALL 5 LIVE BROWSER CHECKS PASSED. Synthetic input only; provider depends on the test server.';
  } catch (error) { outcome = `FAILED: ${error instanceof Error ? error.message : String(error)}`; }
  finally { await native?.close(); await mic?.stop(); sources.forEach(source => { try { source.stop(); } catch { /* Already ended. */ } }); await sourceContext.close(); status.textContent = outcome; run.disabled = false; }
};
