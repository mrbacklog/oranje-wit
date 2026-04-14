// apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/team-config-actions.ts
"use server";

import { requireTC } from "@oranje-wit/auth/checks";
import { prisma } from "@/lib/teamindeling/db/prisma";
import type { ActionResult } from "@oranje-wit/types";
import type { TeamConfigUpdate, ValidatieUpdate } from "@/components/werkbord/types";
import { logger } from "@oranje-wit/types";
import { haalValidatieUpdate } from "@/lib/teamindeling/validatie-update";

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

    const validatieUpdate = await haalValidatieUpdate(teamId);
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

export async function hernoemTeam(teamId: string, naam: string): Promise<ActionResult<void>> {
  await requireTC();
  const schoon = naam.trim();
  if (!schoon) return { ok: false, error: "Naam mag niet leeg zijn" };
  try {
    await prisma.team.update({ where: { id: teamId }, data: { naam: schoon } });
    logger.info(`Team ${teamId} hernoemd naar "${schoon}"`);
    return { ok: true, data: undefined };
  } catch (error) {
    logger.warn(`Fout bij hernoemen team ${teamId}:`, error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function updateTeamVolgorde(
  updates: { id: string; volgorde: number }[]
): Promise<ActionResult<void>> {
  await requireTC();
  try {
    await prisma.$transaction(
      updates.map(({ id, volgorde }) => prisma.team.update({ where: { id }, data: { volgorde } }))
    );
    return { ok: true, data: undefined };
  } catch (error) {
    logger.warn(`Fout bij herordenen teams:`, error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
