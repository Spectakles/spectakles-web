"use client";

import {
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

type NeonRevealProps = {
  children?: ReactNode;

  revealDelay?: number;
  revealDuration?: number;

  direction?: "horizontal" | "vertical";

  color?: string;

  barWidth?: number;
  barHeight?: number;

  verticalOffset?: number;

  mirrored?: boolean;

  expandFrom?: "center" | "left" | "right";

  intensity?: number;
  glowSpread?: number;

  /*
   * Change this value whenever the
   * animation should replay.
   */
  trigger?: number;

  /*
   * Controls animation direction.
   */
  scrollDirection?: "forward" | "backward";

  className?: string;

  onStart?: () => void;
  onComplete?: () => void;
};

export default function NeonReveal({
  children,

  revealDelay = 0,

  revealDuration = 1800,

  direction = "horizontal",

  color = "#3c9b5a",

  barWidth = 1,

  barHeight = 0.014,

  verticalOffset=0.5,

  mirrored = false,

  expandFrom = "center",

  intensity = 1,

  glowSpread = 1,

  trigger = 0,

  scrollDirection = "forward",

  className = "",

  onStart,

  onComplete,
}: NeonRevealProps) {

  /*
   * IMPORTANT:
   *
   * Start at 1 so the first animation
   * actually exists when the page loads.
   */
  const [runId, setRunId] =
    useState(1);

  const previousTrigger =
    useRef(trigger);

  /*
   * Restart animation whenever
   * trigger changes.
   */
  useEffect(() => {

    if (
      trigger ===
      previousTrigger.current
    ) {
      return;
    }

    previousTrigger.current =
      trigger;

    setRunId(
      value => value + 1
    );

  }, [trigger]);

  /*
   * Animation callbacks.
   */
  useEffect(() => {

    if (runId === 0) {
      return;
    }

    if (revealDelay > 0) {
      const startTimer =
        window.setTimeout(() => {
          onStart?.();
        }, revealDelay);

      return () => {
        window.clearTimeout(
          startTimer
        );
      };
    }

    onStart?.();

  }, [
    runId,
    revealDelay,
    onStart,
  ]);

  useEffect(() => {

    const timer =
      window.setTimeout(() => {
        onComplete?.();
      }, revealDelay + revealDuration);

    return () => {
      window.clearTimeout(timer);
    };

  }, [
    runId,
    revealDelay,
    revealDuration,
    onComplete,
  ]);

  const safeOffset =
    Math.max(
      0,
      Math.min(
        verticalOffset,
        1
      )
    );

  const style = {
    "--neon-color": color,

    "--neon-duration":
      `${revealDuration}ms`,

    "--neon-delay":
      `${revealDelay}ms`,

    "--neon-width":
      `${
        Math.max(
          0.1,
          Math.min(
            barWidth,
            1
          )
        ) * 100
      }%`,

    "--neon-height":
      `${
        Math.max(
          0.002,
          Math.min(
            barHeight,
            1
          )
        ) * 100
      }%`,

    "--neon-intensity":
      intensity,

    "--neon-spread":
      `${glowSpread * 24}px`,

    "--neon-offset":
      `${safeOffset * 100}%`,

  } as React.CSSProperties;

  return (
    <div
      className={[
        "neon-reveal",

        direction === "vertical"
          ? "neon-reveal-vertical"
          : "neon-reveal-horizontal",

        `neon-reveal-from-${expandFrom}`,

        scrollDirection === "backward"
          ? "neon-reveal-backward"
          : "neon-reveal-forward",

        className,
      ]
        .filter(Boolean)
        .join(" ")}

      style={style}
    >

      <div className="neon-reveal-content">
        {children}
      </div>

      <div
        key={`bar-${runId}`}
        className="neon-reveal-bar"
        aria-hidden="true"
      />

      {mirrored && (
        <div
          key={`mirror-${runId}`}
          className="
            neon-reveal-bar
            neon-reveal-bar-mirror
          "
          aria-hidden="true"
        />
      )}

    </div>
  );
}