import { useEffect, useRef } from "react";
import {
  ArrowRight,
  BarChart3,
  Check,
  GraduationCap,
  MessageCircle,
  Mic2,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import "./InstitutionsBento.css";

const institutionFeatures = [
  {
    id: "campus",
    label: "Why Spectakles",
    title: "Because silence doesn't get you noticed.",
    body: "Being smart isn't enough. Your ideas deserve a voice.",
    icon: Users,
    tone: "green",
    size: "wide",
  },
  {
    id: "placement",
    label: "Placement practice",
    title: "Train before it counts.",
    body: "Placement day isn't practice. Make practice count.",
    icon: GraduationCap,
    tone: "yellow",
    size: "tall",
  },
  {
    id: "ai",
    label: "AI personas",
    title: "Never practice alone.",
    body: "Meet your toughest conversation yet.",
    icon: Sparkles,
    tone: "peach",
    size: "square",
  },
  {
    id: "interviews",
    label: "Mock interviews",
    title: "Hard questions. Better answers.",
    body: "Practice before they ask.",
    icon: Mic2,
    tone: "ink",
    size: "square",
  },
  {
    id: "discussions",
    label: "Real-time GDs",
    title: "Think on your feet.",
    body: "Don't just join the GD. Own your moment.",
    icon: MessageCircle,
    tone: "green",
    size: "square",
  },
  {
    id: "presentations",
    label: "Presentations",
    title: "All eyes on you. Now speak.",
    body: "Own the room with confidence.",
    icon: BarChart3,
    tone: "yellow",
    size: "wide",
  },
  {
    id: "insights",
    label: "Performance insights",
    title: "See where you improve.",
    body: "Know how you sound.",
    icon: TrendingUp,
    tone: "peach",
    size: "full",
  },
];

/* ─── Visual Components with Lively High-Visibility Animations ──────────── */

function CampusVisual() {
  const dots = [
    [false, true, false, true, false, true, false, true],
    [true, false, true, false, true, false, true, false],
    [false, true, false, true, false, true, false, true],
    [true, false, false, true, false, false, true, false],
  ];
  return (
    <div className="ib-visual ib-visual-campus">
      <div className="ib-campus-radar-wrap">
        <span className="ib-radar-ripple ring-1" />
        <span className="ib-radar-ripple ring-2" />
        <span className="ib-radar-ripple ring-3" />
        <div className="ib-campus-sweep-line" />
        <div className="ib-campus-dots">
          {dots.map((row, ri) =>
            row.map((active, ci) => (
              <span
                key={`${ri}-${ci}`}
                className={`ib-campus-dot ${active ? "ib-campus-dot-active" : ""}`}
                style={{
                  animationDelay: `${(ri * 8 + ci) * 0.09}s`,
                }}
              />
            ))
          )}
        </div>
      </div>

      <div className="ib-campus-stat">
        <div className="ib-campus-pulse-beacon">
          <span className="ib-campus-pulse-dot" />
          <span className="ib-campus-pulse-ring" />
        </div>
        <span className="ib-campus-stat-text">847 active voices</span>
        <div className="ib-campus-live-equalizer">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

function PlacementVisual() {
  const steps = [
    { label: "Choose GD Topic", done: true },
    { label: "Structure Framework", done: true },
    { label: "Roundtable Session", done: false, active: true },
    { label: "Recruiter Scorecard", done: false },
  ];
  return (
    <div className="ib-visual ib-visual-placement">
      <div className="ib-placement-panel">
        <div className="ib-placement-badge">
          <span className="ib-placement-live-indicator" />
          <span>Milestone 3 of 4 · Live</span>
        </div>

        <div className="ib-placement-steps">
          {steps.map((s, index) => (
            <div
              key={s.label}
              className={`ib-placement-step${s.done ? " done" : ""}${s.active ? " active" : ""}`}
              style={{ animationDelay: `${index * 0.12}s` }}
            >
              <span className="ib-step-dot">
                {s.done ? (
                  <Check size={12} strokeWidth={2.8} />
                ) : s.active ? (
                  <span className="ib-step-dot-active-core" />
                ) : null}
              </span>
              <span className="ib-step-label">{s.label}</span>
              {s.active && (
                <span className="ib-step-live-pill">
                  <span className="ib-step-live-ping" />
                  LIVE NOW
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="ib-placement-progress">
          <div className="ib-placement-progress-header">
            <span className="ib-placement-val">65% Readiness Score</span>
            <span className="ib-placement-pill">Top 5% Cohort</span>
          </div>
          <div className="ib-placement-bar">
            <span style={{ width: "65%" }}>
              <span className="ib-placement-bar-sparkle" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AiVisual() {
  return (
    <div className="ib-visual ib-visual-ai">
      <div className="ib-ai-pill">
        <div className="ib-ai-dot-wrap">
          <span className="ib-ai-dot" />
          <span className="ib-ai-ring" />
          <span className="ib-ai-ring ring-2" />
        </div>
        <span className="ib-ai-name">Ananya (AI)</span>
        <span className="ib-ai-tag">Speaking</span>
      </div>

      <div className="ib-ai-equalizer">
        {[14, 32, 44, 22, 48, 28, 40, 20, 36, 16].map((h, i) => (
          <span
            key={i}
            className={`ib-ai-bar ib-ai-bar-${(i % 4) + 1}`}
            style={{
              height: `${h}px`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>

      <div className="ib-ai-prompt-ticker">
        <span className="ib-ai-ticker-dot" />
        <span>Analyzing counter-argument</span>
        <span className="ib-ai-typing-cursor">|</span>
      </div>
    </div>
  );
}

function InterviewsVisual() {
  return (
    <div className="ib-visual ib-visual-interviews">
      <div className="ib-iv-top-row">
        <div className="ib-iv-tag">
          <div className="ib-iv-rec-wrap">
            <span className="ib-iv-rec-dot" />
            <span className="ib-iv-rec-ring" />
          </div>
          <span className="ib-iv-rec-label">REC · LIVE STT</span>
        </div>
        <span className="ib-iv-latency">⚡ 120ms</span>
      </div>

      <div className="ib-iv-bars">
        {[14, 30, 22, 42, 26, 46, 20, 36, 18, 32, 14].map((h, i) => (
          <span
            key={i}
            className={`ib-iv-bar ib-iv-bar-${(i % 3) + 1}`}
            style={{
              height: `${h}px`,
              animationDelay: `${i * 0.09}s`,
            }}
          >
            <span className="ib-iv-bar-cap" />
          </span>
        ))}
      </div>

      <div className="ib-iv-clarity-badge">
        <span>Clarity Score: 94%</span>
        <div className="ib-iv-clarity-live-dot" />
      </div>
    </div>
  );
}

function DiscussionsVisual() {
  return (
    <div className="ib-visual ib-visual-discussions">
      <div className="ib-disc-stage">
        <div className="ib-disc-avatar-stack">
          <div className="ib-disc-av-wrap is-speaking">
            <span className="ib-disc-av ib-disc-av-1">A</span>
            <span className="ib-disc-sound-ring ring-1" />
            <span className="ib-disc-sound-ring ring-2" />
            <div className="ib-disc-speaking-indicator">
              <span />
              <span />
              <span />
            </div>
          </div>
          <span className="ib-disc-av ib-disc-av-2">R</span>
          <span className="ib-disc-av ib-disc-av-3">P</span>
        </div>

        <div className="ib-disc-status">
          <span className="ib-disc-pulse" />
          <span>Turn 4/6 · 45s</span>
        </div>
      </div>
    </div>
  );
}

function PresentationsVisual() {
  return (
    <div className="ib-visual ib-visual-presentations">
      <div className="ib-slide">
        <div className="ib-slide-laser-dot" />
        <div className="ib-slide-header">
          <div className="ib-slide-title">System Resilience</div>
          <span className="ib-slide-badge">Slide 2 of 5</span>
        </div>
        <div className="ib-slide-bullets">
          <span className="ib-slide-bullet-item">1. Observability frame</span>
          <span className="ib-slide-active">
            <span className="ib-slide-active-dot" />
            2. Graceful degradation
            <span className="ib-slide-arrow">→</span>
          </span>
        </div>
        <div className="ib-slide-footer">
          <div className="ib-slide-dots">
            <span className="ib-slide-dot" />
            <span className="ib-slide-dot ib-slide-dot-active" />
            <span className="ib-slide-dot" />
            <span className="ib-slide-dot" />
          </div>
          <div className="ib-slide-reactions">
            <span className="ib-slide-reaction-chip">👏 18</span>
            <span className="ib-slide-reaction-chip">💡 8</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightsVisual() {
  const bars = [
    { label: "Sep", h: 28 },
    { label: "Oct", h: 42 },
    { label: "Nov", h: 56 },
    { label: "Dec", h: 70 },
    { label: "Jan", h: 86 },
  ];
  return (
    <div className="ib-visual ib-visual-insights">
      <div className="ib-insights-target-line">
        <span className="ib-insights-target-tag">Target: 80%</span>
        <span className="ib-insights-target-dash" />
      </div>
      <div className="ib-insights-chart">
        {bars.map((b, i) => (
          <div key={b.label} className="ib-insights-col">
            <span
              className={`ib-insights-bar${i === bars.length - 1 ? " last" : ""}`}
              style={{
                height: `${b.h}px`,
                animationDelay: `${i * 0.12}s`,
              }}
            >
              {i === bars.length - 1 && (
                <span className="ib-insights-peak-star">★</span>
              )}
            </span>
            <span className="ib-insights-label">{b.label}</span>
          </div>
        ))}
      </div>
      <div className="ib-insights-stat">
        <span className="ib-insights-trending-icon">
          <TrendingUp size={15} />
        </span>
        <strong>+53%</strong> speaking confidence
      </div>
    </div>
  );
}

const visuals: Record<string, () => JSX.Element> = {
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
              index * 80
            )
          );
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(root);

    return () => {
      observer.disconnect();
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
              className={`institution-bento-card institution-bento-${feature.size} institution-bento-${feature.tone} group`}
              data-bento-card
            >
              {/* 1. Lively Visual / Ambient Background */}
              <div className="ib-card-background">
                {Visual && <Visual />}
              </div>

              {/* 2. Top Header Monospace Label */}
              <div className="institution-bento-card-top">
                <span className="ib-top-label">{feature.label}</span>
                <span className="ib-top-dot" />
              </div>

              {/* 3. Text and Icon Content Block (Translates Up on Group Hover) */}
              <div className="institution-bento-card-content">
                <div className="ib-card-icon-wrap">
                  <Icon className="ib-card-icon" size={26} />
                </div>
                <h3 className="ib-card-title">{feature.title}</h3>
                <p className="ib-card-desc">{feature.body}</p>
              </div>

              {/* 4. Sliding CTA Link at Bottom (Magic UI Hover Slide) */}
              <div className="institution-bento-card-cta">
                <a
                  href="#how-it-works"
                  className="ib-card-cta-btn"
                  aria-label={`Explore ${feature.label}`}
                >
                  <span>Explore {feature.label}</span>
                  <ArrowRight className="ib-cta-arrow" size={14} />
                </a>
              </div>

              {/* 5. Subtle ambient hover overlay */}
              <div className="institution-bento-card-overlay" />
            </article>
          );
        })}
      </div>
    </div>
  );
}

