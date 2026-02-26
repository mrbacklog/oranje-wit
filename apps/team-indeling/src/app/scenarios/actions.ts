"use server";

import { prisma } from "@/lib/db/prisma";
import { berekenTeamstructuur } from "@/lib/teamstructuur";
import type { SpelerBasis } from "@/lib/teamstructuur";
import type { Prisma } from "@oranje-wit/database";
import { redirect } from "next/navigation";

const SEIZOEN = "2026-2027";
const SEIZOEN_JAAR = 2026;

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
  const teamVoorstellen = berekenTeamstructuur(spelerBasis, keuzeWaardes, SEIZOEN_JAAR);

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
