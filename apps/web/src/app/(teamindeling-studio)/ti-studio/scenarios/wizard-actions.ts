"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { bouwTeamVoorstellen } from "@/lib/teamindeling/teamstructuur";
import type { SpelerBasis, ACatConfig } from "@/lib/teamindeling/teamstructuur";
import type { Prisma } from "@oranje-wit/database";
import { PEILJAAR } from "@oranje-wit/types";
import { redirect } from "next/navigation";

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

// ---------------------------------------------------------------------------
// Wizard: scenario aanmaken vanuit blauwdruk (met A-cat + B-team berekening)
// ---------------------------------------------------------------------------

/**
 * Maak een scenario aan vanuit de blauwdruk-wizard.
 * Genereert teams op basis van senioren/A-cat/B-cat configuratie.
 */
export async function createScenarioVanuitBlauwdruk(
  blauwdrukId: string,
  naam: string,
  aantalSenioren: number,
  aCatTeams: ACatConfig[],
  bTeamOverrides?: Record<string, number>
) {
  const concept = await prisma.concept.upsert({
    where: { id: await findConceptIdForBlauwdruk(blauwdrukId) },
    create: {
      blauwdrukId,
      naam: "Standaard",
      uitgangsprincipe: "Automatisch aangemaakt",
      keuzes: {},
    },
    update: {},
  });

  const spelers = await prisma.speler.findMany({
    select: { id: true, geboortejaar: true, geslacht: true, status: true },
  });

  const spelerBasis: SpelerBasis[] = spelers.map((s) => ({
    id: s.id,
    geboortejaar: s.geboortejaar,
    geslacht: s.geslacht as "M" | "V",
    status: s.status,
  }));

  const teamVoorstellen = bouwTeamVoorstellen(
    spelerBasis,
    PEILJAAR,
    aantalSenioren,
    aCatTeams,
    bTeamOverrides
  );

  const scenario = await prisma.scenario.create({
    data: {
      conceptId: concept.id,
      naam,
      toelichting: null,
      aannames: {
        methode: "blauwdruk",
        aantalSenioren,
        aCatTeams,
        bTeamOverrides: bTeamOverrides ?? null,
      } as unknown as Prisma.InputJsonValue,
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
  });

  redirect(`/ti-studio/scenarios/${scenario.id}`);
}

// ---------------------------------------------------------------------------
// Wizard: leeg scenario
// ---------------------------------------------------------------------------

/**
 * Maak een leeg scenario aan (0 teams).
 */
export async function createLeegScenario(blauwdrukId: string, naam: string) {
  const concept = await prisma.concept.upsert({
    where: { id: await findConceptIdForBlauwdruk(blauwdrukId) },
    create: {
      blauwdrukId,
      naam: "Standaard",
      uitgangsprincipe: "Automatisch aangemaakt",
      keuzes: {},
    },
    update: {},
  });

  const scenario = await prisma.scenario.create({
    data: {
      conceptId: concept.id,
      naam,
      toelichting: null,
      aannames: { methode: "leeg" } as unknown as Prisma.InputJsonValue,
      versies: {
        create: {
          nummer: 1,
          auteur: "Systeem",
          naam: "Initieel",
        },
      },
    },
  });

  redirect(`/ti-studio/scenarios/${scenario.id}`);
}

// ---------------------------------------------------------------------------
// Wizard: kopieer bestaand scenario
// ---------------------------------------------------------------------------

/**
 * Kopieer een bestaand scenario (teams + teamspelers + selectiegroepen).
 */
export async function kopieerScenario(bronScenarioId: string, naam: string) {
  const bron = await prisma.scenario.findUniqueOrThrow({
    where: { id: bronScenarioId },
    include: {
      versies: {
        orderBy: { nummer: "desc" },
        take: 1,
        include: {
          teams: {
            include: {
              spelers: { select: { spelerId: true } },
              staf: { select: { stafId: true } },
            },
            orderBy: { volgorde: "asc" },
          },
          selectieGroepen: {
            include: {
              spelers: { select: { spelerId: true } },
              staf: { select: { stafId: true } },
            },
          },
        },
      },
    },
  });

  const laatsteVersie = bron.versies[0];
  if (!laatsteVersie) {
    throw new Error("Bronscenario heeft geen versies");
  }

  // Bouw selectiegroep-mapping: oude ID → teams die erbij horen
  const selectieGroepTeams = new Map<string, string[]>();
  for (const team of laatsteVersie.teams) {
    if (team.selectieGroepId) {
      const bestaand = selectieGroepTeams.get(team.selectieGroepId) ?? [];
      bestaand.push(team.id);
      selectieGroepTeams.set(team.selectieGroepId, bestaand);
    }
  }

  const scenario = await prisma.$transaction(async (tx) => {
    const nieuwScenario = await tx.scenario.create({
      data: {
        conceptId: bron.conceptId,
        naam,
        toelichting: `Kopie van ${bron.naam}`,
        aannames: { methode: "kopie", bronScenarioId } as unknown as Prisma.InputJsonValue,
        keuzeWaardes: bron.keuzeWaardes ?? undefined,
      },
    });

    const versie = await tx.versie.create({
      data: {
        scenarioId: nieuwScenario.id,
        nummer: 1,
        auteur: "Systeem",
        naam: "Kopie",
      },
    });

    // Selectiegroepen aanmaken (met mapping oud → nieuw ID)
    const sgMapping = new Map<string, string>();
    for (const sg of laatsteVersie.selectieGroepen) {
      const nieuwSg = await tx.selectieGroep.create({
        data: { versieId: versie.id, naam: sg.naam },
      });
      sgMapping.set(sg.id, nieuwSg.id);

      if (sg.spelers.length > 0) {
        await tx.selectieSpeler.createMany({
          data: sg.spelers.map((sp: { spelerId: string }) => ({
            selectieGroepId: nieuwSg.id,
            spelerId: sp.spelerId,
          })),
        });
      }
      if (sg.staf.length > 0) {
        await tx.selectieStaf.createMany({
          data: sg.staf.map((st: { stafId: string }) => ({
            selectieGroepId: nieuwSg.id,
            stafId: st.stafId,
          })),
        });
      }
    }

    // Teams aanmaken
    for (const team of laatsteVersie.teams) {
      const nieuwTeam = await tx.team.create({
        data: {
          versieId: versie.id,
          naam: team.naam,
          alias: team.alias,
          categorie: team.categorie,
          kleur: team.kleur,
          teamType: team.teamType,
          niveau: team.niveau,
          volgorde: team.volgorde,
          selectieGroepId: team.selectieGroepId
            ? (sgMapping.get(team.selectieGroepId) ?? null)
            : null,
        },
      });

      if (!team.selectieGroepId && team.spelers.length > 0) {
        await tx.teamSpeler.createMany({
          data: team.spelers.map((sp: { spelerId: string }) => ({
            teamId: nieuwTeam.id,
            spelerId: sp.spelerId,
          })),
        });
      }
      if (!team.selectieGroepId && team.staf.length > 0) {
        await tx.teamStaf.createMany({
          data: team.staf.map((st: { stafId: string }) => ({
            teamId: nieuwTeam.id,
            stafId: st.stafId,
          })),
        });
      }
    }

    return nieuwScenario;
  });

  redirect(`/ti-studio/scenarios/${scenario.id}`);
}

// ---------------------------------------------------------------------------
// Wizard: speler leeftijdsverdeling ophalen (voor live preview)
// ---------------------------------------------------------------------------

/**
 * Haal speler-basis data op voor de wizard.
 */
export async function getSpelerBasisData(): Promise<SpelerBasis[]> {
  const spelers = await prisma.speler.findMany({
    select: { id: true, geboortejaar: true, geslacht: true, status: true },
  });

  return spelers.map((s) => ({
    id: s.id,
    geboortejaar: s.geboortejaar,
    geslacht: s.geslacht as "M" | "V",
    status: s.status,
  }));
}
