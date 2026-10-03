import { useState } from "react";
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

import { Link } from "react-router-dom";
import { useDemo } from "../components/Layout";
import SpectaklesLogo from "../components/SpectaklesLogo";
import CreativeExperience from "../components/CreativeExperience";
import InstitutionsBento from "../components/InstitutionsBento";
import MagicBento from "../components/MagicBento";
import ParallaxPills from "../components/ParallaxPills";
import ScrollPortalLayout from "../components/ScrollPortalLayout";
import RoundtableHero from "../components/RoundtableHero";
import TypingText from "../components/TypingText";
import { trackClick } from "../lib/firebase";

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
              Your next GD starts here
            </div>

            <h1>
              Stop rehearsing.{" "}
              <em>
                <TypingText
                  words={[
                    "Start speaking.",
                    "Own the GD.",
                    "Think on your feet.",
                    "Take the floor.",
                    "Stand out.",
                  ]}
                  typingSpeed={70}
                  deletingSpeed={38}
                  pauseTime={2200}
                />
              </em>
            </h1>

            <p className="hero-text">
              Think fast. Speak smart. Own your next GD.
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
              <span>Stop overthinking</span>
            </ParallaxPills>

            <ParallaxPills
              className="hero-pill-human"
              color="coral"
              rotate={6}
              strength={22}
            >
              <span>Speak when it matters</span>
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
            <p className="eyebrow">The GD reality</p>

            <h2>
              You knew the answer.{" "}
              <span>You just didn&apos;t say it.</span>
            </h2>

            <p>
              Because knowing what to say isn&apos;t enough. You need to say it when it matters.
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
            <p className="eyebrow">The GD loop</p>

            <h2>
              From awkward silence to <span>active participation.</span>
            </h2>

            <p>
              Practice real conversations, handle pressure, respond on the spot and make your voice count.
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
                Live GD simulation
              </p>

              <h2>
                Less hesitation.{" "}
                <span>More conversation.</span>
              </h2>

              <p>
                Build the confidence to speak clearly, even when the pressure is real.
              </p>

              <div className="experience-list">
                <div>
                  <span className="list-icon">
                    <Zap size={15} />
                  </span>

                  <span>
                    <b>Think on your feet</b>
                    <small>
                      Handle interruptions, counter arguments, and jump in.
                    </small>
                  </span>
                </div>

                <div>
                  <span className="list-icon">
                    <BarChart3 size={15} />
                  </span>

                  <span>
                    <b>Know how you sound</b>
                    <small>
                      Track speaking pace, fillers, and talk time in real time.
                    </small>
                  </span>
                </div>

                <div>
                  <span className="list-icon">
                    <MessageCircle size={15} />
                  </span>

                  <span>
                    <b>Placement-grade rubric</b>
                    <small>
                      Evaluated on the exact 5 parameters campus recruiters test.
                    </small>
                  </span>
                </div>
              </div>

              <Link
                className="text-link text-link-light"
                to="/#top"
                onClick={() => trackClick("explore_student_journey", "student_experience_section")}
              >
                Explore the GD simulation{" "}
                <MoveUpRight size={16} />
              </Link>
            </div>

            <div className="result-card">
              <div className="result-header">
                <span className="result-brand">
                  <SpectaklesLogo height={24} className="h-6 w-auto align-middle" />
                </span>

                <span className="result-status">
                  <span /> GD Round complete
                </span>
              </div>

              <div className="result-title">
                <span className="result-spark">
                  <Sparkles size={20} />
                </span>

                <div>
                  <p>Strong intervention, Ananya.</p>
                  <span>Here&apos;s your instant GD scorecard.</span>
                </div>
              </div>

              <div className="metric-row">
                <div>
                  <span>Talk time</span>
                  <b>2:14</b>
                  <small>Optimal 2–3m window</small>
                </div>

                <div>
                  <span>Interventions</span>
                  <b>7</b>
                  <small>Floor takeovers</small>
                </div>

                <div>
                  <span>Speaking pace</span>
                  <b>138 WPM</b>
                  <small>Clear & steady</small>
                </div>
              </div>

              <div className="highlight-box">
                <span>
                  <Check size={15} />
                  <b>What landed:</b> Backed your counter-point with real
                  data before the floor shifted.
                </span>

                <span>
                  <Target size={15} />
                  <b>Try next:</b> Acknowledge Rohan&apos;s objection before
                  launching your conclusion.
                </span>
              </div>

              <div className="progress-report">
                <div>
                  <span>Placement readiness</span>

                  <b>
                    +24% <small>this month</small>
                  </b>
                </div>

                <div className="progress-track">
                  <span />
                </div>

                <div className="progress-labels">
                  <small>Day 1</small>
                  <small>Placement ready</small>
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
              <p className="eyebrow">Multiple scenarios</p>

              <h2>
                Different room. <span>Different challenge.</span>
              </h2>
            </div>

            <div className="round-tabs">
              {["Placement GD", "Contrarian debate", "Case study"].map(
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

          <div
            className={`round-feature round-feature-${activeRound}`}
            key={activeRound}
          >
            <div className="round-number">
              0{activeRound + 1}
            </div>

            <div className="round-copy">
              <h3>
                {activeRound === 0
                  ? "The campus placement GD"
                  : activeRound === 1
                    ? "The contrarian room"
                    : "The case study roundtable"}
              </h3>

              <p>
                {activeRound === 0
                  ? "Handle aggressive floor takeovers, structure arguments on the fly, and stand out to evaluators."
                  : activeRound === 1
                    ? "Defend controversial angles, counter strong pushback, and hold your ground under scrutiny."
                    : "Break down messy business dilemmas, synthesize points, and align the group toward consensus."}
              </p>

              <div className="round-tags">
                <span>{activeRound === 0 ? "8 min" : activeRound === 1 ? "10 min" : "12 min"}</span>
                <span>5 candidates</span>

                <span>
                  <Sparkles size={13} />
                  {activeRound === 0 ? "Recruiter rubric" : activeRound === 1 ? "Rebuttal scoring" : "Synthesis check"}
                </span>
              </div>
            </div>

            <div className="round-quote">
              <div className="quote-mark">✦</div>

              <p>
                {activeRound === 0
                  ? "Confidence isn't a personality. It's practice."
                  : activeRound === 1
                    ? "Defend controversial ideas with calm, structured clarity."
                    : "Synthesis wins rooms. Noise just fills them."}
              </p>

              <span>
                {activeRound === 0
                  ? "— The Placement Rule"
                  : activeRound === 1
                    ? "— The Contrarian Rule"
                    : "— The Roundtable Rule"}
              </span>
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
              Your next GD is coming
            </p>

            <h2>
              Ready to <em>speak up?</em>
            </h2>

            <p>
              Stop overthinking in silence. Practice before placement day and own your moment.
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
              <span>think fast</span>
              <span>speak smart</span>
            </div>
          </div>
        </section>
      </section>
    </ScrollPortalLayout>
  );
}