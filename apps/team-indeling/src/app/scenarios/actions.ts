"use server";

import { prisma } from "@/lib/db/prisma";
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
  const team = await prisma.team.findUniqueOrThrow({
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
  });
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
 * Voeg een speler toe aan een team.
 */
export async function addSpelerToTeam(teamId: string, spelerId: string) {
  await assertTeamBewerkbaar(teamId);
  await prisma.teamSpeler.create({
    data: { teamId, spelerId },
  });
  revalidatePath("/scenarios");
}

/**
 * Verwijder een speler uit een team.
 */
export async function removeSpelerFromTeam(teamId: string, spelerId: string) {
  await assertTeamBewerkbaar(teamId);
  await prisma.teamSpeler.deleteMany({
    where: { teamId, spelerId },
  });
  revalidatePath("/scenarios");
}

/**
 * Verplaats een speler van het ene team naar het andere.
 */
export async function moveSpeler(spelerId: string, vanTeamId: string, naarTeamId: string) {
  await assertTeamBewerkbaar(vanTeamId);
  await prisma.$transaction([
    prisma.teamSpeler.deleteMany({
      where: { teamId: vanTeamId, spelerId },
    }),
    prisma.teamSpeler.create({
      data: { teamId: naarTeamId, spelerId },
    }),
  ]);
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
  const laatsteTeam = await prisma.team.findFirst({
    where: { versieId },
    orderBy: { volgorde: "desc" },
    select: { volgorde: true },
  });
  const volgorde = (laatsteTeam?.volgorde ?? -1) + 1;

  const team = await prisma.team.create({
    data: {
      versieId,
      naam: data.naam,
      categorie: data.categorie,
      kleur: data.kleur ?? null,
      volgorde,
    },
  });
  revalidatePath("/scenarios");
  return team;
}

/**
 * Verwijder een team.
 */
export async function deleteTeam(teamId: string) {
  await assertTeamBewerkbaar(teamId);
  // Ontkoppel eerst eventuele selectie-leden die naar dit team verwijzen
  await prisma.team.updateMany({
    where: { selectieGroepId: teamId },
    data: { selectieGroepId: null },
  });
  await prisma.team.delete({
    where: { id: teamId },
  });
  revalidatePath("/scenarios");
}

/**
 * Koppel teams als selectie. Eerste team wordt de "groep leider".
 * Alle spelers en staf van lid-teams worden samengevoegd naar de leider (pool).
 */
export async function koppelSelectie(teamIds: string[]) {
  if (teamIds.length < 2) return;
  const [leiderId, ...restIds] = teamIds;

  await prisma.$transaction(async (tx) => {
    // 1. Koppel teams
    await tx.team.updateMany({
      where: { id: { in: restIds } },
      data: { selectieGroepId: leiderId },
    });

    // 2. Verplaats spelers van lid-teams naar leider
    const bestaandeSpelers = await tx.teamSpeler.findMany({
      where: { teamId: leiderId },
      select: { spelerId: true },
    });
    const bestaandSpelerSet = new Set(bestaandeSpelers.map((s) => s.spelerId));

    // Verwijder duplicaten (speler die al in leider zit)
    if (bestaandSpelerSet.size > 0) {
      await tx.teamSpeler.deleteMany({
        where: {
          teamId: { in: restIds },
          spelerId: { in: Array.from(bestaandSpelerSet) },
        },
      });
    }

    // Verplaats rest naar leider
    await tx.teamSpeler.updateMany({
      where: { teamId: { in: restIds } },
      data: { teamId: leiderId },
    });

    // 3. Zelfde voor staf
    const bestaandeStaf = await tx.teamStaf.findMany({
      where: { teamId: leiderId },
      select: { stafId: true },
    });
    const bestaandStafSet = new Set(bestaandeStaf.map((s) => s.stafId));

    if (bestaandStafSet.size > 0) {
      await tx.teamStaf.deleteMany({
        where: {
          teamId: { in: restIds },
          stafId: { in: Array.from(bestaandStafSet) },
        },
      });
    }

    await tx.teamStaf.updateMany({
      where: { teamId: { in: restIds } },
      data: { teamId: leiderId },
    });
  });

  revalidatePath("/scenarios");
}

/**
 * Ontkoppel een selectie (simpel — alle spelers/staf blijven bij leider).
 */
export async function ontkoppelSelectie(groepLeiderId: string) {
  await prisma.team.updateMany({
    where: { selectieGroepId: groepLeiderId },
    data: { selectieGroepId: null },
  });
  revalidatePath("/scenarios");
}

/**
 * Ontkoppel een selectie met speler- en stafverdeling.
 * Spelers worden verdeeld over de teams.
 * Staf met key "alle" wordt gedupliceerd naar elk team.
 */
export async function ontkoppelSelectieMetVerdeling(
  groepLeiderId: string,
  spelerVerdeling: Record<string, string[]>,
  stafVerdeling: Record<string, string[]>,
  alleTeamIds: string[]
) {
  await assertTeamBewerkbaar(groepLeiderId);

  await prisma.$transaction(async (tx) => {
    // 1. Verplaats spelers volgens verdeling
    for (const [teamId, spelerIds] of Object.entries(spelerVerdeling)) {
      if (teamId === groepLeiderId) continue;
      for (const spelerId of spelerIds) {
        await tx.teamSpeler.updateMany({
          where: { teamId: groepLeiderId, spelerId },
          data: { teamId },
        });
      }
    }

    // 2. Verplaats/dupliceer staf volgens verdeling
    for (const [teamIdOrAlle, stafIds] of Object.entries(stafVerdeling)) {
      if (teamIdOrAlle === "alle") {
        // Staf bij alle teams → dupliceer naar elk team (behalve leider)
        for (const stafId of stafIds) {
          const bestaand = await tx.teamStaf.findFirst({
            where: { teamId: groepLeiderId, stafId },
            select: { rol: true },
          });
          if (!bestaand) continue;
          for (const tid of alleTeamIds) {
            if (tid === groepLeiderId) continue;
            await tx.teamStaf.upsert({
              where: { teamId_stafId: { teamId: tid, stafId } },
              create: { teamId: tid, stafId, rol: bestaand.rol },
              update: {},
            });
          }
        }
      } else if (teamIdOrAlle !== groepLeiderId) {
        // Staf naar specifiek team → verplaats
        for (const stafId of stafIds) {
          await tx.teamStaf.updateMany({
            where: { teamId: groepLeiderId, stafId },
            data: { teamId: teamIdOrAlle },
          });
        }
      }
    }

    // 3. Ontkoppel de teams
    await tx.team.updateMany({
      where: { selectieGroepId: groepLeiderId },
      data: { selectieGroepId: null },
    });
  });

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
    select: { conceptId: true },
  });

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
