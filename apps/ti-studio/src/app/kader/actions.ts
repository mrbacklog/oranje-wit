"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { requireTC } from "@/lib/teamindeling/auth-check";
import { logger, type ActionResult } from "@oranje-wit/types";
import type { Prisma } from "@oranje-wit/database";
import type { TcKader } from "./kader-defaults";
import type { WerkbordWerkitem } from "@/components/werkbord/types";

// ---------------------------------------------------------------------------
// getTeamtypeKaders
// ---------------------------------------------------------------------------

/**
 * Haal de opgeslagen teamtype kaders op voor het opgegeven seizoen.
 * Pakt de `teamtypeKaders` sleutel uit het `kaders` JSON veld.
 * Retourneert null als er geen kaders-record bestaat voor dit seizoen.
 */
export async function getTeamtypeKaders(seizoen: string): Promise<Record<string, TcKader> | null> {
  const record = await prisma.kaders.findUnique({
    where: { seizoen },
    select: { kaders: true },
  });

  if (!record) return null;

  const kaders = record.kaders as Record<string, unknown> | null;
  if (!kaders) return null;

  const teamtypeKaders = kaders["teamtypeKaders"];
  if (!teamtypeKaders || typeof teamtypeKaders !== "object") return null;

  return teamtypeKaders as Record<string, TcKader>;
}

// ---------------------------------------------------------------------------
// slaTeamtypeKadersOp
// ---------------------------------------------------------------------------

/**
 * Sla teamtype kaders op in het `kaders` JSON veld van het seizoen.
 * Mergt met de bestaande JSON zodat andere sleutels behouden blijven.
 * Vereist TC-autorisatie.
 */
export async function slaTeamtypeKadersOp(
  seizoen: string,
  data: Record<string, TcKader>
): Promise<ActionResult<void>> {
  await requireTC();

  try {
    const record = await prisma.kaders.findUnique({
      where: { seizoen },
      select: { kaders: true },
    });

    if (!record) {
      return { ok: false, error: `Geen kaders gevonden voor seizoen ${seizoen}` };
    }

    const huidig = (record.kaders as Record<string, unknown>) ?? {};

    await prisma.kaders.update({
      where: { seizoen },
      data: {
        kaders: {
          ...huidig,
          teamtypeKaders: data,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    return { ok: true, data: undefined };
  } catch (error) {
    logger.warn("slaTeamtypeKadersOp mislukt:", error);
    return { ok: false, error: "Kon teamtype kaders niet opslaan" };
  }
}

// ---------------------------------------------------------------------------
// getKaderMemos
// ---------------------------------------------------------------------------

/**
 * Haal alle memo-werkitems op voor het opgegeven kaders-record, gegroepeerd
 * per doelgroep. Retourneert TC-algemene items (doelgroep === "ALLE")
 * en een map per doelgroep voor de overige items.
 */
export async function getKaderMemos(kadersId: string): Promise<{
  tcAlgemeen: WerkbordWerkitem[];
  perDoelgroep: Record<string, WerkbordWerkitem[]>;
}> {
  const werkitems = await prisma.werkitem.findMany({
    where: { kadersId, type: "MEMO", doelgroep: { not: null } },
    orderBy: { volgorde: "asc" },
    select: {
      id: true,
      titel: true,
      beschrijving: true,
      type: true,
      status: true,
      prioriteit: true,
      volgorde: true,
      resolutie: true,
      createdAt: true,
      doelgroep: true,
    },
  });

  const serialiseer = (w: (typeof werkitems)[number]): WerkbordWerkitem => ({
    id: w.id,
    titel: w.titel,
    beschrijving: w.beschrijving,
    type: String(w.type),
    status: String(w.status),
    prioriteit: String(w.prioriteit),
    volgorde: w.volgorde,
    resolutie: w.resolutie,
    createdAt: w.createdAt.toISOString(),
  });

  const tcAlgemeen = werkitems.filter((w) => String(w.doelgroep) === "ALLE").map(serialiseer);
  const perDoelgroep: Record<string, WerkbordWerkitem[]> = {};
  for (const w of werkitems.filter((w) => String(w.doelgroep) !== "ALLE")) {
    const d = String(w.doelgroep);
    perDoelgroep[d] = [...(perDoelgroep[d] ?? []), serialiseer(w)];
  }
  return { tcAlgemeen, perDoelgroep };
}
