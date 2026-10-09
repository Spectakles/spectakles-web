"use client";

import {
  useLayoutEffect,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";

import {
  ArrowUpRight,
  Check,
  MessageCircle,
  Mic2,
  Presentation,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const experiences = [
  {
    id: "discussions",
    number: "01",
    label: "Group discussions",
    title: "Find your way into the room.",
    body: "Practice making a point, listening closely, and helping the conversation move.",
    icon: Users,
  },
  {
    id: "interviews",
    number: "02",
    label: "Mock interviews",
    title: "Rehearse the real thing.",
    body: "Try follow-ups, sharpen your stories, and leave with a clear next step.",
    icon: Mic2,
  },
  {
    id: "presentations",
    number: "03",
    label: "Presentations",
    title: "Make the thread easy to follow.",
    body: "Build a strong point of view and deliver it with the calm of practice behind you.",
    icon: Presentation,
  },
  {
    id: "debates",
    number: "04",
    label: "Debates",
    title: "Challenge ideas, not people.",
    body: "Learn to disagree with clarity, curiosity, and enough structure to stay generous.",
    icon: MessageCircle,
  },
  {
    id: "ai",
    number: "05",
    label: "AI practice",
    title: "A sparring partner for your thinking.",
    body: "Meet personas that ask better follow-ups and give feedback you can use immediately.",
    icon: Sparkles,
  },
  {
    id: "comms",
    number: "06",
    label: "Communication skills",
    title: "Small reps. Visible progress.",
    body: "Turn one brave sentence into a habit that travels with you beyond campus.",
    icon: Zap,
  },
];

/* ─── Centered Thematic Visuals for Each Experience ──────── */

function DiscussionsVisual() {
  const personas = [
    { name: "Ananya", role: "Leader", initial: "A", active: true },
    { name: "Rohan", role: "Contrarian", initial: "R", active: false },
    { name: "Priya", role: "Mediator", initial: "P", active: false },
    { name: "Aarav", role: "Analyst", initial: "Aa", active: false },
  ];

  return (
    <div className="ce-inner ce-inner-discussions">
      <div className="ce-roundtable-box">
        <div className="ce-rt-top-bar">
          <span className="ce-rt-dot-live" />
          <span>5-CANDIDATE ROUNDTABLE</span>
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
          <div className="ce-rt-speaker">Ananya Iyer (Speaking):</div>
          <p className="ce-rt-speech">
            "To hit that target, we must balance automated CI tests with manual validation..."
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

function InterviewsVisual() {
  return (
    <div className="ce-inner ce-inner-interviews">
      <div className="ce-interview-card">
        <div className="ce-iv-header">
          <span className="ce-rec-dot" />
          <span>MOCK INTERVIEW · LIVE STT</span>
          <span className="ce-iv-timer">03:42</span>
        </div>

        <div className="ce-iv-bubble ce-iv-q">
          <div className="ce-iv-role">INTERVIEWER (AI PANEL)</div>
          <p>"Walk me through a time you resolved a major production incident under tight SLA pressure."</p>
        </div>

        <div className="ce-iv-bubble ce-iv-a">
          <div className="ce-iv-role">YOU (CANDIDATE)</div>
          <p>"I immediately isolated the canary instance, reviewed crash traces, and rolled back within 4 minutes."</p>
        </div>

        <div className="ce-iv-metrics">
          <div className="ce-iv-metric">
            <span>PACE</span>
            <strong>138 WPM</strong>
          </div>
          <div className="ce-iv-metric">
            <span>CLARITY</span>
            <strong>9.2/10</strong>
          </div>
          <div className="ce-iv-metric">
            <span>FILLERS</span>
            <strong className="ce-good">0 DETECTED</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function PresentationsVisual() {
  return (
    <div className="ce-inner ce-inner-presentations">
      <div className="ce-presentation-card">
        <div className="ce-pres-slide">
          <div className="ce-pres-slide-header">
            <span className="ce-pres-slide-num">SLIDE 03</span>
            <span className="ce-pres-slide-topic">SYSTEM ARCHITECTURE</span>
          </div>

          <h4 className="ce-pres-slide-title">The Three Pillars of Resilience</h4>

          <div className="ce-pres-points">
            <div className="ce-pres-point">
              <span className="ce-point-num">1</span>
              <span>Observability-First Monitoring</span>
            </div>
            <div className="ce-pres-point">
              <span className="ce-point-num">2</span>
              <span>Graceful Circuit Degradation</span>
            </div>
            <div className="ce-pres-point ce-pres-point-active">
              <span className="ce-point-num">3</span>
              <span>Automated Regional Failover →</span>
            </div>
          </div>

          <div className="ce-pres-dots">
            <span />
            <span />
            <span className="active" />
            <span />
          </div>
        </div>

        <div className="ce-pres-feedback">
          <Check size={12} />
          <span>Clear structural framing · Strong audience engagement</span>
        </div>
      </div>
    </div>
  );
}

function DebatesVisual() {
  return (
    <div className="ce-inner ce-inner-debates">
      <div className="ce-debate-round">
        {/* Motion header */}
        <div className="ce-motion-banner">
          <span className="ce-motion-badge">MOTION</span>
          <span className="ce-motion-text">Speed of Delivery vs. Architectural Stability</span>
        </div>

        {/* Side A: Proposition */}
        <div className="ce-debate-side ce-side-pro">
          <div className="ce-side-head">
            <span className="ce-avatar-tag ce-tag-pro">R</span>
            <div className="ce-speaker-info">
              <strong>Rohan Verma</strong>
              <small>Proposition</small>
            </div>
            <span className="ce-verdict-pill ce-pill-pro">FOR</span>
          </div>
          <p className="ce-side-quote">
            "Rapid production releases surface real failure modes faster than theoretical review cycles."
          </p>
        </div>

        {/* Centered VS divider */}
        <div className="ce-vs-divider">
          <span className="ce-vs-line" />
          <span className="ce-vs-badge">VS</span>
          <span className="ce-vs-line" />
        </div>

        {/* Side B: Opposition */}
        <div className="ce-debate-side ce-side-con">
          <div className="ce-side-head">
            <span className="ce-avatar-tag ce-tag-con">P</span>
            <div className="ce-speaker-info">
              <strong>Priya Sharma</strong>
              <small>Opposition</small>
            </div>
            <span className="ce-verdict-pill ce-pill-con">AGAINST</span>
          </div>
          <p className="ce-side-quote">
            "Unbounded velocity compounds unvalidated debt, crippling enterprise reliability within quarters."
          </p>
        </div>

        {/* Status bar */}
        <div className="ce-debate-floor-status">
          <span className="ce-floor-pulse" />
          <span>Floor open · Rebuttal cross-examination</span>
        </div>
      </div>
    </div>
  );
}

function AiVisual() {
  return (
    <div className="ce-inner ce-inner-ai">
      <div className="ce-ai-chat-card">
        <div className="ce-ai-bar">
          <div className="ce-ai-persona-info">
            <span className="ce-ai-spark-icon">
              <Sparkles size={13} />
            </span>
            <div>
              <strong>Ananya Iyer</strong>
              <small>Strategic Leader AI Persona</small>
            </div>
          </div>
          <span className="ce-ai-active-pill">ACTIVE</span>
        </div>

        <div className="ce-ai-exchange">
          <div className="ce-ai-msg ce-ai-from-persona">
            <p>
              "You raised a strong point regarding cost-efficiency. But how do you reconcile that with team burnout during peak quarters?"
            </p>
          </div>

          <div className="ce-ai-suggested">
            <span className="ce-sug-label">SUGGESTED COUNTER-STRATEGY:</span>
            <div className="ce-sug-chips">
              <span>PESTLE: Internal Capacity</span>
              <span>Two-Way Door Decisions</span>
            </div>
          </div>

          <div className="ce-ai-msg ce-ai-from-user">
            <p>"We structure sustainable sprint cadences and automate repetitive manual QA."</p>
          </div>
        </div>

        <div className="ce-ai-live-eval">
          <span>RUBRIC SCORE:</span>
          <strong>9.0 / 10 · High Analytical Depth</strong>
        </div>
      </div>
    </div>
  );
}

function CommsVisual() {
  return (
    <div className="ce-inner ce-inner-comms">
      <div className="ce-comms-dashboard">
        <div className="ce-comms-top">
          <div className="ce-comms-title">
            <Zap size={14} />
            <span>COMMUNICATION ANALYTICS</span>
          </div>
          <span className="ce-comms-badge">PLACEMENT READY</span>
        </div>

        <div className="ce-comms-grid">
          <div className="ce-comms-stat">
            <span className="ce-stat-lbl">CADENCE</span>
            <strong className="ce-stat-val">142</strong>
            <span className="ce-stat-sub">Words per min</span>
          </div>
          <div className="ce-comms-stat">
            <span className="ce-stat-lbl">CLARITY</span>
            <strong className="ce-stat-val">94%</strong>
            <span className="ce-stat-sub">Articulation</span>
          </div>
          <div className="ce-comms-stat">
            <span className="ce-stat-lbl">FILLERS</span>
            <strong className="ce-stat-val ce-good">0</strong>
            <span className="ce-stat-sub">Zero 'um' / 'uh'</span>
          </div>
          <div className="ce-comms-stat">
            <span className="ce-stat-lbl">CONFIDENCE</span>
            <strong className="ce-stat-val">9.1</strong>
            <span className="ce-stat-sub">Out of 10</span>
          </div>
        </div>

        <div className="ce-comms-spectrum">
          <div className="ce-spectrum-label">
            <span>VOICE FREQUENCY & MODULATION</span>
            <span>OPTIMAL RANGE</span>
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

const visuals: Record<string, () => ReactElement> = {
  discussions: DiscussionsVisual,
  interviews: InterviewsVisual,
  presentations: PresentationsVisual,
  debates: DebatesVisual,
  ai: AiVisual,
  comms: CommsVisual,
};

/* ─── Main Component ─────────────────────────────────────── */

export default function CreativeExperience() {
  const [active, setActive] = useState(0);

  const current = experiences[active];
  const CurrentIcon = current.icon;
  const Visual = visuals[current.id];

  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const heading = headingRef.current;
    const visual = visualRef.current;
    const list = listRef.current;

    if (!section || !heading || !visual || !list) return;

    const ctx = gsap.context(() => {
      const words = heading.querySelectorAll(".reveal-word");
      const listItems = list.querySelectorAll(".creative-service");

      gsap.from(words, {
        yPercent: 110,
        opacity: 0,
        rotate: 2,
        duration: 0.8,
        stagger: 0.08,
        ease: "power4.out",
        scrollTrigger: {
          trigger: section,
          start: "top 78%",
          toggleActions: "restart none restart none",
        },
      });

      gsap.from(
        heading.querySelectorAll(".creative-heading-extra"),
        {
          y: 25,
          opacity: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 78%",
            toggleActions: "play none none reverse",
          },
        }
      );

      gsap.from(visual, {
        clipPath: "inset(18% 12% 18% 12% round 24px)",
        scale: 0.88,
        opacity: 0,
        rotateX: 5,
        transformPerspective: 1000,
        duration: 1.2,
        ease: "power4.out",
        scrollTrigger: {
          trigger: section,
          start: "top 82%",
          toggleActions: "restart none restart none",
        },
      });

      gsap.from(listItems, {
        y: 35,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 75%",
          toggleActions: "restart none restart none",
        },
      });

      gsap.to(visual, {
        y: -35,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="creative-experience"
      id="practice"
    >
      <div className="section-wrap creative-experience-inner">

        {/* LEFT CONTENT */}

        <div
          ref={headingRef}
          className="creative-heading"
        >
          <p className="eyebrow creative-heading-extra">
            Practice, in motion
          </p>

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
              <span className="reveal-word accent-word">
                way
              </span>
            </span>{" "}

            <span className="word-mask">
              <span className="reveal-word accent-word">
                in.
              </span>
            </span>
          </h2>

          <p className="creative-heading-extra">
            Choose a moment to work on. Spectakles gives you
            a low-pressure place to try it, understand it,
            and come back better.
          </p>
        </div>

        {/* RIGHT CONTENT */}

        <div className="creative-story">

          {/* VISUAL CARD */}

          <div className="creative-visual-wrap">
            <div className="creative-portal-frame">
              <div className="creative-portal-frame-inner" />
            </div>
            <div
              ref={visualRef}
              className={`creative-visual creative-visual-${current.id}`}
              role="img"
              aria-label={`${current.label} illustration`}
            >
              {Visual && <Visual />}

              <div className="creative-visual-label">
                <CurrentIcon size={16} />
                {current.label}
              </div>

              <span className="creative-visual-index">
                {current.number} / 06
              </span>
            </div>

            <div className="creative-visual-caption">
              <span>Now exploring</span>

              <strong key={current.number}>
                {current.title}
              </strong>
            </div>
          </div>

          {/* PRACTICE LIST */}

          <div
            ref={listRef}
            className="creative-service-list"
            role="list"
          >
            {experiences.map((experience, index) => {
              const Icon = experience.icon;

              return (
                <button
                  key={experience.number}
                  type="button"
                  className={
                    index === active
                      ? "creative-service active"
                      : "creative-service"
                  }
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  onClick={() => setActive(index)}
                  role="listitem"
                  aria-current={
                    index === active ? "step" : undefined
                  }
                >
                  <span className="creative-service-number">
                    {experience.number}
                  </span>

                  <span className="creative-service-copy">
                    <strong>{experience.label}</strong>
                    <small>{experience.body}</small>
                  </span>

                  <Icon
                    size={17}
                    className="creative-service-icon"
                  />

                  <ArrowUpRight
                    size={17}
                    className="creative-service-arrow"
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}