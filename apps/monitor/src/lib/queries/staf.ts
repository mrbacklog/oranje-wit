import { prisma } from "@/lib/db/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StafLid = {
  stafCode: string;
  naam: string;
  rol: string;
  functie: string | null;
};

export type TeamStaf = {
  team: string;
  staf: StafLid[];
};

// ---------------------------------------------------------------------------
// Staf per team voor een seizoen (uit StafToewijzing)
// ---------------------------------------------------------------------------

export async function getStafPerTeam(seizoen: string): Promise<Map<string, StafLid[]>> {
  const rows = await prisma.$queryRaw<
    {
      ow_code: string;
      staf_id: string;
      naam: string;
      rol: string;
      functie: string | null;
    }[]
  >`
    WITH team_mapping AS (
      -- OW J{n} → ow_code via j_nummer in team_periodes
      SELECT DISTINCT ON ('OW J' || SUBSTRING(tp.j_nummer FROM 2))
        'OW J' || SUBSTRING(tp.j_nummer FROM 2) AS telling_naam,
        t.ow_code
      FROM team_periodes tp
      JOIN teams t ON t.id = tp.team_id AND t.seizoen = ${seizoen}
      WHERE tp.j_nummer IS NOT NULL

      UNION ALL
      -- S{n} → ow_code {n} (senioren)
      SELECT 'S' || t.ow_code, t.ow_code
      FROM teams t WHERE t.seizoen = ${seizoen} AND t.ow_code ~ '^\\d+$'

      UNION ALL
      -- S1/S2 en S1S2 selectie → beide senioren-teams 1 en 2
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
      -- Kangoeroes / K
      SELECT v.telling_naam, v.telling_naam
      FROM (VALUES ('Kangoeroes'), ('K')) v(telling_naam)

      UNION ALL
      -- Direct match (MW1, U15-1, U17-1, etc.)
      SELECT t.ow_code, t.ow_code
      FROM teams t WHERE t.seizoen = ${seizoen}
    ),
    staf_mapped AS (
      SELECT DISTINCT ON (tm.ow_code, st.staf_id)
        tm.ow_code,
        st.staf_id,
        s.naam,
        st.rol,
        st.functie
      FROM staf_toewijzingen st
      JOIN "Staf" s ON s.id = st.staf_id
      JOIN team_mapping tm ON tm.telling_naam = st.team
      WHERE st.seizoen = ${seizoen}
      ORDER BY tm.ow_code, st.staf_id, st.rol
    )
    SELECT * FROM staf_mapped
    ORDER BY ow_code, rol, naam`;

  const perTeam = new Map<string, StafLid[]>();
  for (const r of rows) {
    if (!perTeam.has(r.ow_code)) perTeam.set(r.ow_code, []);
    perTeam.get(r.ow_code)!.push({
      stafCode: r.staf_id,
      naam: r.naam,
      rol: r.rol,
      functie: r.functie,
    });
  }

  return perTeam;
}
