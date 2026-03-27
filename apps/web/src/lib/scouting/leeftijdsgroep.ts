/**
 * Leeftijdsgroep-bepaling op basis van KNKV Competitie 2.0.
 *
 * Korfballeeftijd = peiljaar - geboortejaar.
 * Peildatum is 31 december van het peiljaar (2026).
 *
 * Groepen:
 *   Paars  = leeftijd 5
 *   Blauw  = leeftijd 6-7
 *   Groen  = leeftijd 8-9
 *   Geel   = leeftijd 10-12
 *   Oranje = leeftijd 13-15
 *   Rood   = leeftijd 16-18
 */

import { PEILJAAR } from "@oranje-wit/types";
import type { LeeftijdsgroepNaam } from "@oranje-wit/types";

export type { LeeftijdsgroepNaam };

export type SchaalType = "smiley" | "sterren" | "slider";

interface SpelerMetGeboortejaar {
  geboortejaar: number;
  // huidig is Json in Prisma (JsonValue), maar we casten het intern
  huidig?: unknown;
}

/**
 * Bereken de korfballeeftijd op basis van geboortejaar.
 * Korfballeeftijd = peiljaar - geboortejaar.
 */
export function bepaalKorfbalLeeftijd(geboortejaar: number): number {
  return PEILJAAR - geboortejaar;
}

/**
 * Bepaal de leeftijdsgroep van een speler.
 * Eerst proberen we de kleur uit `huidig` te gebruiken, daarna vallen we
 * terug op het geboortejaar.
 */
export function bepaalLeeftijdsgroep(speler: SpelerMetGeboortejaar): LeeftijdsgroepNaam {
  // Als er een kleur in huidig staat, gebruik die
  if (speler.huidig && typeof speler.huidig === "object") {
    const kleur = (speler.huidig as Record<string, unknown>).kleur;
    if (typeof kleur === "string" && isLeeftijdsgroep(kleur)) {
      // "blauw" in het huidig-object verwijst naar blauw, maar paars is een apart geval
      return kleur as LeeftijdsgroepNaam;
    }
  }

  // Fallback: bereken op basis van geboortejaar
  return leeftijdsgroepVanLeeftijd(bepaalKorfbalLeeftijd(speler.geboortejaar));
}

/**
 * Bepaal de leeftijdsgroep op basis van korfballeeftijd.
 */
export function leeftijdsgroepVanLeeftijd(leeftijd: number): LeeftijdsgroepNaam {
  if (leeftijd <= 5) return "paars";
  if (leeftijd <= 7) return "blauw";
  if (leeftijd <= 9) return "groen";
  if (leeftijd <= 12) return "geel";
  if (leeftijd <= 15) return "oranje";
  return "rood";
}

/**
 * Bepaal het schaaltype voor score-invoer op basis van leeftijdsgroep.
 * - Paars/Blauw/Groen (5-9): smileys
 * - Geel/Oranje (10-15): sterren
 * - Rood (16-18): slider
 */
export function bepaalSchaalType(leeftijdsgroep: LeeftijdsgroepNaam): SchaalType {
  switch (leeftijdsgroep) {
    case "paars":
    case "blauw":
    case "groen":
      return "smiley";
    case "geel":
    case "oranje":
      return "sterren";
    case "rood":
      return "slider";
  }
}

function isLeeftijdsgroep(waarde: string): waarde is LeeftijdsgroepNaam {
  return ["paars", "blauw", "groen", "geel", "oranje", "rood"].includes(waarde);
}
