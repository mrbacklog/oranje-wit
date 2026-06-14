import { prisma } from "@/lib/teamindeling/db/prisma";
import { getActiefSeizoen } from "@oranje-wit/teamindeling-shared/seizoen";
import { logger } from "@oranje-wit/types";

// ── Types ────────────────────────────────────────────────────────────────────

export type PubliekeSpeler = {
  roepnaam: string;
  tussenvoegsel: string | null;
  achternaam: string;
  geslacht: "V" | "M";
};

export type PubliekeStaf = {
  naam: string;
  rol: string;
};

export type PubliekTeam = {
  id: string;
  naam: string;
  volgorde: number;
  soort: "team" | "selectie";
  gebundeld: boolean;
  dames: PubliekeSpeler[];
  heren: PubliekeSpeler[];
  /** Alleen gevuld als soort=selectie en gebundeld=false */
  subteams: {
    naam: string;
    dames: PubliekeSpeler[];
    heren: PubliekeSpeler[];
    staf: PubliekeStaf[];
  }[];
  /** Teamnamen die uit deze selectie-pool voortkomen (gebundeld=true) */
  uitkomstTeams: string[];
  staf: PubliekeStaf[];
};

export type PubliekeToelichtingData = {
  titel: string;
  seizoenLabel: string;
  introTekst: string;
  tcTekst: string;
};

