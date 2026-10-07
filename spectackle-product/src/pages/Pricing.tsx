import { useState } from 'react';
import { ArrowRight, Check, Sparkles, Users, Zap } from 'lucide-react';
import { useDemo } from '../components/Layout';

const plans = [
  {
    name: 'Starter',
    tagline: 'Kickstart placement GD practice',
    price: '₹0',
    period: 'free pilot',
    accent: 'green',
    features: [
      'Up to 50 candidates',
      '5 ready-to-run GD rounds',
      'Instant rubric scorecards',
      'Speech pace & talk-time stats',
      'Email support',
    ],
    cta: 'Start a free pilot',
    highlight: false,
  },
  {
    name: 'Campus',
    tagline: 'Campus-wide GD readiness before placement season',
    price: 'Custom',
    period: 'per semester',
    accent: 'peach',
    features: [
      'Up to 2,000 students',
      'Unlimited rounds across cohorts',
      'Full 5-parameter rubric grading',
      'Cohort placement readiness tracking',
      'Company-specific GD topics',
      'Placement officer onboarding',
      'Priority support',
    ],
    cta: 'Join the waitlist',
    highlight: true,
  },
  {
    name: 'Network',
    tagline: 'Multi-campus institutions and university networks',
    price: 'Custom',
    period: 'annual plan',
    accent: 'yellow',
    features: [
      'Unlimited candidates',
      'Cross-campus readiness benchmarking',
      'API & LMS integrations',
      'Dedicated success lead',
      'Custom rubric parameters',
      'Recruiter drive simulations',
      'SLA & priority support',
    ],
    cta: 'Talk to us',
    highlight: false,
  },
];

const faqSnippets = [
  { q: 'Is there a free trial pilot?', a: 'Yes. Colleges get a 4-week pilot with full access to live GD rounds at no cost.' },
  { q: 'How does pricing work?', a: 'Pricing scales with student cohort count and is billed per semester or annually.' },
  { q: 'Can we switch plans later?', a: 'Yes. You can upgrade or adjust your plan at any point during placement season.' },
];

export default function Pricing() {
  const openDemo = useDemo();
  const [billing, setBilling] = useState<'semester' | 'annual'>('semester');

  return (
    <>
      <section className="page-hero section-wrap">
        <div className="page-hero-copy">
          <div className="announcement"><Sparkles size={15} /> Simple, scalable access</div>
          <h1>Plans built for placement <em>readiness.</em></h1>
          <p>Start with a pilot. Scale across your cohort when recruitment season kicks off.</p>
        </div>
        <div className="billing-toggle">
          <button className={billing === 'semester' ? 'active' : ''} onClick={() => setBilling('semester')}>Per semester</button>
          <button className={billing === 'annual' ? 'active' : ''} onClick={() => setBilling('annual')}>Annual <span className="billing-save">save 15%</span></button>
        </div>
      </section>

      <section className="pricing-section section-wrap">
        <div className="pricing-grid">
          {plans.map((plan) => (
            <div key={plan.name} className={`pricing-card pricing-card-${plan.accent} ${plan.highlight ? 'pricing-highlight' : ''}`}>
              {plan.highlight && <div className="pricing-badge"><Sparkles size={13} /> Most popular</div>}
              <div className="pricing-name">{plan.name}</div>
              <p className="pricing-tagline">{plan.tagline}</p>
              <div className="pricing-price">
                <span className="price-value">{plan.price}</span>
                <span className="price-period">{plan.period}</span>
              </div>
              <button
                className={`button ${plan.highlight ? 'button-green' : 'button-dark'} button-full`}
                onClick={() => openDemo(true)}
              >
                {plan.cta} <ArrowRight size={17} />
              </button>
              <div className="pricing-features">
                {plan.features.map((feature) => (
                  <div key={feature} className="pricing-feature">
                    <span className="feature-check"><Check size={14} /></span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="pricing-faq section-wrap">
        <div className="section-intro centered">
          <p className="eyebrow">Quick answers</p>
          <h2>Before you <span>ask.</span></h2>
        </div>
        <div className="pricing-faq-grid">
          {faqSnippets.map((item) => (
            <div key={item.q} className="pricing-faq-card">
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </div>
          ))}
        </div>
        <div className="pricing-faq-cta">
          <span>Still have questions?</span>
          <button className="button button-dark" onClick={() => openDemo(true)}>Talk to our team <ArrowRight size={16} /></button>
        </div>
      </section>

      <section className="cta-section section-wrap">
        <div className="cta-inner">
          <div className="cta-sun"><Sparkles size={34} /></div>
          <p className="eyebrow">Stop watching. Start speaking.</p>
          <h2>Next GD? <em>Bring it.</em></h2>
          <p>Join the waitlist and give your candidates the sparring room they need.</p>
          <button className="button button-dark" onClick={() => openDemo(true)}>Join the waitlist <ArrowRight size={18} /></button>
          <div className="cta-doodles"><span>think fast</span><span>speak smart</span></div>
        </div>
      </section>
    </>
  );
}
