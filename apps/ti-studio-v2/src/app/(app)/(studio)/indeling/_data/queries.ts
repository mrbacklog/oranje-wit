import { db as prisma } from "@/lib/db";
import {
  korfbalPeildatum,
  berekenKorfbalLeeftijdExact,
  grofKorfbalLeeftijd,
  seizoenStart,
} from "@oranje-wit/types";
import { logger } from "@oranje-wit/types";
import type { Seizoen } from "@oranje-wit/types";
import { getSpelersMetFoto } from "@/lib/queries/spelers-foto";
import type {
  WerkindelingMeta,
  VersieMeta,
  VersieData,
  TeamKaartData,
  TeamKaartSpeler,
  TeamKaartStaf,
  PoolSpeler,
  StafLid,
  SelectieGroepMeta,
} from "../_components/werkbord-types";

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * "Nieuw" grens — 1 juli van het seizoen ervoor.
 * TC werkt typisch aan het komende seizoen (bv. 2026-2027) en wil daar de
 * instromers van het lopende seizoen (vanaf 2025-07-01) als nieuw zien.
 * Geport uit v1 (commits e619fcde + 3a94bb0a).
 */
function nieuwGrensVoorSeizoen(seizoen: string): Date {
  const start = seizoenStart(seizoen as Seizoen);
  return new Date(start.getFullYear() - 1, 6, 1);
}

function bepaalIsNieuw(lidSinds: string | null, grens: Date): boolean {
  if (!lidSinds) return false;
  const d = new Date(lidSinds);
  return !isNaN(d.getTime()) && d >= grens;
}

function catKleurFromGrof(grof: number): string {
  if (grof <= 7) return "blauw";
  if (grof <= 9) return "groen";
  if (grof <= 12) return "geel";
  if (grof <= 15) return "oranje";
  if (grof <= 18) return "rood";
  return "senior";
}

// ── Actieve werkindeling ophalen ─────────────────────────────────────────────

export async function haalActieveWerkindeling(): Promise<{
  werkindeling: WerkindelingMeta;
  versies: VersieMeta[];
  kadersId: string;
  seizoen: string;
  aanbevolenVersieId: string;
} | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kaders = await prisma.kaders.findFirst({
    where: { isWerkseizoen: true },
    include: {
      werkindelingen: {
        where: { status: "ACTIEF" },
        include: {
          versies: {
            orderBy: { nummer: "desc" },
            select: {
              id: true,
              nummer: true,
              naam: true,
              createdAt: true,
              _count: { select: { teams: true } },
            },
          },
        },
        take: 1,
      },
    },
  });

  if (!kaders || !kaders.werkindelingen?.[0]) {
    logger.warn("haalActieveWerkindeling: geen actieve werkindeling gevonden");
    return null;
  }

  const wi = kaders.werkindelingen[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const versiesRaw: any[] = wi.versies;

  // Kies versie met meeste teams (tiebreak: hoogste nummer)
  const aanbevolen = [...versiesRaw].sort(
    (a, b) => (b._count?.teams ?? 0) - (a._count?.teams ?? 0) || b.nummer - a.nummer
  )[0];

  const aanbevolenVersieId = aanbevolen?.id as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const versies: VersieMeta[] = versiesRaw.map((v: any) => ({
    id: v.id as string,
    nummer: v.nummer as number,
    naam: (v.naam as string | null) ?? null,
    createdAt: v.createdAt as Date,
    isActief: v.id === aanbevolenVersieId,
  }));

  return {
    werkindeling: {
      id: wi.id as string,
      naam: wi.naam as string,
      seizoen: kaders.seizoen as string,
      status: wi.status as string,
    },
    versies,
    kadersId: kaders.id as string,
    seizoen: kaders.seizoen as string,
    aanbevolenVersieId,
  };
}

// ── Versie-data laden (teams + spelers + staf) ───────────────────────────────

