import type { TeamCategorie, Kleur, Geslacht, SpelerStatus } from "@oranje-wit/database";

/** Peiljaar voor korfballeeftijd: 31-12 van het eerste seizoensjaar */
export const PEILJAAR = 2026;

/** Peildatum voor precieze korfballeeftijd (31 december van peiljaar) */
export const PEILDATUM = new Date(2026, 11, 31); // 31-12-2026

/**
 * Bereken precieze korfballeeftijd op peildatum 31-12-2026 (2 decimalen).
 * Gebruikt geboortedatum als beschikbaar, anders fallback op geboortejaar.
 */
export function korfbalLeeftijd(
  geboortedatum: Date | string | null | undefined,
  geboortejaar: number
): number {
  if (geboortedatum) {
    const gd =
      typeof geboortedatum === "string" ? new Date(geboortedatum) : geboortedatum;
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
  if (korfballeeftijd <= 8) return "BLAUW";
  if (korfballeeftijd <= 10) return "GROEN";
  if (korfballeeftijd <= 12) return "GEEL";
  if (korfballeeftijd <= 14) return "ORANJE";
  if (korfballeeftijd <= 18) return "ROOD";
  return null; // Senioren
}

/** Tailwind kleuren voor kleurindicatie dot */
export const KLEUR_DOT: Record<string, string> = {
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

/** Team met spelers en staf */
export interface TeamData {
  id: string;
  naam: string;
  categorie: TeamCategorie;
  kleur: Kleur | null;
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
}

/** Scenario data voor de editor */
export interface ScenarioData {
  id: string;
  naam: string;
  toelichting: string | null;
  status: string;
  keuzeWaardes: unknown;
  versies: VersieData[];
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
  NIEUW: "bg-blue-500",
};

export const KLEUR_BADGE_KLEUREN: Record<string, string> = {
  BLAUW: "bg-blue-100 text-blue-700",
  GROEN: "bg-green-100 text-green-700",
  GEEL: "bg-yellow-100 text-yellow-700",
  ORANJE: "bg-orange-100 text-orange-700",
  ROOD: "bg-red-100 text-red-700",
};
