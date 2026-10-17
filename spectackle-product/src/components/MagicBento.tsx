"use client";

import { useEffect, useRef } from "react";
import {
  ArrowUpRight,
  Check,
  MessageCircle,
  Mic2,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

type Card = {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
  variant: "prep" | "live" | "report";
};

const cards: Card[] = [
  {
    number: "01",
    eyebrow: "PRE-GD PREP",
    title: "Structure your thoughts.",
    description:
      "Frame your argument, choose your data points, and enter the circle ready.",
    variant: "prep",
  },
  {
    number: "02",
    eyebrow: "LIVE ROUNDTABLE",
    title: "Own your moment.",
    description:
      "Practice real interventions, handle pressure, and speak before the window closes.",
    variant: "live",
  },
  {
    number: "03",
    eyebrow: "INSTANT GD SCORECARD",
    title: "Know how you sound.",
    description:
      "Get objective scores on talk time, speaking pace, fillers, and argument depth.",
    variant: "report",
  },
];

function PrepVisual() {
  return (
    <div className="mb-visual mb-prep">
      <div className="mb-window">
        <div className="mb-window-top">
          <span>PRIVATE PREP</span>
          <span className="mb-dots">
            <i />
            <i />
            <i />
          </span>
        </div>

        <div className="mb-note">
          <span className="mb-note-line mb-note-title">
            State core premise
          </span>

          <span className="mb-note-line">
            Cite real evidence
          </span>

          <span className="mb-note-line">
            Counter standard objection
          </span>
        </div>

        <div className="mb-note-chip">
          <Sparkles size={12} />
          Add a data point
        </div>
      </div>

      <div className="mb-floating mb-floating-one">
        <Zap size={13} />
      </div>

      <div className="mb-floating mb-floating-two">
        Ready?
      </div>
    </div>
  );
}

function LiveVisual() {
  return (
    <div className="mb-visual mb-live">
      <div className="mb-live-header">
        <span className="mb-live-dot" />
        LIVE GD ROUND
        <span className="mb-live-time">05:32</span>
      </div>

      <div className="mb-live-question">
        Should we
        <strong>build for speed?</strong>
      </div>

      <div className="mb-people">
        <span className="person person-a">R</span>
        <span className="person person-b">K</span>
        <span className="person person-c">M</span>
        <span className="person person-d">Z</span>
      </div>

      <div className="mb-speaking">
        <span className="mb-speaking-pulse" />
        <Mic2 size={12} />
        Speaking
      </div>

      <div className="mb-wave">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}

function ReportVisual() {
  return (
    <div className="mb-visual mb-report">
      <div className="mb-report-top">
        <span>ROUND COMPLETE</span>
        <Check size={15} />
      </div>

      <div className="mb-score">
        <strong>8.6</strong>
        <span>placement score</span>
      </div>

      <div className="mb-report-pills">
        <div className="mb-pill mb-pill-green">
          <Check size={12} />
          Strong rebuttal
        </div>

        <div className="mb-pill mb-pill-peach">
          <Target size={12} />
          Peer reference
        </div>
      </div>

      <div className="mb-report-progress">
        <span />
      </div>

      <div className="mb-report-caption">
        Recruiter-ready for the next round.
      </div>
    </div>
  );
}

function CardVisual({ variant }: { variant: Card["variant"] }) {
  if (variant === "prep") return <PrepVisual />;
  if (variant === "live") return <LiveVisual />;
  return <ReportVisual />;
}

function MagicCard({ card }: { card: Card }) {
  const cardRef = useRef<HTMLElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const rippleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const cardElement = cardRef.current;

    if (!cardElement) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    let raf = 0;

    const handlePointerMove = (event: PointerEvent) => {
      const rect = cardElement.getBoundingClientRect();

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -3.5;
      const rotateY = ((x - centerX) / centerX) * 3.5;

      const magnetX = ((x - centerX) / centerX) * 4;
      const magnetY = ((y - centerY) / centerY) * 4;

      cancelAnimationFrame(raf);

      raf = requestAnimationFrame(() => {
        cardElement.style.setProperty(
          "--mb-rotate-x",
          `${rotateX}deg`
        );

        cardElement.style.setProperty(
          "--mb-rotate-y",
          `${rotateY}deg`
        );

        cardElement.style.setProperty(
          "--mb-magnet-x",
          `${magnetX}px`
        );

        cardElement.style.setProperty(
          "--mb-magnet-y",
          `${magnetY}px`
        );

        cardElement.style.setProperty(
          "--mb-glow-x",
          `${x}px`
        );

        cardElement.style.setProperty(
          "--mb-glow-y",
          `${y}px`
        );

        if (glowRef.current) {
          glowRef.current.style.opacity = "1";
        }
      });
    };

    const handlePointerLeave = () => {
      cancelAnimationFrame(raf);

      cardElement.style.setProperty("--mb-rotate-x", "0deg");
      cardElement.style.setProperty("--mb-rotate-y", "0deg");
      cardElement.style.setProperty("--mb-magnet-x", "0px");
      cardElement.style.setProperty("--mb-magnet-y", "0px");

      if (glowRef.current) {
        glowRef.current.style.opacity = "0";
      }
    };

    const handleClick = (event: MouseEvent) => {
      const rect = cardElement.getBoundingClientRect();

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (!rippleRef.current) return;

      rippleRef.current.style.left = `${x}px`;
      rippleRef.current.style.top = `${y}px`;

      rippleRef.current.classList.remove("is-rippling");

      // Force reflow so repeated clicks restart animation.
      void rippleRef.current.offsetWidth;

      rippleRef.current.classList.add("is-rippling");
    };

    cardElement.addEventListener("pointermove", handlePointerMove);
    cardElement.addEventListener("pointerleave", handlePointerLeave);
    cardElement.addEventListener("click", handleClick);

    return () => {
      cancelAnimationFrame(raf);

      cardElement.removeEventListener(
        "pointermove",
        handlePointerMove
      );

      cardElement.removeEventListener(
        "pointerleave",
        handlePointerLeave
      );

      cardElement.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <article
      ref={cardRef}
      className={`magic-bento-card magic-bento-${card.variant}`}
    >
      {/* Cursor glow */}
      <div
        ref={glowRef}
        className="magic-bento-glow"
      />

      {/* Click ripple */}
      <div
        ref={rippleRef}
        className="magic-bento-ripple"
      />

      {/* Animated border */}
      <div className="magic-bento-border" />

      <div className="magic-bento-content">
        <div className="magic-bento-top">
          <span className="magic-bento-number">
            {card.number}
          </span>

          <span className="magic-bento-eyebrow">
            {card.eyebrow}
          </span>

          <ArrowUpRight
            className="magic-bento-arrow"
            size={18}
          />
        </div>

        <CardVisual variant={card.variant} />

        <div className="magic-bento-copy">
          <h3>{card.title}</h3>

          <p>{card.description}</p>
        </div>
      </div>
    </article>
  );
}

export default function MagicBento() {
  return (
    <div className="magic-bento">
      <div className="magic-bento-grid">
        {cards.map((card) => (
          <MagicCard
            key={card.number}
            card={card}
          />
        ))}
      </div>
    </div>
  );
}