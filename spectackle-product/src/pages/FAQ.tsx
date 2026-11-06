import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { questions } from '../marketing/content';
import { QuestionList } from '../marketing/MarketingParts';
import { usePageMeta } from '../marketing/usePageMeta';
const categories = ['All questions', 'The experience', 'Access & pilots', 'Product & data'];
export default function FAQ() {
  usePageMeta('Questions & answers — Spectakles', 'Answers about Spectakles GD practice, institutional pilots, access, devices, recording and private preparation notes.');
  const [category, setCategory] = useState('All questions');
  return <>
    <section className="mkt-wrap mkt-subhero"><p className="mkt-kicker">QUESTIONS & ANSWERS</p><h1>Good to know.<br /><em>Before you begin.</em></h1><p className="mkt-lead">The discussion experience, institutional access and what happens to your session data.</p></section>
    <section className="mkt-wrap mkt-faq-page"><aside><div aria-label="Question categories">{categories.map(value => <button type="button" key={value} aria-pressed={category === value} onClick={() => setCategory(value)}>{value}</button>)}</div><h2>Something else?</h2><p>We’d be happy to talk through your programme.</p><a href="mailto:contact@spectakles.in" className="mkt-text-link">Email Spectakles<ArrowUpRight size={16} aria-hidden="true" /></a></aside><QuestionList items={questions.filter(item => category === 'All questions' || item.category === category)} /></section>
  </>;
}
