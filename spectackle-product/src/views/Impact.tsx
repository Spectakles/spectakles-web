"use client";

import { ArrowRight, BarChart3, Check, MessageCircle, Quote, Sparkles, TrendingUp, Users } from 'lucide-react';
import Link from "../components/SiteLink";
import { useDemo } from '../components/Layout';
import SpectaklesLogo from '../components/SpectaklesLogo';

const stats = [
  { value: 'Talk Time', label: 'Balanced participation', sub: 'No single speaker dominates' },
  { value: 'Fluency', label: 'Fewer filler words', sub: 'Controlled cadence under pressure' },
  { value: 'Structure', label: 'Structured arguments', sub: 'Backed by evidence and logic' },
  { value: 'Readiness', label: 'Placement ready', sub: '5-parameter rubric mastery' },
];

const useCases = [
  {
    name: 'Scenario 1',
    tag: 'Placement Drives',
    color: 'green',
    headline: 'From freezing in round 1 to getting placed.',
    body: 'Students struggle with floor interruptions and impromptu reasoning. Spectakles builds the reflexes to claim the mic and make every intervention count.',
    metrics: [
      { value: 'Reps', label: 'Roundtable reps' },
      { value: 'Feedback', label: 'Instant scoring' },
      { value: 'Focus', label: 'Floor assertiveness' },
    ],
    quote: 'Placement day isn\'t practice. Make practice count.',
    author: 'Campus Placement GDs',
  },
  {
    name: 'Scenario 2',
    tag: 'Contrarian Debates',
    color: 'peach',
    headline: 'Stand your ground when challenged.',
    body: 'AI peers push back with counter-evidence. You learn to handle disagreement, adapt your argument, and maintain poise.',
    metrics: [
      { value: 'Floor', label: 'Rebuttal timing' },
      { value: 'Logic', label: 'Argument depth' },
      { value: 'Poise', label: 'Zero panic' },
    ],
    quote: 'Challenge ideas, counter strong pushback, and hold your ground.',
    author: 'Debate Roundtables',
  },
  {
    name: 'Scenario 3',
    tag: 'Speech Analytics',
    color: 'yellow',
    headline: 'Confidence you can actually measure.',
    body: 'Session scorecards give objective evidence of improvement — talk time, speaking pace, and rubric breakdowns after every round.',
    metrics: [
      { value: 'Cadence', label: 'Optimal 130–150 WPM' },
      { value: 'Fillers', label: 'Zero um/uh' },
      { value: 'Rubric', label: '5-axis scorecard' },
    ],
    quote: 'Speak once. Then speak better.',
    author: 'Performance Insights',
  },
];

const principles = [
  { text: 'Confidence isn\'t a personality. It\'s practice.', author: 'Core Rule', tone: 'peach' },
  { text: 'Because knowing what to say isn\'t enough. You need to say it when it matters.', author: 'Our Philosophy', tone: 'blue' },
  { text: 'Because silence doesn\'t get you noticed.', author: 'Placement Reality', tone: 'mint' },
  { text: 'Don\'t just join the GD. Own your moment.', author: 'The Goal', tone: 'lilac' },
];

export default function Impact() {
  const openDemo = useDemo();

  return (
    <>
      <section className="page-hero section-wrap">
        <div className="page-hero-copy">
          <div className="announcement"><TrendingUp size={15} /> Expected Outcomes</div>
          <h1>When students speak up, <em>everything</em> changes.</h1>
          <p>Think fast. Speak smart. Stand out. Here is what happens when you train before placement day.</p>
        </div>
        <div className="page-hero-visual">
          <div className="impact-hero-card">
            <div className="impact-hero-top"><span className="result-brand"><SpectaklesLogo height={24} className="h-6 w-auto" /></span><span className="impact-badge"><TrendingUp size={12} /> Target Impact</span></div>
            <div className="impact-hero-stats">
              <div><b>High</b><span>participation</span></div>
              <div><b>More</b><span>confidence</span></div>
              <div><b>All</b><span>students</span></div>
            </div>
            <div className="impact-hero-chart">
              <div className="impact-chart-label">Expected Growth Curve</div>
              <div className="impact-chart-bars">
                <span style={{ height: '20%' }} /><span style={{ height: '35%' }} /><span style={{ height: '30%' }} /><span style={{ height: '55%' }} /><span style={{ height: '48%' }} /><span style={{ height: '72%' }} /><span style={{ height: '65%' }} /><span className="chart-active" style={{ height: '95%' }} />
              </div>
              <div className="impact-chart-labels"><small>First Session</small><small>Tenth Session</small></div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section section-wrap">
        <div className="section-intro centered">
          <p className="eyebrow">What we measure</p>
          <h2>Progress you can <span>point to.</span></h2>
        </div>
        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-sub">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="case-studies-section section-wrap">
        <div className="section-intro centered">
          <p className="eyebrow">Target Scenarios</p>
          <h2>From hesitant to <span>hands up.</span></h2>
          <p>Three high-pressure rooms — one goal: speak with confidence.</p>
        </div>
        <div className="case-studies-list">
          {useCases.map((study) => (
            <article key={study.name} className={`case-study case-study-${study.color}`}>
              <div className="case-study-header">
                <span className="case-study-tag">{study.tag}</span>
                <span className="case-study-name">{study.name}</span>
              </div>
              <h3>{study.headline}</h3>
              <p>{study.body}</p>
              <div className="case-study-metrics">
                {study.metrics.map((metric) => (
                  <div key={metric.label}>
                    <b>{metric.value}</b>
                    <span>{metric.label}</span>
                  </div>
                ))}
              </div>
              <div className="case-study-quote">
                <Quote size={20} />
                <p>{study.quote}</p>
                <span>{study.author}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="testimonials-section">
        <div className="section-wrap">
          <div className="section-intro centered">
            <p className="eyebrow">Core Beliefs</p>
            <h2>What drives <span>our design.</span></h2>
          </div>
          <div className="testimonials-grid">
            {principles.map((testimonial) => (
              <div key={testimonial.author} className={`testimonial-card testimonial-${testimonial.tone}`}>
                <MessageCircle size={22} />
                <p>{testimonial.text}</p>
                <span>{testimonial.author}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section section-wrap">
        <div className="cta-inner">
          <div className="cta-sun"><Sparkles size={34} /></div>
          <p className="eyebrow">Your next GD is coming</p>
          <h2>Ready to <em>speak up?</em></h2>
          <p>Stop overthinking in silence. Join the waitlist and walk into your next GD ready.</p>
          <button className="button button-dark" onClick={() => openDemo(true)}>Join the waitlist <ArrowRight size={18} /></button>
          <div className="cta-doodles"><span>more voices</span><span>more momentum</span></div>
        </div>
      </section>
    </>
  );
}
