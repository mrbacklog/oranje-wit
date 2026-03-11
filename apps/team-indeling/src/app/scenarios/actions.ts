"use server";

import { prisma, anyTeam } from "@/lib/db/prisma";
import type { Prisma, TeamCategorie, Kleur } from "@oranje-wit/database";
import { logger } from "@oranje-wit/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertBewerkbaar } from "@/lib/seizoen";
import { assertSpelerVrij } from "@/lib/db/speler-guard";

/**
 * Guard: controleer of het team bij een bewerkbaar seizoen hoort.
 */
async function assertTeamBewerkbaar(teamId: string) {
  const team = (await anyTeam.findUniqueOrThrow({
    where: { id: teamId },
    select: {
      versie: {
        select: {
          scenario: {
            select: { concept: { select: { blauwdruk: { select: { seizoen: true } } } } },
          },
        },
      },
    },
  })) as { versie: { scenario: { concept: { blauwdruk: { seizoen: string } } } } };
  await assertBewerkbaar(team.versie.scenario.concept.blauwdruk.seizoen);
}

/**
 * Guard: controleer of de versie bij een bewerkbaar seizoen hoort.
 */
async function assertVersieBewerkbaar(versieId: string) {
  const versie = await prisma.versie.findUniqueOrThrow({
    where: { id: versieId },
    select: {
      scenario: { select: { concept: { select: { blauwdruk: { select: { seizoen: true } } } } } },
    },
  });
  await assertBewerkbaar(versie.scenario.concept.blauwdruk.seizoen);
}

/**
 * Guard: controleer of het scenario bij een bewerkbaar seizoen hoort.
 */
async function assertScenarioBewerkbaar(scenarioId: string) {
  const scenario = await prisma.scenario.findUniqueOrThrow({
    where: { id: scenarioId },
    select: { concept: { select: { blauwdruk: { select: { seizoen: true } } } } },
  });
  await assertBewerkbaar(scenario.concept.blauwdruk.seizoen);
}

/**
 * Haal een scenario op met versies en teams.
 */
export async function getScenario(id: string) {
  const scenario = await prisma.scenario.findUnique({
    where: { id },
    include: {
      concept: {
        include: {
          blauwdruk: true,
        },
      },
      versies: {
        include: {
          selectieGroepen: {
            include: {
              spelers: { include: { speler: true } },
              staf: { include: { staf: true } },
            },
          },
          teams: {
            include: {
              spelers: {
                include: { speler: true },
              },
              staf: {
                include: { staf: true },
              },
            },
            orderBy: { volgorde: "asc" },
          },
        },
        orderBy: { nummer: "desc" },
      },
    },
  });

  if (scenario) {
    const v = scenario.versies?.[0];
    logger.warn(
      `[getScenario] ${scenario.naam}: ${v?.teams?.length ?? 0} teams, ${v?.selectieGroepen?.length ?? 0} selectieGroepen`
    );
  }

  return scenario;
}

/**
 * Haal alle scenario's op voor een blauwdruk (via concepten).
 */
