/**
 * Database seeding voor E2E tests.
 *
 * Maakt een representatieve dataset aan:
 * - 14 teams (senioren + U19/U17/U15)
 * - ~129 spelers met TST-prefix rel_codes
 * - 2 seizoenen (huidig + vorig, voor verloop)
 * - Ledenverloop, cohorten, signaleringen
 * - 1 blauwdruk voor team-indeling
 *
 * Draai met: pnpm seed  (of npx tsx e2e/fixtures/seed.ts)
 */
import { prisma } from "../../packages/database/src/index";
import { runSeed } from "../../packages/test-utils/src/seed/index";

runSeed(prisma as Parameters<typeof runSeed>[0])
  .catch((e: unknown) => {
    console.error("Seed fout:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
