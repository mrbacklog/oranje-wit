/**
 * Gesprek CRUD voor Daisy in TI Studio — chat-geschiedenis opslaan en ophalen.
 * Zelfde patroon als apps/web/src/lib/ai/gesprekken.ts.
 */

import { prisma } from "@/lib/teamindeling/db/prisma";
import { HUIDIG_SEIZOEN, logger } from "@oranje-wit/types";
import type { Prisma } from "@oranje-wit/database";

type BerichtRol = "GEBRUIKER" | "ASSISTENT" | "SYSTEEM" | "TOOL";

export async function getOfMaakGesprek(userId: string, gesprekId?: string) {
  if (gesprekId) {
    const bestaand = await prisma.aiGesprek.findFirst({
      where: { id: gesprekId, userId },
      select: { id: true, titel: true, seizoen: true, createdAt: true },
    });

    if (bestaand) return bestaand;

    logger.warn(`Gesprek ${gesprekId} niet gevonden voor user ${userId}, maak nieuw aan`);
  }

  return prisma.aiGesprek.create({
    data: {
      userId,
      seizoen: HUIDIG_SEIZOEN,
    },
    select: { id: true, titel: true, seizoen: true, createdAt: true },
  });
}

export async function slaBerichtOp(
  gesprekId: string,
  rol: BerichtRol,
  inhoud: string,
  metadata?: Prisma.InputJsonValue
) {
  const bericht = await prisma.aiBericht.create({
    data: {
      gesprekId,
      rol,
      inhoud,
      metadata: metadata ?? undefined,
    },
    select: { id: true, rol: true, inhoud: true, createdAt: true },
  });

  await prisma.aiGesprek.update({
    where: { id: gesprekId },
    data: { updatedAt: new Date() },
  });

  return bericht;
}

export async function getGesprekken(userId: string) {
  return prisma.aiGesprek.findMany({
    where: {
      userId,
      seizoen: HUIDIG_SEIZOEN,
    },
    select: {
      id: true,
      titel: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { berichten: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });
}

export async function getBerichten(gesprekId: string, userId: string) {
  const gesprek = await prisma.aiGesprek.findFirst({
    where: { id: gesprekId, userId },
    select: { id: true },
  });

  if (!gesprek) return null;

  return prisma.aiBericht.findMany({
    where: { gesprekId },
    select: {
      id: true,
      rol: true,
      inhoud: true,
      metadata: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
}
