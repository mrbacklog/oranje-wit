/**
 * Seed runner: maakt de volledige testdataset aan in de database.
 * Idempotent (upserts), TST-prefix rel_codes.
 *
 * Gebruik: import { runSeed } from "@oranje-wit/test-utils/seed"
 */
import type { PrismaClient } from "@oranje-wit/database";
import {
  TEAMS,
  SEIZOEN_HUIDIG,
  SEIZOEN_VORIG,
  AANTAL_TEAMLOOS,
  TEAMLOOS_GEBOORTEJAAR_RANGE,
  VOORNAMEN_M,
  VOORNAMEN_V,
  ACHTERNAMEN,
  E2E_USER_EMAIL,
  STAF,
  type TeamDef,
} from "./dataset";
import { seedUser, seedTISpelers, seedStaf, seedConceptScenarioVersie } from "./seed-ti";
import { seedLedenverloop, seedCohorten, seedSignaleringen } from "./seed-monitor";

// ── Helpers ────────────────────────────────────────────────────────────

function relCode(n: number): string {
  return `TSTN${String(n).padStart(3, "0")}`;
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.abs(deterministicRandom()) * (max - min + 1));
}

let seed = 42;
function deterministicRandom(): number {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}

function resetSeed() {
  seed = 42;
}

interface SpelerRecord {
  relCode: string;
  roepnaam: string;
  achternaam: string;
  geslacht: "M" | "V";
  geboortejaar: number;
  geboortedatum: Date;
  team: TeamDef;
}

// ── Seed functies ──────────────────────────────────────────────────────

async function seedSeizoenen(prisma: PrismaClient) {
  for (const [seizoen, startJaar] of [
    [SEIZOEN_HUIDIG, 2025],
    [SEIZOEN_VORIG, 2024],
  ] as const) {
    const eindJaar = startJaar + 1;
    await prisma.seizoen.upsert({
      where: { seizoen },
      update: {},
      create: {
        seizoen,
        startJaar,
        eindJaar,
        startDatum: new Date(startJaar, 7, 1),
        eindDatum: new Date(eindJaar, 5, 30),
        peildatum: new Date(startJaar, 11, 31),
      },
    });
  }
}

function generateSpelers(): SpelerRecord[] {
  resetSeed();
  const spelers: SpelerRecord[] = [];
  let counter = 1;
  let nameIdx = 0;

  for (const team of TEAMS) {
    for (let i = 0; i < team.aantalSpelers; i++) {
      const geslacht: "M" | "V" = i % 2 === 0 ? "M" : "V";
      const namen = geslacht === "M" ? VOORNAMEN_M : VOORNAMEN_V;
      const roepnaam = namen[nameIdx % namen.length];
      const achternaam = ACHTERNAMEN[nameIdx % ACHTERNAMEN.length];
      const geboortejaar = randomInt(team.geboortejaarRange[0], team.geboortejaarRange[1]);

      spelers.push({
        relCode: relCode(counter),
        roepnaam,
        achternaam,
        geslacht,
        geboortejaar,
        geboortedatum: new Date(geboortejaar, 5, 15),
        team,
      });

      counter++;
      nameIdx++;
    }
  }

  for (let i = 0; i < AANTAL_TEAMLOOS; i++) {
    const geslacht: "M" | "V" = i % 2 === 0 ? "M" : "V";
    const namen = geslacht === "M" ? VOORNAMEN_M : VOORNAMEN_V;
    const roepnaam = namen[nameIdx % namen.length];
    const achternaam = ACHTERNAMEN[nameIdx % ACHTERNAMEN.length];
    const geboortejaar = randomInt(TEAMLOOS_GEBOORTEJAAR_RANGE[0], TEAMLOOS_GEBOORTEJAAR_RANGE[1]);

    spelers.push({
      relCode: relCode(counter),
      roepnaam,
      achternaam,
      geslacht,
      geboortejaar,
      geboortedatum: new Date(geboortejaar, 5, 15),
      team: null as unknown as TeamDef,
    });

    counter++;
    nameIdx++;
  }

  return spelers;
}

async function seedLeden(prisma: PrismaClient, spelers: SpelerRecord[]) {
  for (const s of spelers) {
    await prisma.lid.upsert({
      where: { relCode: s.relCode },
      update: {},
      create: {
        relCode: s.relCode,
        roepnaam: s.roepnaam,
        achternaam: s.achternaam,
        geslacht: s.geslacht,
        geboortejaar: s.geboortejaar,
        geboortedatum: s.geboortedatum,
        lidSinds: new Date(2020, 8, 1),
        lidsoort: "Spelend lid",
      },
    });
  }
}

async function seedTeams(prisma: PrismaClient) {
  for (const seizoen of [SEIZOEN_HUIDIG, SEIZOEN_VORIG]) {
    for (const team of TEAMS) {
      const owTeam = await prisma.oWTeam.upsert({
        where: { seizoen_owCode: { seizoen, owCode: team.owCode } },
        update: {},
        create: {
          seizoen,
          owCode: team.owCode,
          naam: team.naam,
          categorie: team.categorie,
          kleur: team.kleur,
          leeftijdsgroep: team.leeftijdsgroep,
          spelvorm: team.spelvorm,
          isSelectie: team.isSelectie,
          selectieOwCode: team.selectieOwCode,
          sortOrder: team.sortOrder,
        },
      });

      await prisma.teamPeriode.upsert({
        where: { teamId_periode: { teamId: owTeam.id, periode: "veld_najaar" } },
        update: {},
        create: {
          teamId: owTeam.id,
          periode: "veld_najaar",
          pool: `Pool-${team.naam}`,
          aantalSpelers: team.aantalSpelers,
        },
      });
    }
  }
}

