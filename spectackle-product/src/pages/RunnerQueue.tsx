import { useEffect, useState } from 'react';
import { responseError, usePlatform } from '../platform/context';

export type Ticket =
  | { status: 'idle' }
  | { status: 'waiting'; round_id: string; position: number }
  | { status: 'offered'; round_id: string; expires_in_seconds: number }
  | { status: 'claimed' | 'active'; round_id: string };

export type QueueEntry = { topic: string; roundId: string };

export function readQueueEntry(key: string): QueueEntry | null {
  try { return JSON.parse(sessionStorage.getItem(key) || 'null') as QueueEntry | null; }
  catch { return null; }
}

export function saveQueueEntry(key: string, entry: QueueEntry | null) {
  try {
    if (entry) sessionStorage.setItem(key, JSON.stringify(entry));
    else sessionStorage.removeItem(key);
  } catch { /* The current tab can still use the queue without storage. */ }
}

export function reservationPath(roundId: string) {
  return `/api/runner/rounds/${roundId}/reservation`;
}

export default function RunnerQueue({ entry, onClaim, onLeave }: {
  entry: QueueEntry;
  onClaim: (entry: QueueEntry) => void;
  onLeave: () => void;
}) {
  const { request } = usePlatform();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const refresh = async () => {
      try {
        const reply = await request('/api/runner/queue/status', { method: 'POST', signal: controller.signal });
        if (!reply.ok) throw await responseError(reply);
        const next = await reply.json() as Ticket;
        if (!controller.signal.aborted) {
          setTicket(next.status !== 'idle' && next.round_id === entry.roundId ? next : { status: 'idle' });
        }
      } catch {
        if (!controller.signal.aborted) setTicket(null);
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(refresh, 4000 + Math.random() * 2000);
      }
    };
    void refresh();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [entry.roundId, request]);

  const claim = async () => {
    setBusy(true);
    setError('');
    try {
      const reply = await request(reservationPath(entry.roundId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: entry.topic }),
      });
      if (!reply.ok) throw await responseError(reply);
      onClaim(entry);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not claim the slot. Try again.');
    } finally { setBusy(false); }
  };
  const leave = async () => {
    setBusy(true);
    setError('');
    try {
      const reply = await request(reservationPath(entry.roundId), { method: 'DELETE' });
      if (!reply.ok) throw await responseError(reply);
      onLeave();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not leave the queue. Try again.');
    } finally { setBusy(false); }
  };
  const canClaim = ticket?.status === 'offered' || ticket?.status === 'claimed';
  const status = (() => {
    switch (ticket?.status) {
      case 'waiting': return `Position ${ticket.position} in the queue.`;
      case 'offered': return 'A slot is available.';
      case 'claimed': return 'Your slot is reserved.';
      case 'active': return 'This round is already in progress.';
      case 'idle': return 'Your queue entry expired. Rejoin to try again.';
      default: return 'Checking your place in the queue…';
    }
  })();
  return <>
    <h1>Discussion queue</h1>
    <p>{entry.topic}</p>
    <p role="status">{status}</p>
    {ticket?.status === 'offered' && <p>Claim within about {ticket.expires_in_seconds} seconds.</p>}
    {error && <p role="alert">{error}</p>}
    {canClaim && <button disabled={busy} onClick={() => void claim()}>Claim slot</button>}{' '}
    <button disabled={busy} onClick={() => void leave()}>{ticket?.status === 'idle' ? 'Back to setup' : 'Leave queue'}</button>
  </>;
}
