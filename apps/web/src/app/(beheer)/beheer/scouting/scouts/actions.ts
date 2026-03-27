"use server";

import { prisma } from "@/lib/db/prisma";

// ── Types ─────────────────────────────────────────────────────

export type ScoutRow = Awaited<ReturnType<typeof getScouts>>[number];

// ── Queries ───────────────────────────────────────────────────

/**
 * Alle scouts met XP, level, rol en aantal rapporten.
 */
export async function getScouts() {
  const scouts = await prisma.scout.findMany({
    orderBy: [{ xp: "desc" }, { naam: "asc" }],
    include: {
      _count: {
        select: {
          rapporten: true,
          badges: true,
          toewijzingen: true,
        },
      },
    },
  });

  return scouts.map((s) => ({
    id: s.id,
    naam: s.naam,
    email: s.email,
    xp: s.xp,
    level: s.level,
    rol: s.rol,
    vrijScouten: s.vrijScouten,
    aantalRapporten: s._count.rapporten,
    aantalBadges: s._count.badges,
    aantalToewijzingen: s._count.toewijzingen,
    createdAt: s.createdAt,
  }));
}
