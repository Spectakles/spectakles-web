"use client";

import { ArrowRight, BarChart3, Check, MessageCircle, Quote, Sparkles, TrendingUp, Users } from 'lucide-react';

import { useDemo } from '@/components/Layout';
import SpectaklesLogo from '@/components/SpectaklesLogo';

const stats = [
  { value: 'Participation', label: 'More voices heard', sub: 'in every single session' },
  { value: 'Confidence', label: 'Lower speaking anxiety', sub: 'through repeated practice' },
  { value: 'Quality', label: 'Better structured thoughts', sub: 'guided by AI nudges' },
  { value: 'Scale', label: 'Unlimited practice rounds', sub: 'for every student' },
];

const useCases = [
  {
    name: 'Scenario 1',
    tag: 'Placement prep',
    color: 'green',
    headline: 'From quiet rooms to confident interviews.',
    body: 'Students often struggle to speak up in mock Group Discussions. Spectakles provides a low-pressure environment to practice organizing thoughts, entering conversations, and handling follow-ups before the real interview.',
    metrics: [
      { value: 'Reps', label: 'Practice rounds' },
      { value: 'Feedback', label: 'Instant feedback' },
      { value: 'Focus', label: 'Structure & flow' },
    ],
    quote: 'Design goal: Make the hardest part of the interview feel familiar.',
    author: 'The Placement Use Case',
  },
  {
    name: 'Scenario 2',
    tag: 'Classroom engagement',
    color: 'peach',
    headline: 'Discussions that don\'t die after two minutes.',
    body: 'Too often, the same three hands go up in every lecture. Spectakles gives every student a way in — a prompt, a nudge, a moment — so that classroom discussions come alive across the entire cohort.',
    metrics: [
      { value: 'Voices', label: 'Every student' },
      { value: 'Pacing', label: 'Guided discussion' },
      { value: 'Safety', label: 'No peer judgment' },
    ],
    quote: 'Design goal: Turn "Any questions?" into active participation.',
    author: 'The Classroom Use Case',
  },
  {
    name: 'Scenario 3',
    tag: 'Communication skills',
    color: 'yellow',
    headline: 'Confidence you can actually measure.',
    body: 'How do you prove a student is getting better at speaking? Spectakles\'s session snapshots provide tangible evidence of improvement — talk time, participation frequency, and specific coaching points after every round.',
    metrics: [
      { value: 'Time', label: 'Active talk time' },
      { value: 'Growth', label: 'Progress tracking' },
      { value: 'Coaching', label: 'Personalized tips' },
    ],
    quote: 'Design goal: Give students data to prove their progress.',
    author: 'The Soft Skills Use Case',
  },
];

const principles = [
  { text: 'Confidence is not a personality trait. It is a trainable skill that grows with repetition.', author: 'Core Belief', tone: 'peach' },
  { text: 'Group discussions shouldn\'t feel like a battleground. They should be a collaborative practice.', author: 'Our Philosophy', tone: 'blue' },
  { text: 'Feedback needs to be instant to be useful. Waiting a week to hear how you did doesn\'t work.', author: 'Design Principle', tone: 'mint' },
  { text: 'The quietest person in the room often has the best ideas. We just need to give them a safe way to share them.', author: 'Our Mission', tone: 'lilac' },
];

export default function Impact() {
  const openDemo = useDemo();

  return (
    <>
      <section className="page-hero section-wrap">
        <div className="page-hero-copy">
          <div className="announcement"><TrendingUp size={15} /> Expected Outcomes</div>
          <h1>When students speak up, <em>everything</em> changes.</h1>
          <p>We are building Spectakles to solve the biggest bottleneck in education: the fear of speaking. Here&apos;s the impact we are designing for.</p>
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
          <p>Three different challenges — one common goal: helping students find their voice.</p>
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
          <p className="eyebrow">Your campus could be next</p>
          <h2>Ready to see this kind of <em>impact?</em></h2>
          <p>Join the waitlist and we&apos;ll show you how Spectakles fits your institution.</p>
          <button className="button button-dark" onClick={() => openDemo(true)}>Join the waitlist <ArrowRight size={18} /></button>
          <div className="cta-doodles"><span>more voices</span><span>more momentum</span></div>
        </div>
      </section>
    </>
  );
}

