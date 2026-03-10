import type { TeamCategorie, Kleur, Geslacht, SpelerStatus } from "@oranje-wit/database";
import { PEILJAAR, PEILDATUM } from "@oranje-wit/types";
export { PEILJAAR, PEILDATUM };

/**
 * Bereken precieze korfballeeftijd op peildatum 31-12-2026 (2 decimalen).
 * Gebruikt geboortedatum als beschikbaar, anders fallback op geboortejaar.
 */
export function korfbalLeeftijd(
  geboortedatum: Date | string | null | undefined,
  geboortejaar: number
): number {
  if (geboortedatum) {
    const gd = typeof geboortedatum === "string" ? new Date(geboortedatum) : geboortedatum;
    const ms = PEILDATUM.getTime() - gd.getTime();
    return Math.round((ms / (365.25 * 86_400_000)) * 100) / 100;
  }
  return PEILJAAR - geboortejaar;
}

/**
 * Kleurindicatie op basis van korfballeeftijd (PEILJAAR - geboortejaar).
 * Dit is een indicatie, niet de definitieve teamkleur — die wordt bepaald
 * door de gemiddelde leeftijd van het team.
 */
export function kleurIndicatie(korfballeeftijd: number): Kleur | null {
  if (korfballeeftijd < 5) return "PAARS";
  if (korfballeeftijd <= 8) return "BLAUW";
  if (korfballeeftijd <= 10) return "GROEN";
  if (korfballeeftijd <= 12) return "GEEL";
  if (korfballeeftijd <= 14) return "ORANJE";
  if (korfballeeftijd <= 18) return "ROOD";
  return null; // Senioren
}

/** Tailwind kleuren voor kleurindicatie dot */
export const KLEUR_DOT: Record<string, string> = {
  PAARS: "bg-purple-400",
  BLAUW: "bg-blue-400",
  GROEN: "bg-emerald-400",
  GEEL: "bg-yellow-400",
  ORANJE: "bg-orange-400",
  ROOD: "bg-red-400",
};

/** Speler zoals opgehaald uit de database */
export interface SpelerData {
  id: string;
  roepnaam: string;
  achternaam: string;
  geboortejaar: number;
  geboortedatum: string | null;
  geslacht: Geslacht;
  status: SpelerStatus;
  huidig: unknown;
  spelerspad: unknown;
  lidSinds: string | null;
  seizoenenActief: number | null;
  notitie: string | null;
  afmelddatum: string | null;
  rating: number | null;
  ratingBerekend: number | null;
}

/** TeamSpeler koppeling met spelerdata */
export interface TeamSpelerData {
  id: string;
  spelerId: string;
  statusOverride: SpelerStatus | null;
  notitie: string | null;
  speler: SpelerData;
}

/** Staf koppeling */
export interface TeamStafData {
  id: string;
  stafId: string;
  rol: string;
  staf: {
    id: string;
    naam: string;
  };
}

/** SelectieGroep: groep van gekoppelde teams die spelers/staf delen */
export interface SelectieGroepData {
  id: string;
  naam: string | null;
  spelers: SelectieSpelerData[];
  staf: SelectieStafData[];
}

/** Speler in een selectiegroep */
export interface SelectieSpelerData {
  id: string;
  spelerId: string;
  statusOverride: SpelerStatus | null;
  notitie: string | null;
  speler: SpelerData;
}

/** Staf in een selectiegroep */
export interface SelectieStafData {
  id: string;
  stafId: string;
  rol: string;
  staf: { id: string; naam: string };
}

/** Team met spelers en staf */
export interface TeamData {
  id: string;
  naam: string;
  alias: string | null;
  categorie: TeamCategorie;
  kleur: Kleur | null;
  teamType: string | null;
  niveau: string | null;
  volgorde: number;
  selectieGroepId: string | null;
  spelers: TeamSpelerData[];
  staf: TeamStafData[];
}

/** Versie met teams */
export interface VersieData {
  id: string;
  nummer: number;
  naam: string | null;
  teams: TeamData[];
  selectieGroepen: SelectieGroepData[];
}

