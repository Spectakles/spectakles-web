import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useEffect, useState, type FormEvent } from 'react';
import { MicrophonePermission } from '../gd-audio/devices';
import { responseError, usePlatform } from '../platform/context';
import './try-now.css';

const PREP_SECONDS = 45;
const DISCUSSION_SECONDS = 180;
const PANEL = ['Arjun', 'Sahil', 'Meera', 'Nina'];
const TOPICS = ['Should colleges ban smartphones in class?', 'Should public transport be free?', 'Can AI improve education?'];
type Access = { approved: boolean; attempts_remaining: number };
type Draft = { topic: string; notes: string; phase: 'prep' | 'discussion'; deadline: number };

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

function DeviceChecks({ canRehearse, onStart }: { canRehearse: boolean; onStart: (topic: string) => void }) {
  const [topic, setTopic] = useState('');
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
  return <>
    <h1>Try Now</h1>
    <p>Four AI panelists · 3 minutes · English</p>
    <form onSubmit={event => { event.preventDefault(); if (canRehearse && headphones && micReady && heard && topic.trim()) onStart(topic.trim()); }}>
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
      <button disabled={!canRehearse || !topic.trim() || !headphones || !micReady || !heard}>Start preparation</button>
      {!canRehearse && <p role="status">Live rounds aren’t available yet.</p>}
    </form>
  </>;
}

function LocalFlow({ uid, canRehearse }: { uid: string; canRehearse: boolean }) {
  const key = `spectakles-try-now:${uid}`;
  const [draft, setDraft] = useState(() => canRehearse ? readDraft(key) : null);
  const [finished, setFinished] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => { if (canRehearse) writeDraft(key, draft); }, [canRehearse, key, draft]);
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
        setDraft(null);
        setFinished(true);
      }
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [deadline, phase]);

  if (finished) return <>
    <h1>Evaluation</h1>
    <p>Rehearsal complete. A live round will show your summary, scores, and coaching here.</p>
    <button onClick={() => setFinished(false)}>Back to Try Now</button>
  </>;

  if (!draft) return <DeviceChecks canRehearse={canRehearse} onStart={topic => {
    setSeconds(PREP_SECONDS);
    setDraft({ topic, notes: '', phase: 'prep', deadline: Date.now() + PREP_SECONDS * 1000 });
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
        setDraft(null);
        setFinished(true);
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
      await signOut(platform.auth);
      writeDraft(`spectakles-try-now:${uid}`, null);
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
    content = <LocalFlow key={uid} uid={uid} canRehearse={canRehearse} />;
  }

  return <main className="try-now">
    {uid && <button type="button" className="try-now-sign-out" onClick={() => void leave()}>Sign out</button>}
    {signOutError && <p role="alert">{signOutError}</p>}
    {content}
  </main>;
}
