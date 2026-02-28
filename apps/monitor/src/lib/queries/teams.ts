import { prisma } from "@/lib/db/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PeriodeData = {
  j_nummer: string | null;
  pool: string | null;
  sterkte: number | null;
  gem_leeftijd: number | null;
  aantal_spelers: number | null;
};

const PERIODE_NAMEN = [
  "veld_najaar",
  "zaal_deel1",
  "zaal_deel2",
  "veld_voorjaar",
] as const;

export type PeriodeNaam = (typeof PERIODE_NAMEN)[number];

export type TeamRegisterEntry = {
  id: number;
  ow_code: string;
  naam: string | null;
  categorie: string;
  kleur: string | null;
  leeftijdsgroep: string | null;
  spelvorm: string | null;
  periodes: Record<PeriodeNaam, PeriodeData | null>;
};

export type TeamsRegisterResult = {
  seizoen: string;
  teams: TeamRegisterEntry[];
};

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

export async function getTeamsRegister(
  seizoen: string
): Promise<TeamsRegisterResult> {
  const rows = await prisma.$queryRaw<
    {
      id: number;
      ow_code: string;
      naam: string | null;
      categorie: string;
      kleur: string | null;
      leeftijdsgroep: string | null;
      spelvorm: string | null;
      periode: string | null;
      j_nummer: string | null;
      pool: string | null;
      sterkte: number | null;
      gem_leeftijd: string | null;
      aantal_spelers: number | null;
    }[]
  >`
    SELECT t.id, t.ow_code, t.naam, t.categorie, t.kleur, t.leeftijdsgroep, t.spelvorm,
           tp.periode, tp.j_nummer, tp.pool, tp.sterkte, tp.gem_leeftijd, tp.aantal_spelers
    FROM teams t
    LEFT JOIN team_periodes tp ON t.id = tp.team_id
    WHERE t.seizoen = ${seizoen}
    ORDER BY t.ow_code, CASE tp.periode
      WHEN 'veld_najaar' THEN 1 WHEN 'zaal_deel1' THEN 2
      WHEN 'zaal_deel2' THEN 3 WHEN 'veld_voorjaar' THEN 4 ELSE 5 END`;

  // Groepeer per team
  const teamsMap = new Map<string, TeamRegisterEntry>();
  for (const r of rows) {
    if (!teamsMap.has(r.ow_code)) {
      teamsMap.set(r.ow_code, {
        id: r.id,
        ow_code: r.ow_code,
        naam: r.naam,
        categorie: r.categorie,
        kleur: r.kleur,
        leeftijdsgroep: r.leeftijdsgroep,
        spelvorm: r.spelvorm,
        periodes: {
          veld_najaar: null,
          zaal_deel1: null,
          zaal_deel2: null,
          veld_voorjaar: null,
        },
      });
    }
    if (r.periode) {
      const team = teamsMap.get(r.ow_code)!;
      team.periodes[r.periode as PeriodeNaam] = {
        j_nummer: r.j_nummer,
        pool: r.pool,
        sterkte: r.sterkte,
        gem_leeftijd: r.gem_leeftijd ? Number(r.gem_leeftijd) : null,
        aantal_spelers: r.aantal_spelers,
      };
    }
  }

  return {
    seizoen,
    teams: [...teamsMap.values()],
  };
}

// ---------------------------------------------------------------------------
// Detecteer selectie-teams (gecombineerde S1/S2, U17, U19)
// ---------------------------------------------------------------------------

export async function getSelectieTeams(
  seizoen: string
): Promise<Record<string, string>> {
  // Check of er gecombineerde S1/S2 data is EN of er géén zaaldata is die het opsplitst
  const rows = await prisma.$queryRaw<
    { has_combined: boolean; has_zaal: boolean }[]
  >`
    SELECT
      EXISTS(
        SELECT 1 FROM competitie_spelers
        WHERE seizoen = ${seizoen} AND competitie = 'veld_najaar' AND team IN ('S1/S2', 'S1S2')
      ) as has_combined,
      EXISTS(
        SELECT 1 FROM competitie_spelers
        WHERE seizoen = ${seizoen} AND competitie = 'zaal' AND team IN ('1', '2')
      ) as has_zaal
  `;

  const result: Record<string, string> = {};
  if (rows[0]?.has_combined && !rows[0]?.has_zaal) {
    // Alleen gecombineerde data, geen zaal die het opsplitst
    result["1"] = "S1/S2 selectie";
    result["2"] = "S1/S2 selectie";
  }
  return result;
}

// ---------------------------------------------------------------------------
// Spelers per team (geslacht-telling)
// ---------------------------------------------------------------------------

