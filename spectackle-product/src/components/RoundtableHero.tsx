"use client";

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { roundtableHtml, roundtableCss } from '../../generated/roundtable';

export default function RoundtableHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(0.5);

  const BASE_WIDTH = 1120;
  const BASE_HEIGHT = 860;

  useLayoutEffect(() => {
    // Use the same numeric scale as the original site. Measure before the
    // client paint, then update directly whenever the available width changes.
    const container = containerRef.current;
    if (!container) return;
    const computed = getComputedStyle(container);
    const width = parseFloat(computed.width)
      - parseFloat(computed.borderLeftWidth) - parseFloat(computed.borderRightWidth)
      - parseFloat(computed.paddingLeft) - parseFloat(computed.paddingRight);
    if (width > 0) setScale(width / BASE_WIDTH);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (width > 0) {
          setScale(width / BASE_WIDTH);
        }
      }
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  // Ensure iframe content uses compiled static Tailwind styles with no external 3MB CDN script and full dimensions
  const formattedHtml = useMemo(() => {
    return roundtableHtml
      .replace(
        /<script src="https:\/\/cdn\.tailwindcss\.com[^"]*"><\/script>/i,
        `<style>${roundtableCss}</style>`
      )
      .replace(
        '</head>',
        `<style>
          html, body {
            overflow: hidden !important;
            margin: 0 !important;
            height: 100% !important;
            width: 100% !important;
          }
        </style></head>`
      );
  }, []);

  return (
    <div
      ref={containerRef}
      className="hero-stage-mockup w-full relative rounded-2xl sm:rounded-[22px] overflow-hidden bg-[#262432] border border-gray-800"
      style={{
        aspectRatio: `${BASE_WIDTH} / ${BASE_HEIGHT}`,
        boxShadow: '14px 14px 0 #e8e0d3, 0 20px 40px -15px rgba(0, 0, 0, 0.35)',
      }}
    >
      <div
        style={{
          width: `${BASE_WIDTH}px`,
          height: `${BASE_HEIGHT}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <iframe
          width={BASE_WIDTH}
          height={BASE_HEIGHT}
          srcDoc={formattedHtml}
          title="Roundtable Live In-Session Preview"
          className="w-full h-full border-0 select-none pointer-events-auto"
          scrolling="no"
          style={{ display: 'block' }}
        />
      </div>
    </div>
  );
}