export async function haalVersieData(
  versieId: string,
  seizoen: string
): Promise<VersieData | null> {
  const peildatum = korfbalPeildatum(seizoen as `${number}-${number}`);
  const nieuwGrens = nieuwGrensVoorSeizoen(seizoen);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const versie = await prisma.versie.findUnique({
    where: { id: versieId },
    include: {
      selectieGroepen: {
        include: {
          teams: { select: { id: true } },
          spelers: {
            include: {
              speler: {
                select: {
                  id: true,
                  roepnaam: true,
                  achternaam: true,
                  // tussenvoegsel niet in schema
                  geboortejaar: true,
                  geboortedatum: true,
                  geslacht: true,
                  status: true,
                  lidSinds: true,
                },
              },
            },
          },
          staf: {
            include: {
              staf: { select: { id: true, naam: true, rollen: true } },
            },
          },
        },
      },
      teams: {
        include: {
          spelers: {
            include: {
              speler: {
                select: {
                  id: true,
                  roepnaam: true,
                  achternaam: true,
                  // tussenvoegsel niet in schema
                  geboortejaar: true,
                  geboortedatum: true,
                  geslacht: true,
                  status: true,
                  lidSinds: true,
                  werkitems: {
                    where: {
                      type: "MEMO",
                      status: {
                        in: ["OPEN", "IN_BESPREKING", "OPGELOST", "GEACCEPTEERD_RISICO"],
                      },
                    },
                    select: { status: true },
                    orderBy: { updatedAt: "desc" },
                    take: 1,
                  },
                },
              },
            },
          },
          staf: {
            include: {
              staf: { select: { id: true, naam: true, rollen: true } },
            },
          },
          werkitems: {
            where: {
              type: "MEMO",
              status: { in: ["OPEN", "IN_BESPREKING"] },
            },
            select: { id: true },
          },
        },
        orderBy: { volgorde: "asc" },
      },
    },
  });

  if (!versie) {
    logger.warn("haalVersieData: versie niet gevonden:", versieId);
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teams: TeamKaartData[] = versie.teams.map((team: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spelersRaw: TeamKaartSpeler[] = team.spelers.map((ts: any) => {
      const s = ts.speler;
      const leeftijd = berekenKorfbalLeeftijdExact(
        s.geboortedatum ?? null,
        s.geboortejaar as number,
        peildatum
      );
      // Hoogste actieve memo-status (eerste na orderBy desc)
      const memoStatus = (s.werkitems as Array<{ status: string }>)?.[0]?.status ?? null;
      return {
        spelerId: s.id as string,
        roepnaam: s.roepnaam as string,
        achternaam: s.achternaam as string,
        tussenvoegsel: null,
        korfbalLeeftijd: leeftijd,
        geslacht: s.geslacht as "M" | "V",
        status: s.status as string,
        isNieuw: bepaalIsNieuw((s.lidSinds as string | null) ?? null, nieuwGrens),
        hasFoto: false, // wordt hieronder ingevuld
        memoStatus,
      };
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stafRaw: TeamKaartStaf[] = team.staf.map((ts: any) => ({
      stafId: ts.staf.id as string,
      naam: ts.staf.naam as string,
      rollen: ts.staf.rollen as string[],
    }));

    const validatieMeldingenRaw = team.validatieMeldingen;
    let validatieMeldingen: string[] | null = null;
    if (Array.isArray(validatieMeldingenRaw)) {
      validatieMeldingen = validatieMeldingenRaw as string[];
    }

    return {
      id: team.id as string,
      naam: team.naam as string,
      alias: (team.alias as string | null) ?? null,
      categorie: team.categorie as string,
      kleur: (team.kleur as string | null) ?? null,
      teamType: (team.teamType as string | null) ?? null,
      niveau: (team.niveau as string | null) ?? null,
      validatieStatus: (team.validatieStatus as string) ?? "ONBEKEND",
      validatieMeldingen,
      spelersDames: spelersRaw.filter((s) => s.geslacht === "V"),
      spelersHeren: spelersRaw.filter((s) => s.geslacht === "M"),
      staf: stafRaw,
      openMemoCount: (team.werkitems as Array<unknown>).length,
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectieGroepen: SelectieGroepMeta[] = versie.selectieGroepen.map((sg: any) => ({
    id: sg.id as string,
    naam: (sg.naam as string | null) ?? null,
    gebundeld: sg.gebundeld as boolean,
    teamIds: (sg.teams as Array<{ id: string }>).map((t) => t.id),
  }));

  // Foto-injectie voor alle team-spelers
  const alleTeamSpelerIds = teams.flatMap((t) => [
    ...t.spelersDames.map((s) => s.spelerId),
    ...t.spelersHeren.map((s) => s.spelerId),
  ]);
  const metFoto = await getSpelersMetFoto(alleTeamSpelerIds);
  const teamsMetFoto = teams.map((team) => ({
    ...team,
    spelersDames: team.spelersDames.map((s) => ({ ...s, hasFoto: metFoto.has(s.spelerId) })),
    spelersHeren: team.spelersHeren.map((s) => ({ ...s, hasFoto: metFoto.has(s.spelerId) })),
  }));

  return {
    versieId,
    teams: teamsMetFoto,
    selectieGroepen,
    peildatum,
    seizoen,
  };
}

// ── Pool-spelers ophalen ─────────────────────────────────────────────────────

export async function haalPoolSpelers(
  kadersId: string,
  versieData: VersieData
): Promise<PoolSpeler[]> {
  const peildatum = versieData.peildatum;
  const nieuwGrens = nieuwGrensVoorSeizoen(versieData.seizoen);

  // Verzamel ingedeelde speler-IDs + teamnaam
  const ingedeeldeMap = new Map<string, string>(); // spelerId → teamId
  const teamNaamMap = new Map<string, string>(); // teamId → alias/naam
  for (const team of versieData.teams) {
    teamNaamMap.set(team.id, team.alias ?? team.naam);
    for (const s of team.spelersDames) ingedeeldeMap.set(s.spelerId, team.id);
    for (const s of team.spelersHeren) ingedeeldeMap.set(s.spelerId, team.id);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kadersSpelers = await prisma.kadersSpeler.findMany({
    where: {
      kadersId,
      speler: {
        // Sluit alleen "echt weg" statussen uit op DB-niveau.
        // RECREANT / GAAT_STOPPEN tonen we onder filter "alle" — drawer-filter
        // "zonder team" sluit ze daar alsnog uit (NIET_INDEELBAAR-set).
        status: { notIn: ["GESTOPT", "NIET_SPELEND"] },
      },
    },
    include: {
      speler: {
        select: {
          id: true,
          roepnaam: true,
          achternaam: true,
          // tussenvoegsel niet in schema
          geboortejaar: true,
          geboortedatum: true,
          geslacht: true,
          status: true,
          huidig: true,
          lidSinds: true,
          werkitems: {
            where: {
              type: "MEMO",
              status: {
                in: ["OPEN", "IN_BESPREKING", "OPGELOST", "GEACCEPTEERD_RISICO"],
              },
            },
            select: { status: true },
            orderBy: { updatedAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const poolSpelers: PoolSpeler[] = kadersSpelers.map((ks: any) => {
    const s = ks.speler;
    const leeftijd = berekenKorfbalLeeftijdExact(
      s.geboortedatum ?? null,
      s.geboortejaar as number,
      peildatum
    );
    const grof = grofKorfbalLeeftijd(s.geboortejaar as number, peildatum);
    const huidigJson = s.huidig as Record<string, unknown> | null;
    const memoStatus = (s.werkitems as Array<{ status: string }>)?.[0]?.status ?? null;

    return {
      spelerId: s.id as string,
      roepnaam: s.roepnaam as string,
      achternaam: s.achternaam as string,
      tussenvoegsel: null,
      geslacht: s.geslacht as "M" | "V",
      korfbalLeeftijd: leeftijd,
      leeftijdCategorie: catKleurFromGrof(grof),
      huidigTeamNaam: huidigJson?.team ? String(huidigJson.team) : null,
      ingedeeldTeamId: ingedeeldeMap.get(s.id as string) ?? null,
      ingedeeldTeamNaam: ingedeeldeMap.has(s.id as string)
        ? (teamNaamMap.get(ingedeeldeMap.get(s.id as string)!) ?? null)
        : null,
      status: s.status as string,
      openMemoCount: (s.werkitems as Array<unknown>).length,
      isNieuw: bepaalIsNieuw((s.lidSinds as string | null) ?? null, nieuwGrens),
      hasFoto: false, // wordt hieronder ingevuld
      memoStatus,
    };
  });

  // Foto-injectie
  const relCodes = poolSpelers.map((s) => s.spelerId);
  const metFotoPool = await getSpelersMetFoto(relCodes);
  return poolSpelers.map((s) => ({ ...s, hasFoto: metFotoPool.has(s.spelerId) }));
}

// ── Staf ophalen ─────────────────────────────────────────────────────────────

export async function haalAlleStaf(versieData: VersieData): Promise<StafLid[]> {
  // Verzamel ingedeelde staf-IDs → teamIds
  const stafTeamMap = new Map<string, string[]>();
  for (const team of versieData.teams) {
    for (const staf of team.staf) {
      const bestaand = stafTeamMap.get(staf.stafId) ?? [];
      bestaand.push(team.id);
      stafTeamMap.set(staf.stafId, bestaand);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stafLeden = await prisma.staf.findMany({
    where: { actief: true },
    select: {
      id: true,
      naam: true,
      rollen: true,
      actief: true,
      werkitems: {
        where: {
          type: "MEMO",
          status: { in: ["OPEN", "IN_BESPREKING"] },
        },
        select: { id: true },
        take: 1,
      },
    },
    orderBy: { naam: "asc" },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return stafLeden.map((s: any) => ({
    stafId: s.id as string,
    naam: s.naam as string,
    rollen: s.rollen as string[],
    actief: s.actief as boolean,
    ingedeeldTeamIds: stafTeamMap.get(s.id as string) ?? [],
    openMemoCount: (s.werkitems as Array<unknown>).length,
  }));
}
