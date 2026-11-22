import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { MicrophonePermission } from '../gd-audio/devices';
import { responseError, usePlatform } from '../platform/context';
import './try-now.css';
import RunnerLiveRound from './RunnerLiveRound';
import RunnerQueue, { readQueueEntry, reservationPath, saveQueueEntry, type QueueEntry, type Ticket } from './RunnerQueue';

const PREP_SECONDS = 45;
const DISCUSSION_SECONDS = 180;
const PANEL = ['Arjun', 'Sahil', 'Meera', 'Nina'];
const TOPICS = ['Should colleges ban smartphones in class?', 'Should public transport be free?', 'Can AI improve education?'];
type Access = { approved: boolean; attempts_remaining: number };
type Draft = { topic: string; notes: string; phase: 'prep' | 'discussion'; deadline: number; roundId?: string };

function readDraft(key: string): Draft | null {
  try {
    const draft = JSON.parse(sessionStorage.getItem(key) || 'null') as Draft | null;
    return draft && draft.deadline > Date.now() ? draft : null;
  } catch { return null; }
}

function writeDraft(key: string, draft: Draft | null) {
  try {
    if (draft) sessionStorage.setItem(key, JSON.stringify(draft));
    else sessionStorage.removeItem(key);
  } catch { /* Notes remain available in memory when browser storage is disabled. */ }
}

function SignIn() {
  const { auth } = usePlatform();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!auth || busy) return;
    setBusy(true);
    setError('');
    try { await signInWithEmailAndPassword(auth, email, password); }
    catch { setError('Could not sign in. Check your email and password.'); }
    finally { setPassword(''); setBusy(false); }
  };
  return <>
    <h1>Sign in to Try Now</h1>
    <form onSubmit={submit}>
      <label>Email<input required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} /></label>
      <label>Password<input required type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} /></label>
      <button disabled={!auth || busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
    {error && <p role="alert">{error}</p>}
  </>;
}

function DeviceChecks({ canStartRound, useQueue, onStart }: {
  canStartRound: boolean;
  useQueue: boolean;
  onStart: (topic: string) => Promise<void>;
}) {
  const [topic, setTopic] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [headphones, setHeadphones] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [played, setPlayed] = useState(false);
  const [heard, setHeard] = useState(false);
  const [checking, setChecking] = useState(false);
  const [micError, setMicError] = useState('');
  const [speakerError, setSpeakerError] = useState('');
  const [probe, setProbe] = useState<MicrophonePermission | null>(null);
  useEffect(() => {
    const permission = new MicrophonePermission(
      async () => {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Microphone access requires HTTPS or localhost.');
        return navigator.mediaDevices.getUserMedia({ audio: true });
      },
      (busy, error) => { setChecking(busy); setMicError(error); },
    );
    setProbe(permission);
    return () => permission.close();
  }, []);
  const checkMic = async () => {
    setMicReady(false);
    if (probe && await probe.request()) setMicReady(true);
  };
  const playTone = async () => {
    setHeard(false);
    setPlayed(false);
    setSpeakerError('');
    let context: AudioContext | undefined;
    try {
      context = new AudioContext();
      await context.resume();
      const tone = context.createOscillator();
      const volume = context.createGain();
      const now = context.currentTime;
      tone.frequency.value = 440;
      volume.gain.setValueAtTime(0.06, now);
      volume.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      tone.connect(volume).connect(context.destination);
      tone.onended = () => { void context?.close(); };
      tone.start(now);
      tone.stop(now + 0.4);
      setPlayed(true);
    } catch {
      if (context) void context.close();
      setSpeakerError('Could not play the test tone. Check your audio output and try again.');
    }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canStartRound || !headphones || !micReady || !heard || !topic.trim() || joining) return;
    setJoining(true);
    setJoinError('');
    try { await onStart(topic.trim()); }
    catch (failure) { setJoinError(failure instanceof Error ? failure.message : 'Could not join the queue. Try again.'); }
    finally { setJoining(false); }
  };
  return <>
    <h1>Try Now</h1>
    <p>Four AI panelists · 3 minutes · English</p>
    <form onSubmit={event => void submit(event)}>
      <label>Discussion topic<input list="try-now-topics" required maxLength={500} value={topic} onChange={event => setTopic(event.target.value)} /></label>
      <datalist id="try-now-topics">{TOPICS.map(value => <option key={value} value={value} />)}</datalist>
      <p>In a live round, Spectakles records your discussion for coaching. This microphone check saves no audio.</p>
      <label className="try-now-check"><input type="checkbox" checked={headphones} onChange={event => setHeadphones(event.target.checked)} /> I’m wearing headphones</label>
      <div className="try-now-actions">
        <button type="button" disabled={!headphones || !probe || checking} onClick={() => void checkMic()}>{checking ? 'Checking…' : 'Check microphone'}</button>
        <span role="status">{micReady ? 'Microphone available' : ''}</span>
      </div>
      {micError && <p role="alert">{micError}</p>}
      <div className="try-now-actions">
        <button type="button" disabled={!headphones} onClick={() => void playTone()}>Play test tone</button>
        <label className="try-now-check"><input type="checkbox" checked={heard} disabled={!played} onChange={event => setHeard(event.target.checked)} /> I heard the tone</label>
      </div>
      {speakerError && <p role="alert">{speakerError}</p>}
      <button disabled={!canStartRound || !topic.trim() || !headphones || !micReady || !heard || joining}>
        {joining ? 'Joining…' : useQueue ? 'Join queue' : 'Start preparation'}
      </button>
      {joinError && <p role="alert">{joinError}</p>}
      {!canStartRound && <p role="status">Live rounds aren’t available yet.</p>}
    </form>
  </>;
}

