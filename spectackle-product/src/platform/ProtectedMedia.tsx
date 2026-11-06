import { useEffect, useState } from 'react';
import { responseError, usePlatform } from './context';

export function ApiDownload({ path, name, children }: { path: string; name: string; children: React.ReactNode }) {
  const { request } = usePlatform();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return <span><button type="button" className="gd-text-link" disabled={busy} onClick={() => {
    setBusy(true); setError('');
    void (async () => {
      try {
        const response = await request(path);
        if (!response.ok) throw await responseError(response);
        const url = URL.createObjectURL(await response.blob());
        const link = document.createElement('a'); link.href = url; link.download = name; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (failure) { setError(failure instanceof Error ? failure.message : 'Download failed.'); }
      finally { setBusy(false); }
    })();
  }}>{busy ? 'Loading…' : children}</button>{error && <span role="alert">{error}</span>}</span>;
}

export function ProtectedAudio({ path, order }: { path: string; order: number }) {
  const { request } = usePlatform();
  const [load, setLoad] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (!load) return;
    let active = true; let objectUrl = '';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    void (async () => {
      try {
        const response = await request(path, { signal: controller.signal });
        if (!response.ok) throw await responseError(response);
        const blob = await response.blob();
        if (active) { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl); }
      } catch (failure) { if (active) { setError(failure instanceof Error ? failure.message : 'Audio could not be loaded.'); setLoad(false); } }
      finally { clearTimeout(timeout); }
    })();
    return () => { active = false; controller.abort(); clearTimeout(timeout); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [load, path, request]);
  return <span>{url ? <audio controls preload="none" src={url} aria-label={`Play utterance ${order}`} /> : <button disabled={load} onClick={() => { setError(''); setLoad(true); }}>{load ? 'Loading audio…' : `Load utterance ${order}`}</button>}{error && <span role="alert">{error}</span>}</span>;
}
