/**
 * TI-STUDIO — Werkplaats / Editor
 * Een raster (blauwdruk) met een potlood-overlay.
 * Suggereert bouwen en bewerken — de desktop werkplaats.
 */

import type { AppIconProps } from "./types";
import { getConfig, getColor } from "./types";

export function TiStudioIcon({ className, size = "md", accent }: AppIconProps) {
  const cfg = getConfig(size);
  const color = getColor(accent, "ti-studio");

  if (size === "sm") {
    return (
      <svg
        viewBox={cfg.viewBox}
        fill="none"
        className={className ?? cfg.className}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Raster achtergrond */}
        <rect
          x="3"
          y="3"
          width="12"
          height="12"
          rx="1"
          stroke={color}
          strokeWidth={cfg.stroke}
          opacity="0.4"
        />
        <line x1="3" y1="7" x2="15" y2="7" stroke={color} strokeWidth={0.8} opacity="0.3" />
        <line x1="3" y1="11" x2="15" y2="11" stroke={color} strokeWidth={0.8} opacity="0.3" />
        <line x1="7" y1="3" x2="7" y2="15" stroke={color} strokeWidth={0.8} opacity="0.3" />
        <line x1="11" y1="3" x2="11" y2="15" stroke={color} strokeWidth={0.8} opacity="0.3" />
        {/* Potlood */}
        <path d="M14 10l-4 4H14v-4z" fill={color} opacity="0.2" />
        <path
          d="M14 10l-4 4M18 6l-4 4M16 4l2 2-8 8-2.5.5.5-2.5L16 4z"
          stroke={color}
          strokeWidth={cfg.stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
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
        {/* Raster */}
        <rect
          x="6"
          y="6"
          width="24"
          height="24"
          rx="2"
          stroke={color}
          strokeWidth={cfg.stroke}
          opacity="0.35"
        />
        <line x1="6" y1="14" x2="30" y2="14" stroke={color} strokeWidth={1.2} opacity="0.25" />
        <line x1="6" y1="22" x2="30" y2="22" stroke={color} strokeWidth={1.2} opacity="0.25" />
        <line x1="14" y1="6" x2="14" y2="30" stroke={color} strokeWidth={1.2} opacity="0.25" />
        <line x1="22" y1="6" x2="22" y2="30" stroke={color} strokeWidth={1.2} opacity="0.25" />
        {/* Potlood */}
        <path d="M28 18l-8 8H28v-8z" fill={color} opacity="0.15" />
        <path
          d="M32 10l-4-4-12 12-1 5 5-1 12-12zM28 14l-4-4"
          stroke={color}
          strokeWidth={cfg.stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
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
      {/* Raster */}
      <rect
        x="12"
        y="12"
        width="48"
        height="48"
        rx="4"
        stroke={color}
        strokeWidth={cfg.stroke}
        opacity="0.35"
      />
      <line x1="12" y1="28" x2="60" y2="28" stroke={color} strokeWidth={2} opacity="0.25" />
      <line x1="12" y1="44" x2="60" y2="44" stroke={color} strokeWidth={2} opacity="0.25" />
      <line x1="28" y1="12" x2="28" y2="60" stroke={color} strokeWidth={2} opacity="0.25" />
      <line x1="44" y1="12" x2="44" y2="60" stroke={color} strokeWidth={2} opacity="0.25" />
      {/* Potlood */}
      <path d="M56 36l-16 16H56V36z" fill={color} opacity="0.15" />
      <path
        d="M64 20l-8-8L24 44l-2 10 10-2 32-32zM56 28l-8-8"
        stroke={color}
        strokeWidth={cfg.stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
