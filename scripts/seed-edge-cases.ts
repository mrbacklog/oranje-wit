#!/usr/bin/env tsx
/**
 * Seed-script voor edge-case test-data op oranjewit-test.
 * Wipe + reseed naar de ideale state uit docs/kennis/edge-case-testdata.md.
 *
 * Gebruik: pnpm tsx scripts/seed-edge-cases.ts
 * Env: DATABASE_URL moet 'test' bevatten (anders weigert wipe).
 */
import { logger } from "@oranje-wit/types";
import { prisma } from "./seed/types";
import { wipeAll } from "./seed/wipe";
import { seedWerkindelingEnVersies } from "./seed/seed-whatif";
import { seedTeams } from "./seed/seed-teams";
import { seedDefaultSpelers } from "./seed/seed-default-spelers";
import { seedStatusEdge } from "./seed/seed-status-edge";
import { seedLeeftijdEdge } from "./seed/seed-leeftijd-edge";
import { seedDataIncomplete } from "./seed/seed-data-incomplete";
import { seedMultiTeam } from "./seed/seed-multi-team";
import { seedSelectiegroepen } from "./seed/seed-selectiegroepen";
import { seedKadersSpelers } from "./seed/seed-kaders-spelers";
import { seedStaf } from "./seed/seed-staf";
import { seedFotos } from "./seed/seed-fotos";
import { seedPosities } from "./seed/seed-posities";
import { resetUniekeNamen } from "./seed/namen-pool";

async function main(): Promise<void> {
  const start = Date.now();
  logger.info("[seed-edge-cases] starten");

  // Sectie 0: opschonen + uniciteit-Set resetten zodat alle namen cross-script uniek zijn
  await wipeAll();
  resetUniekeNamen();

  // Sectie 1.7: werkindeling + versies (vóór teams — teams hangen aan versie)
  const { actieveVersieId } = await seedWerkindelingEnVersies();

  // Sectie 0: 25 teams in actieve versie
  await seedTeams(actieveVersieId);

  // Sectie 0: default spelers per team (~150 spelers)
  await seedDefaultSpelers();

  // Sectie 1.3: 10 status-fixtures
  await seedStatusEdge();

  // Sectie 1.4: 8 leeftijdsgrens-fixtures
  await seedLeeftijdEdge();

  // Sectie 1.5: 3 data-incomplete fixtures
  await seedDataIncomplete();

  // Sectie 1.6: 2 multi-team illegal fixtures
  await seedMultiTeam();

  // Sectie 1.7: selectiegroepen (na spelers — spelers moeten bestaan)
  await seedSelectiegroepen();

  // Sectie 1.8: KadersSpeler-records voor alle spelers in het actieve Kaders.
  // Vereist voor de spelerspool-query op /indeling.
  const kaders = await prisma.kaders.findFirstOrThrow({
    where: { isWerkseizoen: true },
    select: { id: true },
  });
  await seedKadersSpelers(kaders.id);

  // Sectie 1.8b: 100 stafleden (onafhankelijk van spelers/teams)
  await seedStaf(100);

  // Sectie 1.9: fictieve profielfoto's (na alle spelers, voor cleanup)
  await seedFotos();

  // Sectie 1.11: canvas-posities voor teams + selectiegroepen (logische TC-layout)
  await seedPosities();

  const duur = Date.now() - start;
  logger.info(`[seed-edge-cases] klaar in ${duur}ms`);
}

main()
  .catch((error: Error) => {
    logger.error("[seed-edge-cases] mislukt:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
