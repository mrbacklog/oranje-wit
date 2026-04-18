/**
 * Types voor de regelvalidatie-engine.
 */

export type ValidatieStatus = "GROEN" | "ORANJE" | "ROOD";
export type MeldingErnst = "kritiek" | "aandacht" | "info";

export interface ValidatieMelding {
  regel: string;
  bericht: string;
  ernst: MeldingErnst;
}

export interface TeamValidatie {
  status: ValidatieStatus;
  meldingen: ValidatieMelding[];
}

export interface TeamData {
  naam: string;
  categorie: "SENIOREN" | "A_CATEGORIE" | "B_CATEGORIE";
  kleur?: "PAARS" | "BLAUW" | "GROEN" | "GEEL" | "ORANJE" | "ROOD" | null;
  niveau?: string | null;
  spelers: SpelerData[];
}

export interface SpelerData {
  id: string;
  roepnaam: string;
  achternaam: string;
  geboortejaar: number;
  geboortedatum?: string | null;
  geslacht: "M" | "V";
  status?:
    | "BESCHIKBAAR"
    | "TWIJFELT"
    | "GEBLESSEERD"
    | "GAAT_STOPPEN"
    | "NIEUW_POTENTIEEL"
    | "NIEUW_DEFINITIEF"
    | "ALGEMEEN_RESERVE"
    | "RECREANT"
    | "NIET_SPELEND";
}

/**
 * Optionele teamgrootte-targets vanuit de blauwdruk.
 * Als meegegeven, worden ideaalMin/ideaalMax hieruit afgeleid.
 */
export interface TeamgrootteOverrides {
  viertal?: { min: number; ideaal: number; max: number };
  breedteAchttal?: { min: number; ideaal: number; max: number };
  aCatTeam?: { min: number; ideaal: number; max: number };
}

/**
 * Blauwdruk categorie-settings (subset relevant voor validatie).
 * Komt uit Blauwdruk.kaders JSON, per categorie-sleutel.
 */
export interface BlauwdrukCategorieSettings {
  minSpelers?: number;
  optimaalSpelers?: number;
  maxAfwijkingPercentage?: number;
  verplichtMinV?: number;
  verplichtMinM?: number;
  gewenstMinV?: number;
  gewenstMinM?: number;
  gemiddeldeLeeftijdKernMin?: number | null;
  gemiddeldeLeeftijdKernMax?: number | null;
  gemiddeldeLeeftijdOverlapMin?: number | null;
  gemiddeldeLeeftijdOverlapMax?: number | null;
  bandbreedteLeeftijd?: number | null;
}

export type BlauwdrukKaders = Record<string, BlauwdrukCategorieSettings>;

export interface TeamgrootteGrenzen {
  min: number;
  ideaalMin: number;
  ideaalMax: number;
  max: number;
}
