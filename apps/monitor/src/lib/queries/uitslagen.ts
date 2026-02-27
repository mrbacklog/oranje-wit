import { prisma } from "@/lib/db/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StandRegel = {
  positie: number;
  teamNaam: string;
  isOW: boolean;
  gespeeld: number;
  gewonnen: number;
  gelijk: number;
  verloren: number;
  punten: number;
  doelpuntenVoor: number;
  doelpuntenTegen: number;
};

export type PouleStand = {
  pool: string;
  niveau: string | null;
  periode: string;
  regels: StandRegel[];
};

export type TeamUitslagen = {
  teamCode: string; // bijv. "B1", "1", "A2"
  poules: PouleStand[];
};

// ---------------------------------------------------------------------------
// Alle OW-teams voor een seizoen met hun uitslagen
// ---------------------------------------------------------------------------

export async function getOWTeamsMetUitslagen(
  seizoen: string
): Promise<TeamUitslagen[]> {
  const rows = await prisma.$queryRaw<
    {
      pool_stand_id: number;
      pool: string;
      niveau: string | null;
      periode: string;
      positie: number;
      team_naam: string;
      is_ow: boolean;
      gs: number;
      wn: number;
      gl: number;
      vl: number;
      pt: number;
      vr: number;
      tg: number;
    }[]
  >`
    SELECT ps.id as pool_stand_id, ps.pool, ps.niveau, ps.periode,
           psr.positie, psr.team_naam, psr.is_ow,
           psr.gs, psr.wn, psr.gl, psr.vl, psr.pt, psr.vr, psr.tg
    FROM pool_standen ps
    JOIN pool_stand_regels psr ON psr.pool_stand_id = ps.id
    WHERE ps.seizoen = ${seizoen}
    ORDER BY ps.periode, ps.pool, psr.positie`;

  // Groepeer per poule
  const poulesMap = new Map<number, PouleStand & { owTeamCodes: string[] }>();
  for (const r of rows) {
    if (!poulesMap.has(r.pool_stand_id)) {
      poulesMap.set(r.pool_stand_id, {
        pool: r.pool,
        niveau: r.niveau,
        periode: r.periode,
        regels: [],
        owTeamCodes: [],
      });
    }
    const poule = poulesMap.get(r.pool_stand_id)!;
    poule.regels.push({
      positie: r.positie,
      teamNaam: r.team_naam,
      isOW: r.is_ow,
      gespeeld: r.gs,
      gewonnen: r.wn,
      gelijk: r.gl,
      verloren: r.vl,
      punten: r.pt,
      doelpuntenVoor: r.vr,
      doelpuntenTegen: r.tg,
    });
    if (r.is_ow) {
      // Extracteer teamcode: "Oranje Wit (D) B1" → "B1"
      const match = r.team_naam.match(/Oranje Wit \(D\)\s*(.*)/);
      const code = match ? match[1].trim() : r.team_naam;
      poule.owTeamCodes.push(code);
    }
  }

  // Groepeer poules per OW-teamcode
  const teamsMap = new Map<string, PouleStand[]>();
  for (const poule of poulesMap.values()) {
    // Filter lege poules (OW-team heeft 0 wedstrijden gespeeld)
    const owGespeeld = poule.regels
      .filter((r) => r.isOW)
      .reduce((sum, r) => sum + r.gespeeld, 0);
    if (owGespeeld === 0) continue;

    for (const code of poule.owTeamCodes) {
      if (!teamsMap.has(code)) teamsMap.set(code, []);
      teamsMap.get(code)!.push({
        pool: poule.pool,
        niveau: poule.niveau,
        periode: poule.periode,
        regels: poule.regels,
      });
    }
  }

  // Deduplicate: poules met dezelfde pool+niveau behouden alleen de versie
  // met de meeste gespeelde wedstrijden (voorkomt dubbele veld najaar/voorjaar)
  for (const [code, poules] of teamsMap) {
    const seen = new Map<string, number>(); // pool+niveau → index met meeste gs
    const deduped: PouleStand[] = [];
    for (const poule of poules) {
      const key = `${poule.pool}|${poule.niveau}`;
      const totalGs = poule.regels.reduce((s, r) => s + r.gespeeld, 0);
      const existing = seen.get(key);
      if (existing !== undefined) {
        const existingGs = deduped[existing].regels.reduce(
          (s, r) => s + r.gespeeld,
          0
        );
        if (totalGs > existingGs) {
          deduped[existing] = poule; // vervang door versie met meer data
        }
      } else {
        seen.set(key, deduped.length);
        deduped.push(poule);
      }
    }
    teamsMap.set(code, deduped);
  }

  // Sorteer teams
  const teams: TeamUitslagen[] = [...teamsMap.entries()]
    .map(([teamCode, poules]) => ({ teamCode, poules }))
    .sort((a, b) => sorteerTeamCode(a.teamCode) - sorteerTeamCode(b.teamCode));

  return teams;
}

// Sorteer: 1,2,3..., A1,A2..., B1,B2..., C1..., D1..., E1..., F1..., MW1, S-...
function sorteerTeamCode(code: string): number {
  // Puur nummer (senioren): "1" → 100, "2" → 200
  if (/^\d+$/.test(code)) return parseInt(code) * 100;
  // Letter + nummer: "A1" → 1010, "B2" → 1120
  const m = code.match(/^([A-Z]+)(\d+)$/);
  if (m) {
    const letter = m[1].charCodeAt(0) - 64; // A=1, B=2, ...
    return 1000 + letter * 100 + parseInt(m[2]) * 10;
  }
  // Overig (MW1, etc.)
  return 9000;
}
