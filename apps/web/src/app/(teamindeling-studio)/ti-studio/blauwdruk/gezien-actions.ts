"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { requireTC } from "@/lib/teamindeling/auth-check";
import { assertBewerkbaar } from "@/lib/teamindeling/seizoen";
import { revalidatePath } from "next/cache";
import type { GezienStatus } from "@oranje-wit/database";
import { detecteerDoorstroom } from "@/lib/teamindeling/doorstroom-signalering";
import { logger } from "@oranje-wit/types";

// ============================================================
// HELPERS
// ============================================================

async function getOrCreateUser() {
  const session = await requireTC();
  const email = session.user!.email!;
  const naam = session.user!.name ?? email;

  return prisma.user.upsert({
    where: { email },
    create: { email, naam, rol: "EDITOR" },
    update: { naam },
    select: { id: true },
  });
}

async function assertBlauwdrukBewerkbaar(blauwdrukId: string) {
  const blauwdruk = await prisma.blauwdruk.findUniqueOrThrow({
    where: { id: blauwdrukId },
    select: { seizoen: true },
  });
  await assertBewerkbaar(blauwdruk.seizoen);
}

// ============================================================
// INITIALISATIE
// ============================================================

/**
 * Initialiseer BlauwdrukSpeler records voor alle actieve spelers.
 * Detecteert doorstroom-signaleringen en maakt records aan.
 * Bestaande records worden niet overschreven.
 */
export async function initialiseerBlauwdrukSpelers(blauwdrukId: string) {
  await assertBlauwdrukBewerkbaar(blauwdrukId);

  const spelers = await prisma.speler.findMany({
    where: { status: { not: "GAAT_STOPPEN" } },
    select: {
      id: true,
      roepnaam: true,
      achternaam: true,
      geboortejaar: true,
      huidig: true,
    },
  });

  // Detecteer doorstroom
  const signaleringen = detecteerDoorstroom(
    spelers.map((s) => ({
      ...s,
      huidig: s.huidig as { kleur?: string; a_categorie?: string; team?: string } | null,
    }))
  );

  const signaleringMap = new Map<string, string>();
  for (const sig of signaleringen) {
    // Gebruik het eerste signaal per speler als primair
    if (!signaleringMap.has(sig.spelerId)) {
      signaleringMap.set(sig.spelerId, sig.type);
    }
  }

  // Upsert: maak records aan, overschrijf geen bestaande status
  let aangemaakt = 0;
  for (const speler of spelers) {
    const result = await prisma.blauwdrukSpeler.upsert({
      where: {
        blauwdrukId_spelerId: { blauwdrukId, spelerId: speler.id },
      },
      create: {
        blauwdrukId,
        spelerId: speler.id,
        gezienStatus: "ONGEZIEN",
        signalering: signaleringMap.get(speler.id) ?? null,
      },
      update: {
        // Alleen signalering bijwerken, niet de gezienStatus
        signalering: signaleringMap.get(speler.id) ?? undefined,
      },
    });
    if (result.gezienStatus === "ONGEZIEN") aangemaakt++;
  }

  // Spelers die al als GAAT_STOPPEN staan → ROOD markeren
  const stoppers = await prisma.speler.findMany({
    where: { status: "GAAT_STOPPEN" },
    select: { id: true },
  });

  for (const stopper of stoppers) {
    await prisma.blauwdrukSpeler.upsert({
      where: {
        blauwdrukId_spelerId: { blauwdrukId, spelerId: stopper.id },
      },
      create: {
        blauwdrukId,
        spelerId: stopper.id,
        gezienStatus: "ROOD",
        signalering: null,
      },
      update: {},
    });
  }

  revalidatePath("/blauwdruk");
  return {
    aangemaakt,
    totaal: spelers.length + stoppers.length,
    doorstroomSignaleringen: signaleringen.length,
  };
}

// ============================================================
// LEZEN
// ============================================================

/**
 * Haal alle BlauwdrukSpeler records op met spelerdata.
 */
