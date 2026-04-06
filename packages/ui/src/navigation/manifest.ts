/**
 * Navigatie-manifest — Single Source of Truth voor alle domein-app navigatie.
 *
 * Dit bestand definieert de volledige navigatiestructuur van alle 5 OW domein-apps.
 * DomainShell-componenten, de AppSwitcher, en het portaal importeren hieruit.
 * Agents en ontwikkelaars gebruiken dit als de enige waarheid.
 *
 * REGELS:
 * - Precies 4 functionele knoppen + 1 Apps-knop per app (altijd 5 posities)
 * - Positie 1 is de landingspagina — geen "Home" label, maar de primaire functie
 * - Elke app heeft een accent-kleur die subtiel door de UI schemerT (TopBar, active nav, pills)
 * - Pills groeperen sub-onderdelen binnen één bottom-nav-sectie
 * - Geen sidebar — navigatie is mobile-first via BottomNav + Pills
 */

import type { AppId } from "./icons/types";
import { APP_ACCENTS } from "./icons/types";

// ─── Types ──────────────────────────────────────────────────────

/** Bottom nav icon component signature */
export type NavIconComponent = (props: { active: boolean }) => React.ReactNode;

/** Een bottom-nav-item */
export interface ManifestNavItem {
  label: string;
  href: string;
  icon: string; // icon-naam uit @oranje-wit/ui (bijv. "HomeIcon", "ChartIcon")
}

/** Een pill (sub-navigatie binnen een bottom-nav-sectie) */
export interface ManifestPill {
  label: string;
  href: string;
}

/** Navigatie-definitie voor een bottom-nav-knop */
export interface ManifestSection {
  nav: ManifestNavItem;
  pills?: ManifestPill[];
}

/** Volledige navigatie-definitie voor een domein-app */
export interface AppManifest {
  id: AppId;
  name: string;
  shortName: string;
  description: string;
  baseUrl: string;
  accent: string;
  /** 4 bottom-nav-secties (positie 1-4, positie 5 is altijd Apps) */
  sections: [ManifestSection, ManifestSection, ManifestSection, ManifestSection];
  /** Routes waar de shell NIET wordt getoond (smartlinks, formulieren) */
  skipRoutes: string[];
  /** Wie ziet deze app? */
  visibility: {
    requireTC?: boolean;
    requireScout?: boolean;
    /** Zichtbaar voor iedereen (bijv. Evaluatie) */
    public?: boolean;
  };
  /** Minimale shell (alleen TopBar + AppSwitcher, geen BottomNav) */
  minimal?: boolean;
}

// ─── Mijn Oranje Wit (WWW) ──────────────────────────────────────

export const WWW: AppManifest = {
  id: "www",
  name: "Mijn Oranje Wit",
  shortName: "Mijn OW",
  description: "Persoonlijk overzicht, taken en nieuws",
  baseUrl: "/",
  accent: APP_ACCENTS.www,
  sections: [
    {
      nav: { label: "Overzicht", href: "/", icon: "HomeIcon" },
    },
    {
      nav: { label: "Taken", href: "/taken", icon: "ListIcon" },
    },
    {
      nav: { label: "Nieuws", href: "/nieuws", icon: "StarIcon" },
    },
    {
      nav: { label: "Profiel", href: "/profiel", icon: "ProfileIcon" },
    },
  ],
  skipRoutes: ["/login", "/auth"],
  visibility: { public: true },
};

// ─── Monitor ────────────────────────────────────────────────────

export const MONITOR: AppManifest = {
  id: "monitor",
  name: "Verenigingsmonitor",
  shortName: "Monitor",
  description: "Dashboards, ledendynamiek en signalering",
  baseUrl: "/monitor",
  accent: APP_ACCENTS.monitor,
  sections: [
    {
      nav: { label: "Overzicht", href: "/monitor", icon: "ChartIcon" },
    },
    {
      nav: { label: "Teams", href: "/monitor/teams", icon: "PeopleIcon" },
      pills: [
        { label: "Teams", href: "/monitor/teams" },
        { label: "Spelers", href: "/monitor/spelers" },
      ],
    },
    {
      nav: { label: "Analyse", href: "/monitor/samenstelling", icon: "CompareIcon" },
      pills: [
        { label: "Samenstelling", href: "/monitor/samenstelling" },
        { label: "Retentie", href: "/monitor/retentie" },
      ],
    },
    {
      nav: { label: "Signalen", href: "/monitor/signalering", icon: "StarIcon" },
    },
  ],
  skipRoutes: ["/login"],
  visibility: { requireTC: true },
};

