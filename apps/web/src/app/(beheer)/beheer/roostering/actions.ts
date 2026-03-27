"use server";

import { requireTC } from "@oranje-wit/auth/checks";
import { prisma } from "@/lib/db/prisma";
import { HUIDIG_SEIZOEN } from "@oranje-wit/types";

// ── Types ─────────────────────────────────────────────────────

export type RoosterTeamRow = Awaited<ReturnType<typeof getTeamsVoorRoostering>>[number];

// ── Queries ───────────────────────────────────────────────────

/**
 * Teams voor roostering: naam, categorie, kleur.
 */
export async function getTeamsVoorRoostering() {
  await requireTC();
  const teams = await prisma.oWTeam.findMany({
    where: { seizoen: HUIDIG_SEIZOEN },
    orderBy: [{ sortOrder: "asc" }, { owCode: "asc" }],
    select: {
      id: true,
      owCode: true,
      naam: true,
      categorie: true,
      kleur: true,
      leeftijdsgroep: true,
      spelvorm: true,
    },
  });
  return teams;
}
