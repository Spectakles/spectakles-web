"use client";

import { useEffect, useRef } from "react";

const config = {
  desktopSpacing: 24,
  tabletSpacing: 28,
  mobileSpacing: 32,

  shapeSize: 2.2,

  baseOpacity: 0.055,
  hoverOpacity: 0.18,

  cursorRadius: 280,
  cursorStrength: 1,

  displacement: 18,

  waveFrequency: 0.045,
  waveSpeed: 0.004,

  clickStrength: 1,
  clickDuration: 850,

  maxRipples: 5,

  smoothing: 0.085,
};

type Point = {
  baseX: number;
  baseY: number;

  x: number;
  y: number;

  size: number;
  opacity: number;
  rotation: number;
  phase: number;
};

type Ripple = {
  x: number;
  y: number;
  time: number;
  strength: number;
};

export default function CursorWaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const touchQuery = window.matchMedia("(pointer: coarse)");

    let reducedMotion = reducedMotionQuery.matches;
    let touchDevice = touchQuery.matches;

    let width = 0;
    let height = 0;
    let pixelRatio = 1;

    let spacing = config.desktopSpacing;

    let animationFrame = 0;

    let points: Point[] = [];

    const pointer = {
      x: 0,
      y: 0,

      targetX: 0,
      targetY: 0,

      active: false,
    };

    const ripples: Ripple[] = [];

    let theme: "light" | "dark" = "light";

    /**
     * Get the current Spectakles theme.
     */
    const readTheme = () => {
      const root = document.documentElement;

      const dataTheme = root.dataset.theme;

      if (dataTheme === "dark") {
        theme = "dark";
      } else if (dataTheme === "light") {
        theme = "light";
      } else if (root.classList.contains("dark")) {
        theme = "dark";
      } else {
        theme = "light";
      }
    };

    /**
     * Create the grid of shapes.
     */
    const createPoints = () => {
      points = [];

      const columns = Math.ceil(width / spacing) + 2;
      const rows = Math.ceil(height / spacing) + 2;

      for (let row = -1; row < rows; row += 1) {
        for (let column = -1; column < columns; column += 1) {
          const x = column * spacing;
          const y = row * spacing;

          points.push({
            baseX: x,
            baseY: y,

            x,
            y,

            size:
              config.shapeSize *
              (0.85 + Math.random() * 0.3),

            opacity:
              config.baseOpacity *
              (0.7 + Math.random() * 0.6),

            rotation: Math.random() * Math.PI,

            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    };

    /**
     * Resize canvas.
     */
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;

      if (width <= 600) {
        spacing = config.mobileSpacing;
      } else if (width <= 1000) {
        spacing = config.tabletSpacing;
      } else {
        spacing = config.desktopSpacing;
      }

      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.ceil(width * pixelRatio);
      canvas.height = Math.ceil(height * pixelRatio);

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      context.setTransform(
        pixelRatio,
        0,
        0,
        pixelRatio,
        0,
        0,
      );

      createPoints();
    };

    /**
     * Mouse movement.
     */
    const handlePointerMove = (event: PointerEvent) => {
      if (touchDevice || reducedMotion) return;

      pointer.targetX = event.clientX;
      pointer.targetY = event.clientY;
      pointer.active = true;
    };

    /**
     * Mouse leaves viewport.
     */
    const handlePointerLeave = () => {
      pointer.active = false;
    };

    /**
     * Create a click ripple.
     */
    const handlePointerDown = (event: PointerEvent) => {
      if (touchDevice || reducedMotion) return;

      ripples.push({
        x: event.clientX,
        y: event.clientY,
        time: performance.now(),
        strength: config.clickStrength,
      });

      if (ripples.length > config.maxRipples) {
        ripples.shift();
      }
    };

    /**
     * Smoothstep interpolation.
     */
    const smoothStep = (value: number) => {
      const v = Math.max(0, Math.min(1, value));

      return v * v * (3 - 2 * v);
    };

    /**
     * Draw one geometric shape.
     *
     * We're using small diamonds/squares because they create
     * a clean editorial look without looking like particles.
     */
    const drawShape = (
      point: Point,
      size: number,
      opacity: number,
      rotation: number,
    ) => {
      context.save();

      context.translate(point.x, point.y);
      context.rotate(rotation);

      context.globalAlpha = opacity;

      context.beginPath();

      context.moveTo(0, -size);
      context.lineTo(size, 0);
      context.lineTo(0, size);
      context.lineTo(-size, 0);
      context.closePath();

      context.fill();

      context.restore();
    };

    /**
     * Animation loop.
     */
    const draw = (now: number) => {
      readTheme();

      context.clearRect(0, 0, width, height);

      /**
       * Smooth cursor movement.
       */
      if (!reducedMotion) {
        pointer.x +=
          (pointer.targetX - pointer.x) *
          config.smoothing;

        pointer.y +=
          (pointer.targetY - pointer.y) *
          config.smoothing;
      }

      /**
       * Theme-aware shape color.
       *
       * We intentionally derive the color from the existing
       * Spectakles foreground rather than introducing a new palette.
       */
      if (theme === "dark") {
        context.fillStyle = "#f4f1eb";
      } else {
        context.fillStyle = "#20202c";
      }

      for (const point of points) {
        let targetX = point.baseX;
        let targetY = point.baseY;

        let interaction = 0;

        /**
         * Cursor interaction.
         */
        if (
          pointer.active &&
          !touchDevice &&
          !reducedMotion
        ) {
          const dx = point.baseX - pointer.x;
          const dy = point.baseY - pointer.y;

          const distance = Math.sqrt(
            dx * dx + dy * dy,
          );

          if (distance < config.cursorRadius) {
            const normalized =
              1 - distance / config.cursorRadius;

            interaction = smoothStep(normalized);

            /**
             * Direction away from cursor.
             */
            const angle = Math.atan2(dy, dx);

            /**
             * Ripple-like displacement.
             */
            const wave =
              Math.sin(
                distance *
                  config.waveFrequency -
                  now * config.waveSpeed,
              ) * 0.5 + 0.5;

            const displacement =
              config.displacement *
              interaction *
              (0.65 + wave * 0.35) *
              config.cursorStrength;

            targetX += Math.cos(angle) * displacement;
            targetY += Math.sin(angle) * displacement;

            /**
             * Add a small perpendicular wave.
             */
            const perpendicular =
              Math.sin(
                distance * 0.025 -
                  now * config.waveSpeed * 1.5,
              ) *
              interaction *
              5;

            targetX += -Math.sin(angle) * perpendicular;
            targetY += Math.cos(angle) * perpendicular;
          }
        }

        /**
         * Click ripples.
         */
        if (!reducedMotion) {
          for (const ripple of ripples) {
            const elapsed =
              now - ripple.time;

            if (
              elapsed < 0 ||
              elapsed > config.clickDuration
            ) {
              continue;
            }

            const progress =
              elapsed / config.clickDuration;

            const easedProgress =
              1 -
              Math.pow(1 - progress, 3);

            const dx =
              point.baseX - ripple.x;

            const dy =
              point.baseY - ripple.y;

            const distance =
              Math.sqrt(dx * dx + dy * dy);

            /**
             * Expanding wave radius.
             */
            const rippleRadius =
              easedProgress * 420;

            const waveWidth = 90;

            const difference = Math.abs(
              distance - rippleRadius,
            );

            if (difference < waveWidth) {
              const rippleInfluence =
                1 - difference / waveWidth;

              const strength =
                smoothStep(
                  rippleInfluence,
                ) *
                (1 - progress) *
                ripple.strength;

              const angle =
                Math.atan2(dy, dx);

              const displacement =
                strength * 28;

              targetX +=
                Math.cos(angle) *
                displacement;

              targetY +=
                Math.sin(angle) *
                displacement;

              interaction = Math.max(
                interaction,
                strength,
              );
            }
          }
        }

        /**
         * Smooth shape movement.
         */
        point.x +=
          (targetX - point.x) *
          config.smoothing;

        point.y +=
          (targetY - point.y) *
          config.smoothing;

        /**
         * Subtle scale effect.
         */
        const scale =
          1 +
          interaction * 1.2;

        const size =
          point.size * scale;

        /**
         * Cursor makes shapes more visible.
         */
        const opacity =
          point.opacity +
          interaction *
            (config.hoverOpacity - point.opacity);

        /**
         * Slight rotation around cursor.
         */
        const rotation =
          point.rotation +
          interaction *
            Math.sin(now * 0.001 + point.phase) *
            0.25;

        drawShape(
          point,
          size,
          opacity,
          rotation,
        );
      }

      /**
       * Remove expired ripples.
       */
      if (ripples.length > 0) {
        const currentTime = now;

        for (let index = ripples.length - 1; index >= 0; index -= 1) {
          if (
            currentTime - ripples[index].time >
            config.clickDuration
          ) {
            ripples.splice(index, 1);
          }
        }
      }

      context.globalAlpha = 1;

      animationFrame =
        requestAnimationFrame(draw);
    };

    /**
     * Handle reduced-motion changes.
     */
    const handleMotionChange = (
      event: MediaQueryListEvent,
    ) => {
      reducedMotion = event.matches;
    };

    /**
     * Handle pointer capability changes.
     */
    const handlePointerChange = (
      event: MediaQueryListEvent,
    ) => {
      touchDevice = event.matches;

      if (touchDevice) {
        pointer.active = false;
      }
    };

    resize();

    window.addEventListener(
      "resize",
      resize,
    );

    window.addEventListener(
      "pointermove",
      handlePointerMove,
      { passive: true },
    );

    window.addEventListener(
      "pointerdown",
      handlePointerDown,
      { passive: true },
    );

    window.addEventListener(
      "blur",
      handlePointerLeave,
    );

    document.addEventListener(
      "mouseleave",
      handlePointerLeave,
    );

    reducedMotionQuery.addEventListener(
      "change",
      handleMotionChange,
    );

    touchQuery.addEventListener(
      "change",
      handlePointerChange,
    );

    animationFrame =
      requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrame);

      window.removeEventListener(
        "resize",
        resize,
      );

      window.removeEventListener(
        "pointermove",
        handlePointerMove,
      );

      window.removeEventListener(
        "pointerdown",
        handlePointerDown,
      );

      window.removeEventListener(
        "blur",
        handlePointerLeave,
      );

      document.removeEventListener(
        "mouseleave",
        handlePointerLeave,
      );

      reducedMotionQuery.removeEventListener(
        "change",
        handleMotionChange,
      );

      touchQuery.removeEventListener(
        "change",
        handlePointerChange,
      );
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="cursor-wave-background"
      aria-hidden="true"
    />
  );
}