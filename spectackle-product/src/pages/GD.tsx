import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePlatform } from '../platform/context';
import { useDiscussion } from '../gd-audio/useDiscussion';
import { useMicrophoneTest } from '../gd-audio/useMicrophoneTest';
import { HumanCaptions, type RecognitionConstructor } from '../gd-audio/captions';
import DiscussionRoom from '../gd-room/DiscussionRoom';
import { displayRole, formatTime, type ConnectionStatus } from '../gd-room/room-model';
import './gd-room.css';

const defaultPanel = [
  { id: 'arjun', name: 'Arjun', role: 'Skeptical analyst', color: 'lavender' },
  { id: 'sahil', name: 'Sahil', role: 'Practical problem-solver', color: 'peach' },
  { id: 'meera', name: 'Meera', role: 'Thoughtful clarifier', color: 'mint' },
];

function useBackendStatus() {
  const [status, setStatus] = useState<ConnectionStatus>('checking');
  useEffect(() => {
    let active = true;
    let poll: number | undefined;
    let controller: AbortController | undefined;
    async function check() {
      controller = new AbortController();
      const deadline = window.setTimeout(() => controller?.abort(), 2000);
      try {
        const response = await fetch('/api/health', { signal: controller.signal, cache: 'no-store', headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error('Service unavailable');
        const health = await response.json();
        if (active) setStatus(health.status === 'ok' && health.service === 'spectakles-gd' && health.stage === 1 && health.discussion === true ? 'online' : 'offline');
      } catch {
        if (active) setStatus('offline');
      } finally {
        window.clearTimeout(deadline);
        if (active) poll = window.setTimeout(check, 3000);
      }
    }
    void check();
    return () => { active = false; window.clearTimeout(poll); controller?.abort(); };
  }, []);
  return status;
}

export default function GD({ acquireStream, recognitionCreate }: {
  acquireStream?: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
  recognitionCreate?: RecognitionConstructor;
} = {}) {
  const platform = usePlatform();
  const location = useLocation();
  const navigate = useNavigate();
  const inRoom = location.pathname === '/gd/dev';
  const status = useBackendStatus();
  const microphoneStop = useRef<() => void>(() => {});
  const discussion = useDiscussion(inRoom, () => microphoneStop.current());
  const microphone = useMicrophoneTest(inRoom, {
    boundary: discussion.boundary, stop: discussion.micStopped, input: discussion.input,
  }, () => ['idle', 'ended', 'error'].includes(discussion.state.phase) || discussion.acceptsRecording(), acquireStream, platform.token);
  microphoneStop.current = () => { void microphone.stop(); };
  const selectedSettings = platform.selected?.settings || platform.profile?.personal_template;
  const metadataActive = !['idle', 'starting'].includes(discussion.state.phase);
  const panel = metadataActive && discussion.state.panel.length ? discussion.state.panel : selectedSettings?.panel || defaultPanel;
  const humanName = metadataActive ? discussion.state.user_name : platform.profile?.user.name || 'You';
  const participants = [...panel.map(person => ({ ...person, role: displayRole(person.role) })), { id: 'user', name: humanName, role: 'You', color: 'yellow' }];
  const topic = metadataActive ? discussion.state.topic : selectedSettings?.topic || 'AI: boon or bane';
  const prepSeconds = selectedSettings?.preparation_seconds ?? 120;
  const durationSeconds = metadataActive ? discussion.state.duration_ms / 1000 : selectedSettings?.discussion_seconds ?? 720;
  const [notes, setNotes] = useState('');
  const [captionsOn, setCaptionsOn] = useState(false);
  const [captionStatus, setCaptionStatus] = useState('');
  const [humanCaption, setHumanCaption] = useState('');
  const [, setTick] = useState(0);
  const phase = discussion.state.phase;
  const elapsed = discussion.state.receivedAt ? Math.max(0, performance.now() - discussion.state.receivedAt) : 0;
  const remaining = phase === 'preparing' ? discussion.state.prep_remaining_ms : discussion.state.remaining_ms;
  const clock = formatTime(['idle', 'starting'].includes(phase) ? durationSeconds * 1000
    : remaining - (['preparing', 'discussion', 'closing', 'final_minute', 'expired'].includes(phase) ? elapsed : 0));
  const speakingRef = useRef(false);
  speakingRef.current = microphone.snapshot.speaking;
  const audioRef = useRef({ microphone, discussion });
  audioRef.current = { microphone, discussion };

  useEffect(() => { if (!inRoom) { setNotes(''); setHumanCaption(''); } }, [inRoom]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick(value => value + 1), 250);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (microphone.snapshot.phase === 'listening' && discussion.live.playback.connection) {
      const port = audioRef.current.discussion.getVadPort();
      if (port) audioRef.current.microphone.connectPlayback(port);
    }
  }, [microphone.snapshot.phase, discussion.live.playback.connection]);
  const recognize = captionsOn && discussion.acceptsRecording() && microphone.snapshot.phase === 'listening';
  useEffect(() => {
    setHumanCaption('');
    setCaptionStatus('');
    if (!recognize) return;
    const recognizer = new HumanCaptions({ create: recognitionCreate, caption: value => {
      if (speakingRef.current) setHumanCaption(value.text);
    }, status: setCaptionStatus });
    recognizer.start();
    return () => recognizer.close();
  }, [recognize, recognitionCreate]);
  useEffect(() => { if (!microphone.snapshot.speaking) setHumanCaption(''); }, [microphone.snapshot.speaking]);
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Discussion room · Spectakles';
    return () => { document.title = previousTitle; };
  }, []);

  const canStart = ['idle', 'ended', 'error'].includes(phase) && ['idle', 'error'].includes(microphone.snapshot.phase)
    && !microphone.permission.busy && status === 'online';
  const start = () => {
    // Keep the entry route compatible with existing workspace links.
    if (!inRoom) { navigate('/gd/dev'); return; }
    if (!canStart) return;
    setNotes(''); setHumanCaption('');
    discussion.start(async () => await microphone.start());
  };

  return <DiscussionRoom participants={participants} topic={topic} state={discussion.state} live={discussion.live}
    microphone={microphone} status={status} clock={clock} preparationSeconds={prepSeconds} durationSeconds={durationSeconds}
    notes={notes} onNotes={setNotes} captionsOn={captionsOn} onCaptions={() => setCaptionsOn(value => !value)}
    captionStatus={captionStatus} humanCaption={humanCaption} canStart={canStart} onStart={start}
    onReady={discussion.ready} onEnd={() => discussion.end()}
    onLeave={() => navigate(platform.status?.enabled ? '/workspace' : '/')} />;
}
