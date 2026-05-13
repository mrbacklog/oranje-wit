"use server";

import { requireTC } from "@oranje-wit/auth/checks";
import { type ActionResult, logger } from "@oranje-wit/types";
import { getKaderPaginaData } from "@/lib/kader-queries";
import type { KaderPaginaData } from "@/components/kader/types";

/**
 * Herlaad kader-paginadata voor het opgegeven seizoen.
 * Gebruikt voor optimistic refresh na navigatie (Route B: geen mutaties).
 */
export async function haalKaderPaginaDataOp(
  seizoen: string
): Promise<ActionResult<KaderPaginaData>> {
  await requireTC();
  try {
    const data = await getKaderPaginaData(seizoen);
    return { ok: true, data };
  } catch (error) {
    logger.warn("haalKaderPaginaDataOp mislukt:", error);
    return { ok: false, error: "Kon kaderdata niet ophalen" };
  }
}