function LocalFlow({ uid, canRehearse, canRunLive, onLiveDone }: {
  uid: string;
  canRehearse: boolean;
  canRunLive: boolean;
  onLiveDone: () => void;
}) {
  const { request } = usePlatform();
  const useQueue = canRunLive || (canRehearse && import.meta.env.VITE_GD_TRY_NOW_QUEUE === '1');
  const queueKey = `spectakles-try-now-queue:${uid}`;
  const [entry, setEntry] = useState(() => useQueue ? readQueueEntry(queueKey) : null);
  const [releaseError, setReleaseError] = useState('');
  const [showLive, setShowLive] = useState(false);
  const key = `spectakles-try-now:${uid}`;
  const [draft, setDraft] = useState(() => canRehearse ? readDraft(key) : null);
  const [finished, setFinished] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => { if (canRehearse) writeDraft(key, draft); }, [canRehearse, key, draft]);
  useEffect(() => { if (useQueue) saveQueueEntry(queueKey, entry); }, [useQueue, queueKey, entry]);
  const roundId = draft?.roundId;
  const finish = useCallback(() => {
    setDraft(null);
    setFinished(true);
    setReleaseError('');
    if (roundId) void request(reservationPath(roundId), { method: 'DELETE' }).then(reply => {
      if (!reply.ok) throw new Error('Release failed');
    }).catch(() => setReleaseError('The reserved slot could not be released immediately. It will expire automatically.'));
  }, [request, roundId]);
  const beginPrep = (topic: string, id?: string) => {
    setSeconds(PREP_SECONDS);
    setDraft({ topic, notes: '', phase: 'prep', deadline: Date.now() + PREP_SECONDS * 1000, roundId: id });
  };
  const deadline = draft?.deadline;
  const phase = draft?.phase;
  useEffect(() => {
    if (deadline === undefined) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining > 0) return;
      if (phase === 'prep') {
        setDraft(current => current?.phase === 'prep'
          ? { ...current, phase: 'discussion', deadline: Date.now() + DISCUSSION_SECONDS * 1000 }
          : current);
      } else {
        finish();
      }
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [deadline, phase, finish]);

  if (finished) return <>
    <h1>Evaluation</h1>
    <p>Rehearsal complete. A live round will show your summary, scores, and coaching here.</p>
    {releaseError && <p role="alert">{releaseError}</p>}
    <button onClick={() => setFinished(false)}>Back to Try Now</button>
  </>;

  if (entry && showLive) return <RunnerLiveRound entry={entry} onLeave={() => {
    saveQueueEntry(queueKey, null);
    onLiveDone();
  }} />;
  if (entry && !draft) return <RunnerQueue entry={entry} onLeave={() => setEntry(null)} onClaim={claim => {
    if (canRunLive) {
      setShowLive(true);
      return;
    }
    setEntry(null);
    beginPrep(claim.topic, claim.roundId);
  }} />;
  if (!draft) return <DeviceChecks canStartRound={canRunLive || canRehearse} useQueue={useQueue} onStart={async topic => {
    if (!useQueue) {
      beginPrep(topic);
      return;
    }
    const reply = await request('/api/runner/queue', { method: 'POST' });
    if (!reply.ok) throw await responseError(reply);
    const ticket = await reply.json() as Ticket;
    if (ticket.status === 'idle') throw new Error('Could not join the queue. Try again.');
    setEntry({ topic, roundId: ticket.round_id });
  }} />;

  const prep = draft.phase === 'prep';
  return <>
    <h1>{prep ? 'Preparation' : 'Discussion'}</h1>
    <p>{draft.topic}</p>
    <p role="timer" aria-label={prep ? 'Preparation time remaining' : 'Discussion time remaining'}>
      {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
    </p>
    {!prep && <p>{PANEL.join(', ')} · Local rehearsal</p>}
    <label>Private notes<textarea maxLength={12000} value={draft.notes} onChange={event => {
      const notes = event.target.value;
      setDraft(current => current ? { ...current, notes } : current);
    }} /></label>
    <button onClick={() => {
      if (prep) {
        setSeconds(DISCUSSION_SECONDS);
        setDraft({ ...draft, phase: 'discussion', deadline: Date.now() + DISCUSSION_SECONDS * 1000 });
      } else {
        finish();
      }
    }}>{prep ? 'Skip preparation' : 'End discussion'}</button>
  </>;
}

