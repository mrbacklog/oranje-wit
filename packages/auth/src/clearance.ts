/**
 * Clearance-bepaling voor spelersdata.
 *
 * Bepaalt welk detail-niveau een gebruiker te zien krijgt
 * op basis van hun rol en de app-context.
 *
 * Zie: rules/score-model.md, packages/types/src/clearance.ts
 */

import type { Clearance } from "@oranje-wit/types";

type AppContext = "scouting" | "teamindeling" | "evaluatie" | "monitor";

/** ScoutRol uit het Prisma schema */
type ScoutRol = "SCOUT" | "TC";

/** Rol uit het User model */
type UserRol = "EDITOR" | "COORDINATOR" | "REVIEWER" | "VIEWER";

interface ClearanceInput {
  /** Rol in de team-indeling app */
  userRol?: UserRol;
  /** Rol in de scouting app */
  scoutRol?: ScoutRol;
  /** Vanuit welke app wordt clearance gevraagd */
  context: AppContext;
  /** TC-kern lid (hoogste clearance, handmatig toegekend) */
  isTcKern?: boolean;
}

/**
 * Bepaal het clearance-niveau voor spelersdata.
 *
 * | Clearance | Ziet | Typische gebruiker |
 * |-----------|------|--------------------|
 * | 0 | Naam + team | Scout bij verzoek |
 * | 1 | + relatieve positie | Trainer |
 * | 2 | + USS score + trend | TC-lid |
 * | 3 | + volledige kaart | TC-kern |
 */
export function bepaalClearance(input: ClearanceInput): Clearance {
  const { userRol, scoutRol, context, isTcKern } = input;

  // TC-kern krijgt altijd clearance 3
  if (isTcKern) return 3;

  // Scouting-app context
  if (context === "scouting") {
    if (scoutRol === "TC") return 2; // TC-lid in scouting: scores + trend
    return 0; // Scout: geen scores (anti-anchoring)
  }

  // Team-indeling context
  if (context === "teamindeling") {
    if (userRol === "EDITOR") return 2; // TC-lid
    if (userRol === "COORDINATOR") return 1; // Coördinator
    if (userRol === "REVIEWER") return 1; // Trainer/coach
    return 0; // Viewer: geen scores
  }

  // Evaluatie context
  if (context === "evaluatie") {
    if (userRol === "EDITOR") return 2;
    if (userRol === "REVIEWER") return 1;
    return 0;
  }

  // Monitor context (dashboards)
  if (context === "monitor") {
    if (userRol === "EDITOR") return 1; // Alleen verhoudingen in dashboards
    return 0;
  }

  return 0;
}
