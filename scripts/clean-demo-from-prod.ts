/**
 * Verwijdert ALLE demo-data (TSTN prefix) uit de productie-database.
 *
 * Dit script leest DATABASE_URL uit .env (NIET .env.local).
 * Het vraagt bevestiging voordat het iets verwijdert.
 *
 * Gebruik: pnpm db:prod:clean-demo
 */

import "dotenv/config";
import { prisma } from "../packages/database/src/index";
import { logger } from "@oranje-wit/types";
import * as readline from "readline";

const DEMO_PREFIX = "TSTN";
const E2E_TEST_EMAIL = "antjanlaban@gmail.com";

function vraagBevestiging(vraag: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(vraag, (antwoord) => {
      rl.close();
      resolve(antwoord.toLowerCase() === "ja");
    });
  });
}

async function main() {
  const dbUrl = process.env.DATABASE_URL ?? "";
  const isLokaal = dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1");

  if (isLokaal) {
    logger.warn("Dit script is bedoeld voor de PRODUCTIE database.");
    logger.warn("Je DATABASE_URL wijst naar localhost. Gebruik .env (niet .env.local).");
    logger.warn("");
    logger.warn(
      "Tip: DATABASE_URL=postgresql://postgres:****@shinkansen.proxy.rlwy.net:18957/oranjewit npx tsx scripts/clean-demo-from-prod.ts"
    );
    process.exit(1);
  }

  // Eerst tellen wat er is
  const [ledenCount, compCount, scoutCount] = await Promise.all([
    prisma.lid.count({ where: { relCode: { startsWith: DEMO_PREFIX } } }),
    prisma.competitieSpeler.count({ where: { relCode: { startsWith: DEMO_PREFIX } } }),
    prisma.scout.count({
      where: { OR: [{ email: { startsWith: "demo-" } }, { email: E2E_TEST_EMAIL }] },
    }),
  ]);

  logger.info("=== DEMO DATA IN PRODUCTIE ===");
  logger.info(`  Leden:              ${ledenCount}`);
  logger.info(`  CompetitieSpelers:  ${compCount}`);
  logger.info(`  Scouts:             ${scoutCount}`);
  logger.info(`  Database: ${dbUrl.replace(/:[^:]*@/, ":***@")}`);
  logger.info("");

  if (ledenCount === 0 && compCount === 0 && scoutCount === 0) {
    logger.info("Geen demo-data gevonden. Klaar.");
    await prisma.$disconnect();
    return;
  }

  const bevestigd = await vraagBevestiging(
    `Wil je ${ledenCount} leden + ${compCount} competitiespelers + ${scoutCount} scouts verwijderen? (typ 'ja'): `
  );

  if (!bevestigd) {
    logger.info("Afgebroken.");
    await prisma.$disconnect();
    return;
  }

  logger.info("Verwijderen...");

  // Volgorde: eerst FK-afhankelijke tabellen, dan de hoofdtabellen
  // (zelfde volgorde als cleanup() in seed-demo-data.ts)

  const stappen = [
    {
      label: "SpelersKaart",
      fn: () =>
        prisma.spelersKaart.deleteMany({ where: { spelerId: { startsWith: DEMO_PREFIX } } }),
    },
    {
      label: "ScoutingRapport",
      fn: () =>
        prisma.scoutingRapport.deleteMany({
          where: {
            OR: [
              { spelerId: { startsWith: DEMO_PREFIX } },
              { scout: { OR: [{ email: { startsWith: "demo-" } }, { email: E2E_TEST_EMAIL }] } },
            ],
          },
        }),
    },
    {
      label: "ScoutingVergelijking",
      fn: () =>
        prisma.scoutingVergelijking.deleteMany({
          where: { scout: { OR: [{ email: { startsWith: "demo-" } }, { email: E2E_TEST_EMAIL }] } },
        }),
    },
    {
      label: "ScoutToewijzing",
      fn: () =>
        prisma.scoutToewijzing.deleteMany({
          where: { scout: { OR: [{ email: { startsWith: "demo-" } }, { email: E2E_TEST_EMAIL }] } },
        }),
    },
    {
      label: "TeamScoutingSessie",
      fn: () =>
        prisma.teamScoutingSessie.deleteMany({
          where: { scout: { OR: [{ email: { startsWith: "demo-" } }, { email: E2E_TEST_EMAIL }] } },
        }),
    },
    {
      label: "ScoutBadge",
      fn: () =>
        prisma.scoutBadge.deleteMany({
          where: { scout: { OR: [{ email: { startsWith: "demo-" } }, { email: E2E_TEST_EMAIL }] } },
        }),
    },
    {
      label: "Scout",
      fn: () =>
        prisma.scout.deleteMany({
          where: { OR: [{ email: { startsWith: "demo-" } }, { email: E2E_TEST_EMAIL }] },
        }),
    },
    {
      label: "Evaluatie",
      fn: () => prisma.evaluatie.deleteMany({ where: { spelerId: { startsWith: DEMO_PREFIX } } }),
    },
    {
      label: "SpelerZelfEvaluatie",
      fn: () =>
        prisma.spelerZelfEvaluatie.deleteMany({ where: { spelerId: { startsWith: DEMO_PREFIX } } }),
    },
    {
      label: "TeamSpeler",
      fn: () => prisma.teamSpeler.deleteMany({ where: { spelerId: { startsWith: DEMO_PREFIX } } }),
    },
    {
      label: "SelectieSpeler",
      fn: () =>
        prisma.selectieSpeler.deleteMany({ where: { spelerId: { startsWith: DEMO_PREFIX } } }),
    },
    {
      label: "Pin",
      fn: () => prisma.pin.deleteMany({ where: { spelerId: { startsWith: DEMO_PREFIX } } }),
    },
    {
      label: "CompetitieSpeler",
      fn: () =>
        prisma.competitieSpeler.deleteMany({ where: { relCode: { startsWith: DEMO_PREFIX } } }),
    },
    {
      label: "Ledenverloop",
      fn: () => prisma.ledenverloop.deleteMany({ where: { relCode: { startsWith: DEMO_PREFIX } } }),
    },
    {
      label: "Speler",
      fn: () => prisma.speler.deleteMany({ where: { id: { startsWith: DEMO_PREFIX } } }),
    },
    {
      label: "Lid",
      fn: () => prisma.lid.deleteMany({ where: { relCode: { startsWith: DEMO_PREFIX } } }),
    },
  ];

  for (const stap of stappen) {
    try {
      const result = await stap.fn();
      if (result.count > 0) {
        logger.info(`  ${stap.label}: ${result.count} verwijderd`);
      }
    } catch {
      logger.warn(`  ${stap.label}: overgeslagen (tabel bestaat mogelijk niet)`);
    }
  }

  // Verificatie
  const naLeden = await prisma.lid.count({ where: { relCode: { startsWith: DEMO_PREFIX } } });
  const naComp = await prisma.competitieSpeler.count({
    where: { relCode: { startsWith: DEMO_PREFIX } },
  });

  logger.info("");
  logger.info("=== VERIFICATIE ===");
  logger.info(`  Leden TSTN na cleanup:     ${naLeden}`);
  logger.info(`  CompSpelers TSTN na cleanup: ${naComp}`);

  if (naLeden === 0 && naComp === 0) {
    logger.info("  Alle demo-data verwijderd.");
  } else {
    logger.warn("  ER ZIJN NOG RESTANTEN. Handmatig controleren.");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  logger.error("Fout bij cleanup:", e);
  prisma.$disconnect();
  process.exit(1);
});
