"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { logger } from "@oranje-wit/types";
import type { ActionResult } from "@oranje-wit/types";
import { revalidatePath } from "next/cache";
import { requireTC } from "@oranje-wit/auth/checks";
import type { MemoData } from "@/components/ti-studio/werkbord/types";

export type KadersMemosleutel =
  | "kweekvijver"
  | "opleidingshart"
  | "korfbalplezier"
  | "wedstrijdsport"
  | "topsport"
  | "tc";

export async function updateKadersMemo(
  kadersId: string,
  sleutel: KadersMemosleutel,
  memo: MemoData
): Promise<ActionResult<void>> {
  try {
    await requireTC();
    const huidig = await prisma.kaders.findUniqueOrThrow({
      where: { id: kadersId },
      select: { kaders: true },
    });

    const huidigeJson = (huidig.kaders ?? {}) as Record<string, unknown>;
    const huidigeMemos = (huidigeJson.memos ?? {}) as Record<string, unknown>;

    const bijgewerkt = {
      ...huidigeJson,
      memos: {
        ...huidigeMemos,
        [sleutel]: {
          tekst: memo.tekst || null,
          memoStatus: memo.memoStatus,
          besluit: memo.besluit ?? null,
        },
      },
    };

    await prisma.kaders.update({
      where: { id: kadersId },
      data: { kaders: bijgewerkt },
    });

    revalidatePath("/ti-studio/kaders");
    return { ok: true, data: undefined };
  } catch (error) {
    logger.error("updateKadersMemo mislukt:", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
