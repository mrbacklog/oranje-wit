"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { requireTC } from "@/lib/teamindeling/auth-check";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@oranje-wit/types";
import { logger } from "@oranje-wit/types";
import type { GezienStatus } from "@oranje-wit/database";

// ============================================================
// COORDINATOR VOORSTELLEN
// ============================================================

export interface VoorstelItem {
  id: string;
  type: string;
  omschrijving: string;
  status: string;
  toelichting: string | null;
  seizoen: string;
  spelerId: string | null;
  teamNaam: string | null;
  createdAt: Date;
  coordinator: {
    id: string;
    naam: string;
    email: string;
  };
}

/**
 * Haal alle open voorstellen op voor het actieve seizoen.
 */
export async function getOpenVoorstellen(): Promise<VoorstelItem[]> {
  await requireTC();

  const voorstellen = await prisma.coordinatorVoorstel.findMany({
    where: { status: "OPEN" },
    include: {
      coordinator: {
        select: { id: true, naam: true, email: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return voorstellen.map((v) => ({
    id: v.id,
    type: v.type,
    omschrijving: v.omschrijving,
    status: v.status,
    toelichting: v.toelichting,
    seizoen: v.seizoen,
    spelerId: v.spelerId,
    teamNaam: v.teamNaam,
    createdAt: v.createdAt,
    coordinator: v.coordinator,
  }));
}

/**
 * Zet een voorstel op VERWERKT.
 */
export async function verwerkVoorstel(
  id: string,
  toelichting?: string
): Promise<ActionResult<void>> {
  try {
    await requireTC();

    await prisma.coordinatorVoorstel.update({
      where: { id },
      data: {
        status: "VERWERKT",
        toelichting: toelichting ?? null,
        updatedAt: new Date(),
      },
    });

    logger.info(`Voorstel ${id} verwerkt`);
    revalidatePath("/ti-studio/opvolging");
    return { ok: true, data: undefined };
  } catch (error) {
    logger.error("verwerkVoorstel mislukt:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Wijs een voorstel af met optionele reden.
 */
export async function wijsVoorstelAf(id: string, reden?: string): Promise<ActionResult<void>> {
  try {
    await requireTC();

    await prisma.coordinatorVoorstel.update({
      where: { id },
      data: {
        status: "AFGEWEZEN",
        toelichting: reden ?? null,
        updatedAt: new Date(),
      },
    });

    logger.info(`Voorstel ${id} afgewezen`);
    revalidatePath("/ti-studio/opvolging");
    return { ok: true, data: undefined };
  } catch (error) {
    logger.error("wijsVoorstelAf mislukt:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================
// GEZIEN-STATUS VOORSTELLEN (BlauwdrukSpeler)
// ============================================================

export interface GezienVoorstelItem {
  id: string;
  blauwdrukId: string;
  spelerId: string;
  spelerNaam: string;
  teamNaam: string | null;
  gezienStatusVoorgesteld: GezienStatus;
  gezienVoorgesteldDoor: string | null;
  gezienVoorgesteldNotitie: string | null;
  gezienVoorgesteldOp: Date | null;
}

/**
 * Haal alle BlauwdrukSpeler records op waar een status is voorgesteld
 * maar nog niet definitief bevestigd door de TC.
 */
export async function getGezienVoorstellen(blauwdrukId: string): Promise<GezienVoorstelItem[]> {
  await requireTC();

  const records = await prisma.blauwdrukSpeler.findMany({
    where: {
      blauwdrukId,
      gezienStatusVoorgesteld: { not: null },
    },
    include: {
      speler: {
        select: {
          roepnaam: true,
          achternaam: true,
          huidig: true,
        },
      },
    },
    orderBy: { gezienVoorgesteldOp: "asc" },
  });

  return records
    .filter((r) => r.gezienStatusVoorgesteld !== null)
    .map((r) => {
      const huidig = r.speler.huidig as { team?: string } | null;
      return {
        id: r.id,
        blauwdrukId: r.blauwdrukId,
        spelerId: r.spelerId,
        spelerNaam: `${r.speler.roepnaam} ${r.speler.achternaam}`,
        teamNaam: huidig?.team ?? null,
        gezienStatusVoorgesteld: r.gezienStatusVoorgesteld!,
        gezienVoorgesteldDoor: r.gezienVoorgesteldDoor,
        gezienVoorgesteldNotitie: r.gezienVoorgesteldNotitie,
        gezienVoorgesteldOp: r.gezienVoorgesteldOp,
      };
    });
}

/**
 * Bevestig de voorgestelde gezien-status als definitief.
 */
export async function bevestigGezienStatus(blauwdrukSpelerId: string): Promise<ActionResult<void>> {
  try {
    const session = await requireTC();
    const email = session.user!.email!;
    const naam = session.user!.name ?? email;

    const user = await prisma.user.upsert({
      where: { email },
      create: { email, naam, rol: "EDITOR" },
      update: { naam },
      select: { id: true },
    });

    const record = await prisma.blauwdrukSpeler.findUniqueOrThrow({
      where: { id: blauwdrukSpelerId },
      select: { gezienStatusVoorgesteld: true },
    });

    if (!record.gezienStatusVoorgesteld) {
      return { ok: false, error: "Geen voorgestelde status aanwezig." };
    }

    await prisma.blauwdrukSpeler.update({
      where: { id: blauwdrukSpelerId },
      data: {
        gezienStatus: record.gezienStatusVoorgesteld,
        gezienStatusVoorgesteld: null,
        gezienVoorgesteldDoor: null,
        gezienVoorgesteldNotitie: null,
        gezienVoorgesteldOp: null,
        gezienDoorId: user.id,
        gezienOp: new Date(),
      },
    });

    revalidatePath("/ti-studio/opvolging");
    return { ok: true, data: undefined };
  } catch (error) {
    logger.error("bevestigGezienStatus mislukt:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Wijs de voorgestelde gezien-status af (wis het voorstel).
 */
export async function wijsGezienStatusAf(blauwdrukSpelerId: string): Promise<ActionResult<void>> {
  try {
    await requireTC();

    await prisma.blauwdrukSpeler.update({
      where: { id: blauwdrukSpelerId },
      data: {
        gezienStatusVoorgesteld: null,
        gezienVoorgesteldDoor: null,
        gezienVoorgesteldNotitie: null,
        gezienVoorgesteldOp: null,
      },
    });

    revalidatePath("/ti-studio/opvolging");
    return { ok: true, data: undefined };
  } catch (error) {
    logger.error("wijsGezienStatusAf mislukt:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
