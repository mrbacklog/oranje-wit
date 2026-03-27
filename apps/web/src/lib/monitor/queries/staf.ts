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
    SELECT DISTINCT ON (ta.ow_code, st.staf_id)
      ta.ow_code,
      st.staf_id,
      s.naam,
      st.rol,
      st.functie
    FROM staf_toewijzingen st
    JOIN "Staf" s ON s.id = st.staf_id
    JOIN team_aliases ta ON ta.alias = st.team AND ta.seizoen = ${seizoen}
    WHERE st.seizoen = ${seizoen}
    ORDER BY ta.ow_code, st.staf_id, st.rol`;

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
