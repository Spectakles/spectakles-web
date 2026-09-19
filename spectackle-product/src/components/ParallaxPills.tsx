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

    const handleScroll = () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }

      animationFrame.current = requestAnimationFrame(() => {
        const rect = pill.getBoundingClientRect();
        
        // Calculate distance from center of viewport
        const viewportCenter = window.innerHeight / 2;
        const pillCenter = rect.top + rect.height / 2;
        
        const distanceY = pillCenter - viewportCenter;
        
        // The parallax effect creates movement on Y axis proportional to scroll distance from center
        const maxDistance = window.innerHeight;
        const moveY = (distanceY / maxDistance) * strength * 3;
        
        pill.style.setProperty("--pill-y", `${moveY}px`);
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Initial calculation
    handleScroll();

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