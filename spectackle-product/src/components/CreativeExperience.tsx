import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Pause,
  Play,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import "./CreativeExperience.css";

gsap.registerPlugin(ScrollTrigger);

const DURATION_MS = 6000;

export const experiences = [
  {
    id: "simulations",
    number: "01",
    label: "Live GD simulations",
    title: "Don't wait for permission. Take the floor.",
    body: "Practice entering fast-paced discussions, taking the floor with confidence, and steering the room without getting talked over.",
    icon: Users,
    themeColor: "#237442",
    themePastel: "#d4f0db",
    themeText: "#237442",
    themeGlow: "rgba(35, 116, 66, 0.14)",
    tag: "ROUNDTABLE SIM",
    overlayBadge: {
      tag: "LIVE GD ROUNDTABLE",
      text: "6 Candidates Active",
      highlight: "Turn 03/12",
    },
    overlayScore: {
      score: "9.4",
      label: "Recruiter Rubric",
      quote: "Broke deadlock by synthesizing opposing viewpoints with clear, structured points.",
    },
  },
  {
    id: "debates",
    number: "02",
    label: "Debates & counter-arguments",
    title: "Think on your feet. Disagree with poise.",
    body: "Learn how to challenge flawed logic, back up your points with facts, and turn aggressive interruptions into your advantage.",
    icon: MessageCircle,
    themeColor: "#cb7157",
    themePastel: "#ffd9ca",
    themeText: "#a3482d",
    themeGlow: "rgba(203, 113, 87, 0.14)",
    tag: "REBUTTAL STAGE",
    overlayBadge: {
      tag: "CROSS-EXAMINATION",
      text: "Rebuttal Window Open",
      highlight: "Motion Live",
    },
    overlayScore: {
      score: "9.1",
      label: "Rebuttal Defense",
      quote: "Countered velocity premise using concrete reliability metrics without sounding combative.",
    },
  },
  {
    id: "personas",
    number: "03",
    label: "Dynamic AI personas",
    title: "Meet the loudest voice before placement day.",
    body: "Spar against realistic personalities: the aggressive interrupter, the sharp contrarian, the mediator, and the silent candidate.",
    icon: Sparkles,
    themeColor: "#d4a017",
    themePastel: "#fce48b",
    themeText: "#8a6100",
    themeGlow: "rgba(212, 160, 23, 0.14)",
    tag: "AI PERSONAS",
    overlayBadge: {
      tag: "ADAPTIVE AI SPARRING",
      text: "Aggressive Interrupter Mode",
      highlight: "Pressure: High",
    },
    overlayScore: {
      score: "9.3",
      label: "Pressure Resilience",
      quote: "Maintained composure through two sharp interruptions, acknowledged the point, and finished argument.",
    },
  },
  {
    id: "analytics",
    number: "04",
    label: "Speech & recruiter analytics",
    title: "Every second tracked. Zero guesswork.",
    body: "Instant recruiter breakdown on your talk-time ratio, speaking pace, filler frequency, and leadership signals.",
    icon: Zap,
    themeColor: "#20202c",
    themePastel: "#e8e6f0",
    themeText: "#20202c",
    themeGlow: "rgba(32, 32, 44, 0.14)",
    tag: "GD ANALYTICS",
    overlayBadge: {
      tag: "VOCAL & CADENCE METRICS",
      text: "142 WPM · 18% Floor Share",
      highlight: "Zero Fillers",
    },
    overlayScore: {
      score: "9.8",
      label: "Placement Readiness",
      quote: "Ideal floor share: spoke 3 high-impact times with crisp articulation and zero filler pauses.",
    },
  },
];

/* ─── Centered Thematic Visuals for Each Experience ──────── */

