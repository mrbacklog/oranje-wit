/**
 * Rating-berekeningen voor OW Scout — v3.0 (Pijlerevolutie).
 *
 * Ondersteunt variabele pijlers per leeftijdsgroep.
 * Backward compatible: berekenOverall() werkt nog met de legacy 6-pijler codes.
 *
 * Nieuwe functies: berekenOverallV3() voor dynamische pijlers.
 */

import type { LeeftijdsgroepNaam } from "./leeftijdsgroep";
import type { Pijler } from "./vragen";
import { SCOUTING_CONFIG, vragenPerPijler, itemsPerPijlerV3 } from "./vragen";
import type { LeeftijdsgroepNaamV3, PijlerCode } from "@oranje-wit/types";
import { LEEFTIJDSGROEP_CONFIG, berekenPijlerscore } from "@oranje-wit/types";
import { scoutingNaarUSS as _scoutingNaarUSS } from "@oranje-wit/types";

// ─── Score-ranges per leeftijdsgroep (legacy 0-99 schaal) ───

/** @deprecated - Gebruik LEEFTIJDSGROEP_CONFIG voor v3 */
export const SCORE_RANGES: Record<LeeftijdsgroepNaam, { min: number; max: number }> = {
  paars: { min: 0, max: 40 },
  blauw: { min: 0, max: 40 },
  groen: { min: 5, max: 55 },
  geel: { min: 15, max: 70 },
  oranje: { min: 25, max: 85 },
  rood: { min: 35, max: 99 },
};

// ─── Legacy conversie ───

/** @deprecated Gebruik berekenPijlerscore() uit @oranje-wit/types */
export function converteerNaarRange(
  invoer: number,
  maxInvoer: number,
  groep: LeeftijdsgroepNaam
): number {
  const range = SCORE_RANGES[groep];
  if (!range) return Math.round(invoer);

  if (groep === "rood") {
    return Math.round(Math.max(range.min, Math.min(range.max, invoer)));
  }

  const ratio = (invoer - 1) / (maxInvoer - 1);
  return Math.round(range.min + ratio * (range.max - range.min));
}

// ─── Legacy overall (backward compatible) ───

/** @deprecated Gebruik berekenOverallV3() */
export function berekenOverall(
  scores: Record<string, number>,
  groep: LeeftijdsgroepNaam
): {
  overall: number;
  pijlerScores: Record<Pijler, number>;
} {
  const config = SCOUTING_CONFIG[groep];
  const perPijler = vragenPerPijler(groep);
  const pijlerScores: Record<string, number> = {};

  const actievePijlers = (Object.keys(perPijler) as Pijler[]).filter(
    (p) => perPijler[p].length > 0
  );

  for (const pijler of actievePijlers) {
    const vragen = perPijler[pijler];
    const waarden = vragen.map((v) => scores[v.id]).filter((w): w is number => w != null);

    if (waarden.length === 0) {
      pijlerScores[pijler] = 0;
      continue;
    }

    const gemiddelde = waarden.reduce((a, b) => a + b, 0) / waarden.length;
    pijlerScores[pijler] = converteerNaarRange(gemiddelde, config.maxScore, groep);
  }

  const pijlerWaarden = Object.values(pijlerScores).filter((v) => v > 0);
  const overall =
    pijlerWaarden.length > 0
      ? Math.round(pijlerWaarden.reduce((a, b) => a + b, 0) / pijlerWaarden.length)
      : 0;

  return {
    overall,
    pijlerScores: pijlerScores as Record<Pijler, number>,
  };
}

// ─── V3 overall (dynamische pijlers) ───

/**
 * Bereken pijlerscores en overall voor v3 dynamische pijlers.
 *
 * Scores: Record<itemId, waarde> waar waarde de ruwe invoer is
 * (0/1 voor blauw, 0/0.5/1 voor groen, 1-5 voor geel, 1-10 voor oranje/rood).
 */
export function berekenOverallV3(
  scores: Record<string, number>,
  band: LeeftijdsgroepNaamV3,
  kernOnly: boolean = false
): {
  overall: number;
  pijlerScores: Record<string, number>;
} {
  const config = LEEFTIJDSGROEP_CONFIG[band];
  const perPijler = itemsPerPijlerV3(band, kernOnly);
  const pijlerScores: Record<string, number> = {};

  for (const pijler of config.pijlers) {
    const items = perPijler[pijler.code] ?? [];
    const waarden = items.map((item) => scores[item.id]).filter((w): w is number => w != null);

    const score = berekenPijlerscore(waarden, band);
    if (score != null) {
      pijlerScores[pijler.code] = score;
    }
  }

  // Gewogen overall
  let som = 0;
  let gewichtSom = 0;
  for (const pijler of config.pijlers) {
    if (pijlerScores[pijler.code] != null) {
      som += pijler.gewicht * pijlerScores[pijler.code];
      gewichtSom += pijler.gewicht;
    }
  }

  const overall = gewichtSom > 0 ? Math.round(som / gewichtSom) : 0;

  return { overall, pijlerScores };
}

// ─── EWMA ───

const EWMA_ALPHA = 0.3;

export function berekenEWMA(nieuweScore: number, huidigeKaart: number | null): number {
  if (huidigeKaart == null) {
    return Math.round(nieuweScore);
  }
  return Math.round(EWMA_ALPHA * nieuweScore + (1 - EWMA_ALPHA) * huidigeKaart);
}

/**
 * EWMA voor dynamische pijlerscores (JSON).
 * Merged bestaande en nieuwe pijlerscores met EWMA per pijler.
 */
export function berekenEWMAPijlers(
  nieuwePijlerScores: Record<string, number>,
  bestaandePijlerScores: Record<string, number> | null
): Record<string, number> {
  const result: Record<string, number> = {};
  const bestaand = bestaandePijlerScores ?? {};

  // Alle pijlers die in de nieuwe set zitten
  for (const [code, waarde] of Object.entries(nieuwePijlerScores)) {
    result[code] = berekenEWMA(waarde, bestaand[code] ?? null);
  }

  // Behoud bestaande pijlers die niet in de nieuwe set zitten
  for (const [code, waarde] of Object.entries(bestaand)) {
    if (!(code in result)) {
      result[code] = waarde;
    }
  }

  return result;
}

// ─── Betrouwbaarheid en Tier ───

export function bepaalBetrouwbaarheid(aantalRapporten: number): string {
  if (aantalRapporten <= 1) return "concept";
  if (aantalRapporten <= 4) return "basis";
  if (aantalRapporten <= 9) return "betrouwbaar";
  return "bevestigd";
}

export function bepaalTier(score: number, groep: LeeftijdsgroepNaam): "brons" | "zilver" | "goud" {
  const range = SCORE_RANGES[groep];
  if (!range) return "brons";

  const rangeGrootte = range.max - range.min;
  const zilverDrempel = range.min + rangeGrootte * 0.5;
  const goudDrempel = range.min + rangeGrootte * 0.8;

  if (score >= goudDrempel) return "goud";
  if (score >= zilverDrempel) return "zilver";
  return "brons";
}

// ─── USS ───

export function berekenUSSVanKaart(overall: number, groep: LeeftijdsgroepNaam): number {
  return _scoutingNaarUSS(overall, groep);
}
