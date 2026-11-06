import { useEffect, useRef, useState } from 'react';
import captureWorkletUrl from './capture.worklet.ts?worker&url';
import { INITIAL_MICROPHONE, MicrophoneTest } from './microphone';
import type { Boundary } from './dsp';
import { INITIAL_DEVICE_LIST, MicrophoneDeviceList, MicrophonePermission } from './devices';
import { UtteranceGate } from './utterance-gate';
import { INITIAL_RECORDING, LocalRecording } from './recording';
import type { RecordingEvent } from './recording';

export function useMicrophoneTest(enabled: boolean, playback?: { boundary: (event: Boundary) => void; stop: () => void; input?: (event: RecordingEvent) => void }, recordingEnabled?: () => boolean, acquireStream?: (constraints: MediaStreamConstraints) => Promise<MediaStream>, token?: () => Promise<string | undefined>) {
  const recordingGate = useRef(recordingEnabled); recordingGate.current = recordingEnabled;
  const playbackCallbacks = useRef(playback); playbackCallbacks.current = playback;
  const [snapshot, setSnapshot] = useState({ ...INITIAL_MICROPHONE });
  const [boundaries, setBoundaries] = useState<Boundary[]>([]);
  const [recording, setRecording] = useState({ ...INITIAL_RECORDING });
  const [deviceList, setDeviceList] = useState({ ...INITIAL_DEVICE_LIST });
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [permission, setPermission] = useState({ busy: false, error: '' });
  const permissionProbe = useRef<MicrophonePermission | null>(null);
  const devices = useRef<MicrophoneDeviceList | null>(null);
  const controller = useRef<MicrophoneTest | null>(null);
  const active = useRef(enabled);
  active.current = enabled;

  useEffect(() => {
    if (!enabled) return;
    const list = new MicrophoneDeviceList(navigator.mediaDevices, setDeviceList);
    devices.current = list;
    const probe = new MicrophonePermission(() => navigator.mediaDevices.getUserMedia({ audio: true, video: false }),
      (busy, error) => setPermission({ busy, error }));
    permissionProbe.current = probe;
    void list.start();
    return () => {
      list.close(); probe.close();
      if (permissionProbe.current === probe) permissionProbe.current = null;
      if (devices.current === list) devices.current = null;
    };
  }, [enabled]);

  useEffect(() => {
    if (enabled && (snapshot.phase === 'listening' || snapshot.phase === 'error')) {
      void devices.current?.refresh();
    }
  }, [enabled, snapshot.phase]);

  useEffect(() => {
    active.current = enabled;
    if (!enabled) {
      void controller.current?.stop();
      controller.current = null;
      setSnapshot({ ...INITIAL_MICROPHONE });
      setBoundaries([]);
      setRecording({ ...INITIAL_RECORDING });
    }
    return () => {
      active.current = false;
      void controller.current?.stop();
      controller.current = null;
    };
  }, [enabled]);

  const start = () => {
    if (permission.busy || !active.current || !['idle', 'error'].includes(snapshot.phase) || (controller.current && !controller.current.isClosed)) return;
    setBoundaries([]);
    setRecording({ ...INITIAL_RECORDING });
    const url = new URL(`${import.meta.env.BASE_URL}api/recordings/ws`, window.location.origin);
    url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const gate = new UtteranceGate();
    let saved: import('./recording').SavedRecording | null = null;
    const recorder = new LocalRecording({
      url: url.href, token,
      snapshot: (value) => {
        saved = value.recording;
        if (active.current && controller.current === instance) setRecording(value);
      },
      error: (message) => {
        if (controller.current === instance) void instance.stop(message, true);
      },
    });
    const instance = new MicrophoneTest({
      stopped: () => playbackCallbacks.current?.stop(),
      recording: {
        open: device => recorder.open(device), finish: (reason, incomplete) => recorder.finish(reason, incomplete),
        push: event => { if (gate.accept(event, recordingGate.current?.() ?? true)) { recorder.push(event); if (!instance.isClosed) playbackCallbacks.current?.input?.(event); } },
      },
      deviceId: selectedDeviceId, acquireStream,
      createWorker: () => new Worker(new URL('./vad.worker.ts', import.meta.url), { type: 'module' }),
      workletUrl: captureWorkletUrl,
      modelUrl: new URL(`${import.meta.env.BASE_URL}gd-audio/silero_vad.onnx`, window.location.origin).href,
      runtimeUrl: new URL(`${import.meta.env.BASE_URL}gd-audio/ort/`, window.location.origin).href,
      snapshot: (value) => {
        if (active.current && controller.current === instance) setSnapshot(value);
      },
      boundary: (value) => {
        playbackCallbacks.current?.boundary(value);
        if (active.current && controller.current === instance) setBoundaries((previous) => [...previous.slice(-9), value]);
      },
    });
    controller.current = instance;
    return instance.start().then(() => instance.isClosed ? null : saved);
  };

  return {
    snapshot, recording, boundaries, start, stop: () => controller.current?.stop() ?? Promise.resolve(),
    connectPlayback: (port: MessagePort) => { if (controller.current) controller.current.connectPlayback(port); else port.close(); },
    deviceList, selectedDeviceId, permission,
    allowDevices: async () => { if (await permissionProbe.current?.request()) await devices.current?.refresh(); },
    selectDevice: (id: string) => {
      if (!['idle', 'error'].includes(snapshot.phase) || (controller.current && !controller.current.isClosed)) return;
      setSelectedDeviceId(id);
    },
    refreshDevices: () => { void devices.current?.refresh(); },
  };
}
