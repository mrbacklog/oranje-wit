"use server";

/**
 * verplaatsKaart — server action voor werkbord kaart-positionering (B1: vrije 2D X/Y)
 *
 * Sleutelconventie:
 *   - Niet-gebundeld team: `team-{teamId}`
 *   - SelectieGroep (gebundeld of niet): `sg-{groepId}`
 *
 * Audit trail: als __ow_agent_run_id cookie aanwezig is, wordt de mutatie gelogd
 * voor latere rollback via cleanup-endpoint.
 */

import { requireTC } from "@oranje-wit/auth/checks";
import { logger } from "@oranje-wit/types";
import type { ActionResult } from "@oranje-wit/types";
import { db as prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export interface VerplaatsKaartInput {
  versieId: string;
  kaartKey: string; // "team-{teamId}" of "sg-{groepId}"
  x: number;
  y: number;
}

/**
 * Interne helper — voert de DB-mutatie uit zonder audit-logging.
 * Gebruikt door verplaatsKaart (publiek) en het cleanup-endpoint (rollback).
 */
export async function verplaatsKaartInternal(
  versieId: string,
  kaartKey: string,
  positie: { x: number; y: number } | null
): Promise<void> {
  const versie = await prisma.versie.findUniqueOrThrow({
    where: { id: versieId },
    select: { posities: true },
  });

  const huidig = (versie.posities ?? {}) as Record<string, { x: number; y: number }>;

  if (positie === null) {
    // Verwijder de entry
    const { [kaartKey]: _verwijderd, ...rest } = huidig;
    await prisma.versie.update({ where: { id: versieId }, data: { posities: rest } });
    logger.info(`verplaatsKaartInternal: ${kaartKey} verwijderd uit posities (versie ${versieId})`);
  } else {
    const nieuw = { ...huidig, [kaartKey]: positie };
    await prisma.versie.update({ where: { id: versieId }, data: { posities: nieuw } });
    logger.info(
      `verplaatsKaartInternal: ${kaartKey} -> (${positie.x}, ${positie.y}) (versie ${versieId})`
    );
  }
}

/**
 * Haal de huidige positie van een kaart op.
 * Returnt null als de kaart nog geen opgeslagen positie heeft.
 */
async function getHuidigePositie(
  versieId: string,
  kaartKey: string
): Promise<{ x: number; y: number } | null> {
  const versie = await prisma.versie.findUnique({
    where: { id: versieId },
    select: { posities: true },
  });
  const posities = (versie?.posities ?? {}) as Record<string, { x: number; y: number }>;
  return posities[kaartKey] ?? null;
}

export async function verplaatsKaart(
  input: VerplaatsKaartInput
): Promise<ActionResult<{ posities: Record<string, { x: number; y: number }> }>> {
  await requireTC();

  const { versieId, kaartKey, x, y } = input;

  // Lees agent-run cookie voor audit trail
  const cookieStore = await cookies();
  const agentRunId = cookieStore.get("__ow_agent_run_id")?.value ?? null;

  try {
    // VOOR mutatie: query huidige positie (nodig voor inverse)
    const huidigePositie = agentRunId ? await getHuidigePositie(versieId, kaartKey) : null;

    // Voer mutatie uit
    await verplaatsKaartInternal(versieId, kaartKey, { x, y });

    // ALS agentRunId aanwezig: sla audit trail op
    if (agentRunId) {
      await prisma.agentMutatie.create({
        data: {
          agentRunId,
          type: "kaart_verplaats",
          payload: { kaartKey, x, y, versieId },
          inverse: {
            actie: "verplaats",
            kaartKey,
            versieId,
            positie: huidigePositie, // null = geen opgeslagen positie voor de mutatie
          },
        },
      });
      logger.info(
        `verplaatsKaart: audit trail vastgelegd voor agentRunId=${agentRunId}, kaartKey=${kaartKey}`
      );
    }

    // Haal bijgewerkte posities op voor de return-waarde
    const versie = await prisma.versie.findUniqueOrThrow({
      where: { id: versieId },
      select: { posities: true },
    });
    const posities = (versie.posities ?? {}) as Record<string, { x: number; y: number }>;

    revalidatePath("/indeling");
    return { ok: true, data: { posities } };
  } catch (error) {
    logger.warn("verplaatsKaart mislukt:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Onbekende fout bij opslaan",
    };
  }
}
