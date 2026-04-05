/**
 * TI-specifieke seed functies: User, Speler, Staf, Concept, Scenario, Versie, Team.
 * Wordt aangeroepen vanuit runner.ts.
 */
import type { PrismaClient } from "@oranje-wit/database";
import {
  SEIZOEN_HUIDIG,
  E2E_USER_EMAIL,
  E2E_USER_NAAM,
  STAF,
  CONCEPT_NAAM,
  SCENARIO_NAAM,
  TI_TEAM_MAPPINGS,
} from "./dataset";

interface SpelerRecord {
  relCode: string;
  roepnaam: string;
  achternaam: string;
  geslacht: "M" | "V";
  geboortejaar: number;
  geboortedatum: Date;
  team: {
    owCode: string;
    naam: string;
    categorie: string;
    kleur: string | null;
    spelvorm: string;
  } | null;
}

export async function seedUser(prisma: PrismaClient) {
  // Maak werkindeling User aan (voor historische redenen)
  await prisma.user.upsert({
    where: { email: E2E_USER_EMAIL },
    update: {},
    create: {
      email: E2E_USER_EMAIL,
      naam: E2E_USER_NAAM,
      rol: "EDITOR",
    },
  });

  // Maak ook Gebruiker aan voor auth capabilities (isTC=true)
  // Dit is vereist zodat requireTC() in E2E tests werkt
  await prisma.gebruiker.upsert({
    where: { email: E2E_USER_EMAIL },
    update: { actief: true },
    create: {
      email: E2E_USER_EMAIL,
      naam: E2E_USER_NAAM,
      isTC: true,
      isTCKern: false,
      isScout: false,
      clearance: 3,
      actief: true,
    },
  });
}

export async function seedTISpelers(prisma: PrismaClient, spelers: SpelerRecord[]) {
  for (const s of spelers) {
    if (!s.team) continue;

    const leeftijd = 2025 - s.geboortejaar;

    await prisma.speler.upsert({
      where: { id: s.relCode },
      update: {},
      create: {
        id: s.relCode,
        roepnaam: s.roepnaam,
        achternaam: s.achternaam,
        geboortejaar: s.geboortejaar,
        geboortedatum: s.geboortedatum,
        geslacht: s.geslacht,
        lidSinds: "2020-09-01",
        seizoenenActief: 5,
        instroomLeeftijd: leeftijd - 5,
        status: "BESCHIKBAAR",
        huidig: {
          team: s.team.naam,
          categorie: s.team.categorie,
          kleur: s.team.kleur,
          leeftijd,
        },
        spelerspad: [
          {
            seizoen: SEIZOEN_HUIDIG,
            team: s.team.naam,
            kleur: s.team.kleur,
            spelvorm: s.team.spelvorm,
            categorie: s.team.categorie,
          },
        ],
      },
    });
  }
}

export async function seedStaf(prisma: PrismaClient) {
  for (const s of STAF) {
    await prisma.staf.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        naam: s.naam,
        rollen: s.rollen,
        email: s.email,
      },
    });
  }
}

export async function seedConceptScenarioVersie(
  prisma: PrismaClient,
  blauwdrukId: string,
  spelers: SpelerRecord[]
) {
  // Seed werkindeling (vervangt concept + scenario structuur)
  const werkindeling = await prisma.werkindeling.create({
    data: {
      blauwdrukId,
      naam: SCENARIO_NAAM,
      toelichting: "Automatisch aangemaakt door seed voor E2E tests",
      status: "ACTIEF",
    },
  });

  // Gebruik een placeholder voor terugwaartse compatibiliteit
  const concept = { id: blauwdrukId, naam: CONCEPT_NAAM };
  const scenario = werkindeling;

  const versie = await prisma.versie.create({
    data: {
      werkindelingId: werkindeling.id,
      nummer: 1,
      naam: "Initieel",
      auteur: E2E_USER_EMAIL,
    },
  });

  const tiTeamIds = new Map<string, string>();
  for (const mapping of TI_TEAM_MAPPINGS) {
    const tiTeam = await prisma.team.create({
      data: {
        versieId: versie.id,
        naam: mapping.naam,
        categorie: mapping.categorie,
        kleur: mapping.kleur ?? undefined,
        teamType: mapping.teamType,
        volgorde: mapping.volgorde,
        validatieStatus: "ONBEKEND",
      },
    });
    tiTeamIds.set(mapping.owCode, tiTeam.id);
  }

  for (const s of spelers) {
    if (!s.team) continue;
    const tiTeamId = tiTeamIds.get(s.team.owCode);
    if (!tiTeamId) continue;

    await prisma.teamSpeler.create({
      data: {
        teamId: tiTeamId,
        spelerId: s.relCode,
      },
    });
  }

  return { concept, scenario, versie };
}
