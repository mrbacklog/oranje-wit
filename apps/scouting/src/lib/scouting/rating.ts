/**
 * Rating-berekeningen voor OW Scout.
 *
 * Elke leeftijdsgroep heeft een eigen score-range. De invoer (smiley 1-3,
 * sterren 1-5, slider 0-99) wordt omgerekend naar de range van die groep.
 *
 * De SpelersKaart wordt bijgewerkt met EWMA (Exponentially Weighted Moving
 * Average) voor een stabiel, maar responsief scoreverloop.
 */

import type { LeeftijdsgroepNaam } from "./leeftijdsgroep";
import type { Pijler } from "./vragen";
import { SCOUTING_CONFIG, vragenPerPijler } from "./vragen";
import { scoutingNaarUSS as _scoutingNaarUSS } from "@oranje-wit/types";

/** Score-ranges per leeftijdsgroep (0-99 schaal) */
export const SCORE_RANGES: Record<LeeftijdsgroepNaam, { min: number; max: number }> = {
  paars: { min: 0, max: 40 },
  blauw: { min: 0, max: 40 },
  groen: { min: 5, max: 55 },
  geel: { min: 15, max: 70 },
  oranje: { min: 25, max: 85 },
  rood: { min: 35, max: 99 },
};

/**
 * Converteer een invoerwaarde naar de score-range van de leeftijdsgroep.
 *
 * Voorbeeld: smiley=3 (max=3) voor blauw (range 0-40) => 40
 * Voorbeeld: sterren=4 (max=5) voor geel (range 15-70) => 59
 * Voorbeeld: slider=72 (max=99) voor rood (range 35-99) => 72 (directe mapping)
 */
export function converteerNaarRange(
  invoer: number,
  maxInvoer: number,
  groep: LeeftijdsgroepNaam
): number {
  const range = SCORE_RANGES[groep];
  if (!range) return Math.round(invoer);

  // Slider voor rood is al in de juiste range (0-99, capped op min-max)
  if (groep === "rood") {
    return Math.round(Math.max(range.min, Math.min(range.max, invoer)));
  }

  // Normaliseer invoer naar 0-1 (invoer begint bij 1 voor smiley/sterren)
  const ratio = (invoer - 1) / (maxInvoer - 1);
  return Math.round(range.min + ratio * (range.max - range.min));
}

/**
 * Bereken de pijler-gemiddelden uit de ruwe scores en vervolgens de overall.
 *
 * De overall is het gewogen gemiddelde van de 6 pijler-scores.
 * Alle pijlers wegen gelijk.
 */
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

    // Gemiddelde invoerwaarde voor deze pijler
    const gemiddelde = waarden.reduce((a, b) => a + b, 0) / waarden.length;
    // Converteer naar de groep-range
    pijlerScores[pijler] = converteerNaarRange(gemiddelde, config.maxScore, groep);
  }

  // Overall = gemiddelde van alle pijler-scores
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

/**
 * Bereken EWMA (Exponentially Weighted Moving Average).
 *
 * Alpha = 0.3 betekent dat een nieuw rapport 30% invloed heeft
 * en het historische gemiddelde 70%.
 *
 * Bij het eerste rapport wordt de nieuwe score direct overgenomen.
 */
const EWMA_ALPHA = 0.3;

export function berekenEWMA(nieuweScore: number, huidigeKaart: number | null): number {
  if (huidigeKaart == null) {
    return Math.round(nieuweScore);
  }
  return Math.round(EWMA_ALPHA * nieuweScore + (1 - EWMA_ALPHA) * huidigeKaart);
}

/**
 * Bepaal de betrouwbaarheid van een spelerskaart op basis van het
 * aantal rapporten.
 *
 * - concept (0-1 rapporten): Nog onvoldoende data
 * - basis (2-4 rapporten): Eerste indicatie
 * - betrouwbaar (5-9 rapporten): Goede betrouwbaarheid
 * - bevestigd (10+ rapporten): Hoge betrouwbaarheid
 */
export function bepaalBetrouwbaarheid(aantalRapporten: number): string {
  if (aantalRapporten <= 1) return "concept";
  if (aantalRapporten <= 4) return "basis";
  if (aantalRapporten <= 9) return "betrouwbaar";
  return "bevestigd";
}

/**
 * Bepaal de tier (brons/zilver/goud) op basis van percentiel.
 *
 * Binnen elke leeftijdsgroep:
 * - brons: onderste 50% (score < mediaan van range)
 * - zilver: 50-80% (score >= mediaan, < 80e percentiel)
 * - goud: top 20% (score >= 80e percentiel)
 *
 * We berekenen de percentielgrenzen op basis van de score-range.
 */
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

/**
 * Converteer een scouting overall-score naar de Geunificeerde Score Schaal (USS).
 *
 * De USS plaatst spelers en teams op dezelfde schaal (0-200).
 * Zie rules/score-model.md voor het volledige model.
 */
export function berekenUSSVanKaart(overall: number, groep: LeeftijdsgroepNaam): number {
  return _scoutingNaarUSS(overall, groep);
}
