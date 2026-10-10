"use client";

import {
  ArrowRight,
  Heart,
  Lightbulb,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import { useDemo } from "@/components/Layout";
import ScrollPortalLayout from "@/components/ScrollPortalLayout";
import { trackClick } from "@/lib/firebase";

const values = [
  {
    icon: Heart,
    title: "Students first, always",
    body: "Every decision starts with: does this help a student find their voice? If not, we don't build it.",
  },
  {
    icon: Lightbulb,
    title: "Practice over theory",
    body: "You don't learn to swim by reading about it. Spectakles is the pool — shallow end first, deep end when you're ready.",
  },
  {
    icon: Target,
    title: "Measurable warmth",
    body: "Feedback should feel human and be useful. Data without empathy is just noise.",
  },
  {
    icon: Users,
    title: "Every voice matters",
    body: "The quietest student in the room often has the most to say. We build for them.",
  },
];

const timeline = [
  {
    year: "01",
    title: "The Observation",
    body: "We sat through too many group discussions where the same three students dominated the conversation, while the rest stayed silent out of fear of judgment.",
  },
  {
    year: "02",
    title: "The Insight",
    body: "We realized that communication confidence isn't an innate personality trait—it’s a trainable skill. It just requires a safe, low-stakes environment to practice in without consequence.",
  },
  {
    year: "03",
    title: "The Solution",
    body: "We set out to build Spectakles: an AI-moderated platform that removes the social anxiety of peer judgment, allowing students to practice speaking up and structuring their thoughts.",
  },
  {
    year: "04",
    title: "The Vision",
    body: "Our goal is simple: ensure that no student enters the workforce without the confidence to articulate their ideas clearly and command a room.",
  },
];

export default function About() {
  const openDemo = useDemo();

  return (
    <ScrollPortalLayout>
      {/* Hero Section */}
      <section className="portal-scene page-hero section-wrap">
        <div className="page-hero-copy">
          <div className="announcement">
            <Sparkles size={15} />
            Our story
          </div>

          <h1>
            We built Spectakles because <em>silence</em> isn't a personality
            trait.
          </h1>

          <p>
            Too many students have something to say and nowhere safe to
            practice saying it. We're here to change that — one round at a
            time.
          </p>
        </div>

        <div className="about-hero-visual">
          <div className="about-mission-card">
            <div className="about-mission-sticker">
              <Heart size={18} />
            </div>

            <p className="eyebrow">Our mission</p>

            <h2>
              Make practice feel less like pressure and more like{" "}
              <span>play.</span>
            </h2>

            <p>
              Every student deserves a space to find their voice before the
              stakes are real. Spectakles is that space.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="portal-scene values-section section-wrap">
        <div className="section-intro centered">
          <p className="eyebrow">What we believe</p>

          <h2>
            Four things we <span>don't compromise on.</span>
          </h2>
        </div>

        <div className="values-grid">
          {values.map((value) => {
            const Icon = value.icon;

            return (
              <div key={value.title} className="value-item">
                <div className="value-item-icon">
                  <Icon size={22} />
                </div>

                <h3>{value.title}</h3>
                <p>{value.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Timeline Section */}
      <section className="portal-scene timeline-section">
        <div className="section-wrap">
          <div className="section-intro centered">
            <p className="eyebrow">Our Story</p>

            <h2>
              From a quiet room to <span>Spectakles.</span>
            </h2>
          </div>

          <div className="timeline">
            {timeline.map((item, index) => (
              <div
                key={item.year}
                className={`timeline-item ${
                  index % 2 === 0 ? "timeline-left" : "timeline-right"
                }`}
              >
                <div className="timeline-dot" />

                {/* Glassy Timeline Card */}
                <div className="timeline-content glass-card">
                  <span className="timeline-year">{item.year}</span>

                  <h3>{item.title}</h3>

                  <p>{item.body}</p>

                  {/* Decorative glass shine */}
                  <span className="glass-shine" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="portal-scene about-cta section-wrap">
        <div className="about-cta-inner">
          <div className="about-cta-sun">
            <Users size={34} />
          </div>

          <p className="eyebrow">Join the mission</p>

          <h2>
            Help us put a little more <em>life</em> in learning.
          </h2>

          <p>
            Whether you're an institution, a faculty member, or a student who
            wants to practice — there's a round waiting for you.
          </p>

          <button
            className="button button-dark"
            onClick={() => {
              trackClick("join_waitlist", "about_cta_section");
              openDemo(true);
            }}
          >
            Join the waitlist
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </ScrollPortalLayout>
  );
}