export type TeamSpelerTelling = {
  team: string;
  dames: number;
  heren: number;
  totaal: number;
};

export async function getSpelersPerTeam(
  seizoen: string
): Promise<Map<string, TeamSpelerTelling>> {
  const rows = await prisma.$queryRaw<
    { ow_code: string; geslacht: string; aantal: number }[]
  >`
    WITH best_team AS (
      -- Kies per speler de meest specifieke competitie: zaal > veld_najaar > veld_voorjaar
      SELECT DISTINCT ON (cp.rel_code)
        cp.rel_code, cp.team, cp.geslacht
      FROM competitie_spelers cp
      WHERE cp.seizoen = ${seizoen} AND cp.team IS NOT NULL
      ORDER BY cp.rel_code, CASE cp.competitie
        WHEN 'zaal' THEN 1
        WHEN 'veld_najaar' THEN 2
        WHEN 'veld_voorjaar' THEN 3
        ELSE 4
      END
    ),
    team_mapping AS (
      -- OW J{n} (veld) → ow_code via j_nummer in team_periodes
      SELECT DISTINCT ON ('OW J' || SUBSTRING(tp.j_nummer FROM 2))
        'OW J' || SUBSTRING(tp.j_nummer FROM 2) AS telling_naam,
        t.ow_code
      FROM team_periodes tp
      JOIN teams t ON t.id = tp.team_id AND t.seizoen = ${seizoen}
      WHERE tp.j_nummer IS NOT NULL

      UNION ALL
      -- J{n} (zaal) → ow_code via j_nummer in team_periodes
      SELECT DISTINCT ON (tp.j_nummer)
        tp.j_nummer AS telling_naam,
        t.ow_code
      FROM team_periodes tp
      JOIN teams t ON t.id = tp.team_id AND t.seizoen = ${seizoen}
      WHERE tp.j_nummer IS NOT NULL

      UNION ALL
      -- S{n} (veld) → senioren ow_code
      SELECT 'S' || t.ow_code, t.ow_code
      FROM teams t WHERE t.seizoen = ${seizoen} AND t.ow_code ~ '^\\d+$'

      UNION ALL
      -- S1/S2 selectie → senioren 1 en 2
      SELECT v.naam, t.ow_code
      FROM (VALUES ('S1/S2'), ('S1S2')) v(naam)
      CROSS JOIN teams t
      WHERE t.seizoen = ${seizoen} AND t.ow_code IN ('1', '2')

      UNION ALL
      -- Selectie U17 → alle U17-teams
      SELECT 'U17', t.ow_code
      FROM teams t WHERE t.seizoen = ${seizoen} AND t.ow_code LIKE 'U17-%'

      UNION ALL
      -- Selectie U19 → alle U19-teams
      SELECT 'U19', t.ow_code
      FROM teams t WHERE t.seizoen = ${seizoen} AND t.ow_code LIKE 'U19-%'

      UNION ALL
      -- Kangoeroes
      SELECT v.telling_naam, v.telling_naam
      FROM (VALUES ('Kangoeroes'), ('K')) v(telling_naam)

      UNION ALL
      -- Direct match (MW1, U15-1, U17-1, senioren ow_code '1','2', etc.)
      SELECT t.ow_code, t.ow_code
      FROM teams t WHERE t.seizoen = ${seizoen}
    )
    SELECT tm.ow_code,
           COALESCE(bt.geslacht, l.geslacht, 'O') as geslacht,
           COUNT(DISTINCT bt.rel_code)::int as aantal
    FROM best_team bt
    JOIN leden l ON bt.rel_code = l.rel_code
    JOIN team_mapping tm ON tm.telling_naam = bt.team
    WHERE bt.team IS NOT NULL
    GROUP BY tm.ow_code, COALESCE(bt.geslacht, l.geslacht, 'O')
  `;

  const map = new Map<string, TeamSpelerTelling>();
  for (const r of rows) {
    if (!map.has(r.ow_code)) {
      map.set(r.ow_code, { team: r.ow_code, dames: 0, heren: 0, totaal: 0 });
    }
    const entry = map.get(r.ow_code)!;
    if (r.geslacht === "V") entry.dames += r.aantal;
    else entry.heren += r.aantal;
    entry.totaal += r.aantal;
  }
  return map;
}

// ---------------------------------------------------------------------------
// Individuele spelers per team
// ---------------------------------------------------------------------------

export type TeamSpeler = {
  relCode: string;
  roepnaam: string;
  achternaam: string;
  tussenvoegsel: string | null;
  geslacht: string;
  geboortejaar: number | null;
};

