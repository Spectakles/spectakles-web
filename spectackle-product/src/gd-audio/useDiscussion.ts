import { usePlatform, type Panelist } from '../platform/context';
import { useEffect, useRef, useState } from 'react';
import { NativeLive, INITIAL_LIVE } from './live';
import type { LiveSnapshot } from './live';
import type { Boundary } from './dsp';
import type { RecordingEvent, SavedRecording } from './recording';
import playbackWorkletUrl from './playback.worklet.ts?worker&url';

export type DiscussionState = {
  topic: string; user_name: string; panel: Panelist[]; allow_preparation_skip: boolean;
  phase: 'idle' | 'starting' | 'preparing' | 'connecting' | 'waiting' | 'discussion' | 'closing' | 'final_minute' | 'expired' | 'ending' | 'ended' | 'error';
  session_id: string; prep_remaining_ms: number; prep_skipped: boolean; remaining_ms: number; duration_ms: number;
  closing_window_ms: number; final_window_ms: number;
  intro_remaining_ms: number | null; owner: string; leader: string | null; floor: string;
  providers: Record<string, boolean>; transcript: { speaker: string; text: string }[];
  end_reason: string; notice: string; receivedAt: number;
};
export const EMPTY_DISCUSSION: DiscussionState = { topic: 'AI: boon or bane', user_name: 'Srijan', panel: [], allow_preparation_skip: true, phase: 'idle', session_id: '', prep_remaining_ms: 120000, prep_skipped: false,
  remaining_ms: 720000, duration_ms: 720000, intro_remaining_ms: null, owner: 'arjun', leader: null,
  closing_window_ms: 45000, final_window_ms: 30000,
  floor: 'LISTENING', providers: {}, transcript: [], end_reason: '', notice: '', receivedAt: 0 };
const recordingPhases = ['waiting', 'discussion', 'closing', 'final_minute', 'expired'];

