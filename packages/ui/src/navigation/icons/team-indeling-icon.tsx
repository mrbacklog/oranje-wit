/**
 * TEAM-INDELING — Formatie / Strategie
 * Vier knooppunten in een korfbalformatie (ruit/diamant)
 * verbonden door lijnen. Suggereert teamstructuur en plaatsing.
 */

import type { AppIconProps } from "./types";
import { getConfig, getColor } from "./types";

export function TeamIndelingIcon({ className, size = "md", accent }: AppIconProps) {
  const cfg = getConfig(size);
  const color = getColor(accent, "team-indeling");

  if (size === "sm") {
    return (
      <svg
        viewBox={cfg.viewBox}
        fill="none"
        className={className ?? cfg.className}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Verbindingslijnen (eerst, achtergrond) */}
        <path
          d="M12 4L5 12M12 4L19 12M5 12L12 18M19 12L12 18M5 12L19 12"
          stroke={color}
          strokeWidth={1}
          strokeLinecap="round"
          opacity="0.4"
        />
        {/* 4 knooppunten in diamant */}
        <circle cx="12" cy="4" r="2" stroke={color} strokeWidth={cfg.stroke} />
        <circle cx="5" cy="12" r="2" stroke={color} strokeWidth={cfg.stroke} />
        <circle cx="19" cy="12" r="2" stroke={color} strokeWidth={cfg.stroke} />
        <circle cx="12" cy="18" r="2" stroke={color} strokeWidth={cfg.stroke} />
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
        {/* Verbindingslijnen */}
        <path
          d="M24 8L10 24M24 8L38 24M10 24L24 36M38 24L24 36M10 24L38 24"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          opacity="0.35"
        />
        {/* 4 knooppunten in diamant */}
        <circle cx="24" cy="8" r="3.5" stroke={color} strokeWidth={cfg.stroke} />
        <circle cx="10" cy="24" r="3.5" stroke={color} strokeWidth={cfg.stroke} />
        <circle cx="38" cy="24" r="3.5" stroke={color} strokeWidth={cfg.stroke} />
        <circle cx="24" cy="36" r="3.5" stroke={color} strokeWidth={cfg.stroke} />
      </svg>
    );
  }

  // lg — extra detail: subtiel veld-achtergrond, extra crosslinks
  return (
    <svg
      viewBox={cfg.viewBox}
      fill="none"
      className={className ?? cfg.className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Subtiel veld (cirkel achtergrond) */}
      <circle cx="48" cy="48" r="38" stroke={color} strokeWidth={0.75} opacity="0.12" />
      <line x1="10" y1="48" x2="86" y2="48" stroke={color} strokeWidth={0.75} opacity="0.12" />
      {/* Verbindingslijnen */}
      <path
        d="M48 14L20 48M48 14L76 48M20 48L48 72M76 48L48 72M20 48L76 48"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity="0.3"
      />
      {/* Diagonale cross-links */}
      <path
        d="M48 14L20 48M48 14L76 48"
        stroke={color}
        strokeWidth={1}
        strokeLinecap="round"
        strokeDasharray="3 3"
        opacity="0.15"
      />
      {/* 4 knooppunten */}
      <circle cx="48" cy="14" r="7" stroke={color} strokeWidth={cfg.stroke} />
      <circle cx="20" cy="48" r="7" stroke={color} strokeWidth={cfg.stroke} />
      <circle cx="76" cy="48" r="7" stroke={color} strokeWidth={cfg.stroke} />
      <circle cx="48" cy="72" r="7" stroke={color} strokeWidth={cfg.stroke} />
      {/* Inner dots (spelers in positie) */}
      <circle cx="48" cy="14" r="2.5" fill={color} opacity="0.5" />
      <circle cx="20" cy="48" r="2.5" fill={color} opacity="0.5" />
      <circle cx="76" cy="48" r="2.5" fill={color} opacity="0.5" />
      <circle cx="48" cy="72" r="2.5" fill={color} opacity="0.5" />
    </svg>
  );
}
