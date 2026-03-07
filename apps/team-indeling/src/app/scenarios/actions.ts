"use server";

import { prisma, anyTeam } from "@/lib/db/prisma";
import { berekenTeamstructuur } from "@/lib/teamstructuur";
import type { SpelerBasis } from "@/lib/teamstructuur";
import type { Prisma, TeamCategorie, Kleur } from "@oranje-wit/database";
import { PEILJAAR } from "@oranje-wit/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertBewerkbaar } from "@/lib/seizoen";

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
 * Maak een nieuw scenario aan met keuze-waardes.
 * Maakt automatisch een Concept aan als dat nog niet bestaat,
 * plus een initiële Versie (nummer 1) met teams op basis van teamstructuur-berekening.
 */
export async function createScenario(
  blauwdrukId: string,
  naam: string,
  toelichting: string,
  keuzeWaardes: Record<string, string>
) {
  // Zorg dat er een standaard Concept bestaat voor deze blauwdruk
  const concept = await prisma.concept.upsert({
    where: {
      id: await findConceptIdForBlauwdruk(blauwdrukId),
    },
    create: {
      blauwdrukId,
      naam: "Standaard",
      uitgangsprincipe: "Automatisch aangemaakt",
      keuzes: {},
    },
    update: {},
  });

  // Haal spelers op voor teamstructuur-berekening
  const spelers = await prisma.speler.findMany({
    select: {
      id: true,
      geboortejaar: true,
      geslacht: true,
      status: true,
    },
  });

  const spelerBasis: SpelerBasis[] = spelers.map((s) => ({
    id: s.id,
    geboortejaar: s.geboortejaar,
    geslacht: s.geslacht as "M" | "V",
    status: s.status,
  }));

  // Bereken teamstructuur
  const teamVoorstellen = berekenTeamstructuur(spelerBasis, keuzeWaardes, PEILJAAR);

  // Maak scenario + versie + teams in één transactie
  const scenario = await prisma.scenario.create({
    data: {
      conceptId: concept.id,
      naam,
      toelichting: toelichting || null,
      keuzeWaardes: keuzeWaardes as unknown as Prisma.InputJsonValue,
      versies: {
        create: {
          nummer: 1,
          auteur: "Systeem",
          naam: "Initieel",
          teams: {
            create: teamVoorstellen.map((tv, index) => ({
              naam: tv.naam,
              categorie: tv.categorie,
              kleur: tv.kleur,
              volgorde: index,
            })),
          },
        },
      },
    },
    include: {
      versies: {
        include: {
          teams: true,
        },
      },
    },
  });

  redirect(`/scenarios/${scenario.id}`);
}

/**
 * Zoek een bestaand concept-ID voor een blauwdruk, of geef een dummy terug
 * zodat upsert een nieuw concept aanmaakt.
 */
async function findConceptIdForBlauwdruk(blauwdrukId: string): Promise<string> {
  const bestaand = await prisma.concept.findFirst({
    where: { blauwdrukId },
    select: { id: true },
  });
  return bestaand?.id ?? "niet-bestaand-id";
}

/**
 * Haal een scenario op met versies en teams.
 */
export async function getScenario(id: string) {
  return prisma.scenario.findUnique({
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
  return prisma.speler.findMany({
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
    },
    orderBy: [{ achternaam: "asc" }, { roepnaam: "asc" }],
  });
}

/**
 * Voeg een speler toe aan een team (of aan de selectie als het team in een selectie zit).
 */
export async function addSpelerToTeam(teamId: string, spelerId: string) {
  await assertTeamBewerkbaar(teamId);
  const team = (await anyTeam.findUniqueOrThrow({
    where: { id: teamId },
    select: { selectieGroepId: true },
  })) as { selectieGroepId: string | null };

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
  revalidatePath("/definitief");
  redirect("/definitief");
}
