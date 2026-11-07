import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, AudioLines, Captions, Check, ChevronRight, Clock3, Expand,
  Headphones, LockKeyhole, Mic, MicOff, Minimize, NotebookPen, PhoneOff, RefreshCw,
  ShieldCheck, Sparkles, Users, Wifi, WifiOff, X,
} from 'lucide-react';
import SpectaklesLogo from '../components/SpectaklesLogo';
import { portraitFor } from './portraits';
import { ApiDownload } from '../platform/ProtectedMedia';
import type { useMicrophoneTest } from '../gd-audio/useMicrophoneTest';
import type { DiscussionState } from '../gd-audio/useDiscussion';
import type { LiveSnapshot } from '../gd-audio/live';
import { formatTime, isRoundActive, isSpeaking, personStatus, phaseLabels, type ConnectionStatus, type RoomPerson } from './room-model';

type Drawer = 'notes' | 'people' | 'settings' | null;
type RoomProps = {
  participants: RoomPerson[]; topic: string; state: DiscussionState; live: LiveSnapshot;
  microphone: ReturnType<typeof useMicrophoneTest>; status: ConnectionStatus; clock: string;
  preparationSeconds: number; durationSeconds: number; notes: string; onNotes: (value: string) => void;
  captionsOn: boolean; onCaptions: () => void; captionStatus: string; humanCaption: string;
  canStart: boolean; onStart: () => void; onReady: () => void; onEnd: () => void; onLeave: () => void;
};

function initials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase() || '?'; }

function SoundWave({ active = false }: { active?: boolean }) {
  return <span className={`meet-wave ${active ? 'meet-wave--active' : ''}`} aria-hidden="true"><i /><i /><i /><i /><i /></span>;
}

function ParticipantTile({ person, room }: { person: RoomPerson; room: RoomProps }) {
  const speaking = isSpeaking(person, room.microphone.snapshot, room.live, room.state);
  const human = person.id === 'user';
  const [portraitFailed, setPortraitFailed] = useState(false);
  const portrait = !human && !portraitFailed ? portraitFor(person.id) : undefined;
  return <article className={`meet-tile meet-tone--${person.color} ${speaking ? 'meet-tile--speaking' : ''} ${portrait ? 'meet-tile--portrait' : ''}`} aria-label={`${person.name}${human ? ' (you)' : ''}: ${personStatus(person, room.microphone.snapshot, room.live, room.state)}`}>
    {portrait && <img className="meet-portrait" src={portrait} alt="" decoding="async" onError={() => setPortraitFailed(true)} />}
    <div className="meet-tile-top"><span className="meet-person-kind">{!human && <><Sparkles size={13} /> AI</>}</span>
      <span className={`meet-tile-audio ${speaking ? 'meet-tile-audio--speaking' : ''}`} aria-hidden="true">{speaking ? <SoundWave active /> : human && room.microphone.snapshot.phase !== 'listening' ? <MicOff size={15} /> : <Mic size={15} />}</span>
    </div>
    <div className="meet-avatar-wrap"><div className="meet-avatar" aria-hidden="true">{initials(person.name)}</div>
    </div>
    <div className="meet-tile-bottom"><div><h2>{person.name}{human && person.name !== 'You' && <span> (You)</span>}</h2></div>
    </div>
  </article>;
}

