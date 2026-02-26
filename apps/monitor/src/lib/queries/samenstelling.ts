import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@oranje-wit/database";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SnapshotMeta = { id: number; snapshot_datum: Date } | null;

async function latestSnapshot(seizoen: string): Promise<SnapshotMeta> {
  const snap = await prisma.snapshot.findFirst({
    where: { seizoen },
    orderBy: { snapshotDatum: "desc" },
    select: { id: true, snapshotDatum: true },
  });
  if (!snap) return null;
  return { id: snap.id, snapshot_datum: snap.snapshotDatum };
}

// ---------------------------------------------------------------------------
// Per geboortejaar
// ---------------------------------------------------------------------------

export type GeboortejaarRow = {
  geboortejaar: number | null;
  geslacht: string;
  aantal: number;
  a_categorie: string | null;
  a_jaars: string | null;
};

export type GeboortejaarResult = {
  meta: { datum: Date | null; seizoen: string };
  data: GeboortejaarRow[];
};

export async function getPerGeboortejaar(
  seizoen: string
): Promise<GeboortejaarResult> {
  const snap = await latestSnapshot(seizoen);
  if (!snap) return { meta: { datum: null, seizoen }, data: [] };

  const rows = await prisma.$queryRaw<GeboortejaarRow[]>`
    SELECT l.geboortejaar, l.geslacht, COUNT(*)::int AS aantal,
           ls.a_categorie, ls.a_jaars
    FROM leden_snapshot ls
    JOIN leden l ON ls.rel_code = l.rel_code
    WHERE ls.snapshot_id = ${snap.id}
      AND ls.spelactiviteit IS NOT NULL
    GROUP BY l.geboortejaar, l.geslacht, ls.a_categorie, ls.a_jaars
    ORDER BY l.geboortejaar, l.geslacht`;

  return {
    meta: { datum: snap.snapshot_datum, seizoen },
    data: rows.map((r) => ({
      geboortejaar: r.geboortejaar,
      geslacht: r.geslacht,
      aantal: Number(r.aantal),
      a_categorie: r.a_categorie || null,
      a_jaars: r.a_jaars || null,
    })),
  };
}

// ---------------------------------------------------------------------------
// Per kleur
// ---------------------------------------------------------------------------

export type KleurRow = {
  kleur: string;
  categorie: string | null;
  teams: number;
  spelers_m: number;
  spelers_v: number;
  totaal: number;
};

export type KleurResult = {
  meta: { datum: Date | null; seizoen: string };
  data: KleurRow[];
};

export async function getPerKleur(seizoen: string): Promise<KleurResult> {
  const snap = await latestSnapshot(seizoen);
  if (!snap) return { meta: { datum: null, seizoen }, data: [] };

  const rows = await prisma.$queryRaw<KleurRow[]>`
    SELECT
      COALESCE(ls.kleur, t.kleur, 'Onbekend') AS kleur,
      ls.categorie,
      COUNT(DISTINCT ls.ow_code)::int AS teams,
      COUNT(*) FILTER (WHERE l.geslacht = 'M')::int AS spelers_m,
      COUNT(*) FILTER (WHERE l.geslacht = 'V')::int AS spelers_v,
      COUNT(*)::int AS totaal
    FROM leden_snapshot ls
    JOIN leden l ON ls.rel_code = l.rel_code
    LEFT JOIN teams t ON ls.ow_code = t.ow_code AND t.seizoen = ${seizoen}
    WHERE ls.snapshot_id = ${snap.id}
      AND ls.spelactiviteit IS NOT NULL
    GROUP BY COALESCE(ls.kleur, t.kleur, 'Onbekend'), ls.categorie
    ORDER BY ls.categorie, kleur`;

  return {
    meta: { datum: snap.snapshot_datum, seizoen },
    data: rows.map((r) => ({
      kleur: r.kleur,
      categorie: r.categorie || null,
      teams: Number(r.teams),
      spelers_m: Number(r.spelers_m),
      spelers_v: Number(r.spelers_v),
      totaal: Number(r.totaal),
    })),
  };
}

// ---------------------------------------------------------------------------
// Per team
// ---------------------------------------------------------------------------

export type TeamRow = {
  team: string;
  categorie: string | null;
  kleur: string | null;
  niveau: string | null;
  spelers_m: number;
  spelers_v: number;
  totaal: number;
  gem_leeftijd: number | null;
};

export type TeamResult = {
  meta: { datum: Date | null; seizoen: string };
  data: TeamRow[];
};

export async function getPerTeam(seizoen: string): Promise<TeamResult> {
  const snap = await latestSnapshot(seizoen);
  if (!snap) return { meta: { datum: null, seizoen }, data: [] };

  const rows = await prisma.$queryRaw<TeamRow[]>`
    SELECT
      ls.ow_code AS team,
      ls.categorie,
      COALESCE(ls.kleur, t.kleur) AS kleur,
      t.leeftijdsgroep AS niveau,
      COUNT(*) FILTER (WHERE l.geslacht = 'M')::int AS spelers_m,
      COUNT(*) FILTER (WHERE l.geslacht = 'V')::int AS spelers_v,
      COUNT(*)::int AS totaal,
      ROUND(AVG(ls.leeftijd_peildatum)::numeric, 1) AS gem_leeftijd
    FROM leden_snapshot ls
    JOIN leden l ON ls.rel_code = l.rel_code
    LEFT JOIN teams t ON ls.ow_code = t.ow_code AND t.seizoen = ${seizoen}
    WHERE ls.snapshot_id = ${snap.id}
      AND ls.spelactiviteit IS NOT NULL
      AND ls.ow_code IS NOT NULL
    GROUP BY ls.ow_code, ls.categorie, COALESCE(ls.kleur, t.kleur), t.leeftijdsgroep
    ORDER BY ls.categorie, ls.ow_code`;

  return {
    meta: { datum: snap.snapshot_datum, seizoen },
    data: rows.map((r) => ({
      team: r.team,
      categorie: r.categorie || null,
      kleur: r.kleur || null,
      niveau: r.niveau || null,
      spelers_m: Number(r.spelers_m),
      spelers_v: Number(r.spelers_v),
      totaal: Number(r.totaal),
      gem_leeftijd: r.gem_leeftijd ? Number(r.gem_leeftijd) : null,
    })),
  };
}
