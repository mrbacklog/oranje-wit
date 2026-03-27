/**
 * SCOUTING — Vergrootglas met speurfocus
 * Vergrootglas met een klein vizier/crosshair binnenin.
 * "Ontdekken" + "scherp kijken" + "talent spotten".
 */

import type { AppIconProps } from "./types";
import { getConfig, getColor } from "./types";

export function ScoutingIcon({ className, size = "md", accent }: AppIconProps) {
  const cfg = getConfig(size);
  const color = getColor(accent, "scouting");

  if (size === "sm") {
    return (
      <svg
        viewBox={cfg.viewBox}
        fill="none"
        className={className ?? cfg.className}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Vergrootglas cirkel */}
        <circle cx="10.5" cy="10.5" r="7" stroke={color} strokeWidth={cfg.stroke} />
        {/* Handvat */}
        <path d="M16 16l5 5" stroke={color} strokeWidth={cfg.stroke} strokeLinecap="round" />
        {/* Crosshair binnenin */}
        <path
          d="M10.5 7v7M7 10.5h7"
          stroke={color}
          strokeWidth={1}
          strokeLinecap="round"
          opacity="0.5"
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
        {/* Vergrootglas cirkel */}
        <circle cx="20" cy="20" r="13" stroke={color} strokeWidth={cfg.stroke} />
        {/* Handvat */}
        <path
          d="M30 30l10 10"
          stroke={color}
          strokeWidth={cfg.stroke + 0.5}
          strokeLinecap="round"
        />
        {/* Crosshair binnenin */}
        <path
          d="M20 13v14M13 20h14"
          stroke={color}
          strokeWidth={1.25}
          strokeLinecap="round"
          opacity="0.4"
        />
        {/* Center dot */}
        <circle cx="20" cy="20" r="1.5" fill={color} opacity="0.5" />
      </svg>
    );
  }

  // lg — extra: binnenste ring, gestippelde crosshair, detectie-feel
  return (
    <svg
      viewBox={cfg.viewBox}
      fill="none"
      className={className ?? cfg.className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Vergrootglas cirkel */}
      <circle cx="40" cy="40" r="26" stroke={color} strokeWidth={cfg.stroke} />
      {/* Inner ring */}
      <circle
        cx="40"
        cy="40"
        r="18"
        stroke={color}
        strokeWidth={1}
        opacity="0.15"
        strokeDasharray="4 3"
      />
      {/* Handvat */}
      <path d="M59 59l22 22" stroke={color} strokeWidth={cfg.stroke + 1} strokeLinecap="round" />
      {/* Handvat grip detail */}
      <path d="M68 68l4 4" stroke={color} strokeWidth={1} strokeLinecap="round" opacity="0.3" />
      {/* Crosshair */}
      <path
        d="M40 22v36M22 40h36"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity="0.3"
      />
      {/* Center bullseye */}
      <circle cx="40" cy="40" r="3" fill={color} opacity="0.4" />
      <circle cx="40" cy="40" r="7" stroke={color} strokeWidth={1} opacity="0.2" />
    </svg>
  );
}
