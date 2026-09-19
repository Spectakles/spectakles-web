import { notFound } from "next/navigation";

// Route commented out and hidden per user request
export default function Pricing() {
  notFound();
}

/*
"use client";

import { useState } from 'react';
import { ArrowRight, Check, Sparkles, Users, Zap } from 'lucide-react';
import { useDemo } from '@/components/Layout';

const plans = [
  {
    name: 'Starter',
    tagline: 'For departments getting started with practice rounds',
    price: '₹0',
    period: 'free pilot',
    accent: 'green',
    features: [
      'Up to 50 students',
      '3 ready-to-run rounds',
      'Instant session snapshots',
      'Basic participation metrics',
      'Email support',
    ],
    cta: 'Start a free pilot',
    highlight: false,
  },
  {
    name: 'Campus',
    tagline: 'For institutions building confident communicators at scale',
    price: 'Custom',
    period: 'per semester',
    accent: 'peach',
    features: [
      'Up to 2,000 students',
      'Unlimited rounds across departments',
      'Full analytics dashboard',
      'Cohort-level insights & exports',
      'Custom round templates',
      'Faculty onboarding workshop',
      'Priority support',
    ],
    cta: 'Join the waitlist',
    highlight: true,
  },
  {
    name: 'Network',
    tagline: 'For multi-campus institutions and university networks',
    price: 'Custom',
    period: 'annual plan',
    accent: 'yellow',
    features: [
      'Unlimited students',
      'Cross-campus benchmarking',
      'API access & integrations',
      'Dedicated success manager',
      'Custom branding & rounds',
      'Quarterly impact reviews',
      'SLA & priority support',
    ],
    cta: 'Talk to us',
    highlight: false,
  },
];

const faqSnippets = [
  { q: 'Is there really a free pilot?', a: 'Yes. Qualified institutions get a 4-week pilot with full access to core features at no cost.' },
  { q: 'How does pricing work?', a: 'Pricing scales with student count and is billed per semester or annually. We\'ll tailor a plan during your walkthrough.' },
  { q: 'Can we switch plans later?', a: 'Absolutely. You can upgrade or adjust your plan at any point in the semester.' },
];

export function PricingPageContent() {
  const openDemo = useDemo();
  const [billing, setBilling] = useState<'semester' | 'annual'>('semester');

  return (
    <>
      <section className="page-hero section-wrap">
        <div className="page-hero-copy">
          <div className="announcement"><Sparkles size={15} /> Simple, scalable pricing</div>
          <h1>Plans that grow with your <em>campus.</em></h1>
          <p>Start free. Scale when you&apos;re ready. Every plan includes the full Spectakles experience — the difference is in size and support.</p>
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
          <p className="eyebrow">Try before you decide</p>
          <h2>See it work, then <em>decide.</em></h2>
          <p>Join the waitlist and we&apos;ll help you find the right plan for your campus.</p>
          <button className="button button-dark" onClick={() => openDemo(true)}>Join the waitlist <ArrowRight size={18} /></button>
          <div className="cta-doodles"><span>no pressure</span><span>just practice</span></div>
        </div>
      </section>
    </>
  );
}
*/
