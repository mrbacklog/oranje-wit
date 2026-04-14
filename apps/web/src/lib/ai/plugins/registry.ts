/**
 * Plugin-registry voor Daisy — combineert alle tools op basis van context.
 * TI-studio en teamindeling tools zijn verhuisd naar apps/ti-studio (Fase B splitsing).
 */

import type { Clearance } from "@oranje-wit/types";
import { planningTools } from "./planning";
import { monitorTools } from "./monitor";

export interface DaisyContext {
  clearance: Clearance;
  sessieId: string;
  gebruikerEmail: string;
}

/**
 * Geeft alle beschikbare Daisy-tools terug op basis van context.
 * Clearance 0 = geen tools. Clearance 1+ = alle tools.
 */
export function getDaisyTools(context: DaisyContext) {
  if (context.clearance < 1) {
    return {} as Record<string, never>;
  }

  return {
    ...planningTools,
    ...monitorTools,
  };
}