export type PubliekeTeamindelingData = {
  toelichting: PubliekeToelichtingData | null;
  teams: PubliekTeam[];
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function bouwSpeler(r: {
  roepnaam: string;
  achternaam: string;
  geslacht: string;
  tussenvoegsel?: string | null;
}): PubliekeSpeler {
  return {
    roepnaam: r.roepnaam,
    achternaam: r.achternaam,
    tussenvoegsel: r.tussenvoegsel ?? null,
    geslacht: r.geslacht === "V" ? "V" : "M",
  };
}

// ── Hoofdfunctie ─────────────────────────────────────────────────────────────

export async function getPubliekeTeamindelingData(): Promise<PubliekeTeamindelingData> {
  const seizoen = await getActiefSeizoen();

  const kaders = await prisma.kaders.findUnique({
    where: { seizoen },
    select: { id: true },
  });
  if (!kaders) return { toelichting: null, teams: [] };

  // Haal publicatie-toelichting en werkindeling parallel op
  const [publicatie, werkindeling] = await Promise.all([
    prisma.teamindelingPublicatie.findUnique({
      where: { kadersId: kaders.id },
      select: { titel: true, seizoenLabel: true, introTekst: true, tcTekst: true },
    }),
    prisma.werkindeling.findFirst({
      where: { kadersId: kaders.id, verwijderdOp: null },
      select: { id: true },
    }),
  ]);

  if (!werkindeling) return { toelichting: mapToelichting(publicatie), teams: [] };

  // Meest recente versie ophalen
  const versie = await prisma.versie.findFirst({
    where: { werkindelingId: werkindeling.id },
    orderBy: { nummer: "desc" },
    select: {
      id: true,
      selectieGroepen: {
        include: {
          spelers: { include: { speler: true } },
          staf: { include: { staf: true } },
          teams: { select: { id: true } },
        },
      },
      teams: {
        orderBy: { volgorde: "asc" },
        include: {
          spelers: { include: { speler: true } },
          staf: { include: { staf: true } },
        },
      },
    },
  });

  if (!versie) return { toelichting: mapToelichting(publicatie), teams: [] };

  // Verzamel alle relCodes voor batch-tussenvoegsel-lookup
  const alleRelCodes = new Set<string>();
  for (const team of versie.teams) {
    for (const ts of team.spelers) alleRelCodes.add(ts.spelerId);
  }
  for (const sg of versie.selectieGroepen) {
    for (const ss of sg.spelers) alleRelCodes.add(ss.spelerId);
  }

  const leden = await prisma.lid.findMany({
    where: { relCode: { in: Array.from(alleRelCodes) } },
    select: { relCode: true, tussenvoegsel: true },
  });
  const tussenvoegselMap = new Map<string, string | null>(
    leden.map((l) => [l.relCode, l.tussenvoegsel])
  );

  type VersieTeam = (typeof versie.teams)[number];

  // Bepaal welke teamIds bij een selectiegroep horen (nooit als losse kaart tonen)
  const selectieTeamIds = new Set<string>(
    versie.teams.filter((t: VersieTeam) => t.selectieGroepId != null).map((t: VersieTeam) => t.id)
  );

  // Lookup: selectieGroepId → lidteams
  const teamsPerSelectieGroep = new Map<string, VersieTeam[]>();
  for (const team of versie.teams) {
    if (!team.selectieGroepId) continue;
    const arr = teamsPerSelectieGroep.get(team.selectieGroepId) ?? [];
    arr.push(team);
    teamsPerSelectieGroep.set(team.selectieGroepId, arr);
  }

  const kaarten: PubliekTeam[] = [];

  // 1. Losse teams (geen selectieGroepId)
  for (const team of versie.teams) {
    if (selectieTeamIds.has(team.id)) continue;

    const dames: PubliekeSpeler[] = [];
    const heren: PubliekeSpeler[] = [];

    for (const ts of team.spelers) {
      const speler = bouwSpeler({
        ...ts.speler,
        tussenvoegsel: tussenvoegselMap.get(ts.spelerId) ?? null,
      });
      if (ts.speler.geslacht === "V") dames.push(speler);
      else heren.push(speler);
    }

    kaarten.push({
      id: team.id,
      naam: team.naam,
      volgorde: team.volgorde,
      soort: "team",
      gebundeld: false,
      dames,
      heren,
      subteams: [],
      uitkomstTeams: [],
      staf: team.staf.map((ts: VersieTeam["staf"][number]) => ({
        naam:
          ts.staf?.naam ??
          (logger.warn("publieke-presentatie: staf zonder naam", { stafId: ts.stafId }), "?"),
        rol: ts.rol ?? "",
      })),
    });
  }

  // 2. Eén kaart per selectiegroep
  for (const sg of versie.selectieGroepen) {
    const groepTeams: VersieTeam[] = teamsPerSelectieGroep.get(sg.id) ?? [];
    const minVolgorde =
      groepTeams.length > 0
        ? groepTeams.reduce((m, t) => Math.min(m, t.volgorde ?? 0), Infinity)
        : 0;
    const groepNaam =
      (typeof sg.naam === "string" && sg.naam.trim()) ||
      groepTeams.map((t) => t.naam).join(" / ") ||
      "Selectie";

    if (sg.gebundeld) {
      const dames: PubliekeSpeler[] = [];
      const heren: PubliekeSpeler[] = [];

      for (const ss of sg.spelers) {
        const speler = bouwSpeler({
          ...ss.speler,
          tussenvoegsel: tussenvoegselMap.get(ss.spelerId) ?? null,
        });
        if (ss.speler.geslacht === "V") dames.push(speler);
        else heren.push(speler);
      }

      const stafGezien = new Set<string>();
      const staf: PubliekeStaf[] = [];
      for (const ss of sg.staf) {
        if (stafGezien.has(ss.stafId)) continue;
        stafGezien.add(ss.stafId);
        staf.push({
          naam:
            ss.staf?.naam ??
            (logger.warn("publieke-presentatie: staf zonder naam", { stafId: ss.stafId }), "?"),
          rol: ss.rol ?? "",
        });
      }

      kaarten.push({
        id: sg.id,
        naam: groepNaam,
        volgorde: minVolgorde,
        soort: "selectie",
        gebundeld: true,
        dames,
        heren,
        subteams: [],
        uitkomstTeams: groepTeams.map((t) => t.naam),
        staf,
      });
    } else {
      const alleDames: PubliekeSpeler[] = [];
      const alleHeren: PubliekeSpeler[] = [];
      const subteams: PubliekTeam["subteams"] = [];
      const stafGezien = new Set<string>();
      const staf: PubliekeStaf[] = [];

      for (const team of groepTeams) {
        const teamDames: PubliekeSpeler[] = [];
        const teamHeren: PubliekeSpeler[] = [];

        for (const ts of team.spelers) {
          const speler = bouwSpeler({
            ...ts.speler,
            tussenvoegsel: tussenvoegselMap.get(ts.spelerId) ?? null,
          });
          if (ts.speler.geslacht === "V") teamDames.push(speler);
          else teamHeren.push(speler);
        }

        alleDames.push(...teamDames);
        alleHeren.push(...teamHeren);

        const teamStaf: PubliekeStaf[] = [];
        for (const ts of team.staf) {
          // Eerste voorkomen per stafId wint — persoon kan in meerdere subteams zitten
          if (!stafGezien.has(ts.stafId)) {
            stafGezien.add(ts.stafId);
            staf.push({
              naam:
                ts.staf?.naam ??
                (logger.warn("publieke-presentatie: staf zonder naam", { stafId: ts.stafId }), "?"),
              rol: ts.rol ?? "",
            });
          }
          teamStaf.push({
            naam:
              ts.staf?.naam ??
              (logger.warn("publieke-presentatie: staf zonder naam", { stafId: ts.stafId }), "?"),
            rol: ts.rol ?? "",
          });
        }

        subteams.push({ naam: team.naam, dames: teamDames, heren: teamHeren, staf: teamStaf });
      }

      kaarten.push({
        id: sg.id,
        naam: groepNaam,
        volgorde: minVolgorde,
        soort: "selectie",
        gebundeld: false,
        dames: alleDames,
        heren: alleHeren,
        subteams,
        uitkomstTeams: [],
        staf,
      });
    }
  }

  kaarten.sort((a, b) => a.volgorde - b.volgorde);

  return { toelichting: mapToelichting(publicatie), teams: kaarten };
}

function mapToelichting(
  p: { titel: string; seizoenLabel: string; introTekst: string; tcTekst: string } | null
): PubliekeToelichtingData | null {
  if (!p) return null;
  return {
    titel: p.titel,
    seizoenLabel: p.seizoenLabel,
    introTekst: p.introTekst,
    tcTekst: p.tcTekst,
  };
}
