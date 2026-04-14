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
 *
 * Berekening is kalenderjaar-aware: integer deel = kalenderjaar-verschil
 * met verjaardag-correctie; decimaal deel = dagen sinds laatste verjaardag
 * gedeeld door 365.25. Dit vermijdt de drift die ontstaat als je
 * (peildatum - geboortedatum) in ms deelt door een gemiddelde jaarlengte —
 * die aanpak geeft op exacte verjaardagen een overshoot van ~0.001 per
 * schrikkeljaar in de tussenliggende periode.
 *
 * Voorbeelden (peildatum 31-12-2026):
 *   geboren 31-12-2011 → exact 15.00 (precies)
 *   geboren 30-12-2011 → exact 15 + 1/365.25 ≈ 15.0027
 *   geboren 01-01-2012 → exact 14 + 364/365.25 ≈ 14.9966
 *   geboren 31-12-2012 → exact 14.00 (precies)
 */
export function berekenKorfbalLeeftijdExact(
  geboortedatum: Date | string | null | undefined,
  geboortejaar: number,
  peildatum: Date
): number {
  const gd = toDate(geboortedatum);
  if (!gd) {
    return peildatum.getFullYear() - geboortejaar;
  }

  // Integer deel: kalenderjaar-verschil, gecorrigeerd voor of de verjaardag
  // in het peildatum-jaar al is geweest.
  const peilJaar = peildatum.getFullYear();
  const peilMaand = peildatum.getMonth();
  const peilDag = peildatum.getDate();
  const gbMaand = gd.getMonth();
  const gbDag = gd.getDate();

  let intLeeftijd = peilJaar - gd.getFullYear();
  const naVerjaardag = peilMaand > gbMaand || (peilMaand === gbMaand && peilDag >= gbDag);
  if (!naVerjaardag) {
    intLeeftijd--;
  }

  // Decimaal deel: hoeveel dagen sinds de laatste verjaardag / 365.25.
  // UTC gebruiken voor beide datums voorkomt timezone-drift op een uur-niveau.
  const laatsteVerjaardagJaar = peilJaar - (naVerjaardag ? 0 : 1);
  const laatsteVerjaardagMs = Date.UTC(laatsteVerjaardagJaar, gbMaand, gbDag);
  const peilMs = Date.UTC(peilJaar, peilMaand, peilDag);
  const dagenSindsVerjaardag = Math.round((peilMs - laatsteVerjaardagMs) / MS_PER_DAG);

  return intLeeftijd + dagenSindsVerjaardag / DAGEN_PER_JAAR;
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
 * KNKV grens is STRIKT (`< 15.00`): een speler die op de peildatum exact
 * 15 jaar wordt, is vanaf dat moment "te oud" voor U15 en valt eruit.
 * Een speler met leeftijd 14.9966 (geboren 01-01-2012, peildatum
 * 31-12-2026) valt er wél nog in.
 */
export function valtBinnenCategorie(exact: number, categorie: "U15" | "U17" | "U19"): boolean {
  return exact < CATEGORIE_GRENZEN[categorie];
}
