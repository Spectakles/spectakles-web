import { useEffect, useRef, useState } from 'react';
import { NativeLive } from '../gd-audio/live';
import { MicrophoneTest } from '../gd-audio/microphone';
import { UtteranceGate } from '../gd-audio/utterance-gate';
import captureWorkletUrl from '../gd-audio/capture.worklet.ts?worker&url';
import playbackWorkletUrl from '../gd-audio/playback.worklet.ts?worker&url';
import { usePlatform } from '../platform/context';
import { reservationPath, type QueueEntry } from './RunnerQueue';

type LiveState = {
  phase: string; remaining_ms: number; prep_remaining_ms: number; intro_remaining_ms: number | null;
  panel: { id: string; name: string }[]; notice: string; receivedAt: number;
};
type Outcome = { outcome: string; evidenceSaved: boolean; evidenceGapPossible: boolean };
const livePhases = new Set(['discussion', 'closing', 'final_minute', 'waiting']);

const notesKey = (uid: string) => `spectakles-runner-notes:${uid}`;

export function clearRunnerNotes(uid: string) {
  try { sessionStorage.removeItem(notesKey(uid)); }
  catch { /* Browser storage is optional. */ }
}

function readNotes(uid: string, roundId: string): string {
  try {
    const draft = JSON.parse(sessionStorage.getItem(notesKey(uid)) || 'null') as
      { roundId: string; notes: string; expires: number } | null;
    if (draft?.roundId === roundId && draft.expires > Date.now()) return draft.notes;
    clearRunnerNotes(uid);
  } catch { /* Browser storage is optional. */ }
  return '';
}

