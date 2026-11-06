import { ArrowRight, AudioLines, Ear, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ClosingCTA } from '../marketing/MarketingParts';
import { usePageMeta } from '../marketing/usePageMeta';

export default function About() {
  usePageMeta('Our approach — Spectakles', 'Why Spectakles focuses on group-discussion practice, listening and participation in college placement preparation.');
  return <>
    <section className="mkt-wrap mkt-subhero mkt-about-hero"><p className="mkt-kicker">WHY SPECTAKLES</p><h1>Ideas develop<br />when people<br /><em>talk them through.</em></h1><p className="mkt-lead">Students can know a topic well and still need practice taking part in a group discussion. That is the space we’re building for.</p></section>
    <section className="mkt-manifesto"><div className="mkt-wrap"><p className="mkt-kicker">OUR STARTING POINT</p><h2>Give the student a room.<br />Give the conversation<br /><em>somewhere to go.</em></h2><div><p>A group discussion asks more than a prepared answer. You have to listen, decide when to enter, respond to another view and help the group make progress.</p><p>Spectakles creates a place to practise that exchange with AI participants. It is designed to sit alongside trainers and peer practice, giving students another opportunity to take part.</p></div></div></section>
    <section className="mkt-wrap mkt-principles"><div className="mkt-section-heading"><p className="mkt-kicker">WHAT SHAPES THE PRODUCT</p><h2>Keep the practice<br /><em>close to the task.</em></h2></div><div className="mkt-three-columns">{[
      { icon: AudioLines, title: 'Speak, without a script.', text: 'Students contribute out loud. The discussion responds to their contributions, rather than taking them through a fixed list of questions.' },
      { icon: Ear, title: 'Make listening count.', text: 'Different viewpoints create reasons to clarify, build on an idea or challenge it. Taking part is about the exchange, not just time spent talking.' },
      { icon: MessageCircle, title: 'Use evidence, not promises.', text: 'We are building feedback around what happened in a session. We do not promise placements, diagnose personalities or claim learning gains we have not measured.' },
    ].map(item => <article key={item.title}><item.icon size={28} aria-hidden="true" /><h3>{item.title}</h3><p>{item.text}</p></article>)}</div><Link className="mkt-text-link" to="/experience">Explore how that feels<ArrowRight size={18} aria-hidden="true" /></Link></section>
    <ClosingCTA />
  </>;
}
