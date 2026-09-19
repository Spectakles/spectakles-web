import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 180;
const TAU = Math.PI * 2;

type Particle = {
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  delay: number;
  seed: number;
};

type Point = {
  x: number;
  y: number;
};

function addPath(points: Point[], path: Point[], count: number) {
  for (let i = 0; i < count; i++) {
    const progress = (i / count) * path.length;
    const segment = Math.floor(progress) % path.length;
    const remainder = progress - Math.floor(progress);
    const start = path[segment];
    const end = path[(segment + 1) % path.length];
    points.push({
      x: start.x + (end.x - start.x) * remainder,
      y: start.y + (end.y - start.y) * remainder,
    });
  }
}

function createSpectaclesTargets(): Point[] {
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
    75,
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
    42,
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
    42,
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
    21,
  );

  return points;
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

export default function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const container = canvas.parentElement;

    if (!container) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    const targetPoints = createSpectaclesTargets();

    const assignments = shuffle(
      Array.from({ length: PARTICLE_COUNT }, (_, index) => index),
    );

    const particles: Particle[] = Array.from(
      { length: PARTICLE_COUNT },
      (_, index) => {
        const target = targetPoints[assignments[index] % targetPoints.length];

        return {
          x: Math.random(),
          y: Math.random(),

          startX: Math.random(),
          startY: Math.random(),

          targetX: target.x,
          targetY: target.y,

          delay: Math.random() * 0.8,

          seed: Math.random() * TAU,
        };
      },
    );

    // Make the initial position equal to start position
    particles.forEach((particle) => {
      particle.x = particle.startX;
      particle.y = particle.startY;
    });

    let width = 0;
    let height = 0;
    let pixelRatio = 1;

    const startTime = performance.now();

    let animationFrame = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();

      width = rect.width;
      height = rect.height;

      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    resize();

    const resizeObserver = new ResizeObserver(resize);

    resizeObserver.observe(container);

    const easeInOut = (t: number) => {
      return t * t * (3 - 2 * t);
    };

    const animate = (now: number) => {
      const elapsed = (now - startTime) / 1000;

      context.clearRect(0, 0, width, height);

      particles.forEach((particle) => {
        // Individual particle delay
        const localTime = elapsed - particle.delay;

        // Formation takes ~3 seconds
        let progress = Math.max(0, Math.min(1, localTime / 3));

        progress = easeInOut(progress);

        // Current position between start and target
        let x =
          particle.startX + (particle.targetX - particle.startX) * progress;

        let y =
          particle.startY + (particle.targetY - particle.startY) * progress;

        // Very subtle movement AFTER formation
        if (progress >= 1) {
          const time = elapsed;
          const perspective = Math.sin(time * 0.22) * 0.025;

          x += Math.sin(time * 0.8 + particle.seed) * 0.0015;

          y += Math.cos(time * 0.7 + particle.seed) * 0.0015;

          x = 0.5 + (x - 0.5) * (1 + perspective);
          y = 0.5 + (y - 0.5) * (1 - Math.abs(perspective) * 0.18);
        }

        particle.x = x;
        particle.y = y;

        // Fade particles in during formation
        const alpha = 0.2 + progress * 0.75;

        // IMPORTANT:
        // Replace this with your existing theme color.
        context.fillStyle = `rgba(255,255,255,${alpha})`;

        context.beginPath();

        context.arc(particle.x * width, particle.y * height, 1.5, 0, TAU);

        context.fill();
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);

      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
