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

export type PeriodeNaam = "veld_najaar" | "zaal_deel1" | "zaal_deel2" | "veld_voorjaar";

export type TeamRegisterEntry = {
  id: number;
  ow_code: string;
  naam: string | null;
  alias: string | null;
  teamType: string | null;
  categorie: string;
  kleur: string | null;
  leeftijdsgroep: string | null;
  spelvorm: string | null;
  isSelectie: boolean;
  selectieOwCode: string | null;
  sortOrder: number | null;
  periodes: Record<PeriodeNaam, PeriodeData | null>;
};

export type TeamsRegisterResult = {
  seizoen: string;
  teams: TeamRegisterEntry[];
};

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

export async function getTeamsRegister(seizoen: string): Promise<TeamsRegisterResult> {
  const rows = await prisma.$queryRaw<
    {
      id: number;
      ow_code: string;
      naam: string | null;
      alias: string | null;
      team_type: string | null;
      categorie: string;
      kleur: string | null;
      leeftijdsgroep: string | null;
      spelvorm: string | null;
      is_selectie: boolean;
      selectie_ow_code: string | null;
      sort_order: number | null;
      periode: string | null;
      j_nummer: string | null;
      pool: string | null;
      sterkte: number | null;
      gem_leeftijd: string | null;
      aantal_spelers: number | null;
    }[]
  >`
    SELECT t.id, t.ow_code, t.naam, t.alias, t.team_type, t.categorie, t.kleur, t.leeftijdsgroep, t.spelvorm, t.is_selectie, t.selectie_ow_code, t.sort_order,
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
        alias: r.alias,
        teamType: r.team_type,
        categorie: r.categorie,
        kleur: r.kleur,
        leeftijdsgroep: r.leeftijdsgroep,
        spelvorm: r.spelvorm,
        isSelectie: r.is_selectie,
        selectieOwCode: r.selectie_ow_code,
        sortOrder: r.sort_order,
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
// Spelers per team (geslacht-telling)
// ---------------------------------------------------------------------------

export type TeamSpelerTelling = {
  team: string;
  dames: number;
  heren: number;
  totaal: number;
};

export async function getSpelersPerTeam(seizoen: string): Promise<Map<string, TeamSpelerTelling>> {
  const rows = await prisma.$queryRaw<{ ow_code: string; geslacht: string; aantal: number }[]>`
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
    )
    SELECT ta.ow_code,
           COALESCE(bt.geslacht, l.geslacht, 'O') as geslacht,
           COUNT(DISTINCT bt.rel_code)::int as aantal
    FROM best_team bt
    JOIN leden l ON bt.rel_code = l.rel_code
    JOIN team_aliases ta ON ta.alias = bt.team AND ta.seizoen = ${seizoen}
    WHERE bt.team IS NOT NULL
    GROUP BY ta.ow_code, COALESCE(bt.geslacht, l.geslacht, 'O')
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

export async function getSpelersVanTeam(seizoen: string): Promise<Map<string, TeamSpeler[]>> {
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
    )
    SELECT DISTINCT ON (ta.ow_code, bt.rel_code)
           ta.ow_code,
           l.rel_code,
           l.roepnaam,
           l.achternaam,
           l.tussenvoegsel,
           COALESCE(bt.geslacht, l.geslacht, 'O') as geslacht,
           l.geboortejaar
    FROM best_team bt
    JOIN leden l ON bt.rel_code = l.rel_code
    JOIN team_aliases ta ON ta.alias = bt.team AND ta.seizoen = ${seizoen}
    WHERE bt.team IS NOT NULL
    ORDER BY ta.ow_code, bt.rel_code`;

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
