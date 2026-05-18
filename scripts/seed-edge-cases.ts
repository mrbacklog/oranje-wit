#!/usr/bin/env tsx
/**
 * Seed-script voor edge-case test-data op oranjewit-test.
 * Wipe + reseed naar de ideale state uit docs/kennis/edge-case-testdata.md.
 *
 * Gebruik:
 *   pnpm tsx scripts/seed-edge-cases.ts             # skip als SHA gelijk
 *   pnpm tsx scripts/seed-edge-cases.ts --force     # forceer volle reseed
 *
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
import { berekenSeedSha, getOpgeslagenSha, slaSeedShaOp } from "./seed/seed-state";

const force = process.argv.includes("--force");

async function tijd<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const t0 = Date.now();
  const resultaat = await fn();
  const ms = Date.now() - t0;
  logger.info(`[seed] ${label}: ${ms}ms (${(ms / 1000).toFixed(1)}s)`);
  return resultaat;
}

async function main(): Promise<void> {
  const start = Date.now();
  logger.info("[seed-edge-cases] starten");

  // ─── SHA-fingerprint check ──────────────────────────────────────────────
  const huidigeSha = berekenSeedSha();
  logger.info(`[seed] fingerprint: ${huidigeSha.slice(0, 12)}...`);

  if (!force) {
    const opgeslagenSha = await getOpgeslagenSha();
    if (opgeslagenSha === huidigeSha) {
      logger.info(
        `[seed-edge-cases] SKIP — fingerprint gelijk aan vorige run. ` +
          `Gebruik --force om alsnog te reseeden.`
      );
      return;
    }
    logger.info(
      `[seed] fingerprint mismatch (${opgeslagenSha?.slice(0, 12) ?? "leeg"} → ` +
        `${huidigeSha.slice(0, 12)}) — volle reseed`
    );
  } else {
    logger.info("[seed] --force vlag actief — full reseed");
  }

  // ─── Full reseed met per-sectie timing ──────────────────────────────────
  await tijd("wipeAll", () => wipeAll());
  resetUniekeNamen();

  const { actieveVersieId } = await tijd("werkindeling+versies", () => seedWerkindelingEnVersies());

  await tijd("teams (25)", () => seedTeams(actieveVersieId));
  await tijd("default-spelers (~150)", () => seedDefaultSpelers());
  await tijd("status-edge (10)", () => seedStatusEdge());
  await tijd("leeftijd-edge (8)", () => seedLeeftijdEdge());
  await tijd("data-incomplete (3)", () => seedDataIncomplete());
  await tijd("multi-team (2)", () => seedMultiTeam());
  await tijd("selectiegroepen", () => seedSelectiegroepen());

  const kaders = await prisma.kaders.findFirstOrThrow({
    where: { isWerkseizoen: true },
    select: { id: true },
  });
  await tijd("kaders-spelers", () => seedKadersSpelers(kaders.id));
  await tijd("staf (100)", () => seedStaf(100));
  await tijd("fotos", () => seedFotos());
  await tijd("posities", () => seedPosities());

  // Sla nieuwe SHA op zodat volgende run kan skippen
  await tijd("seed-state opslaan", () => slaSeedShaOp(huidigeSha));

  const duur = Date.now() - start;
  logger.info(`[seed-edge-cases] klaar in ${duur}ms (${(duur / 1000).toFixed(1)}s)`);
}

main()
  .catch((error: Error) => {
    logger.error("[seed-edge-cases] mislukt:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
