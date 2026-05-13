"use server";

import { requireTC } from "@oranje-wit/auth/checks";
import { db } from "@/lib/db";
import { logger } from "@oranje-wit/types";
import type { ActionResult } from "@oranje-wit/types";
import type { SyncStatus, SportlinkNotificatieRij } from "@/components/sync/types";

export async function getSyncStatus(): Promise<SyncStatus> {
  await requireTC();

  const aantalLeden = await db.lid.count();
  const nieuwsteSyncOp = await db.lid.findFirst({
    where: { laatstGesyncOp: { not: null } },
    orderBy: { laatstGesyncOp: "desc" },
    select: { laatstGesyncOp: true },
  });
  const aantalNotificaties = await db.sportlinkNotificatie.count();

  const meestRecente = nieuwsteSyncOp?.laatstGesyncOp ?? null;
  const nu = new Date();
  const dagenOud = meestRecente
    ? (nu.getTime() - meestRecente.getTime()) / (1000 * 60 * 60 * 24)
    : null;

  return {
    leden: {
      id: "leden",
      titel: "Leden",
      laatstGesyncOp: meestRecente,
      aantalRecords: aantalLeden,
      fresheid: dagenOud === null ? "onbekend" : dagenOud < 7 ? "ok" : "stale",
    },
    competitie: {
      id: "competitie",
      titel: "Competitie",
      laatstGesyncOp: null,
      aantalRecords: null,
      fresheid: "onbekend",
    },
    historie: {
      id: "historie",
      titel: "Sportlink Notificaties",
      laatstGesyncOp: null,
      aantalRecords: aantalNotificaties,
      fresheid: aantalNotificaties > 0 ? "ok" : "onbekend",
    },
  };
}

export async function getHistorie(limit = 50): Promise<ActionResult<SportlinkNotificatieRij[]>> {
  try {
    await requireTC();
    const rijen = await db.sportlinkNotificatie.findMany({
      orderBy: { datum: "desc" },
      take: limit,
      select: {
        id: true,
        relCode: true,
        datum: true,
        actie: true,
        entiteit: true,
        beschrijving: true,
        categorie: true,
        gewijzigdDoor: true,
        gesyncOp: true,
      },
    });
    return { ok: true, data: rijen };
  } catch (error) {
    logger.warn("getHistorie gefaald:", error);
    return { ok: false, error: "Kon notificatie-historie niet ophalen" };
  }
}
