import { prisma } from "@/lib/db/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SpelerOverzicht = {
  relCode: string;
  roepnaam: string;
  achternaam: string;
  tussenvoegsel: string | null;
  geslacht: string;
  geboortejaar: number | null;
  geboortedatum: Date | null;
  lidSinds: Date | null;
  afmelddatum: Date | null;
  hudigTeam: string | null;
  seizoenenActief: number;
  heeftFoto: boolean;
};

export type SpelerDetailResult = {
  // Basis
  relCode: string;
  roepnaam: string;
  achternaam: string;
  tussenvoegsel: string | null;
  geslacht: string;
  geboortejaar: number | null;
  geboortedatum: Date | null;
  lidSinds: Date | null;
  afmelddatum: Date | null;
  heeftFoto: boolean;
  // Historie
  seizoenen: SpelerSeizoenRegel[];
  // Verloop
  verloop: VerloopRegel[];
};

export type SpelerSeizoenRegel = {
  seizoen: string;
  team: string;
  competities: { competitie: string; team: string }[];
};

export type VerloopRegel = {
  seizoen: string;
  status: string;
  teamVorig: string | null;
  teamNieuw: string | null;
};

// ---------------------------------------------------------------------------
// Overzicht: alle spelers voor een seizoen (of alle actieve)
// ---------------------------------------------------------------------------

export async function getSpelersOverzicht(seizoen: string): Promise<SpelerOverzicht[]> {
  const rows = await prisma.$queryRaw<
    {
      rel_code: string;
      roepnaam: string;
      achternaam: string;
      tussenvoegsel: string | null;
      geslacht: string;
      geboortejaar: number | null;
      geboortedatum: Date | null;
      lid_sinds: Date | null;
      afmelddatum: Date | null;
      huidig_team: string | null;
      seizoenen_actief: bigint;
      heeft_foto: boolean;
    }[]
  >`
    SELECT l.rel_code, l.roepnaam, l.achternaam, l.tussenvoegsel,
           l.geslacht, l.geboortejaar, l.geboortedatum, l.lid_sinds, l.afmelddatum,
           cur.team as huidig_team,
           cp_count.seizoenen_actief,
           EXISTS(SELECT 1 FROM lid_fotos lf WHERE lf.rel_code = l.rel_code) as heeft_foto
    FROM leden l
    INNER JOIN (
      SELECT rel_code, COUNT(DISTINCT seizoen)::bigint as seizoenen_actief
      FROM competitie_spelers
      GROUP BY rel_code
    ) cp_count ON cp_count.rel_code = l.rel_code
    LEFT JOIN LATERAL (
      SELECT team FROM competitie_spelers
      WHERE rel_code = l.rel_code AND seizoen = ${seizoen}
      ORDER BY CASE competitie
        WHEN 'veld_najaar' THEN 1 WHEN 'zaal' THEN 2 WHEN 'veld_voorjaar' THEN 3
      END
      LIMIT 1
    ) cur ON true
    ORDER BY l.achternaam, l.roepnaam`;

  return rows.map((r) => ({
    relCode: r.rel_code,
    roepnaam: r.roepnaam,
    achternaam: r.achternaam,
    tussenvoegsel: r.tussenvoegsel,
    geslacht: r.geslacht,
    geboortejaar: r.geboortejaar,
    geboortedatum: r.geboortedatum,
    lidSinds: r.lid_sinds,
    afmelddatum: r.afmelddatum,
    hudigTeam: r.huidig_team,
    seizoenenActief: Number(r.seizoenen_actief),
    heeftFoto: r.heeft_foto,
  }));
}

// ---------------------------------------------------------------------------
// Detail: volledige info voor één speler
// ---------------------------------------------------------------------------

export async function getSpelerDetail(relCode: string): Promise<SpelerDetailResult | null> {
  // Basis-info
  const lid = await prisma.lid.findUnique({
    where: { relCode },
    select: {
      relCode: true,
      roepnaam: true,
      achternaam: true,
      tussenvoegsel: true,
      geslacht: true,
      geboortejaar: true,
      geboortedatum: true,
      lidSinds: true,
      afmelddatum: true,
      foto: { select: { relCode: true } },
    },
  });

  if (!lid) return null;

  // Seizoenen + competities via raw query (speler_seizoenen is nu een VIEW)
  const cpRows = await prisma.$queryRaw<{ seizoen: string; competitie: string; team: string }[]>`
    SELECT seizoen, competitie, team
    FROM competitie_spelers
    WHERE rel_code = ${relCode}
    ORDER BY seizoen DESC,
      CASE competitie
        WHEN 'veld_najaar' THEN 1 WHEN 'zaal' THEN 2 WHEN 'veld_voorjaar' THEN 3
      END`;

  // Groepeer per seizoen
  const seizoenMap = new Map<string, SpelerSeizoenRegel>();
  for (const r of cpRows) {
    if (!seizoenMap.has(r.seizoen)) {
      seizoenMap.set(r.seizoen, {
        seizoen: r.seizoen,
        team: r.team, // eerste competitie (veld_najaar) = primair team
        competities: [],
      });
    }
    seizoenMap.get(r.seizoen)!.competities.push({
      competitie: r.competitie,
      team: r.team,
    });
  }

  // Verloop
  const verloop = await prisma.ledenverloop.findMany({
    where: { relCode },
    orderBy: { seizoen: "desc" },
    select: {
      seizoen: true,
      status: true,
      teamVorig: true,
      teamNieuw: true,
    },
  });

  return {
    relCode: lid.relCode,
    roepnaam: lid.roepnaam,
    achternaam: lid.achternaam,
    tussenvoegsel: lid.tussenvoegsel,
    geslacht: lid.geslacht,
    geboortejaar: lid.geboortejaar,
    geboortedatum: lid.geboortedatum,
    lidSinds: lid.lidSinds,
    afmelddatum: lid.afmelddatum,
    heeftFoto: !!lid.foto,
    seizoenen: [...seizoenMap.values()],
    verloop: verloop.map((v) => ({
      seizoen: v.seizoen,
      status: v.status,
      teamVorig: v.teamVorig,
      teamNieuw: v.teamNieuw,
    })),
  };
}
