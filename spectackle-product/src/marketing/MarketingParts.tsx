import { ArrowRight, ArrowUpRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { questions } from './content';

export function PilotLink({ children = 'Discuss a pilot', className = '' }: { children?: React.ReactNode; className?: string }) {
  return <Link to="/contact" className={`mkt-button mkt-button--green ${className}`}>{children}<ArrowUpRight size={18} aria-hidden="true" /></Link>;
}

export function ClosingCTA() {
  return <section className="mkt-closing mkt-wrap">
    <div><p className="mkt-kicker">FOR YOUR NEXT PLACEMENT PROGRAMME</p><h2>Make room<br />for <em>more voices.</em></h2></div>
    <div className="mkt-closing-action"><p>Tell us what your students need to practise. Let’s shape a small pilot around it.</p><PilotLink /><a className="mkt-text-link" href="mailto:contact@spectakles.in">contact@spectakles.in <ArrowUpRight size={15} aria-hidden="true" /></a></div>
  </section>;
}

export function QuestionList({ items = questions }: { items?: typeof questions }) {
  return <div className="mkt-questions">{items.map(item => <details key={item.id} id={item.id}>
    <summary>{item.question}<Plus size={20} aria-hidden="true" /></summary><p>{item.answer}</p>
  </details>)}</div>;
}

export function ExperienceLink() {
  return <Link className="mkt-text-link" to="/experience">Explore the experience <ArrowRight size={18} aria-hidden="true" /></Link>;
}
