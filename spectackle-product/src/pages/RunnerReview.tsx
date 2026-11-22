import { useEffect, useState } from 'react';
import { usePlatform } from '../platform/context';

const skills: Record<string, string> = {
  relevance: 'Relevance', reasoning: 'Reasoning', collaboration: 'Collaboration', delivery: 'Delivery',
};

type Review = {
  summary: string;
  overall_score: number | null;
  skills: { skill: string; score: number; finding: string; next_step: string }[];
  limitations: string[];
};
type ReviewState =
  | { status: 'ready'; review: Review }
  | { status: 'pending' | 'uncertain' | 'failed' | 'expired' | 'unavailable' | 'error' };

export default function RunnerReview({ roundId }: { roundId?: string }) {
  const { request } = usePlatform();
  const [state, setState] = useState<ReviewState>({ status: 'pending' });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let next: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const response = await request(`/api/runner/reviews/${roundId ? encodeURIComponent(roundId) : 'latest'}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Review request failed');
        const result = await response.json() as ReviewState;
        if (controller.signal.aborted) return;
        setState(result);
        if (result.status === 'pending') next = setTimeout(poll, 4000);
      } catch {
        if (!controller.signal.aborted) setState({ status: 'error' });
      }
    };
    void poll();
    return () => { controller.abort(); clearTimeout(next); };
  }, [request, roundId, retry]);

  if (state.status === 'ready') return <>
    <p>{state.review.summary}</p>
    {state.review.overall_score !== null && <p>Overall score {state.review.overall_score}/5</p>}
    {state.review.skills.map(skill => <section key={skill.skill}>
      <h2>{skills[skill.skill]} {skill.score}/5</h2>
      <p>{skill.finding}</p>
      <p>{skill.next_step}</p>
    </section>)}
    {state.review.limitations.map((limit, index) => <p key={index}>{limit}</p>)}
  </>;
  if (state.status === 'error') return <>
    <p role="alert">Could not load your review.</p>
    <button onClick={() => setRetry(value => value + 1)}>Retry</button>
  </>;
  const message = {
    pending: 'Preparing your review…',
    uncertain: 'The review could not be confirmed. Contact the Spectakles team.',
    failed: 'A review could not be produced for this round.',
    expired: 'The evidence expired before a review could be produced.',
    unavailable: 'No review is available for this round.',
  }[state.status];
  return <p role="status">{message}</p>;
}
