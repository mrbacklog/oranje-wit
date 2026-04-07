"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { requireTC } from "@/lib/teamindeling/auth-check";
import { assertBewerkbaar } from "@/lib/teamindeling/seizoen";
import { revalidatePath } from "next/cache";
import type { BesluitStatus, BesluitNiveau, Doelgroep } from "@oranje-wit/database";

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

async function assertBlauwdrukBewerkbaar(kadersId: string) {
  const blauwdruk = await prisma.kaders.findUniqueOrThrow({
    where: { id: kadersId },
    select: { seizoen: true },
  });
  await assertBewerkbaar(blauwdruk.seizoen);
}

// ============================================================
// STANDAARDVRAGEN (beheer)
// ============================================================

export async function getStandaardVragen() {
  return prisma.standaardVraag.findMany({
    where: { actief: true },
    orderBy: [{ categorie: "asc" }, { volgorde: "asc" }],
  });
}

export async function upsertStandaardVraag(data: {
  code: string;
  vraag: string;
  categorie: string;
  volgorde?: number;
}) {
  await requireTC();
  return prisma.standaardVraag.upsert({
    where: { code: data.code },
    create: {
      code: data.code,
      vraag: data.vraag,
      categorie: data.categorie,
      volgorde: data.volgorde ?? 0,
    },
    update: {
      vraag: data.vraag,
      categorie: data.categorie,
      volgorde: data.volgorde ?? undefined,
    },
  });
}

// ============================================================
// INITIALISATIE
// ============================================================

/**
 * Initialiseer standaardvragen als BlauwdrukBesluit records.
 * Bestaande standaard-besluiten worden niet opnieuw aangemaakt.
 */
export async function initialiseerStandaardBesluiten(kadersId: string) {
  await assertBlauwdrukBewerkbaar(kadersId);
  const user = await getOrCreateUser();

  const vragen = await prisma.standaardVraag.findMany({
    where: { actief: true },
    orderBy: [{ categorie: "asc" }, { volgorde: "asc" }],
  });

  // Check welke al bestaan
  const bestaand = await prisma.kadersBesluit.findMany({
    where: { kadersId, isStandaard: true },
    select: { standaardCode: true },
  });
  const bestaandeCodes = new Set(bestaand.map((b) => b.standaardCode));

  let aangemaakt = 0;
  for (const vraag of vragen) {
    if (bestaandeCodes.has(vraag.code)) continue;

    await prisma.kadersBesluit.create({
      data: {
        kadersId,
        vraag: vraag.vraag,
        isStandaard: true,
        standaardCode: vraag.code,
        volgorde: vraag.volgorde,
        auteurId: user.id,
      },
    });
    aangemaakt++;
  }

  revalidatePath("/blauwdruk");
  return { aangemaakt, totaal: vragen.length };
}

// ============================================================
// LEZEN
// ============================================================

export async function getBesluiten(kadersId: string) {
  return prisma.kadersBesluit.findMany({
    where: { kadersId },
    include: {
      auteur: { select: { naam: true } },
      actiepunten: {
        select: {
          id: true,
          beschrijving: true,
          status: true,
          deadline: true,
          toegewezenAan: { select: { naam: true } },
        },
      },
    },
    orderBy: [{ volgorde: "asc" }, { createdAt: "asc" }],
  });
}

export async function getBesluitStats(kadersId: string) {
  const records = await prisma.kadersBesluit.groupBy({
    by: ["status"],
    where: { kadersId },
    _count: true,
  });

  const stats: Record<string, number> = {};
  let totaal = 0;
  for (const r of records) {
    stats[r.status] = r._count;
    totaal += r._count;
  }

  return {
    totaal,
    onduidelijk: stats["ONDUIDELIJK"] ?? 0,
    voorlopig: stats["VOORLOPIG"] ?? 0,
    definitief: stats["DEFINITIEF"] ?? 0,
  };
}

// ============================================================
// MUTATIES
// ============================================================

export async function createBesluit(data: {
  kadersId: string;
  vraag: string;
  niveau?: BesluitNiveau;
  doelgroep?: Doelgroep;
}) {
  await assertBlauwdrukBewerkbaar(data.kadersId);
  const user = await getOrCreateUser();

  // Bepaal hoogste volgorde
  const maxVolgorde = await prisma.kadersBesluit.aggregate({
    where: { kadersId: data.kadersId },
    _max: { volgorde: true },
  });

  const besluit = await prisma.kadersBesluit.create({
    data: {
      kadersId: data.kadersId,
      vraag: data.vraag,
      isStandaard: false,
      volgorde: (maxVolgorde._max.volgorde ?? 0) + 1,
      niveau: data.niveau ?? "TECHNISCH",
      doelgroep: data.doelgroep ?? undefined,
      auteurId: user.id,
    },
  });

  revalidatePath("/blauwdruk");
  return besluit;
}

export async function updateBesluit(
  besluitId: string,
  data: {
    antwoord?: string;
    toelichting?: string;
    status?: BesluitStatus;
    niveau?: BesluitNiveau;
    doelgroep?: Doelgroep | null;
    vraag?: string;
  }
) {
  const besluit = await prisma.kadersBesluit.findUniqueOrThrow({
    where: { id: besluitId },
    select: { kadersId: true },
  });
  await assertBlauwdrukBewerkbaar(besluit.kadersId);

  await prisma.kadersBesluit.update({
    where: { id: besluitId },
    data: {
      antwoord: data.antwoord ?? undefined,
      toelichting: data.toelichting ?? undefined,
      status: data.status ?? undefined,
      niveau: data.niveau ?? undefined,
      doelgroep: data.doelgroep !== undefined ? data.doelgroep : undefined,
      vraag: data.vraag ?? undefined,
    },
  });

  revalidatePath("/blauwdruk");
}

export async function deleteBesluit(besluitId: string) {
  const besluit = await prisma.kadersBesluit.findUniqueOrThrow({
    where: { id: besluitId },
    select: { kadersId: true, isStandaard: true },
  });
  await assertBlauwdrukBewerkbaar(besluit.kadersId);

  if (besluit.isStandaard) {
    throw new Error("Standaardvragen kunnen niet verwijderd worden");
  }

  await prisma.kadersBesluit.delete({ where: { id: besluitId } });
  revalidatePath("/blauwdruk");
}