// ─── TI Studio (desktop werkplaats) ────────────────────────────

export const TI_STUDIO: AppManifest = {
  id: "ti-studio",
  name: "TI Studio",
  shortName: "Studio",
  description: "Werkplaats teamindeling",
  baseUrl: "/ti-studio",
  accent: APP_ACCENTS["ti-studio"],
  sections: [
    {
      nav: { label: "Kaders", href: "/ti-studio/kaders", icon: "ListIcon" },
    },
    {
      nav: { label: "Indeling", href: "/ti-studio/indeling", icon: "GridIcon" },
    },
    {
      nav: { label: "Werkbord", href: "/ti-studio/werkbord", icon: "CompareIcon" },
    },
    {
      nav: { label: "Personen", href: "/ti-studio/personen", icon: "PeopleIcon" },
      pills: [
        { label: "Spelers", href: "/ti-studio/personen/spelers" },
        { label: "Staf", href: "/ti-studio/personen/staf" },
      ],
    },
  ],
  skipRoutes: [],
  visibility: { requireTC: true },
};

// ─── Team-Indeling (mobiel veldkantoor) ─────────────────────────

export const TEAM_INDELING: AppManifest = {
  id: "team-indeling",
  name: "Team-Indeling",
  shortName: "Teams",
  description: "Teams bekijken en scenario's reviewen",
  baseUrl: "/teamindeling",
  accent: APP_ACCENTS["team-indeling"],
  sections: [
    {
      nav: { label: "Indeling", href: "/teamindeling", icon: "GridIcon" },
    },
    {
      nav: { label: "Opvolging", href: "/teamindeling/opvolging", icon: "StarIcon" },
    },
    {
      nav: { label: "Personen", href: "/teamindeling/personen", icon: "PeopleIcon" },
      pills: [
        { label: "Spelers", href: "/teamindeling/personen/spelers" },
        { label: "Staf", href: "/teamindeling/personen/staf" },
      ],
    },
    {
      nav: { label: "Meer", href: "/teamindeling/meer", icon: "ListIcon" },
    },
  ],
  skipRoutes: [],
  visibility: { requireTC: false },
};

// ─── Evaluatie ──────────────────────────────────────────────────

export const EVALUATIE: AppManifest = {
  id: "evaluatie",
  name: "Evaluatie",
  shortName: "Evaluatie",
  description: "Spelerevaluaties en zelfevaluaties",
  baseUrl: "/evaluatie",
  accent: APP_ACCENTS.evaluatie,
  sections: [
    {
      nav: { label: "Overzicht", href: "/evaluatie", icon: "ListIcon" },
    },
    {
      nav: { label: "Rondes", href: "/evaluatie/admin", icon: "StarIcon" },
    },
    {
      nav: { label: "Teams", href: "/evaluatie/coordinator", icon: "PeopleIcon" },
    },
    {
      nav: { label: "Resultaten", href: "/evaluatie/resultaten", icon: "ChartIcon" },
    },
  ],
  skipRoutes: [
    "/evaluatie/invullen",
    "/evaluatie/invullen/bedankt",
    "/evaluatie/zelf",
    "/evaluatie/zelf/bedankt",
  ],
  visibility: { public: true },
};

// ─── Scouting ───────────────────────────────────────────────────

export const SCOUTING: AppManifest = {
  id: "scouting",
  name: "Scouting",
  shortName: "Scout",
  description: "Spelers scouten en beoordelen",
  baseUrl: "/scouting",
  accent: APP_ACCENTS.scouting,
  sections: [
    {
      nav: { label: "Overzicht", href: "/scouting", icon: "GridIcon" },
    },
    {
      nav: { label: "Opdrachten", href: "/scouting/verzoeken", icon: "ListIcon" },
      pills: [
        { label: "Openstaand", href: "/scouting/verzoeken?status=open" },
        { label: "Afgerond", href: "/scouting/verzoeken?status=afgerond" },
      ],
    },
    {
      nav: { label: "Zoeken", href: "/scouting/zoek", icon: "SearchIcon" },
    },
    {
      nav: { label: "Profiel", href: "/scouting/profiel", icon: "ProfileIcon" },
    },
  ],
  skipRoutes: [],
  visibility: { requireScout: true },
};

// ─── Beheer ─────────────────────────────────────────────────────

