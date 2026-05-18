/**
 * Werkbord-pagina types — Route B (visueel/structureel)
 * Alle mutatie-gerelateerde types komen in fase 2.
 */

export interface WerkindelingMeta {
  id: string;
  naam: string;
  seizoen: string; // "2025-2026"
  status: string;
}

export interface VersieMeta {
  id: string;
  nummer: number;
  naam: string | null;
  createdAt: Date;
  isActief: boolean; // = huidige actieve versie
}

export interface TeamKaartSpeler {
  spelerId: string; // rel_code
  roepnaam: string;
  achternaam: string;
  tussenvoegsel: string | null;
  korfbalLeeftijd: number; // berekenKorfbalLeeftijdExact()
  geslacht: "M" | "V";
  status: string;
  isNieuw: boolean; // lidSinds >= 1 juli van scenario-startjaar-1
  hasFoto: boolean;
  memoStatus?: string | null;
}

export interface TeamKaartStaf {
  stafId: string;
  naam: string;
  rollen: string[];
}

/**
 * Reservering = fictieve plek in een team voor een nog-onbekende speler.
 * Heeft alleen titel + geslacht, geen leeftijd of status.
 */
export interface TeamReservering {
  id: string;
  titel: string;
  geslacht: "M" | "V";
}

export interface TeamKaartData {
  id: string;
  naam: string;
  alias: string | null;
  categorie: string;
  kleur: string | null;
  teamType: string | null;
  niveau: string | null;
  validatieStatus: string;
  validatieMeldingen: string[] | null;
  spelersDames: TeamKaartSpeler[];
  spelersHeren: TeamKaartSpeler[];
  staf: TeamKaartStaf[];
  reserveringen?: TeamReservering[]; // fictieve plekken; werkbord-mapper laat default leeg, getTeamDialogData vult
  openMemoCount: number;
  // ── Velden voor TeamDialog-tabs (optioneel; werkbord-mapper laat ze leeg,
  // dialog-data-loader vult ze) ──
  werkitemsDetail?: import("@/components/personen/types").SpelerWerkitemDetail[]; // hergebruik shape
  gemKorfbalLeeftijd?: number; // gemiddelde korfbal-leeftijd (voor hero-stats)
  ussScore?: number | null; // som van USS-scores (indien beschikbaar)
}

export interface VersieData {
  versieId: string;
  teams: TeamKaartData[];
  selectieGroepen: SelectieGroepMeta[];
  peildatum: Date;
  seizoen: string; // "2025-2026"
  /** Canvas-posities per kaart-sleutel. Sleutelconventie: "team-{id}" of "sg-{id}" */
  posities: Record<string, { x: number; y: number }>;
}

export interface PoolSpeler {
  spelerId: string; // rel_code
  roepnaam: string;
  achternaam: string;
  tussenvoegsel: string | null;
  geslacht: "M" | "V";
  korfbalLeeftijd: number;
  leeftijdCategorie: string;
  huidigTeamNaam: string | null;
  ingedeeldTeamId: string | null;
  ingedeeldTeamNaam: string | null;
  status: string;
  openMemoCount: number;
  isNieuw: boolean; // lidSinds >= 1 juli van scenario-startjaar-1
  hasFoto: boolean;
  memoStatus?: string | null;
}

export interface StafLid {
  stafId: string;
  naam: string;
  rollen: string[];
  actief: boolean;
  ingedeeldTeamIds: string[];
  openMemoCount: number;
}

export interface SelectieGroepMeta {
  id: string;
  naam: string | null;
  gebundeld: boolean;
  teamIds: string[];
}

export type SaveState = "idle" | "saving" | "saved" | "error";