function DeviceSettings({ room }: { room: RoomProps }) {
  const mic = room.microphone;
  const locked = isRoundActive(room.state.phase) || mic.permission.busy || !['idle', 'error'].includes(mic.snapshot.phase);
  const missing = !!mic.selectedDeviceId && !mic.deviceList.devices.some(device => device.deviceId === mic.selectedDeviceId);
  return <div className="meet-device-settings">
    <div className="meet-field-label"><Mic size={16} /><label htmlFor="meet-microphone">Microphone</label></div>
    <select id="meet-microphone" value={mic.selectedDeviceId} disabled={locked} onChange={event => mic.selectDevice(event.target.value)} aria-describedby="meet-device-help">
      <option value="">System default</option>
      {missing && <option value={mic.selectedDeviceId}>Selected microphone unavailable</option>}
      {mic.deviceList.devices.map(device => <option key={device.deviceId} value={device.deviceId}>{device.label}</option>)}
    </select>
    <p id="meet-device-help">{locked ? 'Change microphones after this round.' : 'Headphones recommended.'}</p>
    {!locked && <div className="meet-device-actions">
      {!mic.deviceList.hasLabels && <button type="button" className="meet-inline-action" onClick={() => { void mic.allowDevices(); }}>Find microphones <ChevronRight size={14} /></button>}
      <button type="button" className="meet-refresh" aria-label="Refresh microphones" title="Refresh microphones" disabled={mic.deviceList.loading} onClick={mic.refreshDevices}><RefreshCw size={15} className={mic.deviceList.loading ? 'meet-spin' : ''} /></button>
    </div>}
    {mic.permission.busy && <p role="status">Waiting for microphone permission…</p>}
    {(mic.permission.error || mic.deviceList.error || missing) && <p className="meet-field-error" role="alert">{mic.permission.error || mic.deviceList.error || 'Your selected microphone is no longer available. Refresh the list or choose another input.'}</p>}
    <div className="meet-device-output"><Headphones size={17} /><div><strong>Speaker output</strong><p>Uses your system output.</p></div></div>
  </div>;
}

function Notes({ room, preparation = false }: { room: RoomProps; preparation?: boolean }) {
  return <div className={`meet-notes ${preparation ? 'meet-notes--preparation' : ''}`}>
    <label htmlFor="meet-private-notes" className="meet-note-label"><NotebookPen size={18} />Private notes</label>
    <textarea id="meet-private-notes" value={room.notes} onChange={event => room.onNotes(event.target.value)} maxLength={12000}
      aria-describedby="meet-notes-privacy" placeholder={'Opening point\n\nExample\n\nCounterpoint'} spellCheck />
    <div className="meet-notes-foot"><span id="meet-notes-privacy"><LockKeyhole size={14} />Private. Cleared on exit or a new round.</span><span>{room.notes.length.toLocaleString()} / 12,000</span></div>
  </div>;
}

