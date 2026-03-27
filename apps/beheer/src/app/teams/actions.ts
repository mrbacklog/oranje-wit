"use server";

import { prisma } from "@/lib/db/prisma";
import { HUIDIG_SEIZOEN } from "@oranje-wit/types";

// ── Types ─────────────────────────────────────────────────────

export type TeamRow = Awaited<ReturnType<typeof getTeams>>[number];
export type TeamDetailRow = Awaited<ReturnType<typeof getTeamDetail>>;

// ── Queries ───────────────────────────────────────────────────

/**
 * Alle teams met leden-count, optioneel per seizoen.
 */
export async function getTeams(seizoen?: string) {
  const where = { seizoen: seizoen ?? HUIDIG_SEIZOEN };
  const teams = await prisma.oWTeam.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { owCode: "asc" }],
    include: {
      _count: {
        select: {
          periodes: true,
          aliases: true,
        },
      },
    },
  });

  // Tel aantal spelers per team via competitie_spelers
  const spelerCounts = await prisma.competitieSpeler.groupBy({
    by: ["team"],
    where: { seizoen: where.seizoen },
    _count: true,
  });
  const countMap = new Map(spelerCounts.map((c) => [c.team, c._count]));

  return teams.map((t) => ({
    ...t,
    aantalSpelers: countMap.get(t.owCode) ?? 0,
  }));
}

/**
 * Team-detail met alle leden (via competitie_spelers).
 */
export async function getTeamDetail(teamId: number) {
  const team = await prisma.oWTeam.findUnique({
    where: { id: teamId },
    include: {
      periodes: { orderBy: { periode: "asc" } },
      aliases: true,
    },
  });

  if (!team) return null;

  // Spelers van dit team via competitie_spelers
  const spelers = await prisma.competitieSpeler.findMany({
    where: {
      seizoen: team.seizoen,
      team: team.owCode,
    },
    include: {
      lid: {
        select: {
          relCode: true,
          roepnaam: true,
          achternaam: true,
          tussenvoegsel: true,
          geslacht: true,
          geboortejaar: true,
        },
      },
    },
    orderBy: { relCode: "asc" },
  });

  return {
    ...team,
    spelers: spelers.map((cs) => ({
      relCode: cs.relCode,
      naam: cs.lid.tussenvoegsel
        ? `${cs.lid.roepnaam} ${cs.lid.tussenvoegsel} ${cs.lid.achternaam}`
        : `${cs.lid.roepnaam} ${cs.lid.achternaam}`,
      geslacht: cs.lid.geslacht,
      geboortejaar: cs.lid.geboortejaar,
      competitie: cs.competitie,
    })),
  };
}

/**
 * Beschikbare seizoenen voor de seizoen-selector.
 */
export async function getTeamSeizoenOpties() {
  const seizoenen = await prisma.seizoen.findMany({
    orderBy: { startJaar: "desc" },
    select: { seizoen: true },
  });
  return seizoenen.map((s) => s.seizoen);
}
