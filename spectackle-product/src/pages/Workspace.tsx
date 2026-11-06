import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { responseError, usePlatform, type Template } from '../platform/context';
import { ApiDownload } from '../platform/ProtectedMedia';
import './workspace.css';
import './institution.css';
import Assignments from '../platform/Assignments';

type History = { session_id: string; recording_id: string; status: string; created_at: string; template: { settings: { name: string } } };

export default function Workspace() {
  const platform = usePlatform();
  const navigate = useNavigate();
  const request = platform.request;
  const userId = platform.user?.uid;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [history, setHistory] = useState<History[]>([]);
  const [editor, setEditor] = useState('');
  const [editing, setEditing] = useState<Template | null>(null);
  const [organizationName, setOrganizationName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('student');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [revision, setRevision] = useState(0);
  const organization = platform.profile?.organizations.find(value => value.id === organizationId);
  const canCreateOrganization = platform.profile?.permissions?.can_create_organization === true;
  const canEdit = !!organization && ['owner', 'admin', 'trainer'].includes(organization.role);
  const canManageMembers = !!organization && ['owner', 'admin'].includes(organization.role);

  const perform = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true); setMessage('');
    try { await action(); } catch (failure) { setMessage(failure instanceof Error ? failure.message : 'Request failed.'); }
    finally { setBusy(false); }
  };
  const json = useCallback(async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const response = await request(path, init);
    if (!response.ok) throw await responseError(response);
    return response.json();
  }, [request]);
  const submit = (event: FormEvent, action: () => Promise<void>) => { event.preventDefault(); void perform(action); };
  const body = (value: unknown) => ({ headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });

  useEffect(() => { setEditor(''); setEditing(null); setMessage(''); }, [organizationId]);
  useEffect(() => {
    let active = true;
    setTemplates([]); setLoadingTemplates(!!organizationId);
    if (organizationId && userId) {
      void json<Template[]>(`/api/platform/organizations/${organizationId}/templates`)
        .then(value => { if (active) setTemplates(value); })
        .catch(failure => { if (active) setMessage(failure.message); })
        .finally(() => { if (active) setLoadingTemplates(false); });
    }
    return () => { active = false; };
  }, [organizationId, userId, revision, json]);
  useEffect(() => {
    let active = true;
    setHistory([]);
    if (userId) void json<History[]>('/api/platform/history')
      .then(value => { if (active) setHistory(value); })
      .catch(failure => { if (active) setMessage(failure.message); });
    return () => { active = false; };
  }, [userId, revision, json]);

  if (!platform.ready) return <main className="workspace"><p role="status">Loading workspace…</p></main>;
  if (platform.error) return <main className="workspace"><h1>Workspace unavailable</h1><p role="alert">{platform.error}</p><button onClick={() => window.location.reload()}>Reload</button>{platform.user && platform.auth && <button onClick={() => void signOut(platform.auth!)}>Sign out</button>}</main>;
  if (!platform.status?.enabled) return <main className="workspace"><h1>Local workspace</h1><p>Start the backend with GD_AUTH_MODE=emulator to test accounts and organizations.</p><Link to="/gd">Open the existing GD preview</Link></main>;
  if (!platform.user) return <main className="workspace"><h1>Sign in to Spectakles</h1><p>{platform.status.emulator ? 'Local test environment.' : 'Use your Spectakles account.'}</p>
    <form onSubmit={event => submit(event, async () => { await signInWithEmailAndPassword(platform.auth!, email.trim(), password); setPassword(''); })}>
      <label>Email<input type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} /></label>
      <label>Password<input type="password" required minLength={6} autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} /></label>
      <button disabled={busy || !platform.auth}>Sign in</button>
      <p><Link to="/reset-password">Forgot password?</Link></p>
      {platform.status.emulator && <button type="button" disabled={busy || !platform.auth || !email || password.length < 6} onClick={() => void perform(async () => { await createUserWithEmailAndPassword(platform.auth!, email.trim(), password); setPassword(''); })}>Create local test account</button>}
    </form><p role="status">{message}</p></main>;

  return <main className="workspace">
    <header><div><h1>Your workspace</h1><p>{platform.profile?.user.name || platform.user.email}{platform.status.emulator && ' · Local test'}</p></div><button disabled={busy} onClick={() => void perform(async () => { await signOut(platform.auth!); setOrganizationId(''); setPassword(''); })}>Sign out</button></header>
    <p role="status" aria-live="polite">{message}</p>
    {platform.profile?.organizations.some(org => ['owner', 'admin', 'trainer'].includes(org.role)) && <section><h2>Your institution</h2><p>Manage cohorts, assignments, templates and student progress.</p><Link to="/admin">Open institution workspace →</Link></section>}
    <section><h2>Practice</h2><p>Practice on your own or choose an organization template.</p>
      <button disabled={busy || !platform.profile} onClick={() => { platform.select(null); navigate('/gd/dev'); }}>Personal practice</button>
      <button disabled={busy} onClick={() => void perform(async () => { await platform.reload(); setRevision(value => value + 1); })}>Refresh workspace</button>
    </section>
    <section><h2>Organization templates</h2><label>Organization<select value={organizationId} disabled={busy} onChange={event => setOrganizationId(event.target.value)}><option value="">Choose an organization</option>{platform.profile?.organizations.map(value => <option key={value.id} value={value.id}>{value.name} · {value.role}</option>)}</select></label>
      {loadingTemplates && <p role="status">Loading templates…</p>}
      {organizationId && !loadingTemplates && !templates.length && <p>No published templates in this workspace.</p>}
      <ul>{templates.map(template => <li key={template.id}><strong>{template.name}</strong><span>Version {template.version} · {template.settings.panel.length} AI participants · {template.settings.discussion_seconds / 60} min</span><p>{template.settings.topic}</p>
        <button disabled={busy} onClick={() => { platform.select(template); navigate('/gd/dev'); }}>Open this GD</button>
        {canEdit && <button disabled={busy} onClick={() => { setEditing(template); setEditor(JSON.stringify(template.settings, null, 2)); }}>Edit next version</button>}
      </li>)}</ul>
      {canEdit && <details><summary>Template editor</summary><p>Set the topic, timing and panel. Voice presets: Charon and Puck (male), Kore and Leda (female), Orus (male).</p>
        <button disabled={busy || !platform.profile} onClick={() => { setEditing(null); setEditor(JSON.stringify(platform.profile!.personal_template, null, 2)); }}>New template</button>
        <form onSubmit={event => submit(event, async () => {
          const value = JSON.parse(editor);
          const saved = await json<Template>(`/api/platform/organizations/${organizationId}/templates${editing ? `/${editing.id}` : ''}`, { method: editing ? 'PUT' : 'POST', ...body({ expected_version: editing?.version ?? 0, settings: value }) });
          setEditing(saved); setEditor(JSON.stringify(saved.settings, null, 2)); setRevision(value => value + 1); setMessage(`Published ${saved.name}, version ${saved.version}.`);
        })}><label htmlFor="template-json">Template settings JSON</label><textarea id="template-json" spellCheck={false} rows={24} value={editor} onChange={event => setEditor(event.target.value)} disabled={busy} /><button disabled={busy || !editor}>Publish {editing ? `version ${editing.version + 1}` : 'new template'}</button></form></details>}
    </section>
    {organization?.role === 'student' && <Assignments key={organizationId} organizationId={organizationId} />}
    {canManageMembers && <section><h2>Add a member</h2><p>An existing account is required. No invitation email is sent.</p><form onSubmit={event => submit(event, async () => { await json(`/api/platform/organizations/${organizationId}/members`, { method: 'POST', ...body({ email: memberEmail.trim(), role: memberRole }) }); setMemberEmail(''); setMessage('Member added. Refresh their workspace to see the organization.'); })}>
      <label>Member email<input type="email" required value={memberEmail} onChange={event => setMemberEmail(event.target.value)} /></label><label>Role<select value={memberRole} onChange={event => setMemberRole(event.target.value)}>{['student', 'trainer', 'admin'].map(role => <option key={role}>{role}</option>)}</select></label><button disabled={busy}>Save membership</button></form></section>}
    {canCreateOrganization && <section><h2>Create an organization</h2><form onSubmit={event => submit(event, async () => { const created = await json<{ id: string }>('/api/platform/organizations', { method: 'POST', ...body({ name: organizationName.trim() }) }); await platform.reload(); setOrganizationId(created.id); setOrganizationName(''); })}><label>Organization name<input required maxLength={100} value={organizationName} onChange={event => setOrganizationName(event.target.value)} /></label><button disabled={busy}>Create organization</button></form></section>}
    <section><h2>Session history</h2><button disabled={busy} onClick={() => setRevision(value => value + 1)}>Refresh history</button>{!history.length && <p>No sessions yet.</p>}<ul>{history.map(value => <li key={value.session_id}><strong>{value.template.settings.name}</strong><span>{new Date(value.created_at).toLocaleString()} · {value.status}</span><Link to={`/reports/${value.session_id}`}>View report →</Link><ApiDownload path={`/api/discussions/${value.recording_id}/${value.session_id}`} name={`discussion-${value.session_id}.json`}>Download discussion</ApiDownload><ApiDownload path={`/api/recordings/${value.recording_id}/manifest`} name={`manifest-${value.recording_id}.json`}>Recording details</ApiDownload></li>)}</ul></section>
  </main>;
}
