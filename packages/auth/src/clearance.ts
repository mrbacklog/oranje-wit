/**
 * Clearance-bepaling en -filtering voor spelersdata.
 *
 * In het capabilities-model wordt clearance direct opgeslagen
 * op de Gebruiker en meegestuurd in de sessie-cookie.
 * Er is geen berekening meer nodig — TC stelt het in via Beheer.
 *
 * | Clearance | Ziet                        | Typische gebruiker |
 * |-----------|-----------------------------|--------------------|
 * | 0         | Naam + team                 | Scout, ouder       |
 * | 1         | + relatieve positie         | Coordinator, trainer |
 * | 2         | + USS score + trend         | TC-lid             |
 * | 3         | + volledige kaart (6 pijlers)| TC-kern           |
 *
 * Zie: rules/score-model.md, packages/types/src/clearance.ts
 */

import type { Clearance } from "@oranje-wit/types";
import { CLEARANCE_ZICHTBAARHEID } from "@oranje-wit/types";

/**
 * Valideer en clamp een clearance-waarde.
 * Gebruik: `bepaalClearance(session.user.clearance)`
 */
export function bepaalClearance(sessionClearance: number): Clearance {
  return Math.min(Math.max(Math.round(sessionClearance), 0), 3) as Clearance;
}

/**
 * Mapping van CLEARANCE_ZICHTBAARHEID-sleutels naar concrete velden
 * die in API-responses voorkomen. Wanneer een zichtbaarheid-sleutel
 * `false` is voor het gegeven clearance-niveau, worden alle bijbehorende
 * velden verwijderd uit het resultaat.
 */
const VELD_MAPPING: Record<string, string[]> = {
  relatievePositie: ["relatievePositie", "relatiefPct"],
  ussScore: ["ussScore", "overall", "rating", "sterren"],
  trend: ["ussTrend", "trendOverall"],
  pijlerScores: ["pijlerScores", "stats"],
  radar: ["radar", "radarScores"],
  rapporten: ["rapporten", "aantalRapporten", "betrouwbaarheid", "scoutingRapporten"],
  historie: ["historie", "evaluaties", "spelerspad"],
};

/**
 * Filter spelersdata op basis van clearance-niveau.
 *
 * Verwijdert velden waarvoor de gebruiker onvoldoende clearance heeft.
 * Gebaseerd op CLEARANCE_ZICHTBAARHEID uit @oranje-wit/types.
 *
 * Level 0: naam, leeftijd, team, geslacht, kleur
 * Level 1: + relatieve positie
 * Level 2: + USS score, overall, rating, trend
 * Level 3: + pijler-scores, radar, rapporten, historie
 *
 * Werkt ook op geneste objecten: als `achterkant` een object is met
 * gefilterde velden (trend, radarScores, rapporten), worden die
 * velden ook daar verwijderd.
 */
export function filterSpelersData<T extends Record<string, unknown>>(
  data: T,
  clearance: Clearance
): T {
  // Level 3 ziet alles — geen filtering nodig
  if (clearance >= 3) return data;

  const zichtbaarheid = CLEARANCE_ZICHTBAARHEID[clearance];
  const result = { ...data };

  // Verwijder top-level velden op basis van zichtbaarheid
  for (const [sleutel, velden] of Object.entries(VELD_MAPPING)) {
    if (!zichtbaarheid[sleutel as keyof typeof zichtbaarheid]) {
      for (const veld of velden) {
        delete result[veld];
      }
    }
  }

  // Verwijder hele achterkant bij clearance < 2 (geen scores/trend),
  // of filter individuele velden binnen achterkant bij clearance 2
  if (result.achterkant && typeof result.achterkant === "object") {
    if (clearance < 2) {
      // Clearance 0-1: geen achterkant-data (bevat scores, radar, trend)
      delete result.achterkant;
    } else {
      // Clearance 2: mag trend zien, maar geen pijler-details/radar/rapporten
      const achterkant = { ...(result.achterkant as Record<string, unknown>) };
      if (!zichtbaarheid.pijlerScores) {
        delete achterkant.radarScores;
      }
      if (!zichtbaarheid.rapporten) {
        delete achterkant.rapporten;
      }
      result.achterkant = achterkant;
    }
  }

  // Verwijder spelersKaart genest object bij clearance < 3
  if (clearance < 3 && result.spelersKaart) {
    delete result.spelersKaart;
  }

  // Verwijder tier bij clearance < 3 (onderdeel van volledige kaart)
  if (clearance < 3) {
    delete result.tier;
  }

  return result;
}
