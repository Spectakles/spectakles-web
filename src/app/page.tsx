"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Check,
  MessageCircle,
  MoveUpRight,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";


import { useDemo } from "@/components/Layout";
import SpectaklesLogo from "@/components/SpectaklesLogo";
import CreativeExperience from "@/components/CreativeExperience";
import InstitutionsBento from "@/components/InstitutionsBento";
import MagicBento from "@/components/MagicBento";
import ParallaxPills from "@/components/ParallaxPills";
import ScrollPortalLayout from "@/components/ScrollPortalLayout";
import RoundtableHero from "@/components/RoundtableHero";
import { trackClick } from "@/lib/firebase";

export default function Home() {
  const openDemo = useDemo();
  const [activeRound, setActiveRound] = useState(0);

  return (
    <ScrollPortalLayout>
      {/* HERO SECTION */}
      <section className="portal-scene">
        <section className="hero section-wrap">
          <div className="hero-copy">
            <div className="announcement">
              <Sparkles size={15} />
              Built for the moments that matter
            </div>

            <h1>
              Make every voice in the room <em>count.</em>
            </h1>

            <p className="hero-text">
              Spectakles turns group discussions, practice sessions, and
              presentations into confident, measurable moments of
              participation.
            </p>

            <div className="hero-actions">
              <button
                className="button button-green"
                onClick={() => {
                  trackClick("join_waitlist", "hero_section");
                  openDemo(true);
                }}
              >
                Join the waitlist <ArrowRight size={18} />
              </button>
            </div>
          </div>

          <div className="hero-stage-wrap">
            <RoundtableHero />

            <ParallaxPills
              className="hero-pill-silence"
              color="yellow"
              rotate={-6}
              strength={16}
            >
              <span className="pill-star">★</span>
              <span>No awkward silences</span>
            </ParallaxPills>

            <ParallaxPills
              className="hero-pill-human"
              color="coral"
              rotate={6}
              strength={22}
            >
              <span>Made for humans</span>
              <span className="pill-arrow">↗</span>
            </ParallaxPills>
          </div>
        </section>
      </section>

      {/* CREATIVE EXPERIENCE */}
      <section className="portal-scene">
        <CreativeExperience />
      </section>

      {/* INSTITUTIONS SECTION */}
      <section className="portal-scene">
        <section
          className="value-section section-wrap"
          id="institutions"
        >
          <div className="section-intro">
            <p className="eyebrow">More than participation</p>

            <h2>
              Turn “any questions?” into{" "}
              <span>everyone&apos;s in.</span>
            </h2>

            <p>
              Whether you&apos;re a placement leader, faculty member, or
              student success team, Spectakles gives every learner a place to
              practice, participate, and progress.
            </p>
          </div>

          <InstitutionsBento />
        </section>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="portal-scene">
        <section
          className="how-section section-wrap"
          id="how-it-works"
        >
          <div className="section-intro centered">
            <p className="eyebrow">A better kind of practice</p>

            <h2>
              From first word to <span>full flow.</span>
            </h2>

            <p>
              One playful loop helps students prepare, show up, and know
              exactly how to improve next time.
            </p>
          </div>

          <MagicBento />
        </section>
      </section>

      {/* STUDENT EXPERIENCE SECTION */}
      <section className="portal-scene">
        <section
          className="experience-section"
          id="experience"
        >
          <div className="section-wrap experience-inner">
            <div className="experience-copy">
              <p className="eyebrow eyebrow-light">
                The student experience
              </p>

              <h2>
                Practice that feels more like{" "}
                <span>a game night.</span>
              </h2>

              <p>
                No blank pages. No cold call energy. Just a clear,
                low-pressure way to speak up, listen well, and get better.
              </p>

              <div className="experience-list">
                <div>
                  <span className="list-icon">
                    <Zap size={15} />
                  </span>

                  <span>
                    <b>Low stakes, high energy</b>
                    <small>
                      Students can try, miss, and try again.
                    </small>
                  </span>
                </div>

                <div>
                  <span className="list-icon">
                    <BarChart3 size={15} />
                  </span>

                  <span>
                    <b>Progress they can feel</b>
                    <small>
                      Small wins become visible over time.
                    </small>
                  </span>
                </div>

                <div>
                  <span className="list-icon">
                    <MessageCircle size={15} />
                  </span>

                  <span>
                    <b>Feedback that sounds human</b>
                    <small>
                      Specific, warm, and ready for next round.
                    </small>
                  </span>
                </div>
              </div>

              <Link
                className="text-link text-link-light"
                href="/#top"
                onClick={() => trackClick("explore_student_journey", "student_experience_section")}
              >
                Explore the student journey{" "}
                <MoveUpRight size={16} />
              </Link>
            </div>

            <div className="result-card">
              <div className="result-header">
                <span className="result-brand">
                  <SpectaklesLogo height={24} className="h-6 w-auto align-middle" />
                </span>

                <span className="result-status">
                  <span /> Round complete
                </span>
              </div>

              <div className="result-title">
                <span className="result-spark">
                  <Sparkles size={20} />
                </span>

                <div>
                  <p>Nice speaking, Ananya.</p>
                  <span>Here&apos;s your instant snapshot.</span>
                </div>
              </div>

              <div className="metric-row">
                <div>
                  <span>Talk time</span>
                  <b>2:14</b>
                  <small>↑ 32s vs last time</small>
                </div>

                <div>
                  <span>Times you spoke</span>
                  <b>7</b>
                  <small>New record</small>
                </div>

                <div>
                  <span>Vibe check</span>
                  <b>Confident</b>
                  <small>Smiled 12×</small>
                </div>
              </div>

              <div className="highlight-box">
                <span>
                  <Check size={15} />
                  <b>What landed:</b> your fresher + copilot example gave
                  the room something to build on.
                </span>

                <span>
                  <Target size={15} />
                  <b>Try next:</b> invite a quieter speaker in before your
                  closing point.
                </span>
              </div>

              <div className="progress-report">
                <div>
                  <span>Confidence journey</span>

                  <b>
                    +24% <small>this month</small>
                  </b>
                </div>

                <div className="progress-track">
                  <span />
                </div>

                <div className="progress-labels">
                  <small>First round</small>
                  <small>Today</small>
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>

      {/* ROUNDS SECTION */}
      <section className="portal-scene">
        <section className="rounds-section section-wrap">
          <div className="rounds-heading">
            <div>
              <p className="eyebrow">Ready when you are</p>

              <h2>
                There&apos;s a round for <span>that.</span>
              </h2>
            </div>

            <div className="round-tabs">
              {["Placement prep", "Classroom", "Team skills"].map(
                (tab, index) => (
                  <button
                    className={activeRound === index ? "active" : ""}
                    key={tab}
                    onClick={() => {
                      trackClick("round_tab", "rounds_section", {
                        tab_name: tab,
                        tab_index: index,
                      });
                      setActiveRound(index);
                    }}
                  >
                    {tab}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="round-feature">
            <div className="round-number">
              0{activeRound + 1}
            </div>

            <div className="round-copy">
              <h3>
                {activeRound === 0
                  ? "The interview warm-up"
                  : activeRound === 1
                    ? "The room opener"
                    : "The team huddle"}
              </h3>

              <p>
                {activeRound === 0
                  ? "Build a point, handle a follow-up, and leave ready for the real thing."
                  : activeRound === 1
                    ? "Make every classroom discussion easier to enter and more rewarding to stay in."
                    : "Practice listening, clarity, and collaboration in a space where everyone contributes."}
              </p>

              <div className="round-tags">
                <span>8 min</span>
                <span>5 participants</span>

                <span>
                  <Sparkles size={13} />
                  Instant feedback
                </span>
              </div>
            </div>

            <div className="round-quote">
              <div className="quote-mark">✦</div>

              <p>
                The goal isn&apos;t perfection. It&apos;s about getting
                comfortable with thinking on your feet.
              </p>

              <span>— The Spectakles Approach</span>
            </div>
          </div>
        </section>
      </section>

      {/* CTA SECTION */}
      <section className="portal-scene">
        <section className="cta-section section-wrap">
          <div className="cta-inner">
            <div className="cta-sun">
              <Sparkles size={34} />
            </div>

            <p className="eyebrow">
              Your next great session is waiting
            </p>

            <h2>
              Put a little more <em>life</em> in learning.
            </h2>

            <p>
              See how Spectakles can help your campus build confident
              communicators, one round at a time.
            </p>

            <button
              className="button button-dark"
              onClick={() => {
                trackClick("join_waitlist", "bottom_cta_section");
                openDemo(true);
              }}
            >
              Join the waitlist <ArrowRight size={18} />
            </button>

            <div className="cta-doodles">
              <span>more voices</span>
              <span>more momentum</span>
            </div>
          </div>
        </section>
      </section>
    </ScrollPortalLayout>
  );
}