export async function getSpelersVanTeam(
  seizoen: string
): Promise<Map<string, TeamSpeler[]>> {
  const rows = await prisma.$queryRaw<
    {
      ow_code: string;
      rel_code: string;
      roepnaam: string;
      achternaam: string;
      tussenvoegsel: string | null;
      geslacht: string;
      geboortejaar: number | null;
    }[]
  >`
    WITH best_team AS (
      -- Kies per speler de meest specifieke competitie: zaal > veld_najaar > veld_voorjaar
      SELECT DISTINCT ON (cp.rel_code)
        cp.rel_code, cp.team, cp.geslacht
      FROM competitie_spelers cp
      WHERE cp.seizoen = ${seizoen} AND cp.team IS NOT NULL
      ORDER BY cp.rel_code, CASE cp.competitie
        WHEN 'zaal' THEN 1
        WHEN 'veld_najaar' THEN 2
        WHEN 'veld_voorjaar' THEN 3
        ELSE 4
      END
    ),
    team_mapping AS (
      -- OW J{n} (veld) → ow_code via j_nummer in team_periodes
      SELECT DISTINCT ON ('OW J' || SUBSTRING(tp.j_nummer FROM 2))
        'OW J' || SUBSTRING(tp.j_nummer FROM 2) AS telling_naam,
        t.ow_code
      FROM team_periodes tp
      JOIN teams t ON t.id = tp.team_id AND t.seizoen = ${seizoen}
      WHERE tp.j_nummer IS NOT NULL

      UNION ALL
      -- J{n} (zaal) → ow_code via j_nummer in team_periodes
      SELECT DISTINCT ON (tp.j_nummer)
        tp.j_nummer AS telling_naam,
        t.ow_code
      FROM team_periodes tp
      JOIN teams t ON t.id = tp.team_id AND t.seizoen = ${seizoen}
      WHERE tp.j_nummer IS NOT NULL

      UNION ALL
      -- S{n} (veld) → senioren ow_code
      SELECT 'S' || t.ow_code, t.ow_code
      FROM teams t WHERE t.seizoen = ${seizoen} AND t.ow_code ~ '^\\d+$'

      UNION ALL
      -- S1/S2 selectie → senioren 1 en 2
      SELECT v.naam, t.ow_code
      FROM (VALUES ('S1/S2'), ('S1S2')) v(naam)
      CROSS JOIN teams t
      WHERE t.seizoen = ${seizoen} AND t.ow_code IN ('1', '2')

      UNION ALL
      -- Selectie U17 → alle U17-teams
      SELECT 'U17', t.ow_code
      FROM teams t WHERE t.seizoen = ${seizoen} AND t.ow_code LIKE 'U17-%'

      UNION ALL
      -- Selectie U19 → alle U19-teams
      SELECT 'U19', t.ow_code
      FROM teams t WHERE t.seizoen = ${seizoen} AND t.ow_code LIKE 'U19-%'

      UNION ALL
      -- Kangoeroes
      SELECT v.telling_naam, v.telling_naam
      FROM (VALUES ('Kangoeroes'), ('K')) v(telling_naam)

      UNION ALL
      -- Direct match (MW1, U15-1, U17-1, senioren ow_code '1','2', etc.)
      SELECT t.ow_code, t.ow_code
      FROM teams t WHERE t.seizoen = ${seizoen}
    )
    SELECT DISTINCT ON (tm.ow_code, bt.rel_code)
           tm.ow_code,
           l.rel_code,
           l.roepnaam,
           l.achternaam,
           l.tussenvoegsel,
           COALESCE(bt.geslacht, l.geslacht, 'O') as geslacht,
           l.geboortejaar
    FROM best_team bt
    JOIN leden l ON bt.rel_code = l.rel_code
    JOIN team_mapping tm ON tm.telling_naam = bt.team
    WHERE bt.team IS NOT NULL
    ORDER BY tm.ow_code, bt.rel_code`;

  const map = new Map<string, TeamSpeler[]>();
  for (const r of rows) {
    if (!map.has(r.ow_code)) map.set(r.ow_code, []);
    map.get(r.ow_code)!.push({
      relCode: r.rel_code,
      roepnaam: r.roepnaam,
      achternaam: r.achternaam,
      tussenvoegsel: r.tussenvoegsel,
      geslacht: r.geslacht,
      geboortejaar: r.geboortejaar,
    });
  }

  // Sorteer per team op achternaam
  for (const spelers of map.values()) {
    spelers.sort((a, b) => a.achternaam.localeCompare(b.achternaam, "nl"));
  }

  return map;
}
