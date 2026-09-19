"use client";

import { useEffect, useRef, useState } from "react";

export default function RoundtableHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(0.5);

  const BASE_WIDTH = 1120;
  const BASE_HEIGHT = 860;

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        if (width > 0) {
          setScale(width / BASE_WIDTH);
        }
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="hero-stage-mockup w-full relative rounded-2xl sm:rounded-[22px] overflow-hidden bg-[#262432] border border-gray-800"
      style={{
        aspectRatio: `${BASE_WIDTH} / ${BASE_HEIGHT}`,
        boxShadow: "14px 14px 0 #e8e0d3, 0 20px 40px -15px rgba(0, 0, 0, 0.35)",
        backgroundImage: "url(/assets/in-session-roundtable.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        style={{
          width: `${BASE_WIDTH}px`,
          height: `${BASE_HEIGHT}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        <iframe
          src="/roundtable.html"
          title="Roundtable Live In-Session Preview"
          className="w-full h-full border-0 select-none pointer-events-auto"
          scrolling="no"
        />
      </div>
    </div>
  );
}
