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

export async function getStafPerTeam(
  seizoen: string
): Promise<Map<string, StafLid[]>> {
  const rows = await prisma.$queryRaw<
    {
      staf_id: string;
      naam: string;
      team: string;
      rol: string;
      functie: string | null;
    }[]
  >`
    SELECT st.staf_id, s.naam, st.team, st.rol, st.functie
    FROM staf_toewijzingen st
    JOIN "Staf" s ON s.id = st.staf_id
    WHERE st.seizoen = ${seizoen}
    ORDER BY st.team, st.rol, s.naam`;

  const perTeam = new Map<string, StafLid[]>();
  for (const r of rows) {
    if (!perTeam.has(r.team)) perTeam.set(r.team, []);
    perTeam.get(r.team)!.push({
      stafCode: r.staf_id,
      naam: r.naam,
      rol: r.rol,
      functie: r.functie,
    });
  }

  return perTeam;
}

// ---------------------------------------------------------------------------
// Alle seizoenen waarvoor staf-toewijzingen bestaan
// ---------------------------------------------------------------------------

export async function getStafSeizoenen(): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ seizoen: string }[]>`
    SELECT DISTINCT seizoen FROM staf_toewijzingen ORDER BY seizoen DESC`;
  return rows.map((r) => r.seizoen);
}
