import { useEffect, useRef, useState } from 'react';
import { NativeLive } from '../gd-audio/live';
import { MicrophoneTest } from '../gd-audio/microphone';
import { UtteranceGate } from '../gd-audio/utterance-gate';
import captureWorkletUrl from '../gd-audio/capture.worklet.ts?worker&url';
import playbackWorkletUrl from '../gd-audio/playback.worklet.ts?worker&url';
import { usePlatform } from '../platform/context';
import { reservationPath, type QueueEntry } from './RunnerQueue';
import RunnerReview from './RunnerReview';
import { ParticipantTile } from '../gd-room/DiscussionRoom';
import { formatTime, type RoomPerson } from '../gd-room/room-model';
import './gd-room.css';

type LiveState = {
  phase: string; remaining_ms: number; prep_remaining_ms: number; intro_remaining_ms: number | null;
  panel: { id: string; name: string }[]; notice: string; receivedAt: number;
};
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
  const [outcome, setOutcome] = useState<string | null>(null);
  const [speaker, setSpeaker] = useState('');
  const [playing, setPlaying] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [learnerSpeaking, setLearnerSpeaking] = useState(false);
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
        if (mounted.current) setPlaying(value.playback.phase === 'playing' && value.playback.played > 0);
      },
      error: () => failed(session.snapshot.message || 'Connection lost before the server confirmed the round.'),
      message: message => {
        if (message.type === 'preparation_result' || message.type === 'evidence_stored') return true;
        if (message.type === 'round_paused' && message.round_id === entry.roundId) {
          const reason = message.reason;
          const detail = reason === 'provider_error' ? 'An AI panelist lost its connection.'
            : reason === 'microphone_stopped' ? 'The microphone stopped.'
            : 'The discussion was interrupted.';
          failed(`${detail} Return to Try Now to check whether the round can be resumed.`);
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
            setOutcome(String(message.outcome));
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
      snapshot: value => {
        if (!mounted.current || stopping.current) return;
        setMicOn(value.phase === 'listening');
        setLearnerSpeaking(value.phase === 'listening' && value.speaking);
      },
      boundary: event => { if (capturing()) session.boundary(event); },
      stopped: message => {
        if (stopping.current || !mounted.current) return;
        if (session.playback.snapshot.connection) end('microphone_stopped');
        else failed(message || 'The microphone stopped during setup.');
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
    <h1>{outcome === 'completed' ? 'Evaluation' : 'Discussion ended'}</h1>
    {outcome === 'completed' && platform.status?.runner_recovery
      ? <RunnerReview roundId={entry.roundId} />
      : <p role="status">{outcome === 'completed' ? 'Round ended.'
          : outcome === 'cancelled_before_start' ? 'Preparation cancelled.' : 'The round ended early.'}</p>}
    <button onClick={onLeave}>Back to Try Now</button>
  </>;
  if (!round) return <>
    <h1>Connect to your discussion</h1><p>{entry.topic}</p>
    <button disabled={connecting} onClick={connect}>{connecting ? 'Connecting…' : 'Connect microphone'}</button>{' '}
    <button onClick={() => void leave()}>Cancel</button>
  </>;

  const prep = round.phase === 'preparing';
  const active = livePhases.has(round.phase);
  const remaining = prep ? round.prep_remaining_ms : round.remaining_ms;
  const clock = formatTime(remaining - (prep || active ? performance.now() - round.receivedAt : 0));
  const speakerName = playing && active ? round.panel.find(bot => bot.id === speaker)?.name : undefined;
  const tones = ['mint', 'peach', 'lavender'];
  const participants: RoomPerson[] = [
    ...round.panel.map((bot, index) => ({ ...bot, role: 'AI participant', color: tones[index % tones.length] })),
    { id: 'user', name: 'You', role: 'You', color: 'yellow' },
  ];
  return <section className="try-now-live-room">
    <div className="meet-topic-bar">
      <div className="meet-topic-copy"><h1>{prep ? 'Preparation' : 'Discussion'}</h1><p>{entry.topic}</p></div>
      <div className="meet-timer"><strong role="timer" aria-label={prep ? 'Preparation time remaining' : 'Discussion time remaining'}>{clock}</strong></div>
    </div>
    <p role="status">{ending ? 'Ending…' : round.phase === 'connecting' ? 'Connecting panelists…'
      : round.notice || (speakerName ? `${speakerName} is speaking` : '')}</p>
    {!prep && <section className="meet-stage" aria-label="Discussion participants">
      <div className={`meet-tiles meet-tiles--${participants.length}`}>
        {participants.map(person => {
          const speaking = active && (person.id === 'user' ? learnerSpeaking : playing && person.id === speaker);
          const status = speaking ? 'Speaking' : person.id === 'user' ? 'Your seat' : 'AI participant';
          return <ParticipantTile key={person.id} person={person} speaking={speaking} status={status} micOn={micOn} />;
        })}
      </div>
    </section>}
    <label>Private notes<textarea value={notes} maxLength={12000} onChange={event => updateNotes(event.target.value)} /></label>
    <div className="try-now-actions">
      {prep && <button disabled={ending} onClick={() => socket.current?.playback.sendControl({ type: 'preparation_ready' })}>Skip preparation</button>}
      <button disabled={ending} onClick={() => end()}>{prep ? 'Cancel preparation' : 'End discussion'}</button>
    </div>
  </section>;
}
