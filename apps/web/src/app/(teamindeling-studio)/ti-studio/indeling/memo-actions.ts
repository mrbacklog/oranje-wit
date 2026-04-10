"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { logger } from "@oranje-wit/types";
import type { ActionResult } from "@oranje-wit/types";
import { revalidatePath } from "next/cache";
import { requireTC } from "@oranje-wit/auth/checks";
import type { MemoData } from "@/components/ti-studio/werkbord/types";

export async function updateTeamMemo(teamId: string, memo: MemoData): Promise<ActionResult<void>> {
  try {
    await requireTC();
    await prisma.team.update({
      where: { id: teamId },
      data: {
        notitie: memo.tekst || null,
        memoStatus: memo.memoStatus,
        besluit: memo.besluit ?? null,
      },
    });
    revalidatePath("/ti-studio/indeling");
    return { ok: true, data: undefined };
  } catch (error) {
    logger.error("updateTeamMemo mislukt:", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
