"use client";

import { useEffect, useRef } from "react";

type ParallaxPillProps = {
  children: React.ReactNode;
  className?: string;
  rotate?: number;
  strength?: number;
  color?: "yellow" | "coral" | "green" | "dark";
};

export default function ParallaxPill({
  children,
  className = "",
  rotate = 0,
  strength = 18,
  color = "yellow",
}: ParallaxPillProps) {
  const pillRef = useRef<HTMLDivElement>(null);
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    const pill = pillRef.current;

    if (!pill) return;

    const getOffset = () => {
      const rect = pill.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const pillCenter = rect.top + rect.height / 2;
      const distanceY = pillCenter - viewportCenter;
      const maxDistance = window.innerHeight;
      return (distanceY / maxDistance) * strength * 3;
    };

    // Calculate and apply resting position synchronously before first paint to eliminate CLS
    const initialY = getOffset();
    pill.style.setProperty("--pill-y", `${initialY}px`);

    const handleScroll = () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }

      animationFrame.current = requestAnimationFrame(() => {
        const moveY = getOffset();
        pill.style.setProperty("--pill-y", `${moveY}px`);
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    let pointerRaf = 0;
    const handlePointerMove = (e: PointerEvent) => {
      const rect = pill.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      cancelAnimationFrame(pointerRaf);
      pointerRaf = requestAnimationFrame(() => {
        pill.style.setProperty("--pill-glow-x", `${x}px`);
        pill.style.setProperty("--pill-glow-y", `${y}px`);
        pill.style.setProperty("--pill-glow-opacity", "1");
      });
    };

    const handlePointerLeave = () => {
      cancelAnimationFrame(pointerRaf);
      pill.style.setProperty("--pill-glow-opacity", "0");
    };

    pill.addEventListener("pointermove", handlePointerMove);
    pill.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      pill.removeEventListener("pointermove", handlePointerMove);
      pill.removeEventListener("pointerleave", handlePointerLeave);

      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      cancelAnimationFrame(pointerRaf);
    };
  }, [strength]);

  return (
    <div
      ref={pillRef}
      className={`parallax-pill parallax-pill-${color} ${className}`}
      style={
        {
          "--pill-rotate": `${rotate}deg`,
        } as React.CSSProperties
      }
    >
      <div className="parallax-pill-glow" />
      <div className="parallax-pill-shine-beam" />
      <span className="parallax-pill-content">{children}</span>
    </div>
  );
}