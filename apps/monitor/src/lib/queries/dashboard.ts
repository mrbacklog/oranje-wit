import { prisma } from "@/lib/db/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DashboardKPIs = {
  seizoen: string;
  snapshot_datum: Date | null;
  totaal_leden: number;
  totaal_spelers: number;
  totaal_teams: number;
  signalering_kritiek: number;
  signalering_aandacht: number;
  geslacht: { M: number; V: number };
  categorie: { a: number; b: number };
};

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

export async function getDashboardKPIs(
  seizoen: string
): Promise<DashboardKPIs> {
  // Snapshot + signalering parallel
  const [snap, signaleringen, teamCount] = await Promise.all([
    prisma.snapshot.findFirst({
      where: { seizoen },
      orderBy: { snapshotDatum: "desc" },
      select: {
        id: true,
        snapshotDatum: true,
        totaalLeden: true,
        totaalSpelers: true,
      },
    }),
    prisma.signalering.findMany({
      where: { seizoen },
      select: { ernst: true },
    }),
    prisma.oWTeam.count({ where: { seizoen } }),
  ]);

  if (!snap) {
    return {
      seizoen,
      snapshot_datum: null,
      totaal_leden: 0,
      totaal_spelers: 0,
      totaal_teams: 0,
      signalering_kritiek: 0,
      signalering_aandacht: 0,
      geslacht: { M: 0, V: 0 },
      categorie: { a: 0, b: 0 },
    };
  }

  // Geslacht- en categorieverdeling uit snapshot
  const geslachtRows = await prisma.$queryRaw<
    { geslacht: string; aantal: number }[]
  >`
    SELECT l.geslacht, COUNT(*)::int AS aantal
    FROM leden_snapshot ls
    JOIN leden l ON ls.rel_code = l.rel_code
    WHERE ls.snapshot_id = ${snap.id}
      AND ls.spelactiviteit IS NOT NULL
    GROUP BY l.geslacht`;

  const categorieRows = await prisma.$queryRaw<
    { categorie: string; aantal: number }[]
  >`
    SELECT ls.categorie, COUNT(*)::int AS aantal
    FROM leden_snapshot ls
    WHERE ls.snapshot_id = ${snap.id}
      AND ls.spelactiviteit IS NOT NULL
      AND ls.categorie IS NOT NULL
    GROUP BY ls.categorie`;

  const geslacht = { M: 0, V: 0 };
  for (const r of geslachtRows) {
    if (r.geslacht === "M") geslacht.M = Number(r.aantal);
    if (r.geslacht === "V") geslacht.V = Number(r.aantal);
  }

  const categorie = { a: 0, b: 0 };
  for (const r of categorieRows) {
    if (r.categorie === "a") categorie.a = Number(r.aantal);
    if (r.categorie === "b") categorie.b = Number(r.aantal);
  }

  return {
    seizoen,
    snapshot_datum: snap.snapshotDatum,
    totaal_leden: snap.totaalLeden ?? 0,
    totaal_spelers: snap.totaalSpelers ?? 0,
    totaal_teams: teamCount,
    signalering_kritiek: signaleringen.filter((s) => s.ernst === "kritiek")
      .length,
    signalering_aandacht: signaleringen.filter((s) => s.ernst === "aandacht")
      .length,
    geslacht,
    categorie,
  };
}
