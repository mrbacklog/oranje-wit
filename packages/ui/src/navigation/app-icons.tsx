/**
 * App Icons — Iconische SVG iconen voor het c.k.v. Oranje Wit ecosysteem.
 *
 * 5 unieke, premium iconen in 3 maten (sm/md/lg).
 * Stijl: stroke-based, monochroom met optionele accent-kleur, consistent visueel gewicht.
 * Geïnspireerd door Strava, Nike Run Club, Apple Fitness.
 *
 * Individuele icon-componenten staan in ./icons/ voor betere onderhoudbaarheid.
 */

// ─── Re-exports ────────────────────────────────────────────────────

export type { AppIconProps } from "./icons/types";
export { APP_ACCENTS } from "./icons/types";
export type { AppId } from "./icons/types";

export { MonitorIcon } from "./icons/monitor-icon";
export { TeamIndelingIcon } from "./icons/team-indeling-icon";
export { EvaluatieIcon } from "./icons/evaluatie-icon";
export { ScoutingIcon } from "./icons/scouting-icon";
export { BeheerIcon } from "./icons/beheer-icon";
export { BeleidIcon } from "./icons/beleid-icon";

// ─── Lookup map en exports ─────────────────────────────────────────

import type { AppId } from "./icons/types";
import { APP_ACCENTS } from "./icons/types";
import { MonitorIcon } from "./icons/monitor-icon";
import { TeamIndelingIcon } from "./icons/team-indeling-icon";
import { EvaluatieIcon } from "./icons/evaluatie-icon";
import { ScoutingIcon } from "./icons/scouting-icon";
import { BeheerIcon } from "./icons/beheer-icon";
import { BeleidIcon } from "./icons/beleid-icon";

export const APP_ICONS: Record<AppId, typeof MonitorIcon> = {
  monitor: MonitorIcon,
  "team-indeling": TeamIndelingIcon,
  evaluatie: EvaluatieIcon,
  scouting: ScoutingIcon,
  beheer: BeheerIcon,
  beleid: BeleidIcon,
};

/** Alle app-IDs in volgorde (voor iteratie) */
export const APP_IDS: AppId[] = [
  "monitor",
  "team-indeling",
  "evaluatie",
  "scouting",
  "beheer",
  "beleid",
];

/** App metadata voor gebruik in launchers en navigatie */
export const APP_META: Record<
  AppId,
  { name: string; description: string; url: string; accent: string }
> = {
  monitor: {
    name: "Monitor",
    description: "Verenigingsmonitor",
    url: "/monitor",
    accent: APP_ACCENTS.monitor,
  },
  "team-indeling": {
    name: "Teams",
    description: "Teamindeling",
    url: "/ti-studio",
    accent: APP_ACCENTS["team-indeling"],
  },
  evaluatie: {
    name: "Evaluatie",
    description: "Spelerevaluaties",
    url: "/evaluatie",
    accent: APP_ACCENTS.evaluatie,
  },
  scouting: {
    name: "Scout",
    description: "Jeugdscouting",
    url: "/scouting",
    accent: APP_ACCENTS.scouting,
  },
  beheer: {
    name: "Beheer",
    description: "TC Beheer",
    url: "/beheer",
    accent: APP_ACCENTS.beheer,
  },
  beleid: {
    name: "Beleid",
    description: "TC Beleid",
    url: "/beleid",
    accent: APP_ACCENTS.beleid,
  },
};
