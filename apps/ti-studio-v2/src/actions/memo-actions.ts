"use server";

// apps/ti-studio-v2/src/actions/memo-actions.ts
// Route B: alleen lees-actions

import { requireTC } from "@oranje-wit/auth/checks";
import { logger } from "@oranje-wit/types";
import type { ActionResult } from "@oranje-wit/types";
import { getMemoKaarten, getMemoDetailData } from "@/lib/memo-queries";
import type { MemoKaartData, MemoDetailData } from "@/components/memo/types";

/**
 * Haalt alle MEMO-werkitems op voor de actieve kaders.
 */
export async function getMemos(kadersId: string): Promise<ActionResult<MemoKaartData[]>> {
  try {
    await requireTC();
    const data = await getMemoKaarten(kadersId);
    return { ok: true, data };
  } catch (error) {
    logger.warn("getMemos fout:", error);
    return { ok: false, error: "Memo's konden niet worden geladen." };
  }
}

/**
 * Haalt detail van één memo op inclusief tijdlijn.
 */
export async function getMemoDetail(memoId: string): Promise<ActionResult<MemoDetailData>> {
  try {
    await requireTC();
    const data = await getMemoDetailData(memoId);
    if (!data) {
      return { ok: false, error: "Memo niet gevonden." };
    }
    return { ok: true, data };
  } catch (error) {
    logger.warn("getMemoDetail fout:", error);
    return { ok: false, error: "Memo kon niet worden geladen." };
  }
}
