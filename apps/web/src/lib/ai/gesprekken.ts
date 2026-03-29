/**
 * Gesprek CRUD voor Daisy — chat-geschiedenis opslaan en ophalen
 */

import { prisma } from "@/lib/db/prisma";
import { HUIDIG_SEIZOEN, logger } from "@oranje-wit/types";
import type { Prisma } from "@oranje-wit/database";

/** Rol-type dat overeenkomt met het Prisma BerichtRol enum */
type BerichtRol = "GEBRUIKER" | "ASSISTENT" | "SYSTEEM" | "TOOL";

/**
 * Vindt een bestaand gesprek of maakt een nieuw aan.
 * Als gesprekId is meegegeven, wordt dat gesprek opgehaald (mits van deze user).
 * Zonder gesprekId wordt een nieuw gesprek aangemaakt.
 */
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

/**
 * Slaat een bericht op in een gesprek.
 */
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

  // Update het gesprek's updatedAt timestamp
  await prisma.aiGesprek.update({
    where: { id: gesprekId },
    data: { updatedAt: new Date() },
  });

  return bericht;
}

/**
 * Geeft een lijst van gesprekken voor een gebruiker (max 20, huidige seizoen).
 * Gesorteerd op meest recent eerst.
 */
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

/**
 * Haalt alle berichten op van een gesprek.
 * Controleert dat het gesprek van de opgegeven gebruiker is.
 */
export async function getBerichten(gesprekId: string, userId: string) {
  const gesprek = await prisma.aiGesprek.findFirst({
    where: { id: gesprekId, userId },
    select: { id: true },
  });

  if (!gesprek) {
    return null;
  }

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
