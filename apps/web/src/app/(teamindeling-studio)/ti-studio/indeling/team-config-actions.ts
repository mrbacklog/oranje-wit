// apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/team-config-actions.ts
"use server";

import { requireTC } from "@oranje-wit/auth/checks";
import { prisma } from "@/lib/teamindeling/db/prisma";
import type { ActionResult } from "@oranje-wit/types";
import type { TeamConfigUpdate, ValidatieUpdate } from "@/components/ti-studio/werkbord/types";
import { logger } from "@oranje-wit/types";
import { getTeamtypeKaders } from "@/app/(teamindeling-studio)/ti-studio/kader/actions";
import { mergeMetDefaults } from "@/app/(teamindeling-studio)/ti-studio/kader/kader-defaults";
import {
  berekenTeamValidatie,
  berekenValidatieStatus,
  korfbalLeeftijd,
} from "@/lib/teamindeling/validatie-engine";

const KLEUR_MAP: Record<string, string> = {
  blauw: "BLAUW",
  groen: "GROEN",
  geel: "GEEL",
  oranje: "ORANJE",
  rood: "ROOD",
};

const TEAM_TYPE_MAP: Record<string, string> = {
  viertal: "VIERTAL",
  achtal: "ACHTTAL",
};

export async function updateTeamConfig(
  teamId: string,
  config: TeamConfigUpdate
): Promise<ActionResult<{ validatieUpdate: ValidatieUpdate }>> {
  await requireTC();
  try {
    await prisma.team.update({
      where: { id: teamId },
      data: {
        categorie: config.hoofdCategorie as "SENIOREN" | "A_CATEGORIE" | "B_CATEGORIE",
        kleur: config.kleur
          ? (KLEUR_MAP[config.kleur] as "BLAUW" | "GROEN" | "GEEL" | "ORANJE" | "ROOD")
          : null,
        niveau: config.niveau ?? null,
        teamType: config.teamType
          ? (TEAM_TYPE_MAP[config.teamType] as "VIERTAL" | "ACHTTAL")
          : null,
      },
    });
    logger.info(`Team ${teamId} configuratie bijgewerkt: ${config.hoofdCategorie}`);

    // Herbereken validatie na config-wijziging
    const teamData = await prisma.team.findUniqueOrThrow({
      where: { id: teamId },
      select: {
        id: true,
        categorie: true,
        kleur: true,
        teamType: true,
        niveau: true,
        versie: {
          select: {
            werkindeling: {
              select: { kaders: { select: { seizoen: true } } },
            },
          },
        },
        spelers: {
          select: {
            speler: {
              select: {
                id: true,
                geslacht: true,
                geboortejaar: true,
                geboortedatum: true,
                roepnaam: true,
                achternaam: true,
              },
            },
          },
        },
      },
    });

    const seizoen = teamData.versie.werkindeling.kaders.seizoen;
    const peiljaar = parseInt(seizoen.split("-")[1], 10);
    const tcKaders = mergeMetDefaults(await getTeamtypeKaders(seizoen));

    const DB_KLEUR_MAP: Record<string, string> = {
      BLAUW: "blauw",
      GROEN: "groen",
      GEEL: "geel",
      ORANJE: "oranje",
      ROOD: "rood",
      PAARS: "blauw",
    };

    type SpelerRij = (typeof teamData.spelers)[number];

    const dames = teamData.spelers
      .filter((ts: SpelerRij) => ts.speler.geslacht === "V")
      .map((ts: SpelerRij) => ({
        id: ts.speler.id,
        spelerId: ts.speler.id,
        speler: {
          ...ts.speler,
          geboortedatum: ts.speler.geboortedatum
            ? (ts.speler.geboortedatum as Date).toISOString().split("T")[0]
            : null,
          geslacht: "V" as const,
          status: "BESCHIKBAAR" as const,
          rating: null,
          notitie: null,
          afmelddatum: null,
          teamId,
          gepind: false,
          isNieuw: false,
          huidigTeam: null,
          ingedeeldTeamNaam: null,
          selectieGroepId: null,
        },
        notitie: null,
      }));

    const heren = teamData.spelers
      .filter((ts: SpelerRij) => ts.speler.geslacht === "M")
      .map((ts: SpelerRij) => ({
        id: ts.speler.id,
        spelerId: ts.speler.id,
        speler: {
          ...ts.speler,
          geboortedatum: ts.speler.geboortedatum
            ? (ts.speler.geboortedatum as Date).toISOString().split("T")[0]
            : null,
          geslacht: "M" as const,
          status: "BESCHIKBAAR" as const,
          rating: null,
          notitie: null,
          afmelddatum: null,
          teamId,
          gepind: false,
          isNieuw: false,
          huidigTeam: null,
          ingedeeldTeamNaam: null,
          selectieGroepId: null,
        },
        notitie: null,
      }));

    const teamVoorValidatie = {
      id: teamId,
      naam: "",
      categorie: String(teamData.categorie),
      kleur: (DB_KLEUR_MAP[teamData.kleur ?? ""] ?? "senior") as
        | "blauw"
        | "groen"
        | "geel"
        | "oranje"
        | "rood"
        | "senior",
      formaat: (teamData.teamType === "VIERTAL" ? "viertal" : "achtal") as
        | "viertal"
        | "achtal"
        | "selectie",
      volgorde: 0,
      canvasX: 0,
      canvasY: 0,
      dames,
      heren,
      staf: [],
      werkitems: [],
      ussScore: null,
      gemiddeldeLeeftijd:
        teamData.spelers.length > 0
          ? Math.round(
              (teamData.spelers.reduce((acc: number, ts: SpelerRij) => {
                const gbd = ts.speler.geboortedatum
                  ? (ts.speler.geboortedatum as Date).toISOString().split("T")[0]
                  : null;
                return (
                  acc + korfbalLeeftijd(gbd, ts.speler.geboortejaar ?? peiljaar - 15, peiljaar)
                );
              }, 0) /
                teamData.spelers.length) *
                10
            ) / 10
          : null,
      validatieStatus: "ok" as const,
      validatieCount: 0,
      teamCategorie: (teamData.categorie ?? "SENIOREN") as
        | "SENIOREN"
        | "A_CATEGORIE"
        | "B_CATEGORIE",
      niveau: (teamData.niveau ?? null) as "A" | "B" | "U15" | "U17" | "U19" | null,
      selectieGroepId: null,
      selectieNaam: null,
      selectieDames: [],
      selectieHeren: [],
      gebundeld: false,
    };

    const items = berekenTeamValidatie(teamVoorValidatie, tcKaders, peiljaar);
    const validatieUpdate: ValidatieUpdate = {
      teamId,
      items,
      status: berekenValidatieStatus(items),
      count: items.filter((i) => i.type !== "ok").length,
    };

    return { ok: true, data: { validatieUpdate } };
  } catch (error) {
    logger.warn(`Fout bij team config update voor ${teamId}:`, error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function koppelSelectie(
  versieId: string,
  teamId1: string,
  teamId2: string
): Promise<ActionResult<{ groepId: string }>> {
  await requireTC();
  try {
    const groep = await prisma.selectieGroep.create({
      data: {
        versieId,
        teams: { connect: [{ id: teamId1 }, { id: teamId2 }] },
      },
    });
    logger.info(`SelectieGroep aangemaakt: ${groep.id} met teams ${teamId1}, ${teamId2}`);
    return { ok: true, data: { groepId: groep.id } };
  } catch (error) {
    logger.warn(`Fout bij selectie koppeling:`, error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function ontkoppelSelectie(groepId: string): Promise<ActionResult<void>> {
  await requireTC();
  try {
    await prisma.selectieGroep.delete({ where: { id: groepId } });
    logger.info(`SelectieGroep verwijderd: ${groepId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    logger.warn(`Fout bij selectie ontkoppeling voor ${groepId}:`, error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function verwijderTeam(teamId: string): Promise<ActionResult<void>> {
  await requireTC();
  try {
    await prisma.team.delete({ where: { id: teamId } });
    return { ok: true, data: undefined };
  } catch (error) {
    logger.warn(`Fout bij verwijderen team ${teamId}:`, error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function updateSelectieNaam(
  groepId: string,
  naam: string
): Promise<ActionResult<void>> {
  await requireTC();
  try {
    await prisma.selectieGroep.update({
      where: { id: groepId },
      data: { naam: naam.trim() || null },
    });
    return { ok: true, data: undefined };
  } catch (error) {
    logger.warn(`Fout bij selectienaam update voor ${groepId}:`, error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
