import { db as prisma } from "@/lib/db";
import {
  korfbalPeildatum,
  berekenKorfbalLeeftijdExact,
  grofKorfbalLeeftijd,
} from "@oranje-wit/types";
import { logger } from "@oranje-wit/types";
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
      return {
        spelerId: s.id as string,
        roepnaam: s.roepnaam as string,
        achternaam: s.achternaam as string,
        tussenvoegsel: null,
        korfbalLeeftijd: leeftijd,
        geslacht: s.geslacht as "M" | "V",
        status: s.status as string,
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

  return {
    versieId,
    teams,
    selectieGroepen,
    peildatum,
  };
}

// ── Pool-spelers ophalen ─────────────────────────────────────────────────────

export async function haalPoolSpelers(
  kadersId: string,
  versieData: VersieData
): Promise<PoolSpeler[]> {
  const peildatum = versieData.peildatum;

  // Verzamel ingedeelde speler-IDs
  const ingedeeldeMap = new Map<string, string>(); // spelerId → teamId
  for (const team of versieData.teams) {
    for (const s of team.spelersDames) ingedeeldeMap.set(s.spelerId, team.id);
    for (const s of team.spelersHeren) ingedeeldeMap.set(s.spelerId, team.id);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kadersSpelers = await prisma.kadersSpeler.findMany({
    where: {
      kadersId,
      speler: {
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
          werkitems: {
            where: {
              type: "MEMO",
              status: { in: ["OPEN", "IN_BESPREKING"] },
            },
            select: { id: true },
            take: 1,
          },
        },
      },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return kadersSpelers.map((ks: any) => {
    const s = ks.speler;
    const leeftijd = berekenKorfbalLeeftijdExact(
      s.geboortedatum ?? null,
      s.geboortejaar as number,
      peildatum
    );
    const grof = grofKorfbalLeeftijd(s.geboortejaar as number, peildatum);
    const huidigJson = s.huidig as Record<string, unknown> | null;

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
      status: s.status as string,
      openMemoCount: (s.werkitems as Array<unknown>).length,
    };
  });
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