export default function RunnerLiveRound({ entry, onLeave, resuming = false }: {
  entry: QueueEntry; onLeave: () => void; resuming?: boolean;
}) {
  const platform = usePlatform();
  const [round, setRound] = useState<LiveState | null>(null);
  const notesUid = platform.status?.runner_recovery ? platform.user?.uid : undefined;
  const [notes, setNotes] = useState(() => notesUid ? readNotes(notesUid, entry.roundId) : '');
  const updateNotes = (value: string) => {
    setNotes(value);
    if (!notesUid) return;
    try {
      sessionStorage.setItem(notesKey(notesUid), JSON.stringify({
        roundId: entry.roundId, notes: value, expires: Date.now() + 10 * 60 * 1000,
      }));
    } catch { /* Notes are still available for this connection. */ }
  };
  const [connecting, setConnecting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [failure, setFailure] = useState('');
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [speaker, setSpeaker] = useState('');
  const [, tick] = useState(0);
  const state = useRef<LiveState | null>(null);
  const media = useRef<MicrophoneTest | null>(null);
  const socket = useRef<NativeLive | null>(null);
  const endingTimer = useRef<ReturnType<typeof setTimeout>>();
  const mounted = useRef(false);
  const stopping = useRef(false);

  const cleanup = () => {
    stopping.current = true;
    clearTimeout(endingTimer.current);
    void media.current?.stop();
    void socket.current?.close(false);
  };
  useEffect(() => {
    mounted.current = true;
    const timer = setInterval(() => tick(value => value + 1), 250);
    return () => { mounted.current = false; clearInterval(timer); cleanup(); };
  }, []);

  const failed = (message: string) => {
    if (!mounted.current) return;
    cleanup();
    setFailure(message);
    setConnecting(false);
    setEnding(false);
    if (!notesUid) setNotes('');
  };
  const end = (reason = 'ended_by_user') => {
    if (!socket.current || stopping.current) return;
    stopping.current = true;
    setEnding(true);
    socket.current.playback.interrupt();
    socket.current.playback.sendControl({ type: 'end', reason });
    void media.current?.stop();
    endingTimer.current = setTimeout(() => failed('The server did not confirm the end of the round.'), 12000);
  };
  const connect = () => {
    if (socket.current || connecting) return;
    stopping.current = false;
    setConnecting(true);
    const url = new URL('/api/runner/live/ws', window.location.origin);
    url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const gate = new UtteranceGate();
    let utterance = 0;
    const capturing = () => !stopping.current && livePhases.has(state.current?.phase ?? '');
    let microphoneReady: Promise<void>;
    const session = new NativeLive({
      url: url.href, workletUrl: playbackWorkletUrl, recordingId: '',
      hello: async () => {
        await microphoneReady;
        if (capture.isClosed) throw new Error('The microphone could not be started.');
        return { type: 'hello', version: 1, round_id: entry.roundId, id_token: await platform.token() };
      },
      ready: () => {
        const port = session.createVadPort();
        if (port) capture.connectPlayback(port);
      },
      acceptInput: capturing,
      snapshot: value => {
        if (mounted.current && value.playback.phase !== 'playing') setSpeaker('');
      },
      error: () => failed(session.snapshot.message || 'Connection lost before the server confirmed the round.'),
      message: message => {
        if (message.type === 'preparation_result' || message.type === 'evidence_stored') return true;
        if (message.type === 'round_paused' && message.round_id === entry.roundId) {
          failed('The discussion was interrupted. Return to Try Now to resume.');
          return true;
        }
        if (message.type === 'discussion_state') {
          const value = { ...message, receivedAt: performance.now() } as unknown as LiveState;
          state.current = value;
          if (mounted.current) {
            setRound(value);
            setConnecting(false);
            setSpeaker(value.notice ? '' : String(message.owner || ''));
          }
          const intro = value.intro_remaining_ms;
          session.playback.scheduleIntroductionCut(livePhases.has(value.phase)
            ? Math.min(value.remaining_ms, intro ?? Infinity) : null);
          return true;
        }
        if (message.type === 'round_ended' && message.round_id === entry.roundId) {
          cleanup();
          if (mounted.current) {
            if (notesUid) clearRunnerNotes(notesUid);
            setNotes('');
            setEnding(false);
            setOutcome({ outcome: String(message.outcome), evidenceSaved: message.evidence_saved === true,
              evidenceGapPossible: message.evidence_gap_possible === true });
          }
          return true;
        }
        return false;
      },
    });
    const capture = new MicrophoneTest({
      createWorker: () => new Worker(new URL('../gd-audio/vad.worker.ts', import.meta.url), { type: 'module' }),
      workletUrl: captureWorkletUrl,
      modelUrl: new URL('gd-audio/silero_vad.onnx', window.location.origin).href,
      runtimeUrl: new URL('gd-audio/ort/', window.location.origin).href,
      snapshot: () => undefined,
      boundary: event => { if (capturing()) session.boundary(event); },
      stopped: () => {
        if (stopping.current || !mounted.current) return;
        if (session.playback.snapshot.connection) end('microphone_stopped');
        else failed('The microphone stopped during setup.');
      },
      recording: {
        open: async () => undefined,
        finish: async () => undefined,
        push: event => {
          if (!gate.accept(event, capturing()) || !capturing()) return;
          if (event.type === 'start') utterance += 1;
          if (event.type === 'audio') session.push({ ...event, id: utterance });
          else session.push({ ...event, boundary: { ...event.boundary, id: utterance } });
        },
      },
    });
    socket.current = session;
    media.current = capture;
    microphoneReady = capture.start();
    void session.open();
  };
  const leave = async () => {
    cleanup();
    if (resuming || (notesUid && socket.current)) { onLeave(); return; }
    try {
      const reply = await platform.request(reservationPath(entry.roundId), { method: 'DELETE' });
      // A connected socket owns settlement. The server may still be finishing it.
      if (!reply.ok && reply.status !== 409) throw new Error('Could not release the slot.');
      if (notesUid) clearRunnerNotes(notesUid);
      onLeave();
    } catch {
      setFailure('Could not release the slot. Try again.');
    }
  };

  if (failure) return <>
    <h1>Discussion interrupted</h1><p role="alert">{failure}</p>
    <button onClick={() => void leave()}>Back to Try Now</button>
  </>;
  if (outcome) return <>
    <h1>{outcome.outcome === 'completed' ? 'Evaluation' : 'Discussion ended'}</h1>
    <p role="status">{outcome.outcome === 'completed'
      ? 'Round ended. Coaching and scores are not available in this build.'
      : outcome.outcome === 'cancelled_before_start' ? 'Preparation cancelled.'
        : 'The round ended early.'}</p>
    {outcome.evidenceGapPossible
      ? <p>Some discussion evidence may be missing.</p>
      : outcome.evidenceSaved && <p>Discussion evidence saved.</p>}
    <button onClick={onLeave}>Back to Try Now</button>
  </>;
  if (!round) return <>
    <h1>Connect to your discussion</h1><p>{entry.topic}</p>
    <button disabled={connecting} onClick={connect}>{connecting ? 'Connecting…' : 'Connect microphone'}</button>{' '}
    <button onClick={() => void leave()}>Cancel</button>
  </>;

  const prep = round.phase === 'preparing';
  const remaining = prep ? round.prep_remaining_ms : round.remaining_ms;
  const seconds = Math.max(0, Math.ceil((remaining - (prep || livePhases.has(round.phase) ? performance.now() - round.receivedAt : 0)) / 1000));
  const speakerName = round.panel.find(bot => bot.id === speaker)?.name;
  return <>
    <h1>{prep ? 'Preparation' : 'Discussion'}</h1>
    <p>{entry.topic}</p>
    <p role="timer" aria-label={prep ? 'Preparation time remaining' : 'Discussion time remaining'}>
      {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
    </p>
    <p role="status">{ending ? 'Ending…' : round.phase === 'connecting' ? 'Connecting panelists…' : round.notice || (speakerName && !prep ? `${speakerName} has the floor` : '')}</p>
    <label>Private notes<textarea value={notes} maxLength={12000} onChange={event => updateNotes(event.target.value)} /></label>
    {prep && <button disabled={ending} onClick={() => socket.current?.playback.sendControl({ type: 'preparation_ready' })}>Skip preparation</button>}{' '}
    <button disabled={ending} onClick={() => end()}>{prep ? 'Cancel preparation' : 'End discussion'}</button>
  </>;
}