export default function TryNow() {
  const platform = usePlatform();
  const uid = platform.user?.uid;
  const [gate, setGate] = useState<{ uid: string; access?: Access; error?: string } | null>(null);
  const [retry, setRetry] = useState(0);
  const [signOutError, setSignOutError] = useState('');
  useEffect(() => {
    if (!uid) return;
    const controller = new AbortController();
    void platform.request('/api/runner/access', { signal: controller.signal }).then(async response => {
      if (!response.ok) throw await responseError(response);
      const access = await response.json() as Access;
      if (!controller.signal.aborted) setGate({ uid, access });
    }).catch(() => {
      if (!controller.signal.aborted) setGate({ uid, error: 'Could not check runner access.' });
    });
    return () => controller.abort();
  }, [uid, platform.request, retry]);

  const current = gate?.uid === uid ? gate : null;
  const canRehearse = import.meta.env.DEV && import.meta.env.VITE_GD_TRY_NOW_REHEARSAL === '1'
    && platform.status?.emulator === true;
  const checkAgain = () => { setGate(null); setRetry(value => value + 1); };
  const leave = async () => {
    if (!uid || !platform.auth) return;
    try {
      const draftKey = `spectakles-try-now:${uid}`;
      const queueKey = `spectakles-try-now-queue:${uid}`;
      const roundId = readDraft(draftKey)?.roundId ?? readQueueEntry(queueKey)?.roundId;
      if (roundId) await platform.request(reservationPath(roundId), { method: 'DELETE' }).catch(() => undefined);
      await signOut(platform.auth);
      writeDraft(draftKey, null);
      saveQueueEntry(queueKey, null);
      setGate(null);
      setSignOutError('');
    } catch { setSignOutError('Could not sign out. Please try again.'); }
  };
  let content;
  if (!platform.ready) content = <p role="status">Connecting…</p>;
  else if (platform.error || !platform.status?.enabled || !platform.auth) {
    content = <p role="alert">Could not connect to Try Now. Reload to retry.</p>;
  } else if (!uid) content = <SignIn />;
  else if (!current) content = <p role="status">Checking access…</p>;
  else if (current.error) {
    content = <><p role="alert">{current.error}</p><button onClick={checkAgain}>Retry</button></>;
  } else if (!current.access?.approved) {
    content = <><h1>Approval required</h1><p>Ask the Spectakles team to approve your account.</p><button onClick={checkAgain}>Check again</button></>;
  } else if (current.access.attempts_remaining < 1) {
    content = <><h1>No tries remaining</h1><p>Ask the Spectakles team for another try.</p><button onClick={checkAgain}>Check again</button></>;
  } else {
    content = <LocalFlow key={uid} uid={uid} canRehearse={canRehearse}
      canRunLive={platform.status?.runner_live === true} onLiveDone={checkAgain} />;
  }

  return <main className="try-now">
    {uid && <button type="button" className="try-now-sign-out" onClick={() => void leave()}>Sign out</button>}
    {signOutError && <p role="alert">{signOutError}</p>}
    {content}
  </main>;
}
