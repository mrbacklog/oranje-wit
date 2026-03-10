/**
 * Database seeding voor E2E tests in CI.
 *
 * Maakt minimale testdata aan zodat de apps
 * kunnen laden zonder lege-state fouten.
 *
 * Draai met: npx tsx e2e/fixtures/seed.ts
 */
import { PrismaClient } from "@oranje-wit/database";

const prisma = new PrismaClient();

async function seed() {
  // Maak een test-seizoen aan
  await prisma.seizoen.upsert({
    where: { seizoen: "2025-2026" },
    update: {},
    create: {
      seizoen: "2025-2026",
      jaar_start: 2025,
      jaar_eind: 2026,
    },
  });

  // Maak een test-blauwdruk aan voor team-indeling
  await prisma.blauwdruk.upsert({
    where: { seizoen: "2025-2026" },
    update: {},
    create: {
      seizoen: "2025-2026",
      naam: "Veld Voorjaar 2026",
      status: "CONCEPT",
    },
  });

  console.info("E2E seed data aangemaakt");
}

seed()
  .catch((e) => {
    console.error("Seed fout:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