/** Scenario data voor de editor */
export interface ScenarioData {
  id: string;
  naam: string;
  toelichting: string | null;
  status: string;
  keuzeWaardes: unknown;
  versies: VersieData[];
  concept: {
    blauwdruk: {
      id: string;
      kaders: Record<string, Record<string, unknown>>;
    };
  };
}

/** Pin data voor de scenario-editor */
export interface PinData {
  id: string;
  spelerId: string;
  type: string;
  waarde: { teamNaam: string; teamId: string } | Record<string, unknown>;
  notitie: string | null;
}

/** Huidig veld (JSON) */
export interface HuidigData {
  team?: string;
  categorie?: string;
  kleur?: string;
  a_categorie?: string;
  a_jaars?: string;
  leeftijd?: number;
}

/** Spelerspad entry (JSON) */
export interface SpelerspadEntry {
  seizoen: string;
  team: string;
  kleur?: string;
  niveau?: string;
  spelvorm?: string;
  categorie?: string;
}

/** Filter type voor spelerspool */
export type SpelerFilter = "zonder_team" | "passend" | "ingedeeld" | "alle";

/** Navigator groep */
export interface TeamGroepConfig {
  label: string;
  teams: TeamData[];
}

export const KLEUR_LABELS: Record<string, string> = {
  PAARS: "Paars",
  BLAUW: "Blauw",
  GROEN: "Groen",
  GEEL: "Geel",
  ORANJE: "Oranje",
  ROOD: "Rood",
};

export const CATEGORIE_LABELS: Record<string, string> = {
  B_CATEGORIE: "B-categorie",
  A_CATEGORIE: "A-categorie",
  SENIOREN: "Senioren",
};

export const STATUS_KLEUREN: Record<SpelerStatus, string> = {
  BESCHIKBAAR: "bg-green-500",
  TWIJFELT: "bg-orange-500",
  GAAT_STOPPEN: "bg-red-500",
  NIEUW_POTENTIEEL: "bg-blue-400",
  NIEUW_DEFINITIEF: "bg-blue-600",
  ALGEMEEN_RESERVE: "bg-gray-400",
};

export const KLEUR_BADGE_KLEUREN: Record<string, string> = {
  PAARS: "bg-purple-100 text-purple-700",
  BLAUW: "bg-blue-100 text-blue-700",
  GROEN: "bg-green-100 text-green-700",
  GEEL: "bg-yellow-100 text-yellow-700",
  ORANJE: "bg-orange-100 text-orange-700",
  ROOD: "bg-red-100 text-red-700",
};

/** Categorie-badge styling (A-categorie en Senioren) */
export const CATEGORIE_BADGE: Record<string, string> = {
  A_CATEGORIE: "bg-orange-100 text-orange-700 border border-orange-200",
  SENIOREN: "bg-gray-100 text-gray-500 border border-gray-200",
};

/** Categorie-badge labels */
export const CATEGORIE_BADGE_LABEL: Record<string, string> = {
  A_CATEGORIE: "A",
  SENIOREN: "Sen",
};

/**
 * Sorteer spelers: eerst Heren (M), dan Dames (V).
 * Binnen elke groep op korfballeeftijd aflopend (oudste eerst).
 */
export function sorteerSpelers(spelers: TeamSpelerData[]): TeamSpelerData[] {
  return [...spelers].sort((a, b) => {
    if (a.speler.geslacht !== b.speler.geslacht) {
      return a.speler.geslacht === "M" ? -1 : 1;
    }
    const leeftijdA = korfbalLeeftijd(a.speler.geboortedatum, a.speler.geboortejaar);
    const leeftijdB = korfbalLeeftijd(b.speler.geboortedatum, b.speler.geboortejaar);
    return leeftijdB - leeftijdA;
  });
}

// Zoom detail-niveaus: 2 standen (55% overzicht, 120% detail)
export type DetailLevel = "overzicht" | "detail";

export function getDetailLevel(zoomScale: number): DetailLevel {
  return zoomScale >= 0.85 ? "detail" : "overzicht";
}
