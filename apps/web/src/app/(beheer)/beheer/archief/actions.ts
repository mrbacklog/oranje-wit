"use server";

import { requireTC } from "@oranje-wit/auth/checks";
import { prisma } from "@/lib/db/prisma";

// ── Types ─────────────────────────────────────────────────────

export type ArchiefSeizoenRow = Awaited<ReturnType<typeof getAfgerondeSeizoen>>[number];
export type ArchiefTeamRow = Awaited<ReturnType<typeof getTeamsVoorSeizoen>>[number];
export type ArchiefResultaatRow = Awaited<ReturnType<typeof getResultatenVoorSeizoen>>[number];

// ── Queries ───────────────────────────────────────────────────

/**
 * Alle seizoenen (voor seizoen-selector).
 * Toont alle seizoenen, met AFGEROND als voorkeur.
 */
export async function getAfgerondeSeizoen() {
  await requireTC();
  const seizoenen = await prisma.seizoen.findMany({
    orderBy: { startJaar: "desc" },
    select: {
      seizoen: true,
      startJaar: true,
      eindJaar: true,
      status: true,
      _count: {
        select: {
          owTeams: true,
          competitieSpelers: true,
        },
      },
    },
  });
  return seizoenen;
}

/**
 * Teams voor een specifiek seizoen (read-only).
 */
export async function getTeamsVoorSeizoen(seizoen: string) {
  await requireTC();
  const teams = await prisma.oWTeam.findMany({
    where: { seizoen },
    orderBy: [{ sortOrder: "asc" }, { owCode: "asc" }],
    include: {
      periodes: {
        select: { periode: true, pool: true, sterkte: true, aantalSpelers: true },
        orderBy: { periode: "asc" },
      },
    },
  });

  return teams;
}

/**
 * Competitieresultaten (poolstanden) voor een seizoen (read-only).
 */
export async function getResultatenVoorSeizoen(seizoen: string) {
  await requireTC();
  const poolStanden = await prisma.poolStand.findMany({
    where: { seizoen },
    orderBy: [{ periode: "asc" }, { pool: "asc" }],
    include: {
      regels: {
        orderBy: { positie: "asc" },
        select: {
          positie: true,
          teamNaam: true,
          isOW: true,
          gespeeld: true,
          gewonnen: true,
          gelijk: true,
          verloren: true,
          punten: true,
          doelpuntenVoor: true,
          doelpuntenTegen: true,
        },
      },
    },
  });
  return poolStanden;
}
