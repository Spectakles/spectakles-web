import type { usePlaybackTest } from './usePlaybackTest';

export default function PlaybackPanel({ test, microphoneActive, speaking }: {
  test: ReturnType<typeof usePlaybackTest>; microphoneActive: boolean; speaking: boolean;
}) {
  const value = test.snapshot;
  const connected = !['idle', 'starting', 'error'].includes(value.phase);
  const canPlay = connected && ['ready', 'cut', 'ended'].includes(value.phase) && !speaking;
  return <section className="gd-playback-panel" aria-labelledby="gd-playback-title">
    <div className="gd-microphone-top"><div><span className="gd-eyebrow">STAGE 5 · STREAMED PLAYBACK</span><h2 id="gd-playback-title">Try automatic interruption</h2></div>
      <span className="gd-playback-state" role="status">{{ idle: 'Playback inactive', starting: 'Connecting…', ready: 'Ready for test voice', playing: 'Test voice playing', cutting: 'Finishing local cut…', cut: 'Interrupted · old audio discarded', ended: 'Playback finished', error: 'Playback stopped' }[value.phase]}</span></div>
    <p className="gd-mic-description">Start the microphone test above, then start playback and play the local test voice. Speak naturally to cut it. No button is needed to speak. This recorded test voice uses no Gemini calls.</p>
    {!microphoneActive && <p className="gd-device-help">You can listen without the microphone. Start the microphone test to test automatic interruption.</p>}
    <div className="gd-mic-actions">
      {['idle', 'error'].includes(value.phase) ? <button onClick={test.start}>Start playback test</button> : <button onClick={test.stop}>Stop playback test</button>}
      <button disabled={!canPlay} onClick={test.play}>{value.turn ? 'Play a fresh test turn' : 'Play test voice'}</button>
    </div>
    {value.message && <p className={`gd-mic-message ${value.phase === 'error' ? 'gd-mic-message--error' : ''}`} role={value.phase === 'error' ? 'alert' : 'status'}>{value.message}</p>}
    <dl className="gd-playback-progress">
      <div><dt>Received in browser</dt><dd>{(value.received / 24000).toFixed(2)} s</dd></div>
      <div><dt>Played at output</dt><dd>{(value.played / 24000).toFixed(2)} s</dd></div>
      <div><dt>Backend floor</dt><dd>{value.floor}</dd></div>
    </dl>
    <details className="gd-mic-diagnostics"><summary>Playback test details</summary>
      <p>24 kHz mono PCM16 → browser output rate. Received, rendered and played are separate. The backend keeps the floor busy until device progress confirms completion. A local cut discards the rest of that turn.</p>
      <dl>
        <div><dt>Connection / turn</dt><dd>{value.connection ? `${value.connection.slice(0, 8)} / ${value.turn}` : 'Not connected'}</dd></div>
        <div><dt>Rendered / acknowledged</dt><dd>{(value.rendered / 24000).toFixed(2)} s / {(value.serverPlayed / 24000).toFixed(2)} s</dd></div>
        <div><dt>Generation finished</dt><dd>{value.generated ? 'Yes; playback may still be pending' : 'No'}</dd></div>
        <div><dt>Stale messages rejected</dt><dd>{value.dropped}</dd></div>
        <div><dt>Delayed-output probes</dt><dd>{value.staleProbes}</dd></div>
        <div><dt>Underflow render blocks</dt><dd>{value.underruns}</dd></div>
        <div><dt>Fully played test lines</dt><dd>{value.heard.length} / 3</dd></div>
      </dl>
      <p>The test deliberately sends delayed audio after an interruption. It must remain silent. Only fully played fixture lines count as heard; this is playback evidence, not live captions or evaluation.</p>
    </details>
  </section>;
}
