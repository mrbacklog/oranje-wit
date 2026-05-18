import { prisma } from "./types";
import { logger } from "@oranje-wit/types";

/**
 * Verwijdert ALLE test-data uit oranjewit-test in FK-veilige volgorde.
 * NOOIT tegen productie-DB draaien — script controleert URL.
 */
export async function wipeAll(): Promise<void> {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.includes("oranjewit-test") && !url.includes("test")) {
    throw new Error(
      `wipe: DATABASE_URL bevat geen 'test' — geweigerd: ${url.replace(/:[^@]+@/, ":***@")}`
    );
  }

  logger.info("[wipe] starten — kindrecords eerst");

  // AgentMutatie — kan missen op test-DB (migratie nog niet toegepast)
  try {
    await prisma.agentMutatie.deleteMany({});
  } catch {
    logger.warn("[wipe] agentMutatie overgeslagen (tabel niet beschikbaar)");
  }

  // Kaders-kinderen
  await prisma.kadersSpeler.deleteMany({});
  await prisma.kadersBesluit.deleteMany({});

  // Werkitem-kinderen (voor werkitem zelf)
  await prisma.actiepunt.deleteMany({});
  await prisma.activiteit.deleteMany({});

  // Team-kinderen
  await prisma.teamSpeler.deleteMany({});
  await prisma.teamStaf.deleteMany({});
  await prisma.reserveringsspeler.deleteMany({});
  await prisma.plaatsreservering.deleteMany({});

  // Selectie-kinderen
  await prisma.selectieSpeler.deleteMany({});
  await prisma.selectieStaf.deleteMany({});
  await prisma.selectieGroep.deleteMany({});

  // Speler-kinderen (evaluaties, werkitems etc. staan hiervoor al leeg na actiepunt/activiteit)
  await prisma.spelerZelfEvaluatie.deleteMany({});
  await prisma.werkitem.deleteMany({});

  // Teams, versies, werkindelingen
  await prisma.team.deleteMany({});
  await prisma.logEntry.deleteMany({});
  await prisma.versie.deleteMany({});
  await prisma.werkindelingSnapshot.deleteMany({});
  await prisma.werkindeling.deleteMany({});

  // Kaders
  await prisma.kaders.deleteMany({});

  // Spelers en staf (na alle relaties)
  await prisma.speler.deleteMany({});
  await prisma.stafToewijzing.deleteMany({});
  await prisma.staf.deleteMany({});

  // Lid-gerelateerd (monitor-tabellen)
  await prisma.lidFoto.deleteMany({});
  await prisma.lid.deleteMany({});

  logger.info("[wipe] klaar");
}

// Sta directe aanroep toe voor veiligheidstest
if (process.argv[1] && process.argv[1].endsWith("wipe.ts")) {
  wipeAll()
    .then(() => logger.info("[wipe] standalone run klaar"))
    .catch((e: Error) => {
      logger.error("[wipe] mislukt:", e.message);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
