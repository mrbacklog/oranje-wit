"use server";

import { requireTC } from "@oranje-wit/auth/checks";
import { type ActionResult } from "@oranje-wit/types";
import { parseLedenCsv, parseTeamsCsv, detectCsvType } from "@/lib/beheer/csv-parser";
import {
  berekenLedenDiff,
  verwerkLedenSync,
  type LedenDiffResult,
  type LedenSyncResult,
} from "@/lib/beheer/leden-sync";
import {
  berekenTeamsPreview,
  berekenTeamsSnapshotDiff,
  verwerkTeamsSnapshot,
  type CompetitieType,
  type TeamsPreview,
  type TeamsSnapshotDiff,
  type TeamsSnapshotResult,
} from "@/lib/beheer/teams-snapshot";
import { revalidatePath } from "next/cache";

export async function detecteerCsvType(
  csvContent: string
): Promise<ActionResult<{ type: "leden" | "teams" | "onbekend" }>> {
  await requireTC();
  const type = detectCsvType(csvContent);
  return { ok: true, data: { type } };
}

export async function previewLedenSync(
  csvContent: string
): Promise<ActionResult<LedenDiffResult & { herkend: string[]; genegeerd: string[] }>> {
  await requireTC();
  try {
    const parsed = parseLedenCsv(csvContent);
    const diff = await berekenLedenDiff(parsed.rijen);
    return {
      ok: true,
      data: { ...diff, herkend: parsed.herkend, genegeerd: parsed.genegeerd },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function verwerkLedenSyncAction(
  csvContent: string
): Promise<ActionResult<LedenSyncResult>> {
  await requireTC();
  try {
    const parsed = parseLedenCsv(csvContent);
    const result = await verwerkLedenSync(parsed.rijen);
    revalidatePath("/beheer/teams");
    return { ok: true, data: result };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function previewTeamsSnapshot(
  csvContent: string,
  seizoen: string,
  competitie: CompetitieType
): Promise<ActionResult<{ preview: TeamsPreview; diff: TeamsSnapshotDiff }>> {
  await requireTC();
  try {
    const parsed = parseTeamsCsv(csvContent);
    const preview = await berekenTeamsPreview(parsed.rijen);
    const diff = await berekenTeamsSnapshotDiff(parsed.rijen, seizoen, competitie);
    return { ok: true, data: { preview, diff } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function verwerkTeamsSnapshotAction(
  csvContent: string,
  seizoen: string,
  competitie: CompetitieType
): Promise<ActionResult<TeamsSnapshotResult>> {
  await requireTC();
  try {
    const parsed = parseTeamsCsv(csvContent);
    const result = await verwerkTeamsSnapshot(parsed.rijen, seizoen, competitie);
    revalidatePath("/beheer/teams");
    return { ok: true, data: result };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
