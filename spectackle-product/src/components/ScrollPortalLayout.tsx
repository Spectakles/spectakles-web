import {
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import "./ScrollPortalLayout.css";

gsap.registerPlugin(ScrollTrigger);

type ScrollPortalLayoutProps = {
  children: ReactNode;
  perspective?: number;
  scrub?: number;
};

export default function ScrollPortalLayout({
  children,
  perspective = 1000,
  scrub = 0.35,
}: ScrollPortalLayoutProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = sectionRef.current;

    if (!container) return;

    const context = gsap.context(() => {
      const scenes = gsap.utils.toArray<HTMLElement>(
        ".portal-scene",
        container
      );

      if (!scenes.length) return;

      scenes.forEach((scene, index) => {
        // Keep above-the-fold hero section stable at natural scale/position to prevent layout shift (CLS)
        if (index === 0) return;

        gsap.fromTo(
          scene,
          {
            opacity: 0.35,
            scale: 0.92,
            y: 50,
            rotateX: index % 2 === 0 ? 2 : -2,
            transformPerspective: perspective,
            transformOrigin: "center center",
          },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            rotateX: 0,
            ease: "none",
            scrollTrigger: {
              trigger: scene,
              start: "top 90%",
              end: "top 35%",
              scrub,
              invalidateOnRefresh: true,
            },
          }
        );
      });
    }, container);

    return () => {
      context.revert();
    };
  }, [perspective, scrub]);

  return (
    <div
      ref={sectionRef}
      className="portal-layout"
      style={
        {
          "--portal-perspective": `${perspective}px`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}