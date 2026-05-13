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
 */

import { requireTC } from "@oranje-wit/auth/checks";
import { logger } from "@oranje-wit/types";
import type { ActionResult } from "@oranje-wit/types";
import { db as prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface VerplaatsSpelerInput {
  versieId: string;
  rel_code: string; // spelerId
  naarTeamId: string | null; // null = terug naar pool
}

export async function verplaatsSpeler(
  input: VerplaatsSpelerInput
): Promise<ActionResult<{ opgeslagen: true }>> {
  await requireTC();

  const { versieId, rel_code, naarTeamId } = input;

  try {
    if (naarTeamId !== null) {
      // Speler verplaatsen naar team
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
      logger.info(`verplaatsSpeler: ${rel_code} → team ${naarTeamId} (versie ${versieId})`);
    } else {
      // Speler terug naar pool
      await prisma.$transaction([
        prisma.teamSpeler.deleteMany({
          where: { spelerId: rel_code, team: { versieId } },
        }),
        prisma.selectieSpeler.deleteMany({
          where: { spelerId: rel_code, selectieGroep: { versieId } },
        }),
      ]);
      logger.info(`verplaatsSpeler: ${rel_code} → spelerpool (versie ${versieId})`);
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
