"use client";

import { useEffect, useRef, type ReactElement } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Check,
  GraduationCap,
  MessageCircle,
  Mic2,
  Sparkles,
  Users,
} from "lucide-react";

const institutionFeatures = [
  {
    id: "campus",
    label: "Campus-wide practice",
    title: "More voices. Better outcomes.",
    body: "Give every learner a repeatable place to practice participation.",
    icon: Users,
    tone: "green",
    size: "wide",
  },
  {
    id: "placement",
    label: "Placement readiness",
    title: "Ready for the room.",
    body: "Turn interview nerves into small, useful rehearsals.",
    icon: GraduationCap,
    tone: "yellow",
    size: "tall",
  },
  {
    id: "ai",
    label: "AI practice",
    title: "A sparring partner for thinking.",
    body: "Practice with personas that ask better follow-ups.",
    icon: Sparkles,
    tone: "peach",
    size: "square",
  },
  {
    id: "interviews",
    label: "Mock interviews",
    title: "Rehearse the real thing.",
    body: "Build clear stories and handle the next question.",
    icon: Mic2,
    tone: "ink",
    size: "square",
  },
  {
    id: "discussions",
    label: "Group discussions",
    title: "Find your way in.",
    body: "Make a point, listen well, and move the room forward.",
    icon: MessageCircle,
    tone: "green",
    size: "square",
  },
  {
    id: "presentations",
    label: "Presentation practice",
    title: "Make the thread clear.",
    body: "Shape your thinking before the stakes are real.",
    icon: BarChart3,
    tone: "yellow",
    size: "wide",
  },
  {
    id: "insights",
    label: "Student insights",
    title: "Progress you can point to.",
    body: "See participation and confidence grow across cohorts.",
    icon: BarChart3,
    tone: "peach",
    size: "wide",
  },
];

/* ─── Visual Components ─────────────────────────────────── */

function CampusVisual() {
  const dots = [
    [false, true, false, false, true, false],
    [true, false, false, true, false, true],
    [false, false, true, false, true, false],
    [true, false, false, true, false, false],
  ];
  return (
    <div className="ib-visual ib-visual-campus">
      <div className="ib-campus-dots">
        {dots.map((row, ri) =>
          row.map((active, ci) => (
            <span
              key={`${ri}-${ci}`}
              className={`ib-campus-dot ${active ? "ib-campus-dot-active" : ""}`}
            />
          ))
        )}
      </div>
      <div className="ib-campus-stat">
        <span className="ib-campus-pulse" />
        847 learners active
      </div>
    </div>
  );
}