export async function getBlauwdrukSpelers(blauwdrukId: string) {
  return prisma.blauwdrukSpeler.findMany({
    where: { blauwdrukId },
    include: {
      speler: {
        select: {
          id: true,
          roepnaam: true,
          achternaam: true,
          geboortejaar: true,
          geslacht: true,
          huidig: true,
          volgendSeizoen: true,
          retentie: true,
          status: true,
        },
      },
      actiepunt: {
        select: {
          id: true,
          beschrijving: true,
          status: true,
          deadline: true,
          toegewezenAan: { select: { naam: true } },
        },
      },
      gezienDoor: { select: { naam: true } },
    },
    orderBy: [{ gezienStatus: "asc" }, { speler: { achternaam: "asc" } }],
  });
}

/**
 * Voortgangsstatistieken voor de gezien-flow.
 */
export async function getGezienVoortgang(blauwdrukId: string) {
  const records = await prisma.blauwdrukSpeler.groupBy({
    by: ["gezienStatus"],
    where: { blauwdrukId },
    _count: true,
  });

  const perStatus: Record<string, number> = {};
  let totaal = 0;
  let gezien = 0;

  for (const r of records) {
    perStatus[r.gezienStatus] = r._count;
    totaal += r._count;
    if (r.gezienStatus !== "ONGEZIEN") gezien += r._count;
  }

  return { totaal, gezien, perStatus };
}

// ============================================================
// MUTATIES
// ============================================================

/**
 * Update de gezien-status voor een speler.
 * Bij GEEL of ORANJE wordt optioneel een actiepunt aangemaakt.
 */
export async function updateGezienStatus(
  blauwdrukId: string,
  spelerId: string,
  status: GezienStatus,
  notitie?: string,
  toegewezenAanId?: string
) {
  await assertBlauwdrukBewerkbaar(blauwdrukId);
  const user = await getOrCreateUser();

  // Haal bestaand record op
  const bestaand = await prisma.blauwdrukSpeler.findUnique({
    where: { blauwdrukId_spelerId: { blauwdrukId, spelerId } },
    select: { id: true, actiepuntId: true },
  });

  if (!bestaand) {
    throw new Error(`Geen BlauwdrukSpeler record voor speler ${spelerId}`);
  }

  let actiepuntId = bestaand.actiepuntId;

  // Bij GEEL/ORANJE: automatisch actiepunt aanmaken als er geen is
  if ((status === "GEEL" || status === "ORANJE") && !actiepuntId && toegewezenAanId) {
    const speler = await prisma.speler.findUnique({
      where: { id: spelerId },
      select: { roepnaam: true, achternaam: true },
    });

    const statusLabel = status === "GEEL" ? "onzekere status" : "stop-signalen";
    const actiepunt = await prisma.actiepunt.create({
      data: {
        beschrijving: `Check ${statusLabel} van ${speler?.roepnaam} ${speler?.achternaam}`,
        blauwdrukId,
        toegewezenAanId,
        auteurId: user.id,
      },
    });
    actiepuntId = actiepunt.id;
  }

  await prisma.blauwdrukSpeler.update({
    where: { id: bestaand.id },
    data: {
      gezienStatus: status,
      notitie: notitie ?? undefined,
      actiepuntId,
      gezienDoorId: user.id,
      gezienOp: new Date(),
    },
  });

  // Synchroniseer naar Speler.status bij definitieve statussen
  if (status === "ROOD") {
    await prisma.speler.update({
      where: { id: spelerId },
      data: { status: "GAAT_STOPPEN" },
    });
  }

  revalidatePath("/blauwdruk");
}

/**
 * Batch-update: meerdere spelers tegelijk markeren (bijv. heel team GROEN).
 */
export async function batchUpdateGezienStatus(
  blauwdrukId: string,
  updates: Array<{ spelerId: string; status: GezienStatus; notitie?: string }>
) {
  await assertBlauwdrukBewerkbaar(blauwdrukId);
  const user = await getOrCreateUser();

  for (const update of updates) {
    await prisma.blauwdrukSpeler.updateMany({
      where: {
        blauwdrukId,
        spelerId: update.spelerId,
      },
      data: {
        gezienStatus: update.status,
        notitie: update.notitie ?? undefined,
        gezienDoorId: user.id,
        gezienOp: new Date(),
      },
    });
  }

  logger.info(`Batch update: ${updates.length} spelers bijgewerkt`);
  revalidatePath("/blauwdruk");
}
