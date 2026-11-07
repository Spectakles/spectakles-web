// Explicit visual fixture. The product route always uses the real GD hooks.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import DiscussionRoom from '../src/gd-room/DiscussionRoom';
import type { useMicrophoneTest } from '../src/gd-audio/useMicrophoneTest';
import { INITIAL_MICROPHONE } from '../src/gd-audio/microphone';
import { INITIAL_LIVE } from '../src/gd-audio/live';
import { INITIAL_RECORDING } from '../src/gd-audio/recording';
import { EMPTY_DISCUSSION, type DiscussionState } from '../src/gd-audio/useDiscussion';
import { formatTime, type RoomPerson } from '../src/gd-room/room-model';
import '../src/index.css';
import '../src/pages/gd-room.css';

const people: RoomPerson[] = [
  { id: 'arjun', name: 'Arjun', role: 'Skeptical analyst', color: 'lavender' },
  { id: 'sahil', name: 'Sahil', role: 'Practical problem-solver', color: 'peach' },
  { id: 'meera', name: 'Meera', role: 'Thoughtful clarifier', color: 'mint' },
  { id: 'nina', name: 'Nina', role: 'Evidence-focused researcher', color: 'peach' },
  { id: 'rohan', name: 'Rohan', role: 'Practical educator', color: 'lavender' },
];
function Fixture() {
  const [phase, setPhase] = useState<DiscussionState['phase']>('discussion');
  const [count, setCount] = useState(3);
  const [notes, setNotes] = useState('');
  const [captionsOn, setCaptionsOn] = useState(false);
  const [device, setDevice] = useState('');
  const [speaking, setSpeaking] = useState('arjun');
  const participants = [...people.slice(0, count), { id: 'user', name: 'Jay', role: 'You', color: 'yellow' }];
  const state = { ...EMPTY_DISCUSSION, phase, owner: speaking, providers: { arjun: true, sahil: true, meera: true },
    remaining_ms: phase === 'closing' ? 42000 : 527000, end_reason: phase === 'ended' ? 'ended_by_user' : '',
    transcript: [{ speaker: 'arjun', text: 'AI can open up access to education, but the quality of that access matters just as much.' }, { speaker: 'user', text: 'I agree. We should also consider who is being left behind.' }],
  };
  const microphone = { snapshot: { ...INITIAL_MICROPHONE, phase: phase === 'idle' ? 'idle' : 'listening', speaking: speaking === 'user', rms: .08 },
    deviceList: { devices: [{ deviceId: 'headset', label: 'Harmonics Z7' }], loading: false, hasLabels: true, error: '' }, selectedDeviceId: device,
    permission: { busy: false, error: '' }, selectDevice: setDevice, refreshDevices() {}, allowDevices: async () => {},
    recording: INITIAL_RECORDING,
  } as unknown as ReturnType<typeof useMicrophoneTest>;
  return <><div style={{ position: 'fixed', bottom: 0, left: 0, zIndex: 100, background: 'white', color: 'black', padding: '3px', fontSize: 10 }} aria-label="Visual fixture controls">
    <label>Fixture phase <select value={phase} onChange={event => setPhase(event.target.value as DiscussionState['phase'])}>{['idle', 'starting', 'preparing', 'connecting', 'waiting', 'discussion', 'closing', 'ending', 'ended', 'error'].map(value => <option key={value}>{value}</option>)}</select></label>
    <label>AI panel size <select value={count} onChange={event => setCount(Number(event.target.value))}>{[2, 3, 5].map(value => <option key={value}>{value}</option>)}</select></label>
    <label>Speaking <select value={speaking} onChange={event => setSpeaking(event.target.value)}>{['arjun', 'user', 'none'].map(value => <option key={value}>{value}</option>)}</select></label>
  </div><DiscussionRoom participants={participants} topic="AI: boon or bane" state={state}
    live={{ ...INITIAL_LIVE, phase: 'replying', playback: { ...INITIAL_LIVE.playback, phase: 'playing', played: 24000 } }}
    microphone={microphone} status="online" clock={formatTime(phase === 'preparing' ? 98000 : state.remaining_ms)}
    preparationSeconds={120} durationSeconds={720} notes={notes} onNotes={setNotes}
    captionsOn={captionsOn} onCaptions={() => setCaptionsOn(value => !value)} captionStatus="" humanCaption="" canStart={true}
    onStart={() => { setNotes(''); setPhase('preparing'); }} onReady={() => setPhase('discussion')}
    onEnd={() => setPhase('ended')} onLeave={() => setPhase('idle')} /></>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
