"use server";

import { prisma } from "@/lib/db/prisma";
import { requireEditor } from "@/lib/auth-check";
import { assertBewerkbaar } from "@/lib/seizoen";
import { revalidatePath } from "next/cache";
import { logger } from "@oranje-wit/types";
import type { ActiviteitType } from "@oranje-wit/database";

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

async function getWerkBlauwdruk() {
  const blauwdruk = await prisma.blauwdruk.findFirst({
    where: { isWerkseizoen: true },
    select: { id: true, seizoen: true },
  });

  if (!blauwdruk) {
    throw new Error("Geen werkseizoen gevonden");
  }

  return blauwdruk;
}

async function assertBlauwdrukBewerkbaar(blauwdrukId: string) {
  const blauwdruk = await prisma.blauwdruk.findUniqueOrThrow({
    where: { id: blauwdrukId },
    select: { seizoen: true },
  });
  await assertBewerkbaar(blauwdruk.seizoen);
}

// ============================================================
// INCLUDE (herbruikbaar voor alle activiteit-queries)
// ============================================================

const activiteitInclude = {
  auteur: { select: { id: true, naam: true } },
  toegewezenAan: { select: { id: true, naam: true } },
  speler: { select: { id: true, roepnaam: true, achternaam: true } },
  staf: { select: { id: true, naam: true } },
};

// ============================================================
// ACTIVITEITEN
// ============================================================

/**
 * Haal alle activiteiten op voor een speler binnen het werkseizoen.
 */
export async function getSpelerActiviteiten(spelerId: string) {
  const blauwdruk = await getWerkBlauwdruk();

  return prisma.activiteit.findMany({
    where: {
      spelerId,
      blauwdrukId: blauwdruk.id,
    },
    include: activiteitInclude,
    orderBy: { createdAt: "desc" },
  });
}

export type ActiviteitMetRelaties = Awaited<ReturnType<typeof getSpelerActiviteiten>>[number];

/**
 * Maak een nieuwe activiteit aan.
 */
export async function createActiviteit(data: {
  type: ActiviteitType;
  inhoud: string;
  spelerId?: string;
  stafId?: string;
  teamOwCode?: string;
  deadline?: string; // ISO date string
  toegewezenAanId?: string;
}) {
  const blauwdruk = await getWerkBlauwdruk();
  await assertBlauwdrukBewerkbaar(blauwdruk.id);
  const user = await getOrCreateUser();

  const activiteit = await prisma.activiteit.create({
    data: {
      type: data.type,
      inhoud: data.inhoud,
      spelerId: data.spelerId ?? null,
      stafId: data.stafId ?? null,
      teamOwCode: data.teamOwCode ?? null,
      deadline: data.deadline ? new Date(data.deadline) : null,
      toegewezenAanId: data.toegewezenAanId ?? null,
      actiepuntStatus: data.type === "ACTIEPUNT" ? "OPEN" : null,
      blauwdrukId: blauwdruk.id,
      auteurId: user.id,
    },
    include: activiteitInclude,
  });

  logger.info(`Activiteit aangemaakt: ${activiteit.id} (${data.type})`);
  revalidatePath("/");

  return activiteit;
}

/**
 * Toggle de status van een actiepunt tussen OPEN en AFGEROND.
 */
export async function toggleActiepuntStatus(activiteitId: string) {
  const activiteit = await prisma.activiteit.findUniqueOrThrow({
    where: { id: activiteitId },
    select: { blauwdrukId: true, actiepuntStatus: true, type: true },
  });

  await assertBlauwdrukBewerkbaar(activiteit.blauwdrukId);
  await requireEditor();

  if (activiteit.type !== "ACTIEPUNT") {
    throw new Error("Alleen actiepunten kunnen worden afgerond");
  }

  const nieuweStatus = activiteit.actiepuntStatus === "OPEN" ? "AFGEROND" : "OPEN";

  const updated = await prisma.activiteit.update({
    where: { id: activiteitId },
    data: {
      actiepuntStatus: nieuweStatus,
      afgerondOp: nieuweStatus === "AFGEROND" ? new Date() : null,
    },
    include: activiteitInclude,
  });

  logger.info(`Actiepunt ${activiteitId} status: ${activiteit.actiepuntStatus} -> ${nieuweStatus}`);
  revalidatePath("/");

  return updated;
}

/**
 * Maak een automatische STATUS_WIJZIGING activiteit aan.
 * Bedoeld om aangeroepen te worden vanuit updateSpelerStatus.
 */
export async function createStatusWijziging(
  spelerId: string,
  oudStatus: string,
  nieuwStatus: string
) {
  const blauwdruk = await getWerkBlauwdruk();
  const user = await getOrCreateUser();

  const activiteit = await prisma.activiteit.create({
    data: {
      type: "STATUS_WIJZIGING",
      inhoud: `${oudStatus} \u2192 ${nieuwStatus}`,
      spelerId,
      blauwdrukId: blauwdruk.id,
      auteurId: user.id,
    },
    include: activiteitInclude,
  });

  logger.info(`Statuswijziging vastgelegd voor speler ${spelerId}: ${oudStatus} -> ${nieuwStatus}`);
  revalidatePath("/");

  return activiteit;
}

// ============================================================
// USERS (voor toewijzing dropdown)
// ============================================================

/**
 * Haal alle users op voor de toewijzing-dropdown.
 */
export async function getUsers() {
  return prisma.user.findMany({
    select: { id: true, naam: true },
    orderBy: { naam: "asc" },
  });
}
