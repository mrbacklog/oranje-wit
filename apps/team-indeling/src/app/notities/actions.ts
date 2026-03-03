"use server";

import { prisma } from "@/lib/db/prisma";
import { requireEditor } from "@/lib/auth-check";
import { assertBewerkbaar } from "@/lib/seizoen";
import type {
  NotitieCategorie,
  NotitiePrioriteit,
  NotitieStatus,
  ActiepuntStatus,
  Prisma,
} from "@oranje-wit/database";

// ============================================================
// HELPERS
// ============================================================

async function getOrCreateUser() {
  const session = await requireEditor();
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
// NOTITIES
// ============================================================

const notitieInclude = {
  auteur: { select: { id: true, naam: true } },
  speler: { select: { id: true, roepnaam: true, achternaam: true } },
  staf: { select: { id: true, naam: true } },
  scenario: { select: { id: true, naam: true } },
  actiepunten: {
    include: {
      toegewezenAan: { select: { id: true, naam: true } },
    },
    orderBy: { createdAt: "asc" as const },
  },
};

export async function getNotities(
  blauwdrukId: string,
  filters?: {
    status?: NotitieStatus[];
    prioriteit?: NotitiePrioriteit[];
    categorie?: NotitieCategorie[];
    spelerId?: string;
    stafId?: string;
    teamOwCode?: string;
    scenarioId?: string | null;
  }
) {
  const where: Prisma.NotitieWhereInput = {
    blauwdrukId,
    ...(filters?.status?.length && { status: { in: filters.status } }),
    ...(filters?.prioriteit?.length && {
      prioriteit: { in: filters.prioriteit },
    }),
    ...(filters?.categorie?.length && {
      categorie: { in: filters.categorie },
    }),
    ...(filters?.spelerId && { spelerId: filters.spelerId }),
    ...(filters?.stafId && { stafId: filters.stafId }),
    ...(filters?.teamOwCode && { teamOwCode: filters.teamOwCode }),
    ...(filters?.scenarioId !== undefined && {
      scenarioId: filters.scenarioId,
    }),
  };

  return prisma.notitie.findMany({
    where,
    include: notitieInclude,
    orderBy: [{ prioriteit: "asc" }, { createdAt: "desc" }],
  });
}

export async function getNotitie(notitieId: string) {
  return prisma.notitie.findUnique({
    where: { id: notitieId },
    include: notitieInclude,
  });
}

export async function createNotitie(data: {
  blauwdrukId: string;
  titel: string;
  beschrijving: string;
  categorie: NotitieCategorie;
  prioriteit?: NotitiePrioriteit;
  scenarioId?: string;
  spelerId?: string;
  stafId?: string;
  teamOwCode?: string;
}) {
  await assertBlauwdrukBewerkbaar(data.blauwdrukId);
  const user = await getOrCreateUser();

  return prisma.notitie.create({
    data: {
      blauwdrukId: data.blauwdrukId,
      titel: data.titel,
      beschrijving: data.beschrijving,
      categorie: data.categorie,
      prioriteit: data.prioriteit ?? "MIDDEL",
      scenarioId: data.scenarioId ?? null,
      spelerId: data.spelerId ?? null,
      stafId: data.stafId ?? null,
      teamOwCode: data.teamOwCode ?? null,
      auteurId: user.id,
    },
    include: notitieInclude,
  });
}

export async function updateNotitie(
  notitieId: string,
  data: {
    titel?: string;
    beschrijving?: string;
    categorie?: NotitieCategorie;
    prioriteit?: NotitiePrioriteit;
  }
) {
  const notitie = await prisma.notitie.findUniqueOrThrow({
    where: { id: notitieId },
    select: { blauwdrukId: true },
  });
  await assertBlauwdrukBewerkbaar(notitie.blauwdrukId);

  return prisma.notitie.update({
    where: { id: notitieId },
    data,
    include: notitieInclude,
  });
}

export async function updateNotitieStatus(
  notitieId: string,
  status: NotitieStatus,
  resolutie?: string
) {
  const notitie = await prisma.notitie.findUniqueOrThrow({
    where: { id: notitieId },
    select: { blauwdrukId: true },
  });
  await assertBlauwdrukBewerkbaar(notitie.blauwdrukId);

  if (status === "OPGELOST" && !resolutie) {
    throw new Error("Resolutie is verplicht bij status OPGELOST");
  }

  return prisma.notitie.update({
    where: { id: notitieId },
    data: {
      status,
      resolutie: resolutie ?? undefined,
      opgelostOp:
        status === "OPGELOST" || status === "GEACCEPTEERD_RISICO" ? new Date() : undefined,
    },
    include: notitieInclude,
  });
}

export async function deleteNotitie(notitieId: string) {
  const notitie = await prisma.notitie.findUniqueOrThrow({
    where: { id: notitieId },
    select: { blauwdrukId: true },
  });
  await assertBlauwdrukBewerkbaar(notitie.blauwdrukId);

  return prisma.notitie.delete({ where: { id: notitieId } });
}

export async function countBlockers(blauwdrukId: string) {
  return prisma.notitie.count({
    where: {
      blauwdrukId,
      prioriteit: "BLOCKER",
      status: { in: ["OPEN", "IN_BESPREKING"] },
    },
  });
}

export async function getNotitieStats(blauwdrukId: string) {
  const [open, blockers, afgerond] = await Promise.all([
    prisma.notitie.count({
      where: {
        blauwdrukId,
        status: { in: ["OPEN", "IN_BESPREKING"] },
      },
    }),
    prisma.notitie.count({
      where: {
        blauwdrukId,
        prioriteit: "BLOCKER",
        status: { in: ["OPEN", "IN_BESPREKING"] },
      },
    }),
    prisma.notitie.count({
      where: {
        blauwdrukId,
        status: { in: ["OPGELOST", "GEACCEPTEERD_RISICO"] },
      },
    }),
  ]);
  return { open, blockers, afgerond };
}

// ============================================================
// ACTIEPUNTEN
// ============================================================

export async function createActiepunt(data: {
  blauwdrukId: string;
  beschrijving: string;
  toegewezenAanId: string;
  notitieId?: string;
  deadline?: string; // ISO date string
}) {
  await assertBlauwdrukBewerkbaar(data.blauwdrukId);
  const user = await getOrCreateUser();

  return prisma.actiepunt.create({
    data: {
      blauwdrukId: data.blauwdrukId,
      beschrijving: data.beschrijving,
      toegewezenAanId: data.toegewezenAanId,
      notitieId: data.notitieId ?? null,
      deadline: data.deadline ? new Date(data.deadline) : null,
      auteurId: user.id,
    },
    include: {
      toegewezenAan: { select: { id: true, naam: true } },
    },
  });
}

export async function updateActiepuntStatus(actiepuntId: string, status: ActiepuntStatus) {
  const actiepunt = await prisma.actiepunt.findUniqueOrThrow({
    where: { id: actiepuntId },
    select: { blauwdrukId: true },
  });
  await assertBlauwdrukBewerkbaar(actiepunt.blauwdrukId);

  return prisma.actiepunt.update({
    where: { id: actiepuntId },
    data: {
      status,
      afgerondOp: status === "AFGEROND" ? new Date() : null,
    },
    include: {
      toegewezenAan: { select: { id: true, naam: true } },
    },
  });
}

export async function deleteActiepunt(actiepuntId: string) {
  const actiepunt = await prisma.actiepunt.findUniqueOrThrow({
    where: { id: actiepuntId },
    select: { blauwdrukId: true },
  });
  await assertBlauwdrukBewerkbaar(actiepunt.blauwdrukId);

  return prisma.actiepunt.delete({ where: { id: actiepuntId } });
}

// ============================================================
// USERS (voor toewijzing dropdowns)
// ============================================================

export async function getUsers() {
  return prisma.user.findMany({
    select: { id: true, naam: true, email: true, rol: true },
    orderBy: { naam: "asc" },
  });
}
