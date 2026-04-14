/**
 * Korfballeeftijd — centrale berekening en weergave.
 *
 * Bron van waarheid voor alles wat met leeftijd-op-peildatum te maken heeft.
 * KNKV-regel: peildatum = 31 december van het startjaar van het seizoen.
 *
 * Gebruik:
 *  - `berekenKorfbalLeeftijdExact` voor grens- en bandbreedte-checks (onafgerond).
 *  - `berekenKorfbalLeeftijd` voor weergave-waardes (2 decimalen).
 *  - `formatKorfbalLeeftijd` voor strings in de UI.
 *  - `valtBinnenCategorie` voor U15/U17/U19 speelgerechtigdheid.
 */

import type { Seizoen } from "./index";

const MS_PER_DAG = 24 * 60 * 60 * 1000;
const DAGEN_PER_JAAR = 365.25;
const MS_PER_JAAR = DAGEN_PER_JAAR * MS_PER_DAG;
const FP_TOLERANTIE = 1e-9;

const CATEGORIE_GRENZEN: Record<"U15" | "U17" | "U19", number> = {
  U15: 15.0,
  U17: 17.0,
  U19: 19.0,
};

/**
 * Peildatum voor een seizoen: 31 december van het startjaar.
 *
 * Voorbeelden:
 *   "2025-2026" → 31-12-2025
 *   "2026-2027" → 31-12-2026
 */
export function korfbalPeildatum(seizoen: Seizoen): Date {
  const startjaar = parseInt(seizoen.split("-")[0], 10);
  return new Date(startjaar, 11, 31);
}

/**
 * Normaliseer geboortedatum-input naar een Date, of null als leeg.
 */
function toDate(input: Date | string | null | undefined): Date | null {
  if (input == null) return null;
  if (input instanceof Date) return input;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Exacte korfballeeftijd op peildatum, onafgerond.
 *
 * Gebruik voor grens-checks en bandbreedte-vergelijkingen. Als
 * `geboortedatum` ontbreekt valt de functie terug op het heel-jaren-
 * verschil met `geboortejaar`.
 */
export function berekenKorfbalLeeftijdExact(
  geboortedatum: Date | string | null | undefined,
  geboortejaar: number,
  peildatum: Date
): number {
  const gd = toDate(geboortedatum);
  if (gd) {
    return (peildatum.getTime() - gd.getTime()) / MS_PER_JAAR;
  }
  return peildatum.getFullYear() - geboortejaar;
}

/**
 * Afgeronde korfballeeftijd op 2 decimalen. Gebruik voor weergave.
 */
export function berekenKorfbalLeeftijd(
  geboortedatum: Date | string | null | undefined,
  geboortejaar: number,
  peildatum: Date
): number {
  const exact = berekenKorfbalLeeftijdExact(geboortedatum, geboortejaar, peildatum);
  return Math.round(exact * 100) / 100;
}

/**
 * Integer korfballeeftijd alleen op basis van geboortejaar.
 * Gebruik voor scouting-filters en plekken zonder geboortedatum-precisie.
 */
export function grofKorfbalLeeftijd(geboortejaar: number, peildatum: Date): number {
  return peildatum.getFullYear() - geboortejaar;
}

/**
 * Weergave als "14.99". Altijd 2 decimalen, geen eenheid.
 */
export function formatKorfbalLeeftijd(leeftijd: number): string {
  return leeftijd.toFixed(2);
}

/**
 * Is een speler met deze exacte leeftijd speelgerechtigd voor de categorie?
 *
 * Grens is inclusief (≤): een speler met exact 15.00 valt nog in U15.
 * Floating-point noise net onder de grens wordt geaccepteerd.
 */
export function valtBinnenCategorie(exact: number, categorie: "U15" | "U17" | "U19"): boolean {
  return exact <= CATEGORIE_GRENZEN[categorie] + FP_TOLERANTIE;
}