export const BEHEER: AppManifest = {
  id: "beheer",
  name: "TC Beheer",
  shortName: "Beheer",
  description: "Configuratie en inrichting van alle domeinen",
  baseUrl: "/beheer",
  accent: APP_ACCENTS.beheer,
  sections: [
    {
      nav: { label: "Planning", href: "/beheer/jaarplanning/kalender", icon: "ListIcon" },
      pills: [
        { label: "Kalender", href: "/beheer/jaarplanning/kalender" },
        { label: "Mijlpalen", href: "/beheer/jaarplanning/mijlpalen" },
        { label: "Trainingen", href: "/beheer/roostering/trainingen" },
        { label: "Wedstrijden", href: "/beheer/roostering/wedstrijden" },
      ],
    },
    {
      nav: { label: "Inrichting", href: "/beheer/jeugd/raamwerk", icon: "SettingsIcon" },
      pills: [
        { label: "Jeugd", href: "/beheer/jeugd/raamwerk" },
        { label: "Scouting", href: "/beheer/scouting/scouts" },
        { label: "Evaluatie", href: "/beheer/evaluatie/rondes" },
        { label: "Werving", href: "/beheer/werving/aanmeldingen" },
      ],
    },
    {
      nav: { label: "Data", href: "/beheer/teams", icon: "PeopleIcon" },
      pills: [
        { label: "Teams", href: "/beheer/teams" },
        { label: "Sync", href: "/beheer/teams/sync" },
        { label: "Import", href: "/beheer/systeem/import" },
        { label: "Archief", href: "/beheer/archief/teams" },
      ],
    },
    {
      nav: { label: "Gebruikers", href: "/beheer/systeem/gebruikers", icon: "ProfileIcon" },
    },
  ],
  skipRoutes: ["/login"],
  visibility: { requireTC: true },
};

// ─── Beleid ─────────────────────────────────────────────────────

export const BELEID: AppManifest = {
  id: "beleid",
  name: "Beleid",
  shortName: "Beleid",
  description: "Technisch beleid, visie en doelgroepenstrategie",
  baseUrl: "/beleid",
  accent: APP_ACCENTS.beleid,
  sections: [
    {
      nav: { label: "Verhaal", href: "/beleid", icon: "ListIcon" },
      pills: [
        { label: "Een leven lang!", href: "/beleid" },
        { label: "Jeugd", href: "/beleid/jeugd" },
        { label: "Overgang", href: "/beleid/overgang" },
        { label: "Senioren", href: "/beleid/senioren" },
        { label: "Recreatief", href: "/beleid/recreatief" },
        { label: "Binden", href: "/beleid/binden" },
      ],
    },
    {
      nav: { label: "Doelgroepen", href: "/beleid/doelgroepen", icon: "PeopleIcon" },
      pills: [
        { label: "Kweekvijver", href: "/beleid/doelgroepen?groep=kweekvijver" },
        { label: "Opleidingshart", href: "/beleid/doelgroepen?groep=opleidingshart" },
        { label: "Korfbalplezier", href: "/beleid/doelgroepen?groep=korfbalplezier" },
        { label: "Wedstrijdsport", href: "/beleid/doelgroepen?groep=wedstrijdsport" },
        { label: "Topsport", href: "/beleid/doelgroepen?groep=topsport" },
      ],
    },
    {
      nav: { label: "Bronnen", href: "/beleid/bronnen", icon: "SearchIcon" },
      pills: [
        { label: "Wetenschap", href: "/beleid/bronnen?type=wetenschap" },
        { label: "Beleid", href: "/beleid/bronnen?type=beleid" },
        { label: "Data", href: "/beleid/bronnen?type=data" },
      ],
    },
    {
      nav: { label: "Delen", href: "/beleid/delen", icon: "StarIcon" },
    },
  ],
  skipRoutes: [],
  visibility: { requireTC: true },
};

// ─── Manifest lookup ────────────────────────────────────────────

export const APP_MANIFEST: Record<AppId, AppManifest> = {
  www: WWW,
  monitor: MONITOR,
  "team-indeling": TEAM_INDELING,
  "ti-studio": TI_STUDIO,
  evaluatie: EVALUATIE,
  scouting: SCOUTING,
  beheer: BEHEER,
  beleid: BELEID,
};

/** Alle app-manifests in weergavevolgorde */
export const ALL_APPS: AppManifest[] = [
  WWW,
  MONITOR,
  TI_STUDIO,
  TEAM_INDELING,
  EVALUATIE,
  SCOUTING,
  BEHEER,
  BELEID,
];
