"use server";

/**
 * verplaatsSpeler — server action voor werkbord drag & drop
 *
 * Mutatie-logica overgenomen uit v1:
 *   apps/ti-studio/src/app/api/indeling/[versieId]/route.ts
 *
 * speler_verplaatst:
 *   - Verwijder uit alle teams + selectiegroepen in de versie (voorkomt duplicaten)
 *   - Upsert in naarTeamId
 *
 * speler_naar_pool:
 *   - Verwijder uit alle teams + selectiegroepen in de versie
 *
 * Audit trail:
 *   - Als cookie __ow_agent_run_id aanwezig is, wordt de mutatie gelogd
 *     in de agent_mutaties tabel voor latere rollback via cleanup-endpoint.
 */

import { requireTC } from "@oranje-wit/auth/checks";
import { logger } from "@oranje-wit/types";
import type { ActionResult } from "@oranje-wit/types";
import { db as prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export interface VerplaatsSpelerInput {
  versieId: string;
  rel_code: string; // spelerId
  naarTeamId: string | null; // null = terug naar pool
}

/**
 * Interne helper — voert de daadwerkelijke DB-mutatie uit zonder audit-logging.
 * Gebruikt door verplaatsSpeler (publiek) en het cleanup-endpoint (rollback).
 */
export async function verplaatsSpelerInternal(input: VerplaatsSpelerInput): Promise<void> {
  const { versieId, rel_code, naarTeamId } = input;

  if (naarTeamId !== null) {
    await prisma.$transaction([
      prisma.teamSpeler.deleteMany({
        where: { spelerId: rel_code, team: { versieId } },
      }),
      prisma.selectieSpeler.deleteMany({
        where: { spelerId: rel_code, selectieGroep: { versieId } },
      }),
    ]);
    await prisma.teamSpeler.upsert({
      where: {
        teamId_spelerId: { teamId: naarTeamId, spelerId: rel_code },
      },
      create: { teamId: naarTeamId, spelerId: rel_code },
      update: {},
    });
    logger.info(`verplaatsSpelerInternal: ${rel_code} → team ${naarTeamId} (versie ${versieId})`);
  } else {
    await prisma.$transaction([
      prisma.teamSpeler.deleteMany({
        where: { spelerId: rel_code, team: { versieId } },
      }),
      prisma.selectieSpeler.deleteMany({
        where: { spelerId: rel_code, selectieGroep: { versieId } },
      }),
    ]);
    logger.info(`verplaatsSpelerInternal: ${rel_code} → spelerpool (versie ${versieId})`);
  }
}

/**
 * Haal de huidige teamId van een speler op in een bepaalde versie.
 * Returnt null als speler in de pool zit.
 */
async function getHuidigeTeamId(rel_code: string, versieId: string): Promise<string | null> {
  const teamSpeler = await prisma.teamSpeler.findFirst({
    where: { spelerId: rel_code, team: { versieId } },
    select: { teamId: true },
  });
  return teamSpeler?.teamId ?? null;
}

export async function verplaatsSpeler(
  input: VerplaatsSpelerInput
): Promise<ActionResult<{ opgeslagen: true }>> {
  await requireTC();

  const { versieId, rel_code, naarTeamId } = input;

  // Lees agent-run cookie voor audit trail
  const cookieStore = await cookies();
  const agentRunId = cookieStore.get("__ow_agent_run_id")?.value ?? null;

  try {
    // VOOR mutatie: query huidige positie (nodig voor inverse)
    const huidigeTeamId = agentRunId ? await getHuidigeTeamId(rel_code, versieId) : null;

    // Voer mutatie uit
    await verplaatsSpelerInternal({ versieId, rel_code, naarTeamId });

    // ALS agentRunId aanwezig: sla audit trail op
    if (agentRunId) {
      await prisma.agentMutatie.create({
        data: {
          agentRunId,
          type: "speler_verplaats",
          payload: { rel_code, van: huidigeTeamId, naar: naarTeamId, versieId },
          inverse: {
            actie: "verplaats",
            rel_code,
            versieId,
            doel: huidigeTeamId, // terugzetten naar originele positie
          },
        },
      });
      logger.info(
        `verplaatsSpeler: audit trail vastgelegd voor agentRunId=${agentRunId}, rel_code=${rel_code}`
      );
    }

    revalidatePath("/indeling");
    return { ok: true, data: { opgeslagen: true } };
  } catch (error) {
    logger.warn("verplaatsSpeler mislukt:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Onbekende fout bij opslaan",
    };
  }
}
