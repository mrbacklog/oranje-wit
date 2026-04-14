/**
 * Helper-functies voor regelvalidatie.
 */

import type {
  TeamData,
  TeamgrootteOverrides,
  BlauwdrukKaders,
  TeamgrootteGrenzen,
  SpelerData,
} from "./types";
import { DEFAULT_TEAMGROOTTE } from "./constanten";
import { berekenKorfbalLeeftijdExact } from "@oranje-wit/types";

export function getTeamgrootte(
  format: "viertal" | "achttal",
  isACat: boolean,
  overrides?: TeamgrootteOverrides
): TeamgrootteGrenzen {
  const defaults = DEFAULT_TEAMGROOTTE[format];

  if (!overrides) return defaults;

  if (format === "viertal" && overrides.viertal) {
    return {
      min: Math.max(defaults.min, overrides.viertal.min - 1),
      ideaalMin: overrides.viertal.min,
      ideaalMax: overrides.viertal.max,
      max: overrides.viertal.max + 2,
    };
  }

  if (format === "achttal" && isACat && overrides.aCatTeam) {
    return {
      min: Math.max(defaults.min, overrides.aCatTeam.min - 2),
      ideaalMin: overrides.aCatTeam.min,
      ideaalMax: overrides.aCatTeam.max,
      max: overrides.aCatTeam.max + 2,
    };
  }

  if (format === "achttal" && !isACat && overrides.breedteAchttal) {
    return {
      min: Math.max(defaults.min, overrides.breedteAchttal.min - 1),
      ideaalMin: overrides.breedteAchttal.min,
      ideaalMax: overrides.breedteAchttal.max,
      max: overrides.breedteAchttal.max + 2,
    };
  }

  return defaults;
}

/**
 * Map een team naar de juiste blauwdruk-categorie-sleutel.
 */
export function teamNaarCategorieSleutel(team: TeamData): string {
  if (team.categorie === "B_CATEGORIE" && team.kleur) {
    return team.kleur; // "BLAUW", "GROEN", "GEEL", "ORANJE", "ROOD"
  }
  if (team.categorie === "A_CATEGORIE") {
    return detecteerACategorie(team.naam) ?? "U17";
  }
  if (team.categorie === "SENIOREN") {
    const nummer = extractTeamNummer(team.naam);
    if (nummer !== null && nummer <= 4) return "SENIOREN_A";
    if (nummer !== null && nummer >= 5) return "SENIOREN_B";
    return "SENIOREN_A"; // default
  }
  return team.kleur ?? "SENIOREN_B";
}

/**
 * Haal teamgrootte op basis van blauwdruk-kaders voor een specifiek team.
 */
export function getTeamgrootteUitKaders(
  team: TeamData,
  kaders: BlauwdrukKaders
): TeamgrootteGrenzen | null {
  const sleutel = teamNaarCategorieSleutel(team);
  const settings = kaders[sleutel];
  if (!settings?.optimaalSpelers) return null;

  const pct = settings.maxAfwijkingPercentage ?? 20;
  const optimaal = settings.optimaalSpelers;
  const min = settings.minSpelers ?? Math.floor(optimaal * 0.6);
  const maxBerekend = Math.ceil(optimaal * (1 + pct / 100));

  return {
    min,
    ideaalMin: optimaal,
    ideaalMax: maxBerekend,
    max: maxBerekend + 1,
  };
}

/**
 * Senioren A (Sen 1-4): wedstrijdkorfbal, A-categorie regels.
 */
export function isSeniorenA(team: TeamData): boolean {
  if (team.categorie !== "SENIOREN") return false;
  const nummer = extractTeamNummer(team.naam);
  return nummer !== null && nummer <= 4;
}

/**
 * Senioren B (Sen 5+): breedtesport, B-categorie regels.
 */
export function isSeniorenB(team: TeamData): boolean {
  if (team.categorie !== "SENIOREN") return false;
  const nummer = extractTeamNummer(team.naam);
  return nummer !== null && nummer >= 5;
}

export function extractTeamNummer(naam: string): number | null {
  const match = naam.match(/(\d+)\s*$/);
  return match ? parseInt(match[1], 10) : null;
}

export function detecteerACategorie(teamNaam: string): "U15" | "U17" | "U19" | null {
  const upper = teamNaam.toUpperCase();
  if (upper.includes("U15")) return "U15";
  if (upper.includes("U17")) return "U17";
  if (upper.includes("U19")) return "U19";
  return null;
}

export function aCategorieGeboortejaren(
  categorie: "U15" | "U17" | "U19",
  peildatum: Date
): [number, number] {
  const seizoenJaar = peildatum.getFullYear();
  switch (categorie) {
    case "U15":
      return [seizoenJaar - 14, seizoenJaar - 13];
    case "U17":
      return [seizoenJaar - 16, seizoenJaar - 15];
    case "U19":
      return [seizoenJaar - 18, seizoenJaar - 17];
  }
}

/**
 * Bereken precieze (onafgeronde) korfballeeftijd op peildatum.
 * Onafgerond voor vergelijkingen; callers die weergave willen moeten
 * `formatKorfbalLeeftijd(...)` toepassen.
 */
export function spelerKorfbalLeeftijd(speler: SpelerData, peildatum: Date): number {
  return berekenKorfbalLeeftijdExact(speler.geboortedatum ?? null, speler.geboortejaar, peildatum);
}
