/**
 * Data-migratie: memo's → Werkitem records
 *
 * WANNEER DRAAIEN:
 * 1. Na de additive schema-migratie (additive-werkitem-memo)
 * 2. VÓÓR de cleanup schema-migratie (die notitie/memoStatus/besluit verwijdert)
 *
 * Gebruik: npx ts-node scripts/migrate-memos-to-werkitems.ts
 * Of via pnpm: pnpm tsx scripts/migrate-memos-to-werkitems.ts
 */

import "dotenv/config";
import { prisma } from "../packages/database/src/index";
import { logger } from "@oranje-wit/types";

async function main() {
  logger.info("=== Migratie: memo's → Werkitem records ===");

  // ──────────────────────────────────────────────────────────
  // Stap 1: Zoek het actieve werkseizoen (Kaders met isWerkseizoen=true)
  // ──────────────────────────────────────────────────────────
  const kaders = await prisma.kaders.findFirst({
    where: { isWerkseizoen: true },
    select: { id: true, seizoen: true },
  });

  if (!kaders) {
    logger.warn("Geen actieve Kaders gevonden (isWerkseizoen=true). Migratie gestopt.");
    return;
  }

  logger.info(`Actieve Kaders gevonden: ${kaders.seizoen} (id: ${kaders.id})`);

  // ──────────────────────────────────────────────────────────
  // Stap 2: Zoek de auteur (eerste TC-gebruiker als fallback)
  // ──────────────────────────────────────────────────────────
  const auteur = await prisma.user.findFirst({
    select: { id: true, email: true },
    orderBy: { createdAt: "asc" },
  });

  if (!auteur) {
    logger.warn("Geen gebruiker gevonden in de database. Migratie gestopt.");
    return;
  }

  logger.info(`Auteur voor migratie: ${auteur.email} (id: ${auteur.id})`);

  const kadersId = kaders.id;
  const auteurId = auteur.id;

  let teamCount = 0;
  let spelerCount = 0;
  let stafCount = 0;

  // ──────────────────────────────────────────────────────────
  // Stap 3: Migreer Team-memos
  // ──────────────────────────────────────────────────────────
  logger.info("Teams ophalen met notitie of open memoStatus...");

  const teams = await prisma.team.findMany({
    where: {
      OR: [{ notitie: { not: null } }, { memoStatus: "open" }],
    },
    select: {
      id: true,
      naam: true,
      notitie: true,
      memoStatus: true,
      besluit: true,
      versie: {
        select: {
          werkindelingId: true,
        },
      },
    },
  });

  logger.info(`${teams.length} teams gevonden met memo-data.`);

  for (const team of teams) {
    const werkindelingId = team.versie?.werkindelingId ?? null;

    // Controleer of dit werkitem al bestaat (idempotentie)
    const bestaand = await prisma.werkitem.findFirst({
      where: {
        type: "MEMO",
        entiteit: "TEAM",
        teamId: team.id,
        kadersId,
      },
    });

    if (bestaand) {
      logger.info(`  Team "${team.naam}": werkitem bestaat al — overgeslagen.`);
      continue;
    }

    try {
      await prisma.werkitem.create({
        data: {
          type: "MEMO",
          entiteit: "TEAM",
          teamId: team.id,
          kadersId,
          werkindelingId,
          titel: null,
          beschrijving: team.notitie ?? "(memo zonder tekst)",
          status: team.memoStatus === "open" ? "OPEN" : "OPGELOST",
          prioriteit: "MIDDEL",
          resolutie: team.besluit ?? null,
          auteurId,
          volgorde: 0,
        },
      });

      teamCount++;
      logger.info(`  Team "${team.naam}": werkitem aangemaakt.`);
    } catch (error) {
      logger.error(`  Team "${team.naam}" mislukt:`, error);
    }
  }

  // ──────────────────────────────────────────────────────────
  // Stap 4: Migreer Speler-memos
  // ──────────────────────────────────────────────────────────
  logger.info("Spelers ophalen met notitie of open memoStatus...");

  const spelers = await prisma.speler.findMany({
    where: {
      OR: [{ notitie: { not: null } }, { memoStatus: "open" }],
    },
    select: {
      id: true,
      roepnaam: true,
      achternaam: true,
      notitie: true,
      memoStatus: true,
      besluit: true,
    },
  });

  logger.info(`${spelers.length} spelers gevonden met memo-data.`);

  for (const speler of spelers) {
    // Controleer of dit werkitem al bestaat (idempotentie)
    const bestaand = await prisma.werkitem.findFirst({
      where: {
        type: "MEMO",
        entiteit: "SPELER",
        spelerId: speler.id,
        kadersId,
      },
    });

    if (bestaand) {
      logger.info(
        `  Speler "${speler.roepnaam} ${speler.achternaam}": werkitem bestaat al — overgeslagen.`
      );
      continue;
    }

    try {
      await prisma.werkitem.create({
        data: {
          type: "MEMO",
          entiteit: "SPELER",
          spelerId: speler.id,
          kadersId,
          werkindelingId: null,
          titel: null,
          beschrijving: speler.notitie ?? "(memo zonder tekst)",
          status: speler.memoStatus === "open" ? "OPEN" : "OPGELOST",
          prioriteit: "MIDDEL",
          resolutie: speler.besluit ?? null,
          auteurId,
          volgorde: 0,
        },
      });

      spelerCount++;
      logger.info(`  Speler "${speler.roepnaam} ${speler.achternaam}": werkitem aangemaakt.`);
    } catch (error) {
      logger.error(`  Speler "${speler.roepnaam} ${speler.achternaam}" mislukt:`, error);
    }
  }

  // ──────────────────────────────────────────────────────────
  // Stap 5: Migreer Staf-memos
  // ──────────────────────────────────────────────────────────
  logger.info("Stafleden ophalen met notitie...");

  const stafleden = await prisma.staf.findMany({
    where: {
      notitie: { not: null },
    },
    select: {
      id: true,
      naam: true,
      notitie: true,
    },
  });

  logger.info(`${stafleden.length} stafleden gevonden met memo-data.`);

  for (const staf of stafleden) {
    // Controleer of dit werkitem al bestaat (idempotentie)
    const bestaand = await prisma.werkitem.findFirst({
      where: {
        type: "MEMO",
        entiteit: "STAF",
        stafId: staf.id,
        kadersId,
      },
    });

    if (bestaand) {
      logger.info(`  Staf "${staf.naam}": werkitem bestaat al — overgeslagen.`);
      continue;
    }

    try {
      await prisma.werkitem.create({
        data: {
          type: "MEMO",
          entiteit: "STAF",
          stafId: staf.id,
          kadersId,
          werkindelingId: null,
          titel: null,
          beschrijving: staf.notitie ?? "(memo zonder tekst)",
          status: "OPEN",
          prioriteit: "MIDDEL",
          resolutie: null,
          auteurId,
          volgorde: 0,
        },
      });

      stafCount++;
      logger.info(`  Staf "${staf.naam}": werkitem aangemaakt.`);
    } catch (error) {
      logger.error(`  Staf "${staf.naam}" mislukt:`, error);
    }
  }

  // ──────────────────────────────────────────────────────────
  // Samenvatting
  // ──────────────────────────────────────────────────────────
  logger.info(
    `Migratie voltooid: ${teamCount} team-memos, ${spelerCount} speler-memos, ${stafCount} staf-memos gemigreerd.`
  );
}

main()
  .catch((error) => {
    logger.error("Migratie mislukt:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect().catch((error: unknown) => {
      logger.error("Prisma disconnect mislukt:", error);
    });
  });
