/**
 * App Icons — Iconische SVG iconen voor het c.k.v. Oranje Wit ecosysteem.
 *
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
export { TiStudioIcon } from "./icons/ti-studio-icon";
export { EvaluatieIcon } from "./icons/evaluatie-icon";
export { ScoutingIcon } from "./icons/scouting-icon";
export { BeheerIcon } from "./icons/beheer-icon";
export { BeleidIcon } from "./icons/beleid-icon";
export { WwwIcon } from "./icons/www-icon";

// ─── Lookup map en exports ─────────────────────────────────────────

import type { AppId } from "./icons/types";
import { APP_ACCENTS } from "./icons/types";
import { MonitorIcon } from "./icons/monitor-icon";
import { TeamIndelingIcon } from "./icons/team-indeling-icon";
import { TiStudioIcon } from "./icons/ti-studio-icon";
import { EvaluatieIcon } from "./icons/evaluatie-icon";
import { ScoutingIcon } from "./icons/scouting-icon";
import { BeheerIcon } from "./icons/beheer-icon";
import { BeleidIcon } from "./icons/beleid-icon";
import { WwwIcon } from "./icons/www-icon";

export const APP_ICONS: Record<AppId, typeof MonitorIcon> = {
  www: WwwIcon,
  monitor: MonitorIcon,
  "team-indeling": TeamIndelingIcon,
  "ti-studio": TiStudioIcon,
  evaluatie: EvaluatieIcon,
  scouting: ScoutingIcon,
  beheer: BeheerIcon,
  beleid: BeleidIcon,
};

/** Alle app-IDs in volgorde (voor iteratie) */
export const APP_IDS: AppId[] = [
  "www",
  "monitor",
  "team-indeling",
  "ti-studio",
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
  www: {
    name: "Mijn OW",
    description: "Mijn Oranje Wit",
    url: "/",
    accent: APP_ACCENTS.www,
  },
  monitor: {
    name: "Monitor",
    description: "Verenigingsmonitor",
    url: "/monitor",
    accent: APP_ACCENTS.monitor,
  },
  "team-indeling": {
    name: "Teams",
    description: "Teamindeling",
    url: "/teamindeling",
    accent: APP_ACCENTS["team-indeling"],
  },
  "ti-studio": {
    name: "TI Studio",
    description: "Werkplaats teamindeling",
    url: "/ti-studio/indeling",
    accent: APP_ACCENTS["ti-studio"],
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
