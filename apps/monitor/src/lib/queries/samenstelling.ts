import { prisma } from "@/lib/db/prisma";

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
  const startJaar = parseInt(seizoen.split("-")[0]);

  const rows = await prisma.$queryRaw<GeboortejaarRow[]>`
    SELECT
      l.geboortejaar,
      l.geslacht,
      COUNT(*)::int AS aantal,
      CASE
        WHEN (${startJaar} - l.geboortejaar) BETWEEN 13 AND 14 THEN 'U15'
        WHEN (${startJaar} - l.geboortejaar) BETWEEN 15 AND 16 THEN 'U17'
        WHEN (${startJaar} - l.geboortejaar) BETWEEN 17 AND 18 THEN 'U19'
        WHEN (${startJaar} - l.geboortejaar) >= 19 THEN 'Senioren'
        ELSE NULL
      END AS a_categorie,
      CASE
        WHEN (${startJaar} - l.geboortejaar) IN (13, 15, 17) THEN '1e-jaars'
        WHEN (${startJaar} - l.geboortejaar) IN (14, 16, 18) THEN '2e-jaars'
        ELSE NULL
      END AS a_jaars
    FROM speler_seizoenen ss
    JOIN leden l ON ss.rel_code = l.rel_code
    WHERE ss.seizoen = ${seizoen}
    GROUP BY l.geboortejaar, l.geslacht,
             (${startJaar} - l.geboortejaar)
    ORDER BY l.geboortejaar, l.geslacht`;

  return {
    meta: { datum: null, seizoen },
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
  const rows = await prisma.$queryRaw<KleurRow[]>`
    WITH team_kleur AS (
      -- OW J-teams: telling-naam via j_nummer → ow_code → kleur
      SELECT DISTINCT ON ('OW J' || SUBSTRING(tp.j_nummer FROM 2))
        'OW J' || SUBSTRING(tp.j_nummer FROM 2) AS telling_naam,
        t.kleur, t.categorie, t.leeftijdsgroep
      FROM team_periodes tp
      JOIN teams t ON t.id = tp.team_id AND t.seizoen = ${seizoen}
      WHERE tp.j_nummer IS NOT NULL

      UNION ALL

      -- Senioren: S{n} → ow_code {n}
      SELECT 'S' || t.ow_code, t.kleur, t.categorie, t.leeftijdsgroep
      FROM teams t
      WHERE t.seizoen = ${seizoen} AND t.ow_code ~ '^\d+$'

      UNION ALL

      -- Direct matches (MW1, U15-1, U17-1, U19-1, etc.)
      SELECT t.ow_code, t.kleur, t.categorie, t.leeftijdsgroep
      FROM teams t
      WHERE t.seizoen = ${seizoen} AND t.ow_code !~ '^\d+$'

      UNION ALL

      -- Selectieteams (gecombineerde telling-namen die later splitsen)
      SELECT v.telling_naam, v.kleur, v.categorie, v.leeftijdsgroep
      FROM (VALUES
        ('S1/S2', NULL::text, 'a', 'Senioren'),
        ('U17',   NULL::text, 'a', 'U17'),
        ('U19',   NULL::text, 'a', 'U19')
      ) v(telling_naam, kleur, categorie, leeftijdsgroep)
      WHERE EXISTS (SELECT 1 FROM teams WHERE seizoen = ${seizoen})
    ),
    spelers AS (
      SELECT
        ss.team,
        l.geslacht,
        COALESCE(
          tk.kleur,
          CASE
            WHEN tk.leeftijdsgroep IN ('U15','U17','U19') THEN 'A-categorie'
            WHEN tk.leeftijdsgroep = 'Senioren' THEN 'Senioren'
            WHEN tk.categorie = 'a' THEN 'A-categorie'
            ELSE 'Onbekend'
          END
        ) AS kleur,
        COALESCE(tk.categorie, 'onbekend') AS categorie
      FROM speler_seizoenen ss
      JOIN leden l ON ss.rel_code = l.rel_code
      LEFT JOIN team_kleur tk ON tk.telling_naam = ss.team
      WHERE ss.seizoen = ${seizoen}
    )
    SELECT
      kleur,
      categorie,
      COUNT(DISTINCT team)::int AS teams,
      COUNT(*) FILTER (WHERE geslacht = 'M')::int AS spelers_m,
      COUNT(*) FILTER (WHERE geslacht = 'V')::int AS spelers_v,
      COUNT(*)::int AS totaal
    FROM spelers
    GROUP BY kleur, categorie
    ORDER BY categorie, kleur`;

  return {
    meta: { datum: null, seizoen },
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
