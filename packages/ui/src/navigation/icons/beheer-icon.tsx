/**
 * BEHEER — Tandwiel / Configuratie
 * Strak tandwiel met zeshoekig centrum. Premium feel door
 * geometrische precisie. "Onder de motorkap", "het bureau van de TC".
 */

import type { AppIconProps } from "./types";
import { getConfig, getColor } from "./types";

export function BeheerIcon({ className, size = "md", accent }: AppIconProps) {
  const cfg = getConfig(size);
  const color = getColor(accent, "beheer");

  if (size === "sm") {
    return (
      <svg
        viewBox={cfg.viewBox}
        fill="none"
        className={className ?? cfg.className}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Gear outer — 8 teeth via a clean path */}
        <path
          d="M10.325 4.317a1.724 1.724 0 013.35 0l.2.574a1.724 1.724 0 002.573.95l.49-.34a1.724 1.724 0 012.37 2.37l-.34.49a1.724 1.724 0 00.95 2.573l.574.2a1.724 1.724 0 010 3.35l-.574.2a1.724 1.724 0 00-.95 2.573l.34.49a1.724 1.724 0 01-2.37 2.37l-.49-.34a1.724 1.724 0 00-2.573.95l-.2.574a1.724 1.724 0 01-3.35 0l-.2-.574a1.724 1.724 0 00-2.573-.95l-.49.34a1.724 1.724 0 01-2.37-2.37l.34-.49a1.724 1.724 0 00-.95-2.573l-.574-.2a1.724 1.724 0 010-3.35l.574-.2a1.724 1.724 0 00.95-2.573l-.34-.49a1.724 1.724 0 012.37-2.37l.49.34a1.724 1.724 0 002.573-.95l.2-.574z"
          stroke={color}
          strokeWidth={cfg.stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Center circle */}
        <circle cx="12" cy="12" r="3" stroke={color} strokeWidth={cfg.stroke} />
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
        {/* Gear — scaled version */}
        <path
          d="M20.65 8.634a3.448 3.448 0 016.7 0l.4 1.148a3.448 3.448 0 005.146 1.9l.98-.68a3.448 3.448 0 014.74 4.74l-.68.98a3.448 3.448 0 001.9 5.146l1.148.4a3.448 3.448 0 010 6.7l-1.148.4a3.448 3.448 0 00-1.9 5.146l.68.98a3.448 3.448 0 01-4.74 4.74l-.98-.68a3.448 3.448 0 00-5.146 1.9l-.4 1.148a3.448 3.448 0 01-6.7 0l-.4-1.148a3.448 3.448 0 00-5.146-1.9l-.98.68a3.448 3.448 0 01-4.74-4.74l.68-.98a3.448 3.448 0 00-1.9-5.146l-1.148-.4a3.448 3.448 0 010-6.7l1.148-.4a3.448 3.448 0 001.9-5.146l-.68-.98a3.448 3.448 0 014.74-4.74l.98.68a3.448 3.448 0 005.146-1.9l.4-1.148z"
          stroke={color}
          strokeWidth={cfg.stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Center circle */}
        <circle cx="24" cy="24" r="6" stroke={color} strokeWidth={cfg.stroke} />
      </svg>
    );
  }

  // lg — inner hexagon detail, subtiel OW initialen hint
  return (
    <svg
      viewBox={cfg.viewBox}
      fill="none"
      className={className ?? cfg.className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Gear — large */}
      <path
        d="M41.3 17.268a6.896 6.896 0 0113.4 0l.8 2.296a6.896 6.896 0 0010.292 3.8l1.96-1.36a6.896 6.896 0 019.48 9.48l-1.36 1.96a6.896 6.896 0 003.8 10.292l2.296.8a6.896 6.896 0 010 13.4l-2.296.8a6.896 6.896 0 00-3.8 10.292l1.36 1.96a6.896 6.896 0 01-9.48 9.48l-1.96-1.36a6.896 6.896 0 00-10.292 3.8l-.8 2.296a6.896 6.896 0 01-13.4 0l-.8-2.296a6.896 6.896 0 00-10.292-3.8l-1.96 1.36a6.896 6.896 0 01-9.48-9.48l1.36-1.96a6.896 6.896 0 00-3.8-10.292l-2.296-.8a6.896 6.896 0 010-13.4l2.296-.8a6.896 6.896 0 003.8-10.292l-1.36-1.96a6.896 6.896 0 019.48-9.48l1.96 1.36a6.896 6.896 0 0010.292-3.8l.8-2.296z"
        stroke={color}
        strokeWidth={cfg.stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Outer center ring */}
      <circle cx="48" cy="48" r="12" stroke={color} strokeWidth={cfg.stroke} />
      {/* Inner detail ring */}
      <circle cx="48" cy="48" r="6" stroke={color} strokeWidth={1} opacity="0.25" />
      {/* Center dot */}
      <circle cx="48" cy="48" r="2.5" fill={color} opacity="0.35" />
    </svg>
  );
}
