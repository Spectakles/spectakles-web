/**
 * SpectaklesLogo — official brand mark (icon only, no wordmark).
 *
 * Uses the official Spectakles SVG asset directly so the exact shape,
 * colours, and proportions are always preserved.
 *
 * Usage:
 *   <SpectaklesLogo width={40} />           // fixed width, auto height
 *   <SpectaklesLogo className="h-8 w-auto" /> // Tailwind sizing
 */

import spectaklesLogoSrc from "../assets/spectakles-logo-horizontal-navbar.svg";
import spectaklesLogoWhiteSrc from "../assets/spectakles-logo-horizontal-white.svg";

interface SpectaklesLogoProps {
  /** CSS class(es) applied to the <img> element */
  className?: string;
  /** Pixel width. Height scales automatically from the 976×525 viewBox. */
  width?: number;
  /** Pixel height. Width scales automatically. */
  height?: number;
  /** Accessible label (defaults to "Spectakles logo") */
  alt?: string;
  /** Color variant: default (black wordmark) or white (white wordmark for dark backgrounds) */
  variant?: "default" | "white";
}

export default function SpectaklesLogo({
  className = "",
  width,
  height,
  alt = "Spectakles logo",
  variant = "default",
}: SpectaklesLogoProps) {
  const calculatedWidth = width ?? (height ? Math.round(height * (1433 / 231)) : undefined);
  const calculatedHeight = height ?? (width ? Math.round(width * (231 / 1433)) : undefined);
  const logoSrc = variant === "white" ? spectaklesLogoWhiteSrc : spectaklesLogoSrc;

  return (
    <img
      src={logoSrc}
      alt={alt}
      width={calculatedWidth}
      height={calculatedHeight}
      className={className}
      style={{
        objectFit: "contain",
        aspectRatio: "1433 / 231",
        height: height ? `${height}px` : undefined,
        width: width ? `${width}px` : "auto",
        maxWidth: "100%",
      }}
      draggable={false}
    />
  );
}
