import { useState } from 'react';
import { AudioLines, Clock3, Mic, Sparkles } from 'lucide-react';
import { topics } from './content';
import { portraitFor } from '../gd-room/portraits';

type Topic = typeof topics[number];
export default function RoomPreview({ interactive = false, topic = topics[0] }: { interactive?: boolean; topic?: Topic }) {
  const [active, setActive] = useState('meera');
  const point = topic.points.find(person => person.id === active) ?? topic.points[2];
  return <div className={`mkt-room ${interactive ? 'mkt-room--interactive' : ''}`}>
    <div className="mkt-room-header"><span><span className="mkt-status-dot" />Illustrative room</span><span><Clock3 size={13} aria-hidden="true" />12:00</span></div>
    <div className="mkt-room-topic"><span>GROUP DISCUSSION</span><h3>{topic.title}</h3></div>
    <div className="mkt-room-grid">{topic.points.map(person => {
      const content = <><img src={portraitFor(person.id)} alt={`${person.name}, a fictional AI participant`} width={420} height={280} loading="eager" /><span className="mkt-ai-label"><Sparkles size={11} aria-hidden="true" /> AI</span><span className="mkt-room-name">{person.name}{active === person.id && <AudioLines size={17} aria-label="Example speaker" />}</span></>;
      return interactive ? <button type="button" key={person.id} className={`mkt-room-person ${active === person.id ? 'is-active' : ''}`} aria-label={`Show ${person.name}’s example point`} aria-pressed={active === person.id} onClick={() => setActive(person.id)}>{content}</button>
        : <div key={person.id} className={`mkt-room-person ${active === person.id ? 'is-active' : ''}`}>{content}</div>;
    })}<div className="mkt-room-person mkt-room-you"><span className="mkt-you-initials">Y</span><span className="mkt-room-name">You<Mic size={14} aria-hidden="true" /></span><span className="mkt-your-seat">A place for your perspective.</span></div></div>
    <div className="mkt-room-caption" aria-live={interactive ? 'polite' : undefined}><span>EXAMPLE EXCHANGE</span><p><strong>{point.name}</strong> {point.text}</p></div>
    <div className="mkt-room-bottom"><span><AudioLines size={15} aria-hidden="true" /> Speak naturally. Join the discussion.</span><span>3 AI + you</span></div>
  </div>;
}