export function useDiscussion(enabled: boolean, stopMicrophone: () => void) {
  const platform = usePlatform();
  const [state, setState] = useState({ ...EMPTY_DISCUSSION });
  const [live, setLive] = useState<LiveSnapshot>({ ...INITIAL_LIVE });
  const [devMessage, setDevMessage] = useState('');
  const current = useRef(state); current.current = state;
  const client = useRef<NativeLive | null>(null);
  const stopper = useRef(stopMicrophone); stopper.current = stopMicrophone;
  const active = useRef(enabled); active.current = enabled;
  const ending = useRef(false);
  const generation = useRef(0);
  const endTimer = useRef<ReturnType<typeof setTimeout>>();
  const introTimer = useRef<ReturnType<typeof setTimeout>>();
  const acceptsRecording = () => recordingPhases.includes(current.current.phase) && !ending.current;
  const end = (reason = 'ended_by_user') => {
    if (ending.current || !client.current) return;
    ending.current = true;
    clearTimeout(introTimer.current);
    setState(previous => ({ ...previous, phase: 'ending' }));
    client.current.playback.interrupt();
    client.current.playback.sendControl({ type: 'end', reason });
    stopper.current();
    endTimer.current = setTimeout(() => {
      void client.current?.close(); client.current = null;
      if (active.current) setState(previous => ({ ...previous, phase: 'error', end_reason: 'The session ended locally; backend confirmation was unavailable. Received files are preserved.' }));
    }, 9000);
  };
  useEffect(() => {
    active.current = enabled;
    if (!enabled) {
      ending.current = false;
      current.current = { ...EMPTY_DISCUSSION };
      setState({ ...EMPTY_DISCUSSION });
      setLive({ ...INITIAL_LIVE });
    }
    return () => {
    active.current = false; generation.current++;
    clearTimeout(endTimer.current); clearTimeout(introTimer.current);
    void client.current?.close(); client.current = null;
    };
  }, [enabled]);

  const start = (startMicrophone: () => Promise<SavedRecording | null | undefined>, options: { skipPreparation?: boolean } = {}) => {
    if (!active.current || client.current) return;
    ending.current = false;
    setDevMessage('');
    const skipPreparation = options.skipPreparation === true;
    const own = ++generation.current;
    const update = (value: DiscussionState) => { current.current = value; setState(value); };
    update({ ...EMPTY_DISCUSSION, phase: 'starting' });
    const recording = startMicrophone();
    const url = new URL('/api/discussions/ws', window.location.origin);
    url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const instance = new NativeLive({
      url: url.href, workletUrl: playbackWorkletUrl, recordingId: '',
      hello: async () => {
        const saved = await recording;
        if (!saved || generation.current !== own) throw new Error('Microphone setup did not complete. Check permissions and try again.');
        const idToken = await platform.token();
        const selected = platform.selected;
        return { type: 'hello', version: 1, recording_id: saved.recording_id, skip_prep: skipPreparation,
          ...(idToken ? { id_token: idToken } : {}),
          ...(selected ? { template_ref: { organization_id: selected.organization_id, template_id: selected.id, version: selected.version } } : {}) };
      },
      startupMessage: 'Starting your microphone and local discussion…',
      acceptInput: acceptsRecording,
      snapshot: value => {
        if (!active.current || generation.current !== own) return;
        setLive(value);
        if (value.phase === 'idle' && document.visibilityState === 'hidden') {
          ending.current = true; clearTimeout(endTimer.current); clearTimeout(introTimer.current);
          stopper.current(); client.current = null;
          update({ ...current.current, phase: 'ended', end_reason: 'The discussion ended when this tab was hidden. Start a fresh round to continue.' });
        }
      },
      error: () => {
        if (!active.current || generation.current !== own) return;
        ending.current = true; stopper.current();
        clearTimeout(endTimer.current); clearTimeout(introTimer.current);
        update({ ...current.current, phase: 'error', end_reason: instance.snapshot.message || 'The discussion connection stopped. Start a fresh discussion.' });
        client.current = null;
      },
      message: (message: Record<string, unknown>) => {
        if (message.type === 'preparation_result') return true;
        if (message.type === 'dev_control_result') {
          if (active.current && generation.current === own) setDevMessage(String(message.message));
          return true;
        }
        if (message.type !== 'discussion_state') return false;
        if (!active.current || generation.current !== own) return true;
        const next = { ...EMPTY_DISCUSSION, ...message, receivedAt: performance.now() } as unknown as DiscussionState;
        if (ending.current && !['ended', 'error'].includes(next.phase)) return true;
        update(next);
        clearTimeout(introTimer.current);
        instance.playback.scheduleIntroductionCut(next.intro_remaining_ms);
        if (next.intro_remaining_ms !== null && next.intro_remaining_ms > 0 && next.leader !== 'user') {
          introTimer.current = setTimeout(() => instance.playback.interrupt('intro_deadline'), Math.max(0, next.intro_remaining_ms - instance.playback.outputLatencyMs - 100));
        }
        if (['ended', 'error'].includes(next.phase)) {
          ending.current = true; clearTimeout(endTimer.current); clearTimeout(introTimer.current);
          stopper.current(); void instance.close(); client.current = null;
        }
        return true;
      },
    });
    client.current = instance;
    void instance.open();
  };
  const setRemaining = (remainingMs: number) => {
    if (!client.current || ending.current || !active.current) return false;
    try {
      client.current.playback.sendControl({ type: 'dev_set_remaining', remaining_ms: remainingMs });
      setDevMessage('Updating discussion clock…');
      return true;
    } catch { setDevMessage('Clock change could not be sent. Check the discussion connection.'); return false; }
  };
  const ready = () => {
    if (current.current.phase !== 'preparing' || !client.current || ending.current) return;
    try { client.current.playback.sendControl({ type: 'preparation_ready' }); }
    catch { end('microphone_stopped'); }
  };
  return { state, live, start, end, ready, acceptsRecording, setRemaining, devMessage,
    input: (event: RecordingEvent) => client.current?.push(event),
    boundary: (event: Boundary) => client.current?.boundary(event),
    micStopped: () => { if (!ending.current) end('microphone_stopped'); },
    getVadPort: () => client.current?.createVadPort(),
  };
}