async function seedCompetitieSpelers(prisma: PrismaClient, spelers: SpelerRecord[]) {
  for (const s of spelers) {
    if (!s.team) continue;
    await prisma.competitieSpeler.upsert({
      where: {
        relCode_seizoen_competitie: {
          relCode: s.relCode,
          seizoen: SEIZOEN_HUIDIG,
          competitie: "veld_najaar",
        },
      },
      update: {},
      create: {
        relCode: s.relCode,
        seizoen: SEIZOEN_HUIDIG,
        competitie: "veld_najaar",
        team: s.team.naam,
        geslacht: s.geslacht,
        bron: "seed",
        betrouwbaar: true,
      },
    });
  }

  for (const s of spelers) {
    const hadVorigSeizoen = s.team ? deterministicRandom() > 0.1 : true;
    if (!hadVorigSeizoen) continue;
    const teamNaam = s.team?.naam ?? TEAMS[0].naam;
    await prisma.competitieSpeler.upsert({
      where: {
        relCode_seizoen_competitie: {
          relCode: s.relCode,
          seizoen: SEIZOEN_VORIG,
          competitie: "veld_najaar",
        },
      },
      update: {},
      create: {
        relCode: s.relCode,
        seizoen: SEIZOEN_VORIG,
        competitie: "veld_najaar",
        team: teamNaam,
        geslacht: s.geslacht,
        bron: "seed",
        betrouwbaar: true,
      },
    });
  }
}

async function seedBlauwdruk(prisma: PrismaClient) {
  return prisma.blauwdruk.create({
    data: {
      seizoen: SEIZOEN_HUIDIG,
      isWerkseizoen: true,
      toelichting: "Test blauwdruk voor E2E tests",
      kaders: {
        knkvRegels: ["Minimaal 4M/4V per achttal", "Leeftijdsgrens per categorie"],
        owRegels: ["Selectieteams hebben prioriteit", "Plezier als basis"],
      },
      speerpunten: ["Doorstroom jeugd naar senioren", "Behoud U15/U17 spelers"],
      keuzes: [],
    },
  });
}

// ── Main seed runner ───────────────────────────────────────────────────

export async function runSeed(prisma: PrismaClient) {
  console.warn("Seed starten...");

  // Pre-cleanup: verwijder niet-idempotente records
  await prisma.speler.deleteMany({ where: { id: { startsWith: "TSTN" } } });
  await prisma.staf.deleteMany({ where: { id: { startsWith: "STAF-TST" } } });
  await prisma.signalering.deleteMany({
    where: {
      seizoen: SEIZOEN_HUIDIG,
      type: { in: ["retentie_laag", "retentie_dalend", "instroom_laag", "bezetting_goed"] },
    },
  });
  await prisma.blauwdruk.deleteMany({ where: { seizoen: SEIZOEN_HUIDIG } });

  const spelers = generateSpelers();

  await seedSeizoenen(prisma);
  await seedLeden(prisma, spelers);
  await seedTeams(prisma);
  await seedCompetitieSpelers(prisma, spelers);
  await seedLedenverloop(prisma, spelers);
  await seedCohorten(prisma, spelers);
  await seedSignaleringen(prisma);
  const blauwdruk = await seedBlauwdruk(prisma);

  // TI-specifieke seed
  await seedUser(prisma);
  const spelersMetTeam = spelers.filter((s) => s.team);
  await seedTISpelers(prisma, spelers);
  await seedStaf(prisma);
  await seedConceptScenarioVersie(prisma, blauwdruk.id, spelers);

  console.warn(
    `Seed compleet: ${spelers.length} leden, ${spelersMetTeam.length} TI spelers, ` +
      `${TEAMS.length} teams, ${STAF.length} stafleden`
  );
}

export async function cleanupSeed(prisma: PrismaClient) {
  console.warn("Cleanup seed data...");

  // Blauwdruk cascadeert Concept > Scenario > Versie > Team > TeamSpeler/TeamStaf
  // Moet VOOR Speler/Staf verwijderd worden (FK constraints)
  await prisma.blauwdruk.deleteMany({ where: { seizoen: SEIZOEN_HUIDIG } });

  // TI-data (nu veilig: TeamSpeler is al verwijderd via cascade)
  await prisma.staf.deleteMany({ where: { id: { startsWith: "STAF-TST" } } });
  await prisma.speler.deleteMany({ where: { id: { startsWith: "TSTN" } } });
  await prisma.user.deleteMany({ where: { email: E2E_USER_EMAIL } });

  // Monitor-data
  await prisma.ledenverloop.deleteMany({ where: { relCode: { startsWith: "TSTN" } } });
  await prisma.competitieSpeler.deleteMany({ where: { relCode: { startsWith: "TSTN" } } });
  await prisma.cohortSeizoen.deleteMany({
    where: { seizoen: { in: [SEIZOEN_HUIDIG, SEIZOEN_VORIG] } },
  });
  await prisma.signalering.deleteMany({ where: { seizoen: SEIZOEN_HUIDIG } });
  await prisma.teamPeriode.deleteMany({
    where: { owTeam: { seizoen: { in: [SEIZOEN_HUIDIG, SEIZOEN_VORIG] } } },
  });
  await prisma.oWTeam.deleteMany({ where: { seizoen: { in: [SEIZOEN_HUIDIG, SEIZOEN_VORIG] } } });
  await prisma.lid.deleteMany({ where: { relCode: { startsWith: "TSTN" } } });

  console.warn("Cleanup compleet");
}
