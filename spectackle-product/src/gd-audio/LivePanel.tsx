import type { useLiveConversation } from './useLiveConversation';
import type { RecordingSnapshot } from './recording';

export default function LivePanel({ test, microphoneActive, speaking, recording }: {
  test: ReturnType<typeof useLiveConversation>; microphoneActive: boolean;
  speaking: boolean; recording: RecordingSnapshot;
}) {
  const value = test.snapshot;
  const active = !['idle', 'error'].includes(value.phase);
  const readyToStart = microphoneActive && !speaking && recording.phase === 'recording' && !!recording.recording;
  return <section className="gd-playback-panel" aria-labelledby="gd-live-title">
    <div className="gd-microphone-top"><div><span className="gd-eyebrow">STAGE 6 · ONE LIVE PARTICIPANT</span><h2 id="gd-live-title">Talk with Arjun</h2></div>
      <span className="gd-playback-state" role="status">{{ idle: 'Live test inactive', connecting: 'Connecting Arjun…', listening: speaking ? 'Listening to you' : 'Arjun is listening', awaiting_reply: 'Arjun is preparing a reply', replying: 'Arjun is speaking', error: 'Live test stopped' }[value.phase]}</span></div>
    <p className="gd-mic-description">Start the microphone test, then connect Arjun. Once connected, make a point about AI: boon or bane. He replies through the real Live API. Speak naturally to interrupt him; your microphone stays active and your utterances keep saving.</p>
    <p className="gd-device-help">This starts one paid provider connection using the Python backend's configured credentials. Use headphones. Sahil and Meera join in a later stage; prep and GD timers stay inactive.</p>
    <div className="gd-mic-actions">
      {active ? <button onClick={test.stop}>Stop Live test</button>
        : <button disabled={!readyToStart} onClick={() => test.start(recording.recording!.recording_id)}>Start Live test</button>}
      {value.sessionUrl && <a className="gd-text-link" href={value.sessionUrl} download="live-session.json">Download session record</a>}
    </div>
    {!active && !readyToStart && <p className="gd-device-help">Start the microphone and pause before connecting. Opening this room makes no model call.</p>}
    {value.message && <p className={`gd-mic-message ${value.phase === 'error' ? 'gd-mic-message--error' : ''}`} role={value.phase === 'error' ? 'alert' : 'status'}>{value.message}</p>}
    <dl className="gd-playback-progress">
      <div><dt>Arjun audio received</dt><dd>{(value.playback.received / 24000).toFixed(2)} s</dd></div>
      <div><dt>Played at output</dt><dd>{(value.playback.played / 24000).toFixed(2)} s</dd></div>
      <div><dt>Playback floor</dt><dd>{value.playback.floor}</dd></div>
    </dl>
    <details className="gd-mic-diagnostics"><summary>Live test details</summary>
      <dl><div><dt>Connection / turn</dt><dd>{value.playback.connection ? `${value.playback.connection.slice(0, 8)} / ${value.playback.turn}` : 'Not connected'}</dd></div>
        <div><dt>User frames sent</dt><dd>{value.inputFrames} × 32 ms</dd></div>
        <div><dt>Provider input acknowledged</dt><dd>{value.inputAcknowledged} commands</dd></div>
        <div><dt>Backend played offset</dt><dd>{(value.playback.serverPlayed / 24000).toFixed(2)} s</dd></div>
        <div><dt>Rejected late output</dt><dd>{value.playback.dropped}</dd></div>
        <div><dt>Generation complete</dt><dd>{value.playback.generated ? 'Yes' : 'No'}</dd></div></dl>
      <p>The same VAD boundaries and pre-roll go to the recorder and Live input. Transcriptions remain in the local session record; optional screen captions come later. A partial bot turn is not credited as fully heard. Stop, leaving, refresh, a hidden tab or failure ends this connection; start fresh to retry.</p>
    </details>
  </section>;
}
