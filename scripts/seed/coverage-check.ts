#!/usr/bin/env tsx
/**
 * Vergelijkt Prisma enum-leden met seed-coverage.
 * Faalt met exit 1 + concrete diff als seed niet alle enum-waardes dekt.
 * Draait in CI vóór seed-run zodat nightly direct faalt bij drift.
 *
 * Intentioneel NIET volledig gedekt (geen mock-fixtures nodig):
 * - WerkindelingStatus (GEARCHIVEERD, DEFINITIEF) — alleen ACTIEF relevant voor E2E-tests
 * - ValidatieStatus (ONBEKEND) — computed, niet seedable
 * - OWTeamType — zit op OWTeam (monitor-data), niet op TI-Studio Team
 */
import { SpelerStatus, Kleur, TeamCategorie, TeamType } from "@oranje-wit/database";
import { TEAM_DEFS } from "./seed-teams";
import { STATUS_FIXTURES } from "./seed-status-edge";
import { LEEFTIJD_FIXTURES } from "./seed-leeftijd-edge";
import { logger } from "@oranje-wit/types";

interface CoverageGap {
  enum: string;
  ontbreekt: string[];
}

function checkEnumCoverage<T extends Record<string, string>>(
  naam: string,
  enumObj: T,
  fixtureValues: string[]
): CoverageGap | null {
  const verwacht = Object.values(enumObj);
  const ontbreekt = verwacht.filter((v) => !fixtureValues.includes(v));
  if (ontbreekt.length === 0) return null;
  return { enum: naam, ontbreekt };
}

async function main(): Promise<void> {
  const gaps: (CoverageGap | null)[] = [];

  // SpelerStatus — verwacht 1 fixture per enum-waarde in seed-status-edge
  gaps.push(
    checkEnumCoverage(
      "SpelerStatus",
      SpelerStatus,
      STATUS_FIXTURES.map((f) => f.status)
    )
  );

  // Kleur — verwacht in TEAM_DEFS minimaal 1 team per kleur (PAARS=Kangoeroes etc.)
  gaps.push(
    checkEnumCoverage(
      "Kleur",
      Kleur,
      TEAM_DEFS.filter((t) => t.kleur).map((t) => t.kleur!)
    )
  );

  // TeamCategorie — verwacht minstens 1 team per categorie
  gaps.push(
    checkEnumCoverage(
      "TeamCategorie",
      TeamCategorie,
      TEAM_DEFS.map((t) => t.categorie)
    )
  );

  // TeamType — verwacht minstens 1 team per type
  gaps.push(
    checkEnumCoverage(
      "TeamType",
      TeamType,
      TEAM_DEFS.map((t) => t.teamType)
    )
  );

  // Filter null entries
  const echteGaps = gaps.filter((g): g is CoverageGap => g !== null);

  if (echteGaps.length === 0) {
    logger.info("[coverage-check] ✅ alle enums gedekt");
    return;
  }

  logger.error("[coverage-check] ❌ dekking-gaten gevonden:");
  for (const gap of echteGaps) {
    logger.error(`  ${gap.enum}: mist fixtures voor ${gap.ontbreekt.join(", ")}`);
  }
  logger.error("");
  logger.error("Actie: voeg fixtures toe aan docs/kennis/edge-case-testdata.md");
  logger.error("       én aan scripts/seed/seed-*.ts");
  logger.error("       (zie 'Mutatie-respons protocol' in catalogus)");
  process.exit(1);
}

main().catch((error) => {
  logger.error("[coverage-check] crash:", error);
  process.exit(1);
});
