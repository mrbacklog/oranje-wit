/**
 * Plugin-registry voor Daisy — combineert alle tools op basis van context
 */

import type { Clearance } from "@oranje-wit/types";
import { planningTools } from "./planning";
import { monitorTools } from "./monitor";
import { teamindelingTools } from "./teamindeling";
import { getTiStudioTools } from "./ti-studio";

export interface DaisyContext {
  clearance: Clearance;
  sessieId: string;
  gebruikerEmail: string;
}

/**
 * Geeft alle beschikbare Daisy-tools terug op basis van context.
 * Clearance 0 = geen tools.
 * Clearance 1+ = alle tools inclusief TI-studio schrijf-tools.
 */
export function getDaisyTools(context: DaisyContext) {
  if (context.clearance < 1) {
    return {} as Record<string, never>;
  }

  return {
    ...planningTools,
    ...monitorTools,
    ...teamindelingTools,
    ...getTiStudioTools(context.sessieId, context.gebruikerEmail),
  };
}
