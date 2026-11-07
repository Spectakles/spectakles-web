import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlatform } from './context';
import { dateLabel, useApi, type Assignment } from './useApi';

export default function Assignments({ organizationId }: { organizationId: string }) {
  const api = useApi();
  const platform = usePlatform();
  const navigate = useNavigate();
  const [items, setItems] = useState<Assignment[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [revision, refresh] = useState(0);
  useEffect(() => {
    let active = true;
    setItems([]); setError(''); setLoading(true);
    void api<Assignment[]>(`/api/platform/organizations/${organizationId}/assignments`)
      .then(value => { if (active) setItems(value); })
      .catch(failure => { if (active) setError(failure.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [organizationId, revision, api]);
  return <section aria-labelledby="assigned-gds"><div className="portal-section-heading"><div><p className="portal-eyebrow">YOUR NEXT DISCUSSION</p><h2 id="assigned-gds">Assigned to you</h2></div><button onClick={() => refresh(value => value + 1)} disabled={loading}>Refresh assignments</button></div>
    {error && <p role="alert">{error}</p>}{loading ? <p role="status">Loading assignments…</p> : !items.length ? <p>Your institution has not assigned a GD yet.</p> : <div className="assignment-list">{items.map(item => {
      const current = Date.now();
      const notOpen = current < Date.parse(item.opens_at);
      const expired = current >= Date.parse(item.due_at);
      const unavailable = item.closed || notOpen || expired || item.attempts_remaining < 1;
      const status = item.closed ? 'Closed' : expired ? 'Deadline passed' : notOpen ? 'Opens soon' : item.attempts_reserved ? 'Attempt in progress' : item.attempts_remaining < 1 ? 'Attempts completed' : 'Ready to start';
      return <article className="assignment-card" key={item.id}><span className="portal-badge">{status}</span><h3>{item.title}</h3><p>{item.template.settings.topic}</p><dl className="portal-inline-facts"><div><dt>Due</dt><dd>{dateLabel(item.due_at)}</dd></div><div><dt>Attempts left</dt><dd>{item.attempts_remaining} / {item.max_attempts}</dd></div><div><dt>Discussion</dt><dd>{item.template.settings.discussion_seconds / 60} min</dd></div></dl><button disabled={unavailable || item.attempts_reserved > 0} onClick={() => { platform.select({ ...item.template, assignment_id: item.id }); navigate('/gd/dev'); }}>Open assigned GD →</button></article>;
    })}</div>}
  </section>;
}