export async function getScenarios(blauwdrukId: string) {
  return prisma.scenario.findMany({
    where: {
      concept: {
        blauwdrukId,
      },
    },
    include: {
      versies: {
        select: {
          id: true,
          nummer: true,
          teams: {
            select: { id: true, naam: true, categorie: true, kleur: true },
            orderBy: { volgorde: "asc" },
          },
        },
        orderBy: { nummer: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Haal alle spelers op voor de spelerspool.
 */
export async function getAlleSpelers() {
  const [spelers, afmeldingen] = await Promise.all([
    prisma.speler.findMany({
      select: {
        id: true,
        roepnaam: true,
        achternaam: true,
        geboortejaar: true,
        geboortedatum: true,
        geslacht: true,
        status: true,
        huidig: true,
        spelerspad: true,
        lidSinds: true,
        seizoenenActief: true,
        notitie: true,
        rating: true,
        ratingBerekend: true,
      },
      orderBy: [{ achternaam: "asc" }, { roepnaam: "asc" }],
    }),
    prisma.lid.findMany({
      where: { afmelddatum: { not: null } },
      select: { relCode: true, afmelddatum: true },
    }),
  ]);

  const afmeldMap = new Map(afmeldingen.map((l) => [l.relCode, l.afmelddatum]));

  return spelers.map((s) => ({
    ...s,
    afmelddatum: afmeldMap.get(s.id)?.toISOString() ?? null,
  }));
}

/**
 * Voeg een speler toe aan een team (of aan de selectie als het team in een selectie zit).
 */
export async function addSpelerToTeam(teamId: string, spelerId: string) {
  await assertTeamBewerkbaar(teamId);
  const team = (await anyTeam.findUniqueOrThrow({
    where: { id: teamId },
    select: { selectieGroepId: true, versieId: true },
  })) as { selectieGroepId: string | null; versieId: string };

  // Guard: speler mag maar 1x in een versie voorkomen
  await assertSpelerVrij(team.versieId, spelerId);

  if (team.selectieGroepId) {
    // Team in selectie → voeg toe aan SelectieSpeler
    await prisma.selectieSpeler.create({
      data: { selectieGroepId: team.selectieGroepId, spelerId },
    });
  } else {
    await prisma.teamSpeler.create({
      data: { teamId, spelerId },
    });
  }
  revalidatePath("/scenarios");
}

/**
 * Verwijder een speler uit een team (of uit de selectie als het team in een selectie zit).
 */
export async function removeSpelerFromTeam(teamId: string, spelerId: string) {
  await assertTeamBewerkbaar(teamId);
  const team = (await anyTeam.findUniqueOrThrow({
    where: { id: teamId },
    select: { selectieGroepId: true },
  })) as { selectieGroepId: string | null };

  if (team.selectieGroepId) {
    await prisma.selectieSpeler.deleteMany({
      where: { selectieGroepId: team.selectieGroepId, spelerId },
    });
  } else {
    await prisma.teamSpeler.deleteMany({
      where: { teamId, spelerId },
    });
  }
  revalidatePath("/scenarios");
}

/**
 * Verplaats een speler van het ene team naar het andere.
 * Handelt selectie-to-selectie, selectie-to-team en team-to-selectie af.
 */
export async function moveSpeler(spelerId: string, vanTeamId: string, naarTeamId: string) {
  await assertTeamBewerkbaar(vanTeamId);

  const [vanTeam, naarTeam] = (await Promise.all([
    anyTeam.findUniqueOrThrow({
      where: { id: vanTeamId },
      select: { selectieGroepId: true },
    }),
    anyTeam.findUniqueOrThrow({
      where: { id: naarTeamId },
      select: { selectieGroepId: true },
    }),
  ])) as [{ selectieGroepId: string | null }, { selectieGroepId: string | null }];

  await prisma.$transaction(async (tx) => {
    // Verwijder uit bron
    if (vanTeam.selectieGroepId) {
      await tx.selectieSpeler.deleteMany({
        where: { selectieGroepId: vanTeam.selectieGroepId, spelerId },
      });
    } else {
      await tx.teamSpeler.deleteMany({
        where: { teamId: vanTeamId, spelerId },
      });
    }

    // Voeg toe aan doel
    if (naarTeam.selectieGroepId) {
      await tx.selectieSpeler.create({
        data: { selectieGroepId: naarTeam.selectieGroepId, spelerId },
      });
    } else {
      await tx.teamSpeler.create({
        data: { teamId: naarTeamId, spelerId },
      });
    }
  });
  revalidatePath("/scenarios");
}

/**
 * Maak een nieuw team aan binnen een versie.
 */
export async function createTeam(
  versieId: string,
  data: { naam: string; categorie: TeamCategorie; kleur?: Kleur | null }
) {
  await assertVersieBewerkbaar(versieId);
  // Bepaal volgorde: hoogste + 1
  const laatsteTeam = await anyTeam.findFirst({
    where: { versieId },
    orderBy: { volgorde: "desc" },
    select: { volgorde: true },
  });
  const volgorde = (laatsteTeam?.volgorde ?? -1) + 1;

  const team = (await anyTeam.create({
    data: {
      versieId,
      naam: data.naam,
      categorie: data.categorie,
      kleur: data.kleur ?? null,
      volgorde,
    },
  })) as { id: string };
  revalidatePath("/scenarios");
  return team;
}

/**
 * Hernoem een scenario.
 */
export async function updateScenarioNaam(scenarioId: string, naam: string) {
  await assertScenarioBewerkbaar(scenarioId);
  await prisma.scenario.update({ where: { id: scenarioId }, data: { naam: naam.trim() } });
  revalidatePath("/scenarios");
}

/**
 * Verwijder een scenario (inclusief versies, teams, spelers, staf via cascade).
 */
export async function deleteScenario(scenarioId: string) {
  await assertScenarioBewerkbaar(scenarioId);
  await prisma.scenario.delete({ where: { id: scenarioId } });
  revalidatePath("/scenarios");
}

/**
 * Markeer een scenario als DEFINITIEF.
 * Alle andere scenario's in hetzelfde concept worden GEARCHIVEERD.
 */
export async function markeerDefinitief(scenarioId: string) {
  await assertScenarioBewerkbaar(scenarioId);
  // Haal het scenario op om de conceptId te kennen
  const scenario = await prisma.scenario.findUniqueOrThrow({
    where: { id: scenarioId },
    select: { conceptId: true, concept: { select: { blauwdrukId: true } } },
  });

  // Blocker-gate: harde blokkade bij open blockers
  const blockers = await prisma.notitie.count({
    where: {
      blauwdrukId: scenario.concept.blauwdrukId,
      prioriteit: "BLOCKER",
      status: { in: ["OPEN", "IN_BESPREKING"] },
    },
  });
  if (blockers > 0) {
    throw new Error(`Kan niet definitief maken: ${blockers} blocker(s) nog niet opgelost`);
  }

  // Archiveer alle andere scenario's in hetzelfde concept
  await prisma.scenario.updateMany({
    where: {
      conceptId: scenario.conceptId,
      id: { not: scenarioId },
    },
    data: { status: "GEARCHIVEERD" },
  });

  // Zet dit scenario op DEFINITIEF
  await prisma.scenario.update({
    where: { id: scenarioId },
    data: { status: "DEFINITIEF" },
  });

  revalidatePath("/scenarios");
  redirect("/scenarios");
}

// ---------------------------------------------------------------------------
// Posities (kaartpositie-opslag voor canvas-editor)
// ---------------------------------------------------------------------------

export async function getPosities(
  versieId: string
): Promise<Record<string, { x: number; y: number }> | null> {
  const versie = await prisma.versie.findUnique({
    where: { id: versieId },
    select: { posities: true },
  });
  return (versie?.posities as Record<string, { x: number; y: number }>) ?? null;
}

export async function savePosities(
  versieId: string,
  posities: Record<string, { x: number; y: number }>
): Promise<void> {
  await prisma.versie.update({
    where: { id: versieId },
    data: { posities: posities as unknown as Prisma.JsonObject },
  });
}

// Wizard-functies (createScenarioVanuitBlauwdruk, createLeegScenario,
// kopieerScenario, getSpelerBasisData) staan in wizard-actions.ts
