/* eslint-disable max-lines */
/**
 * App Icons — Iconische SVG iconen voor het c.k.v. Oranje Wit ecosysteem.
 *
 * 5 unieke, premium iconen in 3 maten (sm/md/lg).
 * Stijl: stroke-based, monochroom met optionele accent-kleur, consistent visueel gewicht.
 * Geïnspireerd door Strava, Nike Run Club, Apple Fitness.
 */

// ─── Types ─────────────────────────────────────────────────────────

export interface AppIconProps {
  className?: string;
  /** sm = 24px sidebar, md = 48px switcher, lg = 96px launcher */
  size?: "sm" | "md" | "lg";
  /** true = accent kleur, false = currentColor */
  accent?: boolean;
}

type AppId = "monitor" | "team-indeling" | "evaluatie" | "scouting" | "beheer";

// ─── Accent kleuren per app ────────────────────────────────────────

export const APP_ACCENTS: Record<AppId, string> = {
  monitor: "#22c55e",
  "team-indeling": "#3b82f6",
  evaluatie: "#eab308",
  scouting: "#ff6b00",
  beheer: "#9ca3af",
};

// ─── Size config ───────────────────────────────────────────────────

const SIZE_CONFIG = {
  sm: { viewBox: "0 0 24 24", className: "h-6 w-6", stroke: 1.5 },
  md: { viewBox: "0 0 48 48", className: "h-12 w-12", stroke: 2 },
  lg: { viewBox: "0 0 96 96", className: "h-24 w-24", stroke: 2.5 },
} as const;

// ─── Helpers ───────────────────────────────────────────────────────

function getConfig(size: "sm" | "md" | "lg" = "md") {
  return SIZE_CONFIG[size];
}

function getColor(accent: boolean | undefined, appId: AppId) {
  return accent ? APP_ACCENTS[appId] : "currentColor";
}

// ═══════════════════════════════════════════════════════════════════
//  MONITOR — Pulse/Hartslag
//  ECG-hartslaglijn die door een afgerond scherm loopt.
//  Subtiel scherm = "dashboard", pulse = "live monitoring".
// ═══════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════
//  TEAM-INDELING — Formatie / Strategie
//  Vier knooppunten in een korfbalformatie (ruit/diamant)
//  verbonden door lijnen. Suggereert teamstructuur en plaatsing.
// ═══════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════
//  EVALUATIE — Ster op klembord
//  Klembord met een prominente ster. Combineert "beoordeling" met
//  "gestructureerde feedback". De ster geeft het geel/goud-gevoel.
// ═══════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════
//  SCOUTING — Vergrootglas met speurfocus
//  Vergrootglas met een klein vizier/crosshair binnenin.
//  "Ontdekken" + "scherp kijken" + "talent spotten".
// ═══════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════
//  BEHEER — Tandwiel / Configuratie
//  Strak tandwiel met zeshoekig centrum. Premium feel door
//  geometrische precisie. "Onder de motorkap", "het bureau van de TC".
// ═══════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════
//  Lookup map en exports
// ═══════════════════════════════════════════════════════════════════

export const APP_ICONS: Record<AppId, typeof MonitorIcon> = {
  monitor: MonitorIcon,
  "team-indeling": TeamIndelingIcon,
  evaluatie: EvaluatieIcon,
  scouting: ScoutingIcon,
  beheer: BeheerIcon,
};

/** Alle app-IDs in volgorde (voor iteratie) */
export const APP_IDS: AppId[] = ["monitor", "team-indeling", "evaluatie", "scouting", "beheer"];

/** App metadata voor gebruik in launchers en navigatie */
export const APP_META: Record<
  AppId,
  { name: string; description: string; url: string; accent: string }
> = {
  monitor: {
    name: "Monitor",
    description: "Verenigingsmonitor",
    url: "https://monitor.ckvoranjewit.app",
    accent: APP_ACCENTS.monitor,
  },
  "team-indeling": {
    name: "Teams",
    description: "Teamindeling",
    url: "https://teamindeling.ckvoranjewit.app",
    accent: APP_ACCENTS["team-indeling"],
  },
  evaluatie: {
    name: "Evaluatie",
    description: "Spelerevaluaties",
    url: "https://evaluatie.ckvoranjewit.app",
    accent: APP_ACCENTS.evaluatie,
  },
  scouting: {
    name: "Scout",
    description: "Jeugdscouting",
    url: "https://scout.ckvoranjewit.app",
    accent: APP_ACCENTS.scouting,
  },
  beheer: {
    name: "Beheer",
    description: "TC Beheer",
    url: "https://beheer.ckvoranjewit.app",
    accent: APP_ACCENTS.beheer,
  },
};
