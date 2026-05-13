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
}

export interface TeamKaartStaf {
  stafId: string;
  naam: string;
  rollen: string[];
}

export interface TeamKaartData {
  id: string;
  naam: string;
  alias: string | null;
  categorie: string;
  kleur: string | null;
  teamType: string | null;
  validatieStatus: string;
  validatieMeldingen: string[] | null;
  spelersDames: TeamKaartSpeler[];
  spelersHeren: TeamKaartSpeler[];
  staf: TeamKaartStaf[];
  openMemoCount: number;
}

export interface VersieData {
  versieId: string;
  teams: TeamKaartData[];
  selectieGroepen: SelectieGroepMeta[];
  peildatum: Date;
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
  status: string;
  openMemoCount: number;
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
