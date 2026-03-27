/**
 * MONITOR — Pulse/Hartslag
 * ECG-hartslaglijn die door een afgerond scherm loopt.
 * Subtiel scherm = "dashboard", pulse = "live monitoring".
 */

import type { AppIconProps } from "./types";
import { getConfig, getColor } from "./types";

export function MonitorIcon({ className, size = "md", accent }: AppIconProps) {
  const cfg = getConfig(size);
  const color = getColor(accent, "monitor");

  if (size === "sm") {
    return (
      <svg
        viewBox={cfg.viewBox}
        fill="none"
        className={className ?? cfg.className}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Monitor frame */}
        <rect
          x="3"
          y="4"
          width="18"
          height="13"
          rx="2"
          stroke={color}
          strokeWidth={cfg.stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Stand */}
        <path d="M8 20h8" stroke={color} strokeWidth={cfg.stroke} strokeLinecap="round" />
        <path d="M12 17v3" stroke={color} strokeWidth={cfg.stroke} strokeLinecap="round" />
        {/* ECG pulse line */}
        <path
          d="M6 11h2.5l1.5-3 2 6 2-6 1.5 3H18"
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
        {/* Monitor frame */}
        <rect
          x="6"
          y="8"
          width="36"
          height="24"
          rx="4"
          stroke={color}
          strokeWidth={cfg.stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Stand */}
        <path d="M16 38h16" stroke={color} strokeWidth={cfg.stroke} strokeLinecap="round" />
        <path d="M24 32v6" stroke={color} strokeWidth={cfg.stroke} strokeLinecap="round" />
        {/* ECG pulse line */}
        <path
          d="M12 21h4.5l3-5.5 4 11 4-11 3 5.5H36"
          stroke={color}
          strokeWidth={cfg.stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // lg — extra detail: subtiele grid lines in het scherm
  return (
    <svg
      viewBox={cfg.viewBox}
      fill="none"
      className={className ?? cfg.className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Monitor frame */}
      <rect
        x="12"
        y="14"
        width="72"
        height="48"
        rx="8"
        stroke={color}
        strokeWidth={cfg.stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Stand */}
      <path d="M32 74h32" stroke={color} strokeWidth={cfg.stroke} strokeLinecap="round" />
      <path d="M48 62v12" stroke={color} strokeWidth={cfg.stroke} strokeLinecap="round" />
      {/* Subtle grid lines */}
      <path
        d="M20 30h56M20 42h56M20 54h56"
        stroke={color}
        strokeWidth={0.5}
        strokeLinecap="round"
        opacity="0.2"
      />
      {/* ECG pulse line — main */}
      <path
        d="M22 42h9l6-12 8 24 8-24 6 12H70"
        stroke={color}
        strokeWidth={cfg.stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Small dot at pulse peak */}
      <circle cx="45" cy="30" r="2" fill={color} opacity="0.6" />
    </svg>
  );
}
