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
  ow_code: string;
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
    SELECT t.id, t.ow_code, t.categorie, t.kleur, t.leeftijdsgroep, t.spelvorm,
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
        ow_code: r.ow_code,
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
