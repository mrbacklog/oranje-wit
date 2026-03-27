/**
 * EVALUATIE — Ster op klembord
 * Klembord met een prominente ster. Combineert "beoordeling" met
 * "gestructureerde feedback". De ster geeft het geel/goud-gevoel.
 */

import type { AppIconProps } from "./types";
import { getConfig, getColor } from "./types";

export function EvaluatieIcon({ className, size = "md", accent }: AppIconProps) {
  const cfg = getConfig(size);
  const color = getColor(accent, "evaluatie");

  if (size === "sm") {
    return (
      <svg
        viewBox={cfg.viewBox}
        fill="none"
        className={className ?? cfg.className}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Klembord body */}
        <path
          d="M8 5H6.5A1.5 1.5 0 005 6.5v13A1.5 1.5 0 006.5 21h11a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0017.5 5H16"
          stroke={color}
          strokeWidth={cfg.stroke}
          strokeLinecap="round"
        />
        {/* Clipboard clip */}
        <rect x="8" y="3" width="8" height="3.5" rx="1" stroke={color} strokeWidth={cfg.stroke} />
        {/* Star centered on clipboard */}
        <path
          d="M12 9.5l1.76 3.57 3.94.57-2.85 2.78.67 3.93L12 18.35l-3.52 1.85.67-3.93-2.85-2.78 3.94-.57L12 9.5z"
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
        {/* Klembord body */}
        <path
          d="M16 10H13a3 3 0 00-3 3v22a3 3 0 003 3h22a3 3 0 003-3V13a3 3 0 00-3-3h-3"
          stroke={color}
          strokeWidth={cfg.stroke}
          strokeLinecap="round"
        />
        {/* Clipboard clip */}
        <rect x="16" y="6" width="16" height="6" rx="2" stroke={color} strokeWidth={cfg.stroke} />
        {/* Star */}
        <path
          d="M24 18l3.53 7.14 7.88 1.15-5.7 5.56 1.35 7.85L24 35.64l-7.06 3.71 1.35-7.85-5.7-5.56 7.88-1.15L24 18z"
          stroke={color}
          strokeWidth={cfg.stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // lg — extra: lijntjes op het klembord, ster groter
  return (
    <svg
      viewBox={cfg.viewBox}
      fill="none"
      className={className ?? cfg.className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Klembord body */}
      <path
        d="M32 18H26a6 6 0 00-6 6v46a6 6 0 006 6h44a6 6 0 006-6V24a6 6 0 00-6-6h-6"
        stroke={color}
        strokeWidth={cfg.stroke}
        strokeLinecap="round"
      />
      {/* Clipboard clip */}
      <rect x="32" y="10" width="32" height="12" rx="4" stroke={color} strokeWidth={cfg.stroke} />
      {/* Subtle lines (text placeholder) */}
      <path
        d="M30 66h36M30 72h24"
        stroke={color}
        strokeWidth={1}
        strokeLinecap="round"
        opacity="0.2"
      />
      {/* Star — larger, more prominent */}
      <path
        d="M48 32l7.06 14.28 15.76 2.29-11.41 11.12 2.69 15.71L48 68.28l-14.1 7.42 2.69-15.71-11.41-11.12 15.76-2.29L48 32z"
        stroke={color}
        strokeWidth={cfg.stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner star glow dot */}
      <circle cx="48" cy="52" r="3" fill={color} opacity="0.3" />
    </svg>
  );
}
