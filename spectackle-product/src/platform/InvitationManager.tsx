import { useEffect, useState, type FormEvent } from 'react';
import { useApi } from './useApi';

type Invitation = { id: string; email: string; role: string; status: string; expires_at: number };
export default function InvitationManager({ organizationId }: { organizationId: string }) {
  const api = useApi();
  const [items, setItems] = useState<Invitation[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [revision, refresh] = useState(0);
  const prefix = `/api/platform/organizations/${organizationId}/invitations`;
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    void api<Invitation[]>(prefix).then(value => { if (active) setItems(value); }).catch(failure => { if (active) setError(failure.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [api, prefix, revision]);
  const perform = async (action: () => Promise<void>) => {
    if (busy) return; setBusy(true); setError('');
    try { await action(); } catch (failure) { setError(failure instanceof Error ? failure.message : 'Invitation could not be saved.'); }
    finally { setBusy(false); }
  };
  const submit = (event: FormEvent) => { event.preventDefault(); void perform(async () => { const result = await api<{ join_url: string }>(prefix, { email, role, expires_days: 7 }); setUrl(result.join_url); setCopied(false); setEmail(''); refresh(value => value + 1); }); };
  return <section className="portal-card"><p className="portal-eyebrow">WELCOME YOUR PEOPLE</p><h2>Invitations</h2><p>Invite a student or colleague, including someone who has not created an account yet. Each link is tied to their email and expires after seven days.</p><form onSubmit={submit}><label>Invited email<input required type="email" value={email} onChange={event => setEmail(event.target.value)} /></label><label>Invitation role<select value={role} onChange={event => setRole(event.target.value)}><option value="student">Student</option><option value="trainer">Trainer</option><option value="admin">Administrator</option></select></label><button className="portal-primary" disabled={busy}>Create invitation link →</button></form>
    {url && <div className="portal-invite-link"><label>Invitation link<input readOnly value={url} onFocus={event => event.target.select()} /></label><button onClick={() => void perform(async () => { await navigator.clipboard.writeText(url); setCopied(true); })}>{copied ? 'Copied' : 'Copy invitation link'}</button><p className="portal-help">Copy this link now and share it with the invited person. It is shown only once. No email has been sent.</p></div>}
    {loading && <p role="status">Loading invitations…</p>}{error && <p role="alert">{error}</p>}{!loading && !items.length && <p>No invitations yet.</p>}<ul className="portal-member-list">{items.map(item => { const pending = item.status === 'pending' && item.expires_at * 1000 > Date.now(); return <li key={item.id}><div><strong>{item.email}</strong><small>{item.role} · {item.status === 'pending' && !pending ? 'expired' : item.status}</small></div>{pending && <button className="portal-quiet" disabled={busy} onClick={() => void perform(async () => { await api(prefix + `/${item.id}/revoke`, {}); refresh(value => value + 1); setUrl(''); })}>Revoke invitation</button>}</li>; })}</ul>
  </section>;
}
