"use client";

import { useEffect, useRef, useState } from "react";
import NeonReveal from "./NeonReveal";
import AsciiWavesBackground from "./AsciiWavesBackground";
// import { UserRound } from "lucide-react";
const PERSONAS = [
  {
    name: "Maya",
    role: "The Optimist",
    initial: "M",
    color: "#f1946d",
    ring: 0,
  },
  {
    name: "Kabir",
    role: "The Challenger",
    initial: "K",
    color: "#296489",
    ring: 1,
    speaking: true,
  },
  {
    name: "Zara",
    role: "The Analyst",
    initial: "Z",
    color: "#46f17c",
    ring: 2,
  },
  {
    name: "Dev",
    role: "The Peacemaker",
    initial: "D",
    color: "#d9d5ff",
    ring: 1,
  },
  {
    name: "Aarav",
    role: "The Strategist",
    initial: "A",
    color: "#ff6849",
    ring: 0,
  },
  {
    name: "Isha",
    role: "The Observer",
    initial: "I",
    color: "#dbbb47",
    ring: 2,
  },
  {
    name: "Rohan",
    role: "The Speaker",
    initial: "R",
    color: "#f5c5df",
    ring: 1,
  },
  {
    name: "Naina",
    role: "The Connector",
    initial: "N",
    color: "#3d5d75",
    ring: 2,
  },
];
const PERSONA_ANGLES = [
  -1.52,
  -0.78,
  -0.08,
  0.68,
  1.48,
  2.28,
  3.02,
  3.78,
];
export default function SpectakleEclipseIntro() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
const [
    neonTrigger,
    setNeonTrigger,
  ] = useState(0);

  const [
    neonDirection,
    setNeonDirection,
  ] =
    useState<
      "forward" | "backward"
    >("forward");
  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;

    if (!section || !stage || !canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;

    let coronaFrame = 0;
    let scrollFrame = 0;
    let previousProgress = 0;

let previousDirection:
  | "forward"
  | "backward" = "forward";

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    /* =====================================================
       HELPERS
    ===================================================== */

    const clamp = (
      value: number,
      min = 0,
      max = 1
    ) => Math.min(Math.max(value, min), max);

    const easeOut = (value: number) =>
      1 - Math.pow(1 - value, 3);

    /* =====================================================
       CANVAS
    ===================================================== */

   
   const resize = () => {
  const eclipse = stage.querySelector(
    ".Spectakles-eclipse"
  ) as HTMLElement | null;

  if (!eclipse) return;

  width = eclipse.clientWidth;
  height = eclipse.clientHeight;

  dpr = Math.min(
    window.devicePixelRatio || 1,
    2
  );

  canvas.width = width * dpr;
  canvas.height = height * dpr;

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );
};

    resize();

    window.addEventListener(
      "resize",
      resize
    );

    /* =====================================================
       CORONA

       IMPORTANT:
       The corona is calculated around the EXACT
       center of the Eclipse.
    ===================================================== */

    const drawCorona = (time: number) => {
      ctx.clearRect(
        0,
        0,
        width,
        height
      );

      const centerX = width / 2;
      const centerY = height / 2;

      /*
       * Keep the corona radius tied to the actual
       * Eclipse size.
       */

      const eclipseRadius =
        Math.min(width, height) *
        (window.innerWidth <= 720
          ? 0.305
          : 0.198);

      /* =================================================
         SOFT GREEN ATMOSPHERE
      ================================================= */

      const glow =
        ctx.createRadialGradient(
          centerX,
          centerY,
          eclipseRadius * 0.92,
          centerX,
          centerY,
          eclipseRadius * 1.75
        );

      glow.addColorStop(
        0,
        "rgba(60,155,90,0.16)"
      );

      glow.addColorStop(
        0.32,
        "rgba(60,155,90,0.08)"
      );

      glow.addColorStop(
        0.65,
        "rgba(60,155,90,0.025)"
      );

      glow.addColorStop(
        1,
        "rgba(60,155,90,0)"
      );

      ctx.beginPath();

      ctx.arc(
        centerX,
        centerY,
        eclipseRadius * 1.75,
        0,
        Math.PI * 2
      );

      ctx.fillStyle = glow;

      ctx.fill();

      /* =================================================
         TURBULENT CORONA
      ================================================= */

      const rotation =
        time * 0.00004;

      const strands = 220;

      for (
        let i = 0;
        i < strands;
        i++
      ) {
        const angle =
          (i / strands) *
            Math.PI *
            2 +
          rotation;

        const wave1 =
          Math.sin(
            angle * 8 +
              time * 0.001
          ) * 7;

        const wave2 =
          Math.sin(
            angle * 15 -
              time * 0.0007
          ) * 4;

        const wave3 =
          Math.sin(
            angle * 28 +
              time * 0.00045
          ) * 2;

        const innerRadius =
          eclipseRadius * 1.015;

        const outerRadius =
          eclipseRadius *
            1.20 +
          wave1 +
          wave2 +
          wave3;

        const x1 =
          centerX +
          Math.cos(angle) *
            innerRadius;

        const y1 =
          centerY +
          Math.sin(angle) *
            innerRadius;

        const x2 =
          centerX +
          Math.cos(angle) *
            outerRadius;

        const y2 =
          centerY +
          Math.sin(angle) *
            outerRadius;

        const pulse =
          (Math.sin(
            i * 1.8 +
              time * 0.001
          ) +
            1) /
          2;

        const alpha =
          0.025 +
          pulse * 0.065;

        ctx.beginPath();

        ctx.moveTo(x1, y1);

        ctx.lineTo(x2, y2);

        ctx.strokeStyle =
          `rgba(60,155,90,${alpha})`;

        ctx.lineWidth =
          i % 10 === 0
            ? 1.2
            : 0.65;

        ctx.stroke();
      }

      /* =================================================
         INNER CORONA EDGE
      ================================================= */

      ctx.beginPath();

      ctx.arc(
        centerX,
        centerY,
        eclipseRadius * 1.045,
        0,
        Math.PI * 2
      );

      ctx.strokeStyle =
        "rgba(60,155,90,0.22)";

      ctx.lineWidth = 1.5;

      ctx.stroke();

      if (!reducedMotion) {
        coronaFrame =
          requestAnimationFrame(
            drawCorona
          );
      }
    };

    drawCorona(0);

    /* =====================================================
       SCROLL
    ===================================================== */

    const updateScroll = () => {
      scrollFrame = 0;

      const rect =
        section.getBoundingClientRect();

      const totalDistance =
        section.offsetHeight -
        window.innerHeight;

      const travelled =
        clamp(
          -rect.top,
          0,
          totalDistance
        );

      const progress =
        totalDistance > 0
          ? travelled /
            totalDistance
          : 0;

          /*
 * =====================================================
 * NEON SCROLL DIRECTION
 * =====================================================
 */

const currentDirection =
  progress >= previousProgress
    ? "forward"
    : "backward";

/*
 * Restart the Neon Reveal only when
 * the user changes scroll direction.
 */
if (
  currentDirection !==
  previousDirection
) {
  setNeonDirection(
    currentDirection
  );

  setNeonTrigger(
    (value) => value + 1
  );

  previousDirection =
    currentDirection;
}

previousProgress = progress;

      /* =================================================
         PHASE 1
         Eclipse introduction

         0 → 20%
      ================================================= */

      const intro =
        clamp(
          progress / 0.20
        );

      /* =================================================
         PHASE 2
         Personas emerge

         15 → 45%
      ================================================= */

      const emergence =
        easeOut(
          clamp(
            (progress - 0.15) /
              0.30
          )
        );

      /* =================================================
         PHASE 3
         Orbit

         38 → 84%
      ================================================= */

      const orbit =
        clamp(
          (progress - 0.38) /
            0.46
        );

      /* =================================================
         PHASE 4
         Exit

         84 → 100%
      ================================================= */

      const exit =
        easeOut(
          clamp(
            (progress - 0.84) /
              0.16
          )
        );

      /*
       * Eclipse remains almost completely stable.
       */

      const eclipseScale =
        1 +
        emergence * 0.025 -
        exit * 0.22;

      stage.style.setProperty(
        "--intro",
        String(intro)
      );

      stage.style.setProperty(
        "--emergence",
        String(emergence)
      );

      stage.style.setProperty(
        "--orbit",
        String(orbit)
      );

      stage.style.setProperty(
        "--exit",
        String(exit)
      );

      stage.style.setProperty(
        "--eclipse-scale",
        String(eclipseScale)
      );

      

      /* =================================================
         ORBIT

         1.35 rotations
      ================================================= */

      const orbitAngle =
        orbit *
        Math.PI *
        2.7;

      /*
       * Radius of the orbit.
       *
       * It starts close to the Eclipse and expands.
       */

     const baseRadius =
  Math.min(
    window.innerWidth,
    window.innerHeight
  ) *
  (window.innerWidth <= 720
    ? 0.43
    : 0.46);

      const radius =
        baseRadius *
        (
          0.20 +
          emergence * 0.80
        );

      /* =================================================
         PERSONAS
      ================================================= */

      PERSONAS.forEach(
        (_, index) => {
          const element =
            stage.querySelector(
              `[data-persona="${index}"]`
            ) as HTMLElement | null;

          if (!element) return;

          const startingAngle =
             PERSONA_ANGLES[index];

          const angle =
            startingAngle +
            orbitAngle;

          const x =
            Math.cos(angle) *
            radius;

          const y =
            Math.sin(angle) *
            radius;

          /*
           * Small stagger.
           */

          const stagger =
            index * 0.035;

          const personProgress =
            clamp(
              emergence -
                stagger
            );

          const scale =
            0.15 +
            personProgress * 0.85 -
            exit * 0.2;

          const opacity =
            personProgress *
            (1 - exit);

          element.style.setProperty(
            "--persona-x",
            `${x}px`
          );

          element.style.setProperty(
            "--persona-y",
            `${y}px`
          );

          element.style.setProperty(
            "--persona-scale",
            String(scale)
          );

          element.style.setProperty(
            "--persona-opacity",
            String(opacity)
          );
        }
      );
    };

    const onScroll = () => {
      if (!scrollFrame) {
        scrollFrame =
          requestAnimationFrame(
            updateScroll
          );
      }
    };

    window.addEventListener(
      "scroll",
      onScroll,
      {
        passive: true,
      }
    );

    updateScroll();

    return () => {
      window.removeEventListener(
        "resize",
        resize
      );

      window.removeEventListener(
        "scroll",
        onScroll
      );

      cancelAnimationFrame(
        coronaFrame
      );

      if (scrollFrame) {
        cancelAnimationFrame(
          scrollFrame
        );
      }
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="Spectakles-eclipse-intro"
    >
      <div
        ref={stageRef}
        className="Spectakles-eclipse-stage"
      >

        {/* =================================================
            BRAND
        ================================================= */}

        <div className="Spectakles-eclipse-brand">
          Spectakles
        </div>


        {/* =================================================
            ECLIPSE
        ================================================= */}
<NeonReveal
  className="Spectakles-eclipse-neon"

  color="#3c9b5a"

  revealDuration={1500}

  barWidth={0.95}

  barHeight={0.014}

  verticalOffset={0.5}

  expandFrom="center"

  intensity={0.7}

  glowSpread={1.15}

  mirrored={false}

  trigger={neonTrigger}

  scrollDirection={
    neonDirection
  }
/>
        <div className="Spectakles-eclipse">

          {/* Turbulent corona */}
            <div className="Spectakles-ascii-layer">
    <AsciiWavesBackground />
  </div>
          <canvas
            ref={canvasRef}
            className="Spectakles-eclipse-corona"
            aria-hidden="true"
          />


          {/* Dark circle */}

          <div className="Spectakles-eclipse-core">
            
            {/* =========================================
                INITIAL CONTENT
            ========================================= */}

            <div className="Spectakles-intro-content">
              <span className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-1">TOPIC</span>
              <h2 className="text-xl md:text-2xl font-semibold text-white/95 leading-snug px-3 max-w-[280px] mb-3">
                Should AI replace freshers in IT?
              </h2>
              <div className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-0.5">
                05:32
              </div>
              <span className="text-[11px] text-white/45 font-medium mb-3">left of 8:00</span>
              {/* 4-Segment Progress Bar */}
              <div className="flex items-center space-x-1.5" data-purpose="progress-segmented-indicator">
                <span className="w-8 h-1.5 rounded-full bg-[#E59838]"></span>
                <span className="w-8 h-1.5 rounded-full bg-[#EF6545]"></span>
                <span className="w-8 h-1.5 rounded-full bg-[#3FB950]"></span>
                <span className="w-8 h-1.5 rounded-full bg-white/20"></span>
              </div>
            </div>


            {/* =========================================
                SECONDARY CONTENT

                This appears AFTER personas emerge.
            ========================================= */}

            <div className="Spectakles-wordmark">
              <span>Spectakles</span>

              <small>
                EVERY VOICE COUNTS
              </small>
            </div>

          </div>


          {/* =================================================
              PERSONAS
          ================================================= */}

 <div className="Spectakles-personas">

  {PERSONAS.map((persona, index) => (
    <div
      key={persona.name}
      className="Spectakles-persona"
      data-persona={index}
      
    >

      <div className="flex flex-col items-center">
        <div className="relative">
          <div
            className={`w-[88px] h-[88px] rounded-[28px] font-bold text-3xl flex items-center justify-center shadow-lg text-[#1E293B] ${persona.speaking ? 'ring-4 ring-[#E69D43]' : 'border border-white/10'}`}
            style={{
              background: persona.color,
            }}
          >
            {persona.initial}
          </div>
          {persona.speaking && (
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-[#E69D43] text-black font-extrabold text-[10px] px-2 py-0.5 rounded-full tracking-wider flex items-center space-x-1 shadow-md uppercase whitespace-nowrap">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"></path>
              </svg>
              <span>SPEAKING</span>
            </div>
          )}
        </div>
        <span className="text-sm font-bold text-white mt-2">{persona.name}</span>
        <span className="text-xs text-white/50">{persona.role}</span>
      </div>

    </div>
  ))}

</div>
        </div>


        {/* =================================================
            SCROLL HINT
        ================================================= */}

        <div className="Spectakles-eclipse-scroll">

          <span>
            SCROLL TO ENTER THE ROOM
          </span>

          <i>↓</i>

        </div>


        {/* =================================================
            EXIT
        ================================================= */}

        <div className="Spectakles-eclipse-exit">
          WELCOME TO Spectakles
        </div>

      </div>
    </section>
    
  );
}