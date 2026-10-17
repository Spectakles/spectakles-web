"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import "./SpectakleIntro.css";

const DESKTOP_PARTICLE_COUNT = 1100;
const MOBILE_PARTICLE_COUNT = 650;
const TAU = Math.PI * 2;

type Point = {
  x: number;
  y: number;
};

type Particle = Point & {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  delay: number;
  depth: number;
  seed: number;
  vx: number;
  vy: number;
  size: number;
  brightness: number;
  glow: boolean;
};

type StoryText = {
  eyebrow: string;
  title: string;
  description?: string;
  side: "left" | "right";
  start: number;
  end: number;
};


/* =====================================================
   PARTICLE LOGO
===================================================== */

function addPath(
  points: Point[],
  path: Point[],
  count: number
) {
  for (let index = 0; index < count; index += 1) {
    const progress =
      (index / count) * path.length;

    const segment =
      Math.floor(progress) % path.length;

    const remainder =
      progress - Math.floor(progress);

    const start = path[segment];

    const end =
      path[(segment + 1) % path.length];

    const rawX =
      start.x +
      (end.x - start.x) *
        remainder;

    const rawY =
      start.y +
      (end.y - start.y) *
        remainder;

    points.push({
      x:
        0.5 +
        (rawX - 0.5) * 0.62,

      y:
        0.5 +
        (rawY - 0.46) * 0.33,
    });
  }
}


function createLogoTargets(): Point[] {
  const points: Point[] = [];

  addPath(
    points,
    [
      { x: 0.08, y: 0.28 },
      { x: 0.08, y: 0.2 },
      { x: 0.1, y: 0.12 },
      { x: 0.15, y: 0.06 },
      { x: 0.26, y: 0.06 },
      { x: 0.43, y: 0.06 },
      { x: 0.47, y: 0.08 },
      { x: 0.5, y: 0.14 },
      { x: 0.53, y: 0.08 },
      { x: 0.57, y: 0.06 },
      { x: 0.74, y: 0.06 },
      { x: 0.85, y: 0.06 },
      { x: 0.9, y: 0.12 },
      { x: 0.92, y: 0.2 },
      { x: 0.92, y: 0.48 },
      { x: 0.9, y: 0.62 },
      { x: 0.85, y: 0.74 },
      { x: 0.77, y: 0.83 },
      { x: 0.65, y: 0.86 },
      { x: 0.56, y: 0.84 },
      { x: 0.5, y: 0.75 },
      { x: 0.44, y: 0.84 },
      { x: 0.35, y: 0.86 },
      { x: 0.23, y: 0.83 },
      { x: 0.15, y: 0.74 },
      { x: 0.1, y: 0.62 },
      { x: 0.08, y: 0.48 },
    ],
    420
  );

  addPath(
    points,
    [
      { x: 0.2, y: 0.18 },
      { x: 0.39, y: 0.18 },
      { x: 0.44, y: 0.21 },
      { x: 0.46, y: 0.28 },
      { x: 0.46, y: 0.48 },
      { x: 0.43, y: 0.62 },
      { x: 0.37, y: 0.72 },
      { x: 0.28, y: 0.74 },
      { x: 0.21, y: 0.7 },
      { x: 0.18, y: 0.62 },
      { x: 0.17, y: 0.5 },
      { x: 0.17, y: 0.28 },
    ],
    250
  );

  addPath(
    points,
    [
      { x: 0.8, y: 0.18 },
      { x: 0.61, y: 0.18 },
      { x: 0.56, y: 0.21 },
      { x: 0.54, y: 0.28 },
      { x: 0.54, y: 0.48 },
      { x: 0.57, y: 0.62 },
      { x: 0.63, y: 0.72 },
      { x: 0.72, y: 0.74 },
      { x: 0.79, y: 0.7 },
      { x: 0.82, y: 0.62 },
      { x: 0.83, y: 0.5 },
      { x: 0.83, y: 0.28 },
    ],
    250
  );

  addPath(
    points,
    [
      { x: 0.46, y: 0.18 },
      { x: 0.47, y: 0.25 },
      { x: 0.5, y: 0.32 },
      { x: 0.53, y: 0.25 },
      { x: 0.54, y: 0.18 },
    ],
    180
  );

  return points;
}


function easeInOut(value: number) {
  return value * value * (3 - 2 * value);
}


