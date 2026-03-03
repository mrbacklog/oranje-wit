import { prisma } from "@/lib/db/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SpelerStatus = "in_team" | "reserve" | "historisch";

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
  lidsoort: string | null;
  huidigTeam: string | null;
  selectie: string | null;
  seizoenenActief: number;
  heeftFoto: boolean;
  status: SpelerStatus;
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
      lidsoort: string | null;
      huidig_team: string | null;
      selectie: string | null;
      seizoenen_actief: bigint;
      heeft_foto: boolean;
    }[]
  >`
    SELECT l.rel_code, l.roepnaam, l.achternaam, l.tussenvoegsel,
           l.geslacht, l.geboortejaar, l.geboortedatum, l.lid_sinds, l.afmelddatum,
           l.lidsoort,
           cur.team as huidig_team,
           sel.selectie,
           cp_count.seizoenen_actief,
           EXISTS(SELECT 1 FROM lid_fotos lf WHERE lf.rel_code = l.rel_code) as heeft_foto
    FROM leden l
    INNER JOIN (
      SELECT rel_code, COUNT(DISTINCT seizoen)::bigint as seizoenen_actief
      FROM competitie_spelers
      GROUP BY rel_code
    ) cp_count ON cp_count.rel_code = l.rel_code
    LEFT JOIN LATERAL (
      SELECT CASE
        WHEN j_al.alias IS NOT NULL
          THEN COALESCE(t.naam, ta.ow_code) || ' (' || j_al.alias || ')'
        ELSE COALESCE(t.naam, ta.ow_code, cp.team)
      END as team
      FROM competitie_spelers cp
      LEFT JOIN team_aliases ta ON ta.seizoen = cp.seizoen AND ta.alias = cp.team
      LEFT JOIN teams t ON t.seizoen = cp.seizoen AND t.ow_code = ta.ow_code
      LEFT JOIN team_aliases j_al ON j_al.seizoen = cp.seizoen AND j_al.ow_code = ta.ow_code AND j_al.alias ~ '^J[0-9]+$'
      WHERE cp.rel_code = l.rel_code AND cp.seizoen = ${seizoen}
      ORDER BY CASE cp.competitie
        WHEN 'zaal' THEN 1 WHEN 'veld_najaar' THEN 2 WHEN 'veld_voorjaar' THEN 3
      END
      LIMIT 1
    ) cur ON true
    LEFT JOIN LATERAL (
      SELECT COALESCE(t_sel.naam, ta_sel.ow_code) as selectie
      FROM competitie_spelers cp_sel
      JOIN team_aliases ta_sel ON ta_sel.seizoen = cp_sel.seizoen AND ta_sel.alias = cp_sel.team
      JOIN teams t_sel ON t_sel.seizoen = cp_sel.seizoen AND t_sel.ow_code = ta_sel.ow_code AND t_sel.is_selectie = true
      WHERE cp_sel.rel_code = l.rel_code AND cp_sel.seizoen = ${seizoen} AND cp_sel.competitie = 'veld_najaar'
      LIMIT 1
    ) sel ON true
    ORDER BY l.achternaam, l.roepnaam`;

  return rows.map((r) => {
    const heeftTeam = !!r.huidig_team;
    const isAfgemeld = !!r.afmelddatum;
    const isBondslid = r.lidsoort === "Bondslid";

    let status: SpelerStatus;
    if (heeftTeam) status = "in_team";
    else if (!isAfgemeld && isBondslid) status = "reserve";
    else status = "historisch";

    return {
      relCode: r.rel_code,
      roepnaam: r.roepnaam,
      achternaam: r.achternaam,
      tussenvoegsel: r.tussenvoegsel,
      geslacht: r.geslacht,
      geboortejaar: r.geboortejaar,
      geboortedatum: r.geboortedatum,
      lidSinds: r.lid_sinds,
      afmelddatum: r.afmelddatum,
      lidsoort: r.lidsoort,
      huidigTeam: r.huidig_team,
      selectie: r.selectie ?? null,
      seizoenenActief: Number(r.seizoenen_actief),
      heeftFoto: r.heeft_foto,
      status,
    };
  });
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