function PlacementVisual() {
  const steps = [
    { label: "Choose GD Topic", done: true },
    { label: "Structure Framework", done: true },
    { label: "Roundtable Session", done: false, active: true },
    { label: "Scorecard & Analysis", done: false },
  ];
  return (
    <div className="ib-visual ib-visual-placement">
      <div className="ib-placement-steps">
        {steps.map((s) => (
          <div
            key={s.label}
            className={`ib-placement-step${s.done ? " done" : ""}${s.active ? " active" : ""}`}
          >
            <span className="ib-step-dot">
              {s.done && <Check size={10} />}
            </span>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
      <div className="ib-placement-progress">
        <div className="ib-placement-bar">
          <span style={{ width: "65%" }} />
        </div>
        <span className="ib-placement-val">65% Readiness</span>
      </div>
    </div>
  );
}

function AiVisual() {
  return (
    <div className="ib-visual ib-visual-ai">
      <div className="ib-ai-pill">
        <span className="ib-ai-dot" />
        <span className="ib-ai-name">Ananya (AI)</span>
        <span className="ib-ai-tag">Active</span>
      </div>
      <div className="ib-ai-mini-wave">
        <i /><i /><i /><i /><i />
      </div>
    </div>
  );
}

function InterviewsVisual() {
  return (
    <div className="ib-visual ib-visual-interviews">
      <div className="ib-iv-tag">
        <span className="ib-iv-rec-dot" />
        <span>LIVE STT · 120ms</span>
      </div>
      <div className="ib-iv-bars">
        {[8, 16, 11, 20, 14, 17, 9].map((h, i) => (
          <span key={i} className="ib-iv-bar" style={{ height: `${h}px` }} />
        ))}
      </div>
    </div>
  );
}

function DiscussionsVisual() {
  return (
    <div className="ib-visual ib-visual-discussions">
      <div className="ib-disc-avatar-stack">
        <span className="ib-disc-av ib-disc-av-1">A</span>
        <span className="ib-disc-av ib-disc-av-2">R</span>
        <span className="ib-disc-av ib-disc-av-3">P</span>
      </div>
      <div className="ib-disc-status">
        <span className="ib-disc-pulse" />
        <span>Roundtable · Turn 4</span>
      </div>
    </div>
  );
}

function PresentationsVisual() {
  return (
    <div className="ib-visual ib-visual-presentations">
      <div className="ib-slide">
        <div className="ib-slide-title">System Resilience</div>
        <div className="ib-slide-bullets">
          <span>1. Observability frame</span>
          <span className="ib-slide-active">2. Graceful degradation →</span>
        </div>
        <div className="ib-slide-footer">
          <span className="ib-slide-dot" />
          <span className="ib-slide-dot ib-slide-dot-active" />
          <span className="ib-slide-dot" />
        </div>
      </div>
    </div>
  );
}

function InsightsVisual() {
  const bars = [
    { label: "Sep", h: 18 },
    { label: "Oct", h: 28 },
    { label: "Nov", h: 34 },
    { label: "Dec", h: 42 },
    { label: "Jan", h: 54 },
  ];
  return (
    <div className="ib-visual ib-visual-insights">
      <div className="ib-insights-chart">
        {bars.map((b, i) => (
          <div key={b.label} className="ib-insights-col">
            <span
              className={`ib-insights-bar${i === bars.length - 1 ? " last" : ""}`}
              style={{ height: `${b.h}px` }}
            />
            <span className="ib-insights-label">{b.label}</span>
          </div>
        ))}
      </div>
      <div className="ib-insights-stat">
        <strong>+53%</strong> cohort participation
      </div>
    </div>
  );
}

const visuals: Record<string, () => ReactElement> = {
  campus: CampusVisual,
  placement: PlacementVisual,
  ai: AiVisual,
  interviews: InterviewsVisual,
  discussions: DiscussionsVisual,
  presentations: PresentationsVisual,
  insights: InsightsVisual,
};

/* ─── Main Component ─────────────────────────────────────── */

export default function InstitutionsBento() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const cards = Array.from(
      root.querySelectorAll<HTMLElement>("[data-bento-card]")
    );

    if (reduceMotion) {
      cards.forEach((card) => card.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          cards.forEach((card, index) =>
            window.setTimeout(
              () => card.classList.add("is-visible"),
              index * 75
            )
          );
          observer.disconnect();
        }
      },
      { threshold: 0.16 }
    );
    observer.observe(root);

    const onPointerMove = (event: PointerEvent) => {
      if (window.innerWidth <= 720) return;
      const bounds = root.getBoundingClientRect();
      const pointerX = event.clientX - bounds.left;
      const pointerY = event.clientY - bounds.top;
      cards.forEach((card) => {
        const cardBounds = card.getBoundingClientRect();
        const centerX = cardBounds.left - bounds.left + cardBounds.width / 2;
        const centerY = cardBounds.top - bounds.top + cardBounds.height / 2;
        const distance = Math.hypot(pointerX - centerX, pointerY - centerY);
        const influence = Math.max(0, 1 - distance / 430);
        const moveX = (pointerX - centerX) * influence * 0.018;
        const moveY = (pointerY - centerY) * influence * 0.018;
        card.style.setProperty("--pointer-x", `${moveX}px`);
        card.style.setProperty("--pointer-y", `${moveY}px`);
      });
    };

    const clearPointer = () =>
      cards.forEach((card) => {
        card.style.setProperty("--pointer-x", "0px");
        card.style.setProperty("--pointer-y", "0px");
      });

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("blur", clearPointer);

    return () => {
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", clearPointer);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="institution-bento"
      aria-label="Institution capabilities"
    >
      <div className="institution-bento-grid">
        {institutionFeatures.map((feature) => {
          const Icon = feature.icon;
          const Visual = visuals[feature.id];
          return (
            <article
              key={feature.id}
              className={`institution-bento-card institution-bento-${feature.size} institution-bento-${feature.tone}`}
              data-bento-card
            >
              {Visual && <Visual />}
              <div className="institution-bento-card-top">
                <span>{feature.label}</span>
                <Icon size={16} />
              </div>
              <div className="institution-bento-card-bottom">
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
                <a
                  href="#how-it-works"
                  aria-label={`Explore ${feature.label}`}
                >
                  <ArrowUpRight size={16} />
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
