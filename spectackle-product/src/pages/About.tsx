import {
  ArrowRight,
  Heart,
  Lightbulb,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import { useDemo } from "../components/Layout";
import ScrollPortalLayout from "../components/ScrollPortalLayout";
import { trackClick } from "../lib/firebase";

const values = [
  {
    icon: Lightbulb,
    title: "Practice over theory",
    body: "You don't get better at GDs by reading tips. You get better by speaking under pressure.",
  },
  {
    icon: Target,
    title: "Silence isn't safe",
    body: "In a placement GD, staying quiet gets you eliminated. We train active participation.",
  },
  {
    icon: Heart,
    title: "Real feedback, zero fluff",
    body: "Generic advice like 'be confident' doesn't work. We track exact pacing, fillers, and interventions.",
  },
  {
    icon: Users,
    title: "Every voice counts",
    body: "Good thoughts mean nothing if they stay in your head. Spectakles helps you say them out loud.",
  },
];

const timeline = [
  {
    year: "01",
    title: "The GD Problem",
    body: "Brilliant students fail placement round 1 simply because louder candidates hijack the room.",
  },
  {
    year: "02",
    title: "The Realization",
    body: "Speaking up isn't personality. It's a muscle that gets sharper every time you jump in.",
  },
  {
    year: "03",
    title: "The Sparring Room",
    body: "We built Spectakles: autonomous AI personas that interrupt, debate, and force you to speak.",
  },
  {
    year: "04",
    title: "The Outcome",
    body: "Walk into your next placement GD with zero hesitation and total control of your voice.",
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
            Why we built Spectakles
          </div>

          <h1>
            Because <em>silence</em> doesn&apos;t get you placed.
          </h1>

          <p>
            You knew the answer. You just didn&apos;t say it. Spectakles exists
            so you never freeze in a GD again.
          </p>
        </div>

        <div className="about-hero-visual">
          <div className="about-mission-card">
            <div className="about-mission-sticker">
              <Heart size={18} />
            </div>

            <p className="eyebrow">The Mission</p>

            <h2>
              Turn hesitation into{" "}
              <span>conviction.</span>
            </h2>

            <p>
              Everyone has something to say. Spectakles gives you the room to
              say it when it matters.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="portal-scene values-section section-wrap">
        <div className="section-intro centered">
          <p className="eyebrow">What we believe</p>

          <h2>
            Four rules we <span>stand by.</span>
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
            <p className="eyebrow">The origin</p>

            <h2>
              From hesitant silence to <span>Spectakles.</span>
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

          <p className="eyebrow">Stop watching. Start speaking.</p>

          <h2>
            Next GD? <em>Bring it.</em>
          </h2>

          <p>
            Practice real interventions, handle pressure, and walk into placements ready.
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