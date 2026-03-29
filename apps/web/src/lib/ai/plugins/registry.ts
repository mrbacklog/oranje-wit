/**
 * Plugin-registry voor Daisy — combineert alle tools op basis van clearance
 */

import type { Clearance } from "@oranje-wit/types";
import { planningTools } from "./planning";
import { monitorTools } from "./monitor";
import { teamindelingTools } from "./teamindeling";

/**
 * Geeft alle beschikbare Daisy-tools terug op basis van het clearance-niveau.
 * Clearance 0 = geen tools (scouts zonder scores-toegang).
 * Clearance 1+ = alle tools (TC-leden, trainers).
 */
export function getDaisyTools(clearance: Clearance) {
  if (clearance < 1) {
    return {} as Record<string, never>;
  }

  return {
    ...planningTools,
    ...monitorTools,
    ...teamindelingTools,
  };
}
