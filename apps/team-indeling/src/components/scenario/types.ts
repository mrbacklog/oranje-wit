import type { TeamCategorie, Kleur, Geslacht, SpelerStatus } from "@oranje-wit/database";

/** Seizoenjaar voor leeftijdsberekening (peildatum 31 dec) */
export const SEIZOEN_JAAR = 2027;

/** Speler zoals opgehaald uit de database */
export interface SpelerData {
  id: string;
  roepnaam: string;
  achternaam: string;
  geboortejaar: number;
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