export default function DiscussionRoom(room: RoomProps) {
  const { state, microphone } = room;
  const phase = state.phase;
  const busy = isRoundActive(phase);
  const preparing = phase === 'preparing';
  const finished = phase === 'ended' || phase === 'error';
  const idle = phase === 'idle';
  const [drawer, setDrawer] = useState<Drawer>('settings');
  const [confirmation, setConfirmation] = useState<'end' | 'leave' | null>(null);
  const [leaveAfterEnd, setLeaveAfterEnd] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);
  const [screenMessage, setScreenMessage] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const sidePanel = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const captionLog = useRef<HTMLDivElement>(null);
  const previousPhase = useRef(phase);
  const leave = useRef(room.onLeave); leave.current = room.onLeave;
  const drawerTrigger = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (phase === 'preparing' || phase === 'connecting' || phase === 'ended' || phase === 'error') setDrawer(null);
    if (previousPhase.current !== phase) setScreenMessage('');
    previousPhase.current = phase;
  }, [phase]);
  useEffect(() => {
    if (leaveAfterEnd && (phase === 'ended' || phase === 'error')) leave.current();
  }, [leaveAfterEnd, phase]);
  useEffect(() => {
    if (confirmation) dialog.current?.showModal();
    else dialog.current?.close();
  }, [confirmation]);
  useEffect(() => {
    setFullscreenSupported(document.fullscreenEnabled && !!document.documentElement.requestFullscreen);
    const update = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);
  useEffect(() => {
    const log = captionLog.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [room.captionsOn, room.humanCaption, state.transcript]);
  useEffect(() => {
    if (!drawer) return;
    if (drawerTrigger.current) {
      const target = sidePanel.current?.querySelector<HTMLElement>('textarea')
        || sidePanel.current?.querySelector<HTMLElement>('select:not(:disabled)')
        || sidePanel.current?.querySelector<HTMLElement>('button');
      target?.focus();
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !dialog.current?.open) {
        setDrawer(null);
        drawerTrigger.current?.focus();
      }
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [drawer]);
  useEffect(() => {
    if (!busy) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [busy]);

  const toggleDrawer = (value: Exclude<Drawer, null>, button: HTMLButtonElement) => {
    drawerTrigger.current = button;
    setDrawer(previous => previous === value ? null : value);
  };
  const closeDrawer = () => { setDrawer(null); drawerTrigger.current?.focus(); };
  const requestLeave = () => { if (busy) setConfirmation('leave'); else room.onLeave(); };
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await root.current?.requestFullscreen();
    } catch { setScreenMessage('Full screen is unavailable. Continue in this window.'); }
  };
  const endReason = ({
    ended_by_user: 'Your recordings are saved in your workspace.',
    microphone_stopped: 'Your microphone stopped. Check Audio before trying again.',
    browser_disconnected: 'Connection lost. Recordings already received are saved.',
    'time limit reached; current turn finished': 'Time’s up. Your round is complete.',
  } as Record<string, string>)[state.end_reason] || state.end_reason;
  const warning = room.status === 'offline' ? 'Connection unavailable. Check your connection and try again.'
    : microphone.snapshot.phase === 'error' && !finished ? microphone.snapshot.message : '';
  const currentSpeaker = room.participants.find(person => isSpeaking(person, microphone.snapshot, room.live, state));
  const micLevel = Math.min(100, Math.round(microphone.snapshot.rms * 350));
  const timerLabel = preparing ? 'Preparation remaining' : 'Discussion remaining';
  const lowTime = ['closing', 'final_minute', 'expired'].includes(phase);
  const hasCaptions = state.transcript.length > 0 || !!room.humanCaption;

  return <div className="meet-room" ref={root}>
    <header className="meet-header">
      <div className="meet-brand-group"><button type="button" className="meet-icon-button meet-back" aria-label="Back to workspace" disabled={phase === 'ending'} onClick={requestLeave}><ArrowLeft size={19} /></button>
        <SpectaklesLogo variant="white" height={20} /><span className="meet-header-divider" /><span className="meet-product-name">Discussion room</span>
      </div>
      <div className="meet-header-right"><span className={`meet-connection ${room.status === 'offline' ? 'meet-connection--offline' : ''}`} role="status" title={room.status === 'online' ? 'Discussion service connected' : 'Connecting to the discussion service'}>{room.status === 'offline' ? <WifiOff size={15} /> : <Wifi size={15} />}<span>{room.status === 'online' ? 'Connected' : room.status === 'checking' ? 'Connecting' : 'Offline'}</span></span>
        <span className="meet-private-badge"><ShieldCheck size={15} /> Private session</span>
      </div>
    </header>

    <main className="meet-main">
      <div className="meet-topic-bar"><div className="meet-topic-copy"><div className="meet-overline">{preparing ? 'PREPARATION' : 'GROUP DISCUSSION'}<span />{room.participants.length} participants</div><h1 title={room.topic}>{room.topic}</h1></div>
        <div className={`meet-timer ${lowTime ? 'meet-timer--closing' : ''}`}><Clock3 size={18} /><div><strong role="timer" aria-label={timerLabel}>{room.clock}</strong><span>{preparing ? 'to prepare' : idle ? 'discussion time' : finished ? 'remaining at finish' : 'remaining'}</span></div></div>
      </div>
      {warning && <div className="meet-banner meet-banner--error" role="alert"><WifiOff size={17} /><p>{warning}</p></div>}
      {state.notice && !finished && <div className="meet-banner" role="status"><AudioLines size={17} /><p>{state.notice}</p></div>}
      {screenMessage && <div className="meet-banner" role="status"><p>{screenMessage}</p></div>}

      <div className={`meet-workspace ${drawer ? 'meet-workspace--with-panel' : ''}`}>
        <section className={`meet-stage ${room.captionsOn ? 'meet-stage--captioned' : ''}`} aria-label={preparing ? 'Preparation space' : 'Discussion participants'}>
          {preparing ? <div className="meet-preparation">
            <div className="meet-prep-heading"><h2>Prepare your points</h2><p>Note your opening, examples and counterpoints.</p></div>
            <Notes room={room} preparation />
          </div> : finished ? <div className="meet-finished">
            <span className={`meet-finished-icon ${phase === 'error' ? 'meet-finished-icon--error' : ''}`}>{phase === 'error' ? <WifiOff size={30} /> : <Check size={34} />}</span>
            <h2>{phase === 'error' ? 'Discussion stopped' : 'Discussion complete'}</h2>
            <p>{endReason || (phase === 'error' ? room.live.message || 'Check your connection and microphone, then try again.' : 'Your recordings are saved.')}</p>
            <div className="meet-finished-actions"><button className="meet-primary" type="button" disabled={!room.canStart} onClick={room.onStart}>New discussion <ArrowRight size={17} /></button><button className="meet-secondary" type="button" onClick={room.onLeave}>Back to workspace</button></div>
            {room.live.sessionUrl && <div className="meet-record-download"><ApiDownload path={room.live.sessionUrl} name="discussion.json">Download discussion record</ApiDownload></div>}
          </div> : <>
            <div className="meet-stage-status" role="status"><span className={`meet-status-dot ${busy ? 'meet-status-dot--live' : ''}`} /><span>{currentSpeaker ? `${currentSpeaker.id === 'user' ? 'You are' : `${currentSpeaker.name} is`} speaking` : phaseLabels[phase]}</span></div>
            <div className={`meet-tiles meet-tiles--${room.participants.length}`}>{room.participants.map(person => <ParticipantTile key={person.id} person={person} room={room} />)}</div>
            {['starting', 'connecting', 'ending'].includes(phase) && <div className="meet-stage-progress" role="status"><span className="meet-loader" />{phaseLabels[phase]}…</div>}
          </>}

          {room.captionsOn && !preparing && !finished && <section className="meet-captions" aria-label="Discussion captions">
            <div className="meet-captions-heading"><Captions size={16} /><span>Live captions</span><button type="button" className="meet-icon-button" aria-label="Close captions" onClick={room.onCaptions}><X size={15} /></button></div>
            <div className="meet-caption-log" ref={captionLog} role="log" aria-live="polite" aria-relevant="additions text">
              {state.transcript.slice(-3).map((line, index) => <p key={`${state.transcript.length - 3 + index}-${line.speaker}`}><strong>{room.participants.find(person => person.id === line.speaker)?.name || line.speaker}</strong><span>{line.text}</span></p>)}
              {room.humanCaption && <p><strong>You</strong><span>{room.humanCaption}</span></p>}
              {!hasCaptions && <p className="meet-caption-empty">Waiting for speech…</p>}
            </div>
            {room.captionStatus && <p className="meet-caption-status" role="status">{room.captionStatus}</p>}
          </section>}
        </section>

        {drawer && <aside ref={sidePanel} className="meet-panel" id="meet-side-panel" aria-label={drawer === 'notes' ? 'Private notes' : drawer === 'people' ? 'Participants' : 'Audio and room details'}>
          <div className="meet-panel-heading"><h2>{drawer === 'notes' ? 'Your notes' : drawer === 'people' ? 'In this discussion' : idle ? 'Before you begin' : 'Room settings'}</h2><button className="meet-panel-close" type="button" aria-label="Close side panel" onClick={closeDrawer}><X size={18} /></button></div>
          <div className="meet-panel-content">
            {drawer === 'notes' && (preparing ? <p className="meet-panel-copy">Your notes are open in the main area.</p> : <Notes room={room} />)}
            {drawer === 'people' && <ul className="meet-people-list">{room.participants.map(person => <li key={person.id} className={`meet-tone--${person.color}`}><span className="meet-small-avatar" aria-hidden="true">{initials(person.name)}</span><div><strong>{person.name}{person.id === 'user' && person.name !== 'You' ? ' (You)' : ''}</strong><small>{personStatus(person, microphone.snapshot, room.live, state)}</small></div>{isSpeaking(person, microphone.snapshot, room.live, state) && <SoundWave active />}</li>)}</ul>}
            {drawer === 'settings' && <><DeviceSettings room={room} />
              <div className="meet-round-plan"><h3>Timing</h3><div><Clock3 size={17} /><p><strong>Preparation</strong><span>{formatTime(room.preparationSeconds * 1000)}</span></p></div><div><Users size={17} /><p><strong>Discussion</strong><span>{formatTime(room.durationSeconds * 1000)}</span></p></div></div>
              <p className="meet-recording-notice"><ShieldCheck size={17} />Discussion speech is recorded for evaluation. Preparation audio is excluded.</p></>}
          </div>
        </aside>}
      </div>
    </main>

    <footer className="meet-toolbar" aria-label="Room controls">
      <div className="meet-toolbar-info"><span className="meet-toolbar-phase">{preparing ? 'Discussion starts when the timer ends' : phaseLabels[phase]}</span></div>
      <div className="meet-toolbar-actions">
        <button type="button" className={`meet-tool ${drawer === 'settings' ? 'meet-tool--selected' : ''}`} aria-label="Audio settings" aria-expanded={drawer === 'settings'} aria-controls="meet-side-panel" onClick={event => toggleDrawer('settings', event.currentTarget)}><span className="meet-tool-icon"><Mic size={20} />{microphone.snapshot.phase === 'listening' && <span className="meet-mic-active" />}</span><span>Audio</span></button>
        {!preparing && <><button type="button" className={`meet-tool ${room.captionsOn ? 'meet-tool--selected' : ''}`} aria-label={room.captionsOn ? 'Turn captions off' : 'Turn captions on'} aria-pressed={room.captionsOn} onClick={room.onCaptions}><span className="meet-tool-icon"><Captions size={21} /></span><span>Captions</span></button>
        <button type="button" className={`meet-tool ${drawer === 'notes' ? 'meet-tool--selected' : ''}`} aria-label="Open private notes" aria-expanded={drawer === 'notes'} aria-controls="meet-side-panel" onClick={event => toggleDrawer('notes', event.currentTarget)}><span className="meet-tool-icon"><NotebookPen size={20} /></span><span>Notes</span></button></>}
        <span className="meet-tool-divider" />
        {preparing && state.allow_preparation_skip && <button type="button" className="meet-primary meet-start" onClick={room.onReady}>Start discussion <ArrowRight size={17} /></button>}
        {busy && !preparing && <button type="button" className="meet-end-button" aria-label={phase === 'ending' ? 'Ending discussion' : 'End discussion'} title="End discussion" disabled={phase === 'ending'} onClick={() => setConfirmation('end')}><PhoneOff size={20} /><span>{phase === 'ending' ? 'Ending…' : 'End discussion'}</span></button>}
        {!busy && !finished && <button type="button" className="meet-primary meet-start" aria-label="Begin preparation" disabled={!room.canStart} onClick={room.onStart}>Prepare<ArrowRight size={19} /></button>}
      </div>
      <div className="meet-toolbar-extra"><button type="button" className={`meet-icon-button ${drawer === 'people' ? 'meet-icon-button--selected' : ''}`} aria-label={`Show ${room.participants.length} participants`} aria-expanded={drawer === 'people'} aria-controls="meet-side-panel" onClick={event => toggleDrawer('people', event.currentTarget)}><Users size={21} /><span className="meet-count">{room.participants.length}</span></button>
        {fullscreenSupported && <button type="button" className="meet-icon-button meet-fullscreen" aria-label={fullscreen ? 'Exit full screen' : 'Enter full screen'} onClick={() => { void toggleFullscreen(); }}>{fullscreen ? <Minimize size={20} /> : <Expand size={20} />}</button>}
      </div>
    </footer>
    {microphone.snapshot.phase === 'listening' && <div className="meet-input-meter" role="meter" aria-label="Microphone input level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={micLevel}><span style={{ width: `${micLevel}%` }} /></div>}

    <dialog ref={dialog} className="meet-end-dialog" aria-labelledby="meet-dialog-title" aria-describedby="meet-dialog-description" onCancel={() => setConfirmation(null)} onClose={() => setConfirmation(null)}>
      <span className="meet-dialog-icon"><PhoneOff size={24} /></span><h2 id="meet-dialog-title">{confirmation === 'leave' ? 'Leave this discussion?' : 'End this discussion?'}</h2>
      <p id="meet-dialog-description">This ends the round and saves your recordings.</p>
      <div><button type="button" className="meet-secondary" autoFocus onClick={() => setConfirmation(null)}>Keep discussing</button><button type="button" className="meet-end-button" onClick={() => { setLeaveAfterEnd(confirmation === 'leave'); setConfirmation(null); room.onEnd(); }}>{confirmation === 'leave' ? 'End & leave' : 'End discussion'}</button></div>
    </dialog>
  </div>;
}
