import { usePlatform } from '../platform/context';
import { ApiDownload, ProtectedAudio } from '../platform/ProtectedMedia';
import { useEffect, useState } from 'react';
import type { RecordingSnapshot, SavedRecording } from './recording';

export default function RecordingLibrary({ current }: { current: RecordingSnapshot }) {
  const { request } = usePlatform();
  const [recordings, setRecordings] = useState<SavedRecording[]>([]);
  const [root, setRoot] = useState('');
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const revision = `${current.recording?.recording_id}:${current.phase}:${current.recording?.utterances.length}`;

  useEffect(() => {
    let active = true;
    let poll: number | undefined;
    let controller: AbortController;
    const check = async () => {
      controller = new AbortController();
      const deadline = window.setTimeout(() => controller.abort(), 2500);
      try {
        const response = await request('/api/recordings', { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error('Local recording service unavailable.');
        const body = await response.json();
        if (!Array.isArray(body.recordings)) throw new Error('Start the Stage 4 recording backend.');
        if (active) { setRecordings(body.recordings); setRoot(body.root); setError(''); }
      } catch {
        if (active) setError('Start the local Stage 4 backend to save and review clips. Existing files remain on disk.');
      } finally {
        window.clearTimeout(deadline);
        if (active) poll = window.setTimeout(check, 3000);
      }
    };
    void check();
    return () => { active = false; window.clearTimeout(poll); controller?.abort(); };
  }, [revision, refresh, request]);

  return (
    <section className="gd-recording-library" aria-labelledby="gd-recordings-title">
      <div className="gd-microphone-top"><div><span className="gd-eyebrow">SAVED ON THIS COMPUTER</span><h2 id="gd-recordings-title">Your test recordings</h2></div>
        <button type="button" onClick={() => setRefresh((value) => value + 1)}>Refresh saved tests</button></div>
      <p className="gd-mic-description">One 16 kHz mono PCM16 WAV per detected utterance, with pre-roll and silence padding. Partial clips are labelled. Each test has its own ordered manifest.</p>
      {error && <p className="gd-mic-message gd-mic-message--error" role="status">{error}</p>}
      {root && <details className="gd-recording-folder"><summary>Where are the files?</summary><code>{root}/&lt;test id&gt;/</code><p>Files stay here until you remove them yourself. A refresh starts a new test; it does not resume an old recording.</p></details>}
      {!recordings.length && !error && <p className="gd-mic-description">No saved tests yet. Start the microphone test and speak, then pause.</p>}
      {recordings.slice(0, 5).map((recording, index) => (
        <details className="gd-saved-test" key={recording.recording_id} open={index === 0}>
          <summary>{new Date(recording.created_at).toLocaleString()} · {recording.utterances.length} utterance(s) · {recording.status}{recording.incomplete ? ' · contains partial audio' : ''}</summary>
          <div className="gd-saved-test-links"><span>Test {recording.recording_id.slice(0, 8)}</span><ApiDownload path={recording.manifest_url} name={`manifest-${recording.recording_id}.json`}>Download manifest</ApiDownload></div>
          {!recording.utterances.length && <p className="gd-mic-description">No speech received in this test.</p>}
          {recording.utterances.length > 20 && <p className="gd-mic-description">Showing the latest 20 clips. The manifest and folder contain every clip in order.</p>}
          <ol className="gd-saved-clips">
            {recording.utterances.slice(-20).map((clip) => {
              const url = `/api/recordings/${encodeURIComponent(recording.recording_id)}/audio/${encodeURIComponent(clip.file)}`;
              const saved = clip.status !== 'recording' && clip.sample_count > 0;
              return <li key={clip.id}>
                <div><strong>#{clip.order} · {clip.file}</strong><span>{clip.status === 'recording' ? 'Recording…' : `${(clip.duration_ms / 1000).toFixed(2)} s · ${clip.incomplete ? 'Partial' : 'Complete'} · ${clip.end_reason}`}</span></div>
                {saved ? <div className="gd-saved-clip-audio"><ProtectedAudio path={url} order={clip.order} /><ApiDownload path={url} name={clip.file}>WAV</ApiDownload></div> : <span className="gd-mic-description">{clip.status === 'recording' ? 'Available after this utterance ends.' : 'No audio samples were received.'}</span>}
              </li>;
            })}
          </ol>
        </details>
      ))}
      {recordings.length > 5 && <p className="gd-mic-description">Showing the latest five tests. Earlier tests remain in the local recordings folder.</p>}
    </section>
  );
}
