import { useEffect, useRef } from "react";
import "./ParallaxPills.css";

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

    return () => {
      window.removeEventListener("scroll", handleScroll);

      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
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
      <span className="parallax-pill-content">{children}</span>
    </div>
  );
}