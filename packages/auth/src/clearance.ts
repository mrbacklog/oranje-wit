/**
 * Clearance-bepaling voor spelersdata.
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

/**
 * Valideer en clamp een clearance-waarde.
 * Gebruik: `bepaalClearance(session.user.clearance)`
 */
export function bepaalClearance(sessionClearance: number): Clearance {
  return Math.min(Math.max(Math.round(sessionClearance), 0), 3) as Clearance;
}
