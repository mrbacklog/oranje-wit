/**
 * WWW — Huis/Home
 * Gestileerd huis-icoon dat "Mijn Oranje Wit" vertegenwoordigt.
 * Warm, uitnodigend — de thuisbasis van het platform.
 */

import type { AppIconProps } from "./types";
import { getConfig, getColor } from "./types";

export function WwwIcon({ className, size = "md", accent }: AppIconProps) {
  const cfg = getConfig(size);
  const color = getColor(accent, "www");

  if (size === "sm") {
    return (
      <svg
        viewBox={cfg.viewBox}
        fill="none"
        className={className ?? cfg.className}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Dak */}
        <path
          d="M3 10l9-7 9 7"
          stroke={color}
          strokeWidth={cfg.stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Huis */}
        <path
          d="M5 10v9a1 1 0 001 1h12a1 1 0 001-1v-9"
          stroke={color}
          strokeWidth={cfg.stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Deur */}
        <path
          d="M9 20v-6h6v6"
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
        {/* Dak */}
        <path
          d="M6 20l18-14 18 14"
          stroke={color}
          strokeWidth={cfg.stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Huis */}
        <path
          d="M10 20v18a2 2 0 002 2h24a2 2 0 002-2V20"
          stroke={color}
          strokeWidth={cfg.stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Deur */}
        <path
          d="M18 40v-12h12v12"
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
      {/* Dak */}
      <path
        d="M12 40l36-28 36 28"
        stroke={color}
        strokeWidth={cfg.stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Huis */}
      <path
        d="M20 40v36a4 4 0 004 4h48a4 4 0 004-4V40"
        stroke={color}
        strokeWidth={cfg.stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Deur */}
      <path
        d="M36 80v-24h24v24"
        stroke={color}
        strokeWidth={cfg.stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Raam links */}
      <rect
        x="30"
        y="46"
        width="10"
        height="8"
        rx="1"
        stroke={color}
        strokeWidth={cfg.stroke * 0.7}
        opacity="0.5"
      />
      {/* Raam rechts */}
      <rect
        x="56"
        y="46"
        width="10"
        height="8"
        rx="1"
        stroke={color}
        strokeWidth={cfg.stroke * 0.7}
        opacity="0.5"
      />
    </svg>
  );
}
