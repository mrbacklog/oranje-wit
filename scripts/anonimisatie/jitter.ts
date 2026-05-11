/**
 * Geboortedatum-jitter met strikte kalenderjaargrens.
 *
 * Korfballeeftijd wordt afgeleid van het kalenderjaar van de peildatum en
 * geboortejaar (zie @oranje-wit/types/korfballeeftijd). Een jitter die de
 * jaargrens overschrijdt verandert dus de korfbal-categorie van een speler
 * en breekt de test-werkelijkheid.
 *
 * Algoritme:
 *  1. Bepaal max dagen vooruit binnen hetzelfde kalenderjaar (tot 31-12).
 *  2. Bepaal max dagen achteruit binnen hetzelfde kalenderjaar (vanaf 1-1).
 *  3. Map een deterministische seed naar de range [-max_back, +max_forward].
 *
 * De bug in de spec (`365 - date.getDate()`) gebruikte de dag-van-de-maand
 * i.p.v. dag-van-het-jaar. We berekenen hier op basis van UTC om DST-glitches
 * te vermijden.
 */

import { hmacDigest } from "./hash";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Dag-van-het-jaar (1-365/366) voor een gegeven UTC datum.
 */
function dayOfYearUTC(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const diff = date.getTime() - start;
  return Math.floor(diff / MS_PER_DAY) + 1;
}

/**
 * Aantal dagen in het kalenderjaar van `date` (365 of 366).
 */
function daysInYear(year: number): number {
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return isLeap ? 366 : 365;
}

/**
 * Bereken een deterministische, kalenderjaar-veilige jitter (-90 .. +90)
 * en pas hem toe op de gegeven datum. Returnt null bij null-input.
 *
 * De seed is `${relCode}:${date.toISOString()}` zodat dezelfde input altijd
 * dezelfde uitvoer geeft.
 */
export function jitterDate(
  date: Date | null | undefined,
  relCode: string,
  salt: string,
  maxJitter: number = 90
): Date | null {
  if (!date) return null;

  // Werk in UTC om timezone-shifts uit te sluiten.
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const year = utcDate.getUTCFullYear();
  const dayInYear = dayOfYearUTC(utcDate); // 1..365/366
  const yearLen = daysInYear(year);

  const maxForward = Math.min(maxJitter, yearLen - dayInYear);
  const maxBackward = Math.min(maxJitter, dayInYear - 1);
  const range = maxForward + maxBackward + 1;

  if (range <= 1) return utcDate;

  const digest = hmacDigest(`${relCode}:${utcDate.toISOString()}`, salt);
  const seed = parseInt(digest.slice(0, 8), 16);
  const offset = (seed % range) - maxBackward; // [-maxBackward, +maxForward]

  const shifted = new Date(utcDate.getTime() + offset * MS_PER_DAY);

  // Defensieve assertie: jaargrens mag NIET overschreden zijn.
  if (shifted.getUTCFullYear() !== year) {
    // Veiligheidsval: clamp naar 31-12 of 1-1 van het oorspronkelijke jaar.
    if (shifted.getUTCFullYear() > year) {
      return new Date(Date.UTC(year, 11, 31));
    }
    return new Date(Date.UTC(year, 0, 1));
  }

  return shifted;
}
