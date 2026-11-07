import { Activity, Mic, Square } from 'lucide-react';
import type { useMicrophoneTest } from './useMicrophoneTest';

export type MicrophoneControls = ReturnType<typeof useMicrophoneTest>;

export function microphoneLabel(mic: MicrophoneControls['snapshot']): string {
  if (mic.phase === 'listening') return mic.speaking ? 'Speaking detected' : 'Listening · no speech';
  return { idle: 'Microphone inactive', starting: 'Starting microphone…', muted: 'Microphone paused', resuming: 'Resuming microphone…', stopping: 'Releasing microphone…', error: 'Microphone test stopped' }[mic.phase];
}

export default function MicrophonePanel({ test }: { test: MicrophoneControls }) {
  const { snapshot: mic, boundaries } = test;
  const running = mic.phase === 'listening';
  const deviceLocked = test.permission.busy || !['idle', 'error'].includes(mic.phase);
  const { deviceList, selectedDeviceId } = test;
  const selectionMissing = !!selectedDeviceId && !deviceList.devices.some((device) => device.deviceId === selectedDeviceId);
  const level = Math.min(100, Math.round(mic.rms * 350));

  return (
    <section className="gd-microphone" aria-labelledby="gd-microphone-title">
      <div className="gd-microphone-top">
        <div><span className="gd-eyebrow">MICROPHONE & LOCAL RECORDINGS</span><h2 id="gd-microphone-title">Try your microphone</h2></div>
        <div className={`gd-mic-state ${mic.speaking ? 'gd-mic-state--speaking' : ''}`} role="status"><Activity size={15} />{microphoneLabel(mic)}</div>
      </div>
      <p className="gd-mic-description">Start once, then speak naturally. VAD detects each utterance automatically and saves it as a separate WAV on this computer. Connecting the Live test below also sends accepted speech to Arjun through the Python backend.</p>
      <div className="gd-device-picker">
        <div className="gd-device-field">
          <label htmlFor="gd-microphone-device">Microphone</label>
          <select id="gd-microphone-device" value={selectedDeviceId} onChange={(event) => test.selectDevice(event.target.value)} disabled={deviceLocked} aria-describedby="gd-device-help">
            <option value="">System default</option>
            {selectionMissing && <option value={selectedDeviceId}>Selected microphone (not currently listed)</option>}
            {deviceList.devices.map((device) => <option key={device.deviceId} value={device.deviceId}>{device.label}</option>)}
          </select>
        </div>
        {!deviceLocked && <button type="button" onClick={() => { void test.allowDevices(); }}>Allow microphone access & find devices</button>}
        {test.permission.busy && <span role="status">Waiting for microphone permission…</span>}
        <button type="button" onClick={test.refreshDevices} disabled={deviceList.loading}>{deviceList.loading ? 'Finding microphones…' : 'Refresh devices'}</button>
      </div>
      <p id="gd-device-help" className="gd-device-help" role="status">{test.permission.error || deviceList.error || (deviceLocked
        ? 'Stop the microphone test to change devices. Speech detection stays automatic while the test runs.'
        : selectionMissing ? 'The selected microphone is not currently listed. Refresh devices or choose another microphone.'
        : !deviceList.hasLabels ? 'Allow microphone access to list named inputs, then choose your headset. This permission check releases the mic immediately and records nothing.'
        : 'Choose a microphone, then start the test. Connected devices update automatically.')}</p>
      <p className="gd-device-help">If a headset appears in macOS Input but is missing here, allow access above and refresh. The microphone list contains inputs; sound output follows your system output setting.</p>
      <div className="gd-mic-actions">
        {!test.permission.busy && !running && mic.phase !== 'starting' && mic.phase !== 'stopping' && <button className="gd-mic-start" onClick={test.start}><Mic size={16} />Start microphone test</button>}
        {(running || mic.phase === 'starting') && <button onClick={test.stop}><Square size={14} />{mic.phase === 'starting' ? 'Cancel microphone setup' : 'Stop microphone test'}</button>}
        {mic.phase === 'stopping' && <span className="gd-mic-description">Releasing microphone…</span>}
        <div className="gd-mic-meter" role="meter" aria-label="Microphone input level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={level}><span style={{ width: `${level}%` }} /></div>
      </div>
      {mic.message && <p className={`gd-mic-message ${mic.phase === 'error' ? 'gd-mic-message--error' : ''}`} role={mic.phase === 'error' ? 'alert' : 'status'}>{mic.message}</p>}
      <p className="gd-recording-status" role="status">{mic.phase === 'stopping' ? 'Finishing captured audio and saving files…'
        : test.recording.phase === 'recording' ? `Saving locally · ${test.recording.recording?.utterances.length ?? 0} clip(s) finished`
        : test.recording.phase === 'saved' ? 'Test saved. Review the clips below.'
        : test.recording.phase === 'connecting' ? 'Connecting to local audio storage…'
        : test.recording.phase === 'error' ? test.recording.message
        : 'Audio is recorded only after you start this test.'}</p>
      <details className="gd-mic-diagnostics">
        <summary>Audio test details</summary>
        <dl>
          <div><dt>Device</dt><dd>{mic.device || 'Not opened'}</dd></div>
          <div><dt>Audio format</dt><dd>{mic.sourceRate ? `${mic.sourceRate.toLocaleString()} Hz → ` : ''}16,000 Hz · mono PCM16</dd></div>
          <div><dt>Processed audio</dt><dd>{mic.frames} frames · {(mic.frames * 0.032).toFixed(2)} s</dd></div>
          <div><dt>Speech probability</dt><dd>{mic.probability.toFixed(3)} / 0.900</dd></div>
          <div><dt>Inference / queued</dt><dd>{mic.inferenceMs.toFixed(1)} ms / {mic.queue} frames</dd></div>
          <div><dt>Speech boundaries</dt><dd>32 ms frames · 512 ms end silence · up to 320 ms pre-roll</dd></div>
        </dl>
        <p>Speech boundaries are automatic. Stop releases the microphone, stops the Live test and saves a partial clip if you were speaking. Leaving, refresh, hiding this tab or failures preserve audio already received by the local backend. Full panel discussion comes later.</p>
        <ol className="gd-mic-events" aria-label="Recent speech boundaries">
          {boundaries.length ? boundaries.map((event, index) => <li key={`${event.id}-${event.type}-${index}`}><strong>#{event.id} {event.type === 'start' ? 'Speech started' : 'Speech ended'}</strong><span>{event.type === 'start' ? `${event.preRollSamples / 16} ms buffered context` : `${(event.durationMs / 1000).toFixed(2)} s incl. padding · ${event.reason}${event.incomplete ? ' · partial' : ''}`}</span></li>) : <li>No speech boundaries yet.</li>}
        </ol>
      </details>
    </section>
  );
}
