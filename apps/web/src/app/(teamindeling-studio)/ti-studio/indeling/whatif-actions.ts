"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { logger } from "@oranje-wit/types";
import type { WhatIfSummary } from "@/lib/teamindeling/whatif/types";

// ============================================================
// WHAT-IF CRUD & QUERIES
// ============================================================

/**
 * Maak een nieuwe what-if aan op basis van geselecteerde teams.
 *
 * Kopieer de geselecteerde teams (met spelers en staf) uit de
 * huidige versie van de werkindeling naar de what-if.
 */
export async function createWhatIf(
  werkindelingId: string,
  data: { vraag: string; toelichting?: string; teamIds: string[] }
): Promise<{ id: string }> {
  const werkindeling = await prisma.scenario.findUniqueOrThrow({
    where: { id: werkindelingId },
    select: {
      id: true,
      isWerkindeling: true,
      versies: {
        orderBy: { nummer: "desc" as const },
        take: 1,
        select: {
          id: true,
          nummer: true,
          teams: {
            where: { id: { in: data.teamIds } },
            select: {
              id: true,
              naam: true,
              categorie: true,
              kleur: true,
              teamType: true,
              niveau: true,
              volgorde: true,
              spelers: {
                select: { spelerId: true, statusOverride: true, notitie: true },
              },
              staf: {
                select: { stafId: true, rol: true },
              },
            },
          },
        },
      },
    },
  });

  if (!werkindeling.isWerkindeling) {
    throw new Error("Scenario is geen werkindeling");
  }

  const versie = werkindeling.versies[0];
  if (!versie) {
    throw new Error("Werkindeling heeft geen versie");
  }

  if (versie.teams.length === 0) {
    throw new Error("Geen teams gevonden met de opgegeven IDs");
  }

  const whatIf = await prisma.$transaction(async (tx: any) => {
    return tx.whatIf.create({
      data: {
        werkindelingId,
        vraag: data.vraag,
        toelichting: data.toelichting ?? null,
        basisVersieNummer: versie.nummer,
        teams: {
          create: versie.teams.map((team: any) => ({
            bronTeamId: team.id,
            naam: team.naam,
            categorie: team.categorie,
            kleur: team.kleur,
            teamType: team.teamType,
            niveau: team.niveau,
            volgorde: team.volgorde,
            spelers: {
              create: team.spelers.map((s: any) => ({
                spelerId: s.spelerId,
                statusOverride: s.statusOverride,
                notitie: s.notitie,
              })),
            },
            staf: {
              create: team.staf.map((s: any) => ({
                stafId: s.stafId,
                rol: s.rol,
              })),
            },
          })),
        },
      },
      select: { id: true },
    });
  });

  logger.info(`What-if "${data.vraag}" aangemaakt (${whatIf.id}) met ${versie.teams.length} teams`);
  return { id: whatIf.id };
}

/**
 * Haal een what-if op met teams, spelers en staf.
 */
export async function getWhatIf(whatIfId: string) {
  return prisma.whatIf.findUnique({
    where: { id: whatIfId },
    select: {
      id: true,
      werkindelingId: true,
      vraag: true,
      toelichting: true,
      status: true,
      basisVersieNummer: true,
      toelichtingAfwijking: true,
      toegepastOp: true,
      verworpenOp: true,
      createdAt: true,
      updatedAt: true,
      teams: {
        orderBy: { volgorde: "asc" as const },
        select: {
          id: true,
          bronTeamId: true,
          naam: true,
          categorie: true,
          kleur: true,
          teamType: true,
          volgorde: true,
          spelers: {
            select: {
              id: true,
              spelerId: true,
              statusOverride: true,
              notitie: true,
            },
          },
          staf: {
            select: { id: true, stafId: true, rol: true },
          },
        },
      },
    },
  });
}

/**
 * Haal alle what-ifs op voor een werkindeling (samenvattingen voor zijbalk).
 */
export async function getWhatIfs(werkindelingId: string): Promise<WhatIfSummary[]> {
  const werkindeling = await prisma.scenario.findUniqueOrThrow({
    where: { id: werkindelingId },
    select: {
      versies: {
        orderBy: { nummer: "desc" as const },
        take: 1,
        select: { nummer: true },
      },
    },
  });
  const huidigVersieNummer = werkindeling.versies[0]?.nummer ?? 0;

  const whatIfs = await prisma.whatIf.findMany({
    where: { werkindelingId },
    orderBy: { createdAt: "desc" as const },
    select: {
      id: true,
      vraag: true,
      status: true,
      basisVersieNummer: true,
      createdAt: true,
      _count: { select: { teams: true } },
    },
  });

  return whatIfs.map((wi: any) => ({
    id: wi.id,
    vraag: wi.vraag,
    status: wi.status,
    aantalTeams: wi._count.teams,
    isStale: wi.basisVersieNummer < huidigVersieNummer,
    createdAt: wi.createdAt,
  }));
}
