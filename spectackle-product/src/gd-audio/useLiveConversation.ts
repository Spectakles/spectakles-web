import { useEffect, useRef, useState } from 'react';
import workletUrl from './playback.worklet.ts?worker&url';
import { NativeLive, INITIAL_LIVE } from './live';
import type { RecordingEvent } from './recording';
import type { Boundary } from './dsp';

export function useLiveConversation(enabled: boolean, failed: () => void) {
  const [snapshot, setSnapshot] = useState({ ...INITIAL_LIVE });
  const controller = useRef<NativeLive | null>(null);
  const active = useRef(enabled); active.current = enabled;
  const onFailure = useRef(failed); onFailure.current = failed;
  useEffect(() => {
    active.current = enabled;
    if (!enabled) setSnapshot({ ...INITIAL_LIVE });
    return () => { active.current = false; void controller.current?.close(); controller.current = null; };
  }, [enabled]);
  return {
    snapshot,
    start: (recordingId: string) => {
      if (!active.current || !['idle', 'error'].includes(snapshot.phase)) return;
      const url = new URL(`${import.meta.env.BASE_URL}api/live/ws`, location.origin);
      url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const instance = new NativeLive({ url: url.href, workletUrl, recordingId,
        snapshot: next => { if (active.current && controller.current === instance) setSnapshot(next); },
        error: () => { if (active.current && controller.current === instance) onFailure.current(); } });
      controller.current = instance; void instance.open();
    },
    input: (event: RecordingEvent) => controller.current?.push(event),
    boundary: (event: Boundary) => controller.current?.boundary(event),
    getVadPort: () => controller.current?.createVadPort(),
    stop: () => { void controller.current?.close(); },
  };
}
