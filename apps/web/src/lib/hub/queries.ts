// @ts-nocheck — Prisma 7 type-recursie workaround (TS2321)
import { prisma } from "@/lib/db/prisma";
import { HUIDIG_SEIZOEN } from "@oranje-wit/types";
import { logger } from "@oranje-wit/types";

// ── TC-leden: signaleringen uit monitor ──────────────────────────

export async function getSignaleringen() {
  try {
    return await prisma.signalering.findMany({
      where: { seizoen: HUIDIG_SEIZOEN },
      orderBy: { ernst: "asc" }, // "aandacht" < "kritiek" < "op_koers" alphabetisch, maar we sorteren hierna
      take: 8,
    });
  } catch (error) {
    logger.warn("Hub: signaleringen ophalen mislukt:", error);
    return [];
  }
}

export type HubSignalering = Awaited<ReturnType<typeof getSignaleringen>>[number];

// ── Trainers/coordinatoren: openstaande evaluatie-uitnodigingen ───

export async function getOpenEvaluaties(email: string) {
  try {
    return await prisma.evaluatieUitnodiging.findMany({
      where: {
        email: email.toLowerCase(),
        ronde: { status: "actief" },
      },
      include: {
        ronde: { select: { naam: true, deadline: true, seizoen: true } },
        owTeam: { select: { naam: true } },
      },
      take: 10,
    });
  } catch (error) {
    logger.warn("Hub: evaluaties ophalen mislukt:", error);
    return [];
  }
}

export type HubEvaluatie = Awaited<ReturnType<typeof getOpenEvaluaties>>[number];

// ── Scouts: openstaande scouting-toewijzingen ────────────────────

export async function getOpenVerzoeken(email: string) {
  try {
    // Type-annotatie voorkomt "excessive stack depth" bij Prisma's Scout model
    const scout: { id: string } | null = await (prisma.scout.findUnique as Function)({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });
    if (!scout) return [];

    return await prisma.scoutToewijzing.findMany({
      where: {
        scoutId: scout.id,
        status: { in: ["UITGENODIGD", "GEACCEPTEERD"] },
      },
      include: {
        verzoek: {
          select: {
            type: true,
            toelichting: true,
            deadline: true,
            seizoen: true,
            status: true,
          },
        },
      },
      take: 10,
    });
  } catch (error) {
    logger.warn("Hub: scouting-verzoeken ophalen mislukt:", error);
    return [];
  }
}

export type HubVerzoek = Awaited<ReturnType<typeof getOpenVerzoeken>>[number];

// ── Spelers/ouders: openstaande zelfevaluaties ───────────────────

export async function getOpenZelfevaluaties(email: string) {
  try {
    return await prisma.evaluatieUitnodiging.findMany({
      where: {
        email: email.toLowerCase(),
        type: "speler",
        ronde: { status: "actief" },
      },
      include: {
        ronde: { select: { naam: true, deadline: true } },
      },
      take: 5,
    });
  } catch (error) {
    logger.warn("Hub: zelfevaluaties ophalen mislukt:", error);
    return [];
  }
}

export type HubZelfevaluatie = Awaited<ReturnType<typeof getOpenZelfevaluaties>>[number];

// ── TC-leden: openstaande actiepunten ────────────────────────────

export async function getOpenActiepunten() {
  try {
    return await prisma.actiepunt.findMany({
      where: { status: { in: ["OPEN", "BEZIG"] } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        beschrijving: true,
        status: true,
        deadline: true,
        toegewezenAan: { select: { naam: true } },
      },
      take: 5,
    });
  } catch (error) {
    logger.warn("Hub: actiepunten ophalen mislukt:", error);
    return [];
  }
}

export type HubActiepunt = Awaited<ReturnType<typeof getOpenActiepunten>>[number];