function SimulationsVisual() {
  const personas = [
    { name: "Ananya", role: "Leader", initial: "A", active: true },
    { name: "Rohan", role: "Contrarian", initial: "R", active: false },
    { name: "Priya", role: "Mediator", initial: "P", active: false },
    { name: "Aarav", role: "Analyst", initial: "Aa", active: false },
    { name: "Sneha", role: "Strategist", initial: "S", active: false },
  ];

  return (
    <div className="ce-inner ce-inner-discussions">
      <div className="ce-roundtable-box">
        <div className="ce-rt-top-bar">
          <span className="ce-rt-dot-live" />
          <span>6-CANDIDATE GD ROUNDTABLE</span>
          <span className="ce-rt-turn">TURN 03/12</span>
        </div>

        <div className="ce-rt-avatars">
          {personas.map((p) => (
            <div
              key={p.name}
              className={`ce-rt-seat ${p.active ? "ce-rt-seat-active" : ""}`}
            >
              <span className="ce-rt-avatar">{p.initial}</span>
              <span className="ce-rt-name">{p.name}</span>
            </div>
          ))}
          <div className="ce-rt-seat ce-rt-seat-you">
            <span className="ce-rt-avatar">YOU</span>
            <span className="ce-rt-name">Candidate</span>
          </div>
        </div>

        <div className="ce-rt-transcript">
          <div className="ce-rt-speaker">Ananya Iyer (Leader · Speaking):</div>
          <p className="ce-rt-speech">
            &ldquo;While automated QA accelerates release speed, without peer review our technical debt multiplies rapidly...&rdquo;
          </p>
        </div>

        <div className="ce-rt-wave">
          {[4, 9, 6, 14, 8, 12, 5, 10, 6, 13, 7, 4].map((h, i) => (
            <span
              key={i}
              className="ce-rt-bar"
              style={{ height: `${h * 1.8}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DebatesVisual() {
  return (
    <div className="ce-inner ce-inner-debates">
      <div className="ce-debate-round">
        <div className="ce-motion-banner">
          <span className="ce-motion-badge">MOTION</span>
          <span className="ce-motion-text">Speed of Delivery vs. Architectural Stability</span>
        </div>

        <div className="ce-debate-side ce-side-pro">
          <div className="ce-side-head">
            <span className="ce-avatar-tag ce-tag-pro">R</span>
            <div className="ce-speaker-info">
              <strong>Rohan Verma</strong>
              <small>Proposition (Pro-Velocity)</small>
            </div>
            <span className="ce-verdict-pill ce-pill-pro">FOR</span>
          </div>
          <p className="ce-side-quote">
            &ldquo;Rapid production releases surface real failure modes faster than theoretical review cycles.&rdquo;
          </p>
        </div>

        <div className="ce-vs-divider">
          <span className="ce-vs-line" />
          <span className="ce-vs-badge">VS</span>
          <span className="ce-vs-line" />
        </div>

        <div className="ce-debate-side ce-side-con">
          <div className="ce-side-head">
            <span className="ce-avatar-tag ce-tag-con">P</span>
            <div className="ce-speaker-info">
              <strong>Priya Sharma</strong>
              <small>Opposition (Pro-Stability)</small>
            </div>
            <span className="ce-verdict-pill ce-pill-con">AGAINST</span>
          </div>
          <p className="ce-side-quote">
            &ldquo;Unbounded velocity compounds unvalidated debt, crippling enterprise reliability within quarters.&rdquo;
          </p>
        </div>

        <div className="ce-debate-floor-status">
          <span className="ce-floor-pulse" />
          <span>Floor open · Rebuttal cross-examination</span>
        </div>
      </div>
    </div>
  );
}

function PersonasVisual() {
  return (
    <div className="ce-inner ce-inner-ai">
      <div className="ce-ai-chat-card">
        <div className="ce-ai-bar">
          <div className="ce-ai-persona-info">
            <span className="ce-ai-spark-icon">
              <Sparkles size={13} />
            </span>
            <div>
              <strong>Karan Mehta</strong>
              <small>Aggressive Contrarian AI</small>
            </div>
          </div>
          <span className="ce-ai-active-pill">ACTIVE</span>
        </div>

        <div className="ce-ai-exchange">
          <div className="ce-ai-msg ce-ai-from-persona">
            <p>
              &ldquo;That plan sounds idealistic. But in a 20-minute discussion, how do you prevent the team from splintering on execution?&rdquo;
            </p>
          </div>

          <div className="ce-ai-suggested">
            <span className="ce-sug-label">RECOMMENDED INTERVENTION STRATEGY:</span>
            <div className="ce-sug-chips">
              <span>Acknowledge &amp; Pivot</span>
              <span>3-Step Framework</span>
            </div>
          </div>

          <div className="ce-ai-msg ce-ai-from-user">
            <p>&ldquo;Fair push, Karan. That&apos;s why we define the non-negotiables first, then assign modular ownership.&rdquo;</p>
          </div>
        </div>

        <div className="ce-ai-live-eval">
          <span>GD RUBRIC EVALUATION:</span>
          <strong>9.3 / 10 · High Composure Under Fire</strong>
        </div>
      </div>
    </div>
  );
}

function AnalyticsVisual() {
  return (
    <div className="ce-inner ce-inner-comms">
      <div className="ce-comms-dashboard">
        <div className="ce-comms-top">
          <div className="ce-comms-title">
            <Zap size={14} />
            <span>GD PERFORMANCE ANALYTICS</span>
          </div>
          <span className="ce-comms-badge">PLACEMENT READY</span>
        </div>

        <div className="ce-comms-grid">
          <div className="ce-comms-stat">
            <span className="ce-stat-lbl">TALK TIME SHARE</span>
            <strong className="ce-stat-val">18%</strong>
            <span className="ce-stat-sub">Optimal (15-20% in GD)</span>
          </div>
          <div className="ce-comms-stat">
            <span className="ce-stat-lbl">SPEAKING PACE</span>
            <strong className="ce-stat-val">142</strong>
            <span className="ce-stat-sub">Words per minute</span>
          </div>
          <div className="ce-comms-stat">
            <span className="ce-stat-lbl">FILLER WORDS</span>
            <strong className="ce-stat-val ce-good">0</strong>
            <span className="ce-stat-sub">Zero &lsquo;um&rsquo; / &lsquo;uh&rsquo; detected</span>
          </div>
          <div className="ce-comms-stat">
            <span className="ce-stat-lbl">RECRUITER SCORE</span>
            <strong className="ce-stat-val">9.4</strong>
            <span className="ce-stat-sub">Top 5% Placement Tier</span>
          </div>
        </div>

        <div className="ce-comms-spectrum">
          <div className="ce-spectrum-label">
            <span>VOICE MODULATION &amp; PITCH CONTOUR</span>
            <span>OPTIMAL GD ZONE</span>
          </div>
          <div className="ce-spectrum-bars">
            {[20, 35, 28, 55, 42, 70, 60, 85, 68, 75, 52, 60, 38, 48, 25].map((h, i) => (
              <span
                key={i}
                className="ce-spectrum-bar"
                style={{ height: `${h * 0.42}px` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const visuals: Record<string, () => JSX.Element> = {
  simulations: SimulationsVisual,
  debates: DebatesVisual,
  personas: PersonasVisual,
  analytics: AnalyticsVisual,
};

/* ─── Main Component ─────────────────────────────────────── */

export default function CreativeExperience() {
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const current = experiences[active];
  const CurrentIcon = current.icon;
  const Visual = visuals[current.id];

  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const handleNext = useCallback(() => {
    setActive((prev) => (prev + 1) % experiences.length);
  }, []);

  const handlePrev = useCallback(() => {
    setActive((prev) => (prev - 1 + experiences.length) % experiences.length);
  }, []);

  const handleSelect = (index: number) => {
    setActive(index);
  };

  // Auto-cycling timer: advances every DURATION_MS when not paused or hovered
  useEffect(() => {
    if (isPaused || isHovered) return;

    const timer = setInterval(() => {
      handleNext();
    }, DURATION_MS);

    return () => clearInterval(timer);
  }, [isPaused, isHovered, handleNext, active]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const tabs = tabsRef.current;
    const stage = stageRef.current;

    if (!section || !header || !tabs || !stage) return;

    const ctx = gsap.context(() => {
      const words = header.querySelectorAll(".reveal-word");

      gsap.from(words, {
        yPercent: 110,
        opacity: 0,
        rotate: 2,
        duration: 0.8,
        stagger: 0.08,
        ease: "power4.out",
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          once: true,
        },
      });

      gsap.from(header.querySelectorAll(".header-animate"), {
        y: 20,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          once: true,
        },
      });

      gsap.from(stage, {
        scale: 0.94,
        opacity: 0,
        y: 25,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          once: true,
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="creative-experience features-2-section"
      id="practice"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="section-wrap features-2-container">
        {/* SECTION HEADER */}
        <div ref={headerRef} className="features-2-header">
          <div className="features-badge header-animate">
            <span className="features-badge-dot" />
            <span className="features-badge-text">PRACTICE BEFORE IT COUNTS</span>
          </div>

          <h2 className="staggered-heading">
            <span className="word-mask">
              <span className="reveal-word">Every</span>
            </span>{" "}
            <span className="word-mask">
              <span className="reveal-word">room</span>
            </span>{" "}
            <span className="word-mask">
              <span className="reveal-word">has</span>
            </span>{" "}
            <span className="word-mask">
              <span className="reveal-word">a</span>
            </span>{" "}
            <span className="word-mask">
              <span className="reveal-word accent-word">way</span>
            </span>{" "}
            <span className="word-mask">
              <span className="reveal-word accent-word">in.</span>
            </span>
          </h2>

          <p className="features-header-sub header-animate">
            Because knowing what to say isn&apos;t enough. You need to say it when it matters.
          </p>
        </div>

        {/* TWO-COLUMN LAYOUT */}
        <div className="features-2-grid">
          {/* LEFT COLUMN: AUTO-CYCLING FEATURE LIST (4 MAJOR GD TABS) */}
          <div className="features-list-col">
            <div
              ref={tabsRef}
              className="feature-tabs"
              role="tablist"
              aria-label="Group discussion features carousel"
            >
              {experiences.map((exp, index) => {
                const Icon = exp.icon;
                const isActive = index === active;

                return (
                  <button
                    key={exp.id}
                    type="button"
                    role="tab"
                    id={`feature-tab-${exp.id}`}
                    aria-selected={isActive}
                    aria-controls={`feature-panel-${exp.id}`}
                    tabIndex={isActive ? 0 : -1}
                    className={`feature-tab-item ${isActive ? "active" : ""} ${isPaused || isHovered ? "is-paused" : ""
                      }`}
                    style={
                      {
                        "--item-theme": exp.themeColor,
                        "--item-glow": exp.themeGlow,
                        "--item-pastel": exp.themePastel,
                        "--item-text": exp.themeText,
                      } as React.CSSProperties
                    }
                    onClick={() => handleSelect(index)}
                  >
                    <div className="feature-tab-top">
                      <span className="feature-tab-num">{exp.number}</span>

                      <div className="feature-tab-icon-wrap">
                        <Icon size={18} className="feature-tab-icon" />
                      </div>

                      <div className="feature-tab-text">
                        <span className="feature-tab-title">{exp.label}</span>
                        <p className="feature-tab-desc">{exp.body}</p>
                      </div>

                      <ArrowUpRight size={18} className="feature-tab-arrow" />
                    </div>

                    {/* AUTO-CYCLING PROGRESS BAR */}
                    {isActive && (
                      <div className="feature-tab-progress-track">
                        <div
                          key={`progress-${active}-${isHovered ? "paused" : "running"}`}
                          className="feature-tab-progress-bar"
                          style={{
                            animationDuration: `${DURATION_MS}ms`,
                            backgroundColor: exp.themeColor,
                          }}
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: SHOWCASE STAGE & ANIMATED GLASS OVERLAYS */}
          <div className="features-stage-col" ref={stageRef}>
            <div
              className="stage-container"
              style={
                {
                  "--stage-theme": current.themeColor,
                  "--stage-glow": current.themeGlow,
                  "--stage-pastel": current.themePastel,
                  "--stage-text": current.themeText,
                } as React.CSSProperties
              }
            >
              {/* DYNAMIC AMBIENT BACKGLOW */}
              <div
                className="stage-ambient-glow"
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${current.themeGlow} 0%, rgba(0,0,0,0) 70%)`,
                }}
              />

              {/* TOP ANIMATED GLASS OVERLAY BADGE */}
              <div className="glass-overlay glass-overlay-top">
                <div className="glass-overlay-glow-dot" style={{ backgroundColor: current.themeColor }} />
                <div className="glass-overlay-badge-content">
                  <span className="glass-badge-tag">{current.overlayBadge.tag}</span>
                  <div className="glass-badge-row">
                    <span className="glass-badge-main">{current.overlayBadge.text}</span>
                    <span
                      className="glass-badge-pill"
                      style={{
                        backgroundColor: current.themePastel,
                        color: current.themeText,
                        borderColor: current.themeColor,
                      }}
                    >
                      {current.overlayBadge.highlight}
                    </span>
                  </div>
                </div>
              </div>

              {/* MAIN SHOWCASE CARD */}
              <div
                id={`feature-panel-${current.id}`}
                role="tabpanel"
                aria-labelledby={`feature-tab-${current.id}`}
                className={`stage-card stage-card-${current.id}`}
              >
                {/* STAGE HEADER BAR */}
                <div className="stage-topbar">
                  <div className="stage-window-dots">
                    <span className="window-dot dot-red" />
                    <span className="window-dot dot-yellow" />
                    <span className="window-dot dot-green" />
                  </div>

                  <div className="stage-topbar-title">
                    <CurrentIcon size={14} style={{ color: current.themeColor }} />
                    <span>{current.label}</span>
                  </div>

                  <span className="stage-status-live">
                    <span className="live-ping" style={{ backgroundColor: current.themeColor }} />
                    ACTIVE
                  </span>
                </div>

                {/* VISUAL DISPLAY WITH ANIMATED KEY */}
                <div className="stage-screen" key={current.id}>
                  {Visual && <Visual />}
                </div>

                {/* BOTTOM CAPTION BAR */}
                <div className="stage-bottom-bar">
                  <div className="stage-caption-info">
                    <span className="stage-caption-sub">GD FOCUS AREA</span>
                    <strong className="stage-caption-heading">{current.title}</strong>
                  </div>

                  <span className="stage-index-badge">
                    {current.number} / 04
                  </span>
                </div>
              </div>

              {/* BOTTOM ANIMATED GLASS OVERLAY SCORE CARD */}
              <div className="glass-overlay glass-overlay-bottom">
                <div className="glass-score-header">
                  <div className="glass-score-badge">
                    <Star size={13} className="star-icon" />
                    <strong>{current.overlayScore.score}</strong>
                    <small>/ 10</small>
                  </div>
                  <span className="glass-score-label">{current.overlayScore.label}</span>
                </div>

                <p className="glass-score-quote">&ldquo;{current.overlayScore.quote}&rdquo;</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}