function createStarStart(
  index: number
): Point {
  const clusters = [
    { x: 0.2, y: 0.28 },
    { x: 0.72, y: 0.24 },
    { x: 0.28, y: 0.73 },
    { x: 0.76, y: 0.7 },
  ];

  if (index % 5 !== 0) {
    return {
      x: Math.random(),
      y: Math.random(),
    };
  }

  const cluster =
    clusters[
      index % clusters.length
    ];

  const spread =
    0.11 +
    Math.random() * 0.13;

  return {
    x: Math.min(
      1,
      Math.max(
        0,
        cluster.x +
          (Math.random() - 0.5) *
            spread
      )
    ),

    y: Math.min(
      1,
      Math.max(
        0,
        cluster.y +
          (Math.random() - 0.5) *
            spread
      )
    ),
  };
}


/* =====================================================
   TEXT STORY
===================================================== */
const STORY: StoryText[] = [
  {
    eyebrow: "01 / THE PLATFORM",
    title: "Spectakles",
    side: "left",
    start: 0.30,
    end: 0.52,
  },

  {
    eyebrow: "02 / THE IDEA",
    title: "A place to practice",
    description:
      "before the room starts listening.",
    side: "right",
    start: 0.46,
    end: 0.68,
  },

  {
    eyebrow: "03 / THE METHOD",
    title: "Speak. Listen. Grow.",
    description:
      "Build the confidence to enter every conversation.",
    side: "left",
    start: 0.62,
    end: 0.84,
  },

  {
    eyebrow: "04 / THE OUTCOME",
    title: "Practice without",
    description:
      "the pressure.",
    side: "right",
    start: 0.78,
    end: 1.0,
  },
];


/* =====================================================
   COMPONENT
===================================================== */

export default function SpectakleIntro() {
  const pathname = usePathname();

  const canvasRef =
    useRef<HTMLCanvasElement>(null);

  const scrollRef =
    useRef(0);

  const cursorRef =
    useRef<
      Point & {
        active: boolean;
      }
    >({
      x: 0.5,
      y: 0.5,
      active: false,
    });

  const storyRef =
    useRef<HTMLDivElement>(null);

  const [formed, setFormed] =
    useState(false);

  useEffect(() => {
    if (pathname !== "/") {
      return undefined;
    }

    const canvas =
      canvasRef.current;

    const stage =
      canvas?.parentElement;

    const scrollArea =
      stage?.parentElement;

    if (
      !canvas ||
      !stage ||
      !scrollArea
    ) {
      return undefined;
    }

    const context =
      canvas.getContext("2d");

    if (!context) {
      return undefined;
    }

    const reducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

    const targets =
      createLogoTargets();

    const particleCount =
      window.matchMedia(
        "(max-width: 720px)"
      ).matches
        ? MOBILE_PARTICLE_COUNT
        : DESKTOP_PARTICLE_COUNT;

    const particles: Particle[] =
      Array.from(
        {
          length: particleCount,
        },
        (_, index) => {
          const target =
            targets[
              Math.floor(
                (index *
                  targets.length) /
                  particleCount
              )
            ];

          const start =
            createStarStart(index);

          const depth =
            0.35 +
            Math.random() * 1.1;

          return {
            x: start.x,
            y: start.y,

            startX: start.x,
            startY: start.y,

            targetX: target.x,
            targetY: target.y,

            delay:
              Math.random() * 0.08,

            depth,

            seed:
              Math.random() *
              TAU,

            vx: 0,
            vy: 0,

            size:
              0.45 +
              depth * 0.9,

            brightness:
              0.24 +
              depth * 0.68,

            glow:
              Math.random() <
              0.035,
          };
        }
      );

    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let animationFrame = 0;

    let formedState = false;

    const startTime =
      performance.now();


    /* =================================================
       RESIZE
    ================================================= */

    const resize = () => {
      const bounds =
        stage.getBoundingClientRect();

      width = bounds.width;
      height = bounds.height;

      pixelRatio =
        Math.min(
          window.devicePixelRatio ||
            1,
          2
        );

      canvas.width =
        Math.round(
          width * pixelRatio
        );

      canvas.height =
        Math.round(
          height * pixelRatio
        );

      context.setTransform(
        pixelRatio,
        0,
        0,
        pixelRatio,
        0,
        0
      );
    };


    /* =================================================
       SCROLL
    ================================================= */

    const updateScroll = () => {
      const scrollRange =
        Math.max(
          scrollArea.offsetHeight -
            height,
          1
        );

      scrollRef.current =
        Math.min(
          1,
          Math.max(
            0,
            window.scrollY /
              scrollRange
          )
        );
    };


    /* =================================================
       CURSOR
    ================================================= */

    const updateCursor = (
      event: PointerEvent
    ) => {
      const bounds =
        stage.getBoundingClientRect();

      cursorRef.current.x =
        Math.min(
          1,
          Math.max(
            0,
            (event.clientX -
              bounds.left) /
              bounds.width
          )
        );

      cursorRef.current.y =
        Math.min(
          1,
          Math.max(
            0,
            (event.clientY -
              bounds.top) /
              bounds.height
          )
        );

      cursorRef.current.active =
        true;
    };


    const clearCursor = () => {
      cursorRef.current.active =
        false;
    };


    resize();
    updateScroll();

    const resizeObserver =
      new ResizeObserver(() => {
        resize();
        updateScroll();
      });

    resizeObserver.observe(stage);

    window.addEventListener(
      "scroll",
      updateScroll,
      { passive: true }
    );

    stage.addEventListener(
      "pointermove",
      updateCursor
    );

    stage.addEventListener(
      "pointerleave",
      clearCursor
    );


    /* =================================================
       TEXT ANIMATION
    ================================================= */

    const updateStory = (
      progress: number
    ) => {
      const story =
        storyRef.current;

      if (!story) return;

      const items =
        story.querySelectorAll<HTMLElement>(
          ".Spectakles-story-item"
        );

      items.forEach(
        (item, index) => {
          const scene =
            STORY[index];

          /*
           * Fade in/out around the
           * scene's scroll window.
           */

          const fadeLength = 0.045;

          let opacity = 0;

          if (
            progress >=
              scene.start &&
            progress <= scene.end
          ) {
            if (
              progress <
              scene.start +
                fadeLength
            ) {
              opacity =
                (progress -
                  scene.start) /
                fadeLength;
            } else if (
              progress >
              scene.end -
                fadeLength
            ) {
              opacity =
                (scene.end -
                  progress) /
                fadeLength;
            } else {
              opacity = 1;
            }
          }

          /*
           * Direction of movement.
           *
           * Left scenes enter from left.
           * Right scenes enter from right.
           */

          const direction =
            scene.side === "left"
              ? -1
              : 1;

          const visibleOffset =
            (1 - opacity) *
            direction *
            60;

          item.style.opacity =
            String(opacity);

          item.style.transform =
            `translate3d(${visibleOffset}px, 0, 0)`;

          /*
           * Small scale effect.
           */

          const scale =
            0.97 +
            opacity * 0.03;

          item.style.scale =
            String(scale);
        }
      );
    };


    /* =================================================
       PARTICLE ANIMATION
    ================================================= */

    const animate = (
      now: number
    ) => {
      const elapsed =
        (now - startTime) /
        1000;

      const rawScroll =
        scrollRef.current;

      /*
       * Particle formation.
       *
       * The logo forms first.
       */

      const formation =
        reducedMotion
          ? 1
          : easeInOut(
              Math.min(
                1,
                rawScroll / 0.38
              )
            );

      /*
       * Gentle movement after
       * the logo has formed.
       */

      const rotationProgress =
        reducedMotion
          ? 0
          : Math.min(
              1,
              Math.max(
                0,
                (rawScroll -
                  0.42) /
                  0.42
              )
            );

      /*
       * Final particle dispersion.
       */

      const exitProgress =
        reducedMotion
          ? 0
          : Math.min(
              1,
              Math.max(
                0,
                (rawScroll -
                  0.86) /
                  0.14
              )
            );

      const rotation =
        rotationProgress *
        0.1;

      const shouldBeFormed =
        formation >= 0.98;

      if (
        shouldBeFormed !==
        formedState
      ) {
        formedState =
          shouldBeFormed;

        setFormed(
          shouldBeFormed
        );
      }


      context.clearRect(
        0,
        0,
        width,
        height
      );


      particles.forEach(
        (particle) => {
          const localProgress =
            Math.min(
              1,
              Math.max(
                0,
                formation -
                  particle.delay
              )
            );

          const eased =
            easeInOut(
              localProgress
            );

          let baseX =
            particle.startX +
            (particle.targetX -
              particle.startX) *
              eased;

          let baseY =
            particle.startY +
            (particle.targetY -
              particle.startY) *
              eased;


          const cursor =
            cursorRef.current;

          const cursorDistance =
            Math.hypot(
              cursor.x -
                particle.x,
              cursor.y -
                particle.y
            );

          const cursorInfluence =
            cursor.active
              ? Math.max(
                  0,
                  1 -
                    cursorDistance /
                      0.18
                )
              : 0;


          const floatX =
            Math.sin(
              elapsed * 0.35 +
                particle.seed
            ) *
            0.0015 *
            particle.depth;

          const floatY =
            Math.cos(
              elapsed * 0.3 +
                particle.seed
            ) *
            0.0015 *
            particle.depth;


          baseX += floatX;
          baseY += floatY;


          particle.vx +=
            (baseX -
              particle.x) *
            0.055;

          particle.vy +=
            (baseY -
              particle.y) *
            0.055;


          if (
            cursorInfluence > 0
          ) {
            particle.vx +=
              (cursor.x -
                particle.x) *
              cursorInfluence *
              0.012 *
              particle.depth;

            particle.vy +=
              (cursor.y -
                particle.y) *
              cursorInfluence *
              0.012 *
              particle.depth;
          }


          particle.vx *= 0.86;
          particle.vy *= 0.86;


          particle.x +=
            particle.vx;

          particle.y +=
            particle.vy;


          let x =
            0.5 +
            (particle.x -
              0.5) *
              (
                1 +
                rotation -
                exitProgress *
                  0.18
              );


          let y =
            0.5 +
            (particle.y -
              0.5) *
              (
                1 -
                rotation *
                  0.18 -
                exitProgress *
                  0.1
              ) -
            exitProgress *
              0.28;


          x +=
            Math.sin(
              rotation * 8 +
                particle.seed
            ) *
            rotation *
            0.08 *
            particle.depth;

          y +=
            Math.cos(
              rotation * 7 +
                particle.seed
            ) *
            rotation *
            0.02 *
            particle.depth;


          /*
           * Keep particles visible
           * while the story is playing.
           */

          const alpha =
            (
              0.16 +
              localProgress *
                0.7
            ) *
            particle.brightness *
            (
              1 -
              exitProgress *
                0.55
            );


          context.fillStyle =
            `rgba(32, 32, 44, ${alpha})`;

          context.shadowBlur =
            particle.glow
              ? 5
              : 0;

          context.shadowColor =
            `rgba(255, 253, 249, ${
              alpha * 0.6
            })`;

          context.beginPath();

          context.arc(
            x * width,
            y * height,
            particle.size,
            0,
            TAU
          );

          context.fill();

          context.shadowBlur = 0;
        }
      );


      /*
       * Update the text scenes
       * from the same scroll progress.
       */

      updateStory(
        rawScroll
      );


      animationFrame =
        requestAnimationFrame(
          animate
        );
    };


    animationFrame =
      requestAnimationFrame(
        animate
      );


    return () => {
      cancelAnimationFrame(
        animationFrame
      );

      resizeObserver.disconnect();

      window.removeEventListener(
        "scroll",
        updateScroll
      );

      stage.removeEventListener(
        "pointermove",
        updateCursor
      );

      stage.removeEventListener(
        "pointerleave",
        clearCursor
      );
    };
  }, [pathname]);


  if (pathname !== "/") {
    return null;
  }


  return (
    <section
      className={`Spectakles-intro${
        formed
          ? " is-formed"
          : ""
      }`}
      aria-label="Spectakles introduction"
    >
      <div className="Spectakles-intro-stage">

        {/* =========================================
            PARTICLES
        ========================================== */}

        <canvas
          ref={canvasRef}
          aria-hidden="true"
        />


        {/* =========================================
            ALTERNATING STORY TEXT
        ========================================== */}

        <div
          ref={storyRef}
          className="Spectakles-story"
        >
          {STORY.map(
            (scene, index) => (
              <div
                key={scene.title}
                className={`Spectakles-story-item ${
                  scene.side === "left"
                    ? "story-left"
                    : "story-right"
                }`}
              >
                <div className="Spectakles-story-inner">

                  <span className="Spectakles-story-eyebrow">
                    {scene.eyebrow}
                  </span>

                  <h2>
                    {scene.title}
                  </h2>

                  {scene.description && (
                    <p>
                      {scene.description}
                    </p>
                  )}

                </div>
              </div>
            )
          )}
        </div>


        {/* =========================================
            INITIAL SCROLL INDICATOR
        ========================================== */}

        <div
          className="Spectakles-intro-scroll"
          aria-hidden="true"
        >
          <span>
            SCROLL TO EXPLORE
          </span>

          <span className="Spectakles-intro-arrow">
            ↓
          </span>
        </div>

      </div>
    </section>
  );
}