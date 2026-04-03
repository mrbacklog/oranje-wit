// ─── Types ─────────────────────────────────────────────────────────

export interface AppIconProps {
  className?: string;
  /** sm = 24px sidebar, md = 48px switcher, lg = 96px launcher */
  size?: "sm" | "md" | "lg";
  /** true = accent kleur, false = currentColor */
  accent?: boolean;
}

export type AppId =
  | "www"
  | "monitor"
  | "team-indeling"
  | "ti-studio"
  | "evaluatie"
  | "scouting"
  | "beheer"
  | "beleid";

// ─── Accent kleuren per app ────────────────────────────────────────

export const APP_ACCENTS: Record<AppId, string> = {
  www: "#f97316",
  monitor: "#22c55e",
  "team-indeling": "#3b82f6", // blauw — mobiel veldkantoor
  "ti-studio": "#6366f1", // indigo — desktop werkplaats
  evaluatie: "#eab308",
  scouting: "#ff6b00",
  beheer: "#9ca3af",
  beleid: "#a855f7",
};

// ─── Size config ───────────────────────────────────────────────────

const SIZE_CONFIG = {
  sm: { viewBox: "0 0 24 24", className: "h-6 w-6", stroke: 1.5 },
  md: { viewBox: "0 0 48 48", className: "h-12 w-12", stroke: 2 },
  lg: { viewBox: "0 0 96 96", className: "h-24 w-24", stroke: 2.5 },
} as const;

// ─── Helpers ───────────────────────────────────────────────────────

export function getConfig(size: "sm" | "md" | "lg" = "md") {
  return SIZE_CONFIG[size];
}

export function getColor(accent: boolean | undefined, appId: AppId) {
  return accent ? APP_ACCENTS[appId] : "currentColor";
}
