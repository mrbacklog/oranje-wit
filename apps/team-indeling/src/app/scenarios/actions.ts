"use server";

import { prisma } from "@/lib/db/prisma";
import { berekenTeamstructuur } from "@/lib/teamstructuur";
import type { SpelerBasis } from "@/lib/teamstructuur";
import type { Prisma, TeamCategorie, Kleur } from "@oranje-wit/database";
import { PEILJAAR } from "@oranje-wit/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const _SEIZOEN = "2026-2027";

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
  await prisma.teamSpeler.create({
    data: { teamId, spelerId },
  });
  revalidatePath("/scenarios");
}

/**
 * Verwijder een speler uit een team.
 */
export async function removeSpelerFromTeam(teamId: string, spelerId: string) {
  await prisma.teamSpeler.deleteMany({
    where: { teamId, spelerId },
  });
  revalidatePath("/scenarios");
}

/**
 * Verplaats een speler van het ene team naar het andere.
 */
export async function moveSpeler(spelerId: string, vanTeamId: string, naarTeamId: string) {
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
 */
export async function koppelSelectie(teamIds: string[]) {
  if (teamIds.length < 2) return;
  const [leiderId, ...restIds] = teamIds;
  await prisma.team.updateMany({
    where: { id: { in: restIds } },
    data: { selectieGroepId: leiderId },
  });
  revalidatePath("/scenarios");
}

/**
 * Ontkoppel een selectie.
 */
export async function ontkoppelSelectie(groepLeiderId: string) {
  await prisma.team.updateMany({
    where: { selectieGroepId: groepLeiderId },
    data: { selectieGroepId: null },
  });
  revalidatePath("/scenarios");
}

/**
 * Verwijder een scenario (inclusief versies, teams, spelers, staf via cascade).
 */
export async function deleteScenario(scenarioId: string) {
  await prisma.scenario.delete({ where: { id: scenarioId } });
  revalidatePath("/scenarios");
}

/**
 * Markeer een scenario als DEFINITIEF.
 * Alle andere scenario's in hetzelfde concept worden GEARCHIVEERD.
 */
export async function markeerDefinitief(scenarioId: string) {
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
