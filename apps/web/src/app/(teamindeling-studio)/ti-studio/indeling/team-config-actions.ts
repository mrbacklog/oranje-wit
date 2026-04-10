// apps/web/src/app/(teamindeling-studio)/ti-studio/indeling/team-config-actions.ts
"use server";

import { requireTC } from "@oranje-wit/auth/checks";
import { prisma } from "@/lib/teamindeling/db/prisma";
import type { ActionResult } from "@oranje-wit/types";
import type { TeamConfigUpdate } from "@/components/ti-studio/werkbord/types";
import { logger } from "@oranje-wit/types";

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
): Promise<ActionResult<void>> {
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
    return { ok: true, data: undefined };
  } catch (error) {
    logger.warn(`Fout bij team config update voor ${teamId}:`, error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
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
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
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
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
