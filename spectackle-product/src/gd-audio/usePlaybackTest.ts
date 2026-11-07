import { useEffect, useRef, useState } from 'react';
import workletUrl from './playback.worklet.ts?worker&url';
import { BrowserPlayback, INITIAL_PLAYBACK } from './playback';
import type { Boundary } from './dsp';

export function usePlaybackTest(enabled: boolean) {
  const [snapshot, setSnapshot] = useState({ ...INITIAL_PLAYBACK });
  const controller = useRef<BrowserPlayback | null>(null);
  const active = useRef(enabled); active.current = enabled;
  useEffect(() => {
    if (!enabled) setSnapshot({ ...INITIAL_PLAYBACK });
    return () => { active.current = false; void controller.current?.close(); controller.current = null; };
  }, [enabled]);
  return {
    snapshot,
    start: () => {
      if (!active.current || !['idle', 'error'].includes(snapshot.phase)) return;
      const url = new URL(`${import.meta.env.BASE_URL}api/playback/ws`, location.origin);
      url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const instance = new BrowserPlayback({ url: url.href, workletUrl, snapshot: (value) => {
        if (active.current && controller.current === instance) setSnapshot(value);
      } });
      controller.current = instance; void instance.open().catch(() => undefined);
    },
    play: () => controller.current?.play(),
    stop: () => { void controller.current?.close(); },
    getVadPort: () => controller.current?.createVadPort(),
    boundary: (event: Boundary) => controller.current?.userActivity(event.type === 'start'),
  };
}
