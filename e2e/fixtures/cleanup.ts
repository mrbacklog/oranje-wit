/**
 * Verwijdert alle seed-data (TST-prefix) uit de database.
 * Draai met: pnpm seed:clean  (of npx tsx e2e/fixtures/cleanup.ts)
 */
import { prisma } from "../../packages/database/src/index";
import { cleanupSeed } from "../../packages/test-utils/src/seed/index";

cleanupSeed(prisma as Parameters<typeof cleanupSeed>[0])
  .catch((e: unknown) => {
    console.error("Cleanup fout:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
