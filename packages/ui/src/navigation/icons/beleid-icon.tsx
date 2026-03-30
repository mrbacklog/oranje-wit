/**
 * BELEID — Kompas
 * Cirkel met richtingsnaald: geeft richting zonder de exacte route voor te schrijven.
 * Symboliseert visie, fundament, beleid.
 */

import type { AppIconProps } from "./types";
import { getConfig, getColor } from "./types";

export function BeleidIcon({ className, size = "md", accent }: AppIconProps) {
  const cfg = getConfig(size);
  const color = getColor(accent, "beleid");

  if (size === "sm") {
    return (
      <svg
        viewBox={cfg.viewBox}
        fill="none"
        className={className ?? cfg.className}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Compass circle */}
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth={cfg.stroke} />
        {/* Compass needle — diamond shape */}
        <path
          d="M12 5l2.5 7L12 19l-2.5-7L12 5z"
          stroke={color}
          strokeWidth={cfg.stroke}
          strokeLinejoin="round"
        />
        {/* North fill */}
        <path d="M12 5l2.5 7H9.5L12 5z" fill={color} opacity="0.3" />
        {/* Center dot */}
        <circle cx="12" cy="12" r="1.5" fill={color} />
      </svg>
    );
  }

  if (size === "md") {
    return (
      <svg
        viewBox={cfg.viewBox}
        fill="none"
        className={className ?? cfg.className}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Compass circle */}
        <circle cx="24" cy="24" r="18" stroke={color} strokeWidth={cfg.stroke} />
        {/* Cardinal ticks */}
        <path
          d="M24 8v3M24 37v3M8 24h3M37 24h3"
          stroke={color}
          strokeWidth={cfg.stroke}
          strokeLinecap="round"
        />
        {/* Compass needle — diamond */}
        <path
          d="M24 10l5 14L24 38l-5-14L24 10z"
          stroke={color}
          strokeWidth={cfg.stroke}
          strokeLinejoin="round"
        />
        {/* North fill */}
        <path d="M24 10l5 14H19L24 10z" fill={color} opacity="0.3" />
        {/* Center dot */}
        <circle cx="24" cy="24" r="2.5" fill={color} />
      </svg>
    );
  }

  // lg
  return (
    <svg
      viewBox={cfg.viewBox}
      fill="none"
      className={className ?? cfg.className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Compass circle */}
      <circle cx="48" cy="48" r="36" stroke={color} strokeWidth={cfg.stroke} />
      {/* Cardinal ticks */}
      <path
        d="M48 14v6M48 76v6M14 48h6M76 48h6"
        stroke={color}
        strokeWidth={cfg.stroke}
        strokeLinecap="round"
      />
      {/* Subtle minor ticks */}
      <path
        d="M72 24l-4 3M24 72l3-4M72 72l-4-3M24 24l3 4"
        stroke={color}
        strokeWidth={1}
        strokeLinecap="round"
        opacity="0.3"
      />
      {/* Compass needle — diamond */}
      <path
        d="M48 20l10 28L48 76l-10-28L48 20z"
        stroke={color}
        strokeWidth={cfg.stroke}
        strokeLinejoin="round"
      />
      {/* North fill */}
      <path d="M48 20l10 28H38L48 20z" fill={color} opacity="0.3" />
      {/* Center dot */}
      <circle cx="48" cy="48" r="4" fill={color} />
    </svg>
  );
}
