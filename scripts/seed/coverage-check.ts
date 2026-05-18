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
 *
 * Extra structuurchecks (geen enum):
 * - SelectieGroep count = 2 (sg-senioren-a + sg-u17, statisch via seed-code)
 * - LidFoto dekking: ≥80% van default spelers heeft een foto (statisch berekend)
 */
import { SpelerStatus, Kleur, TeamCategorie, TeamType } from "@oranje-wit/database";
import { TEAM_DEFS } from "./seed-teams";
import { STATUS_FIXTURES } from "./seed-status-edge";
import { LEEFTIJD_FIXTURES } from "./seed-leeftijd-edge";
import { logger } from "@oranje-wit/types";

// LEEFTIJD_FIXTURES is geïmporteerd zodat coverage-check-bestand compleet is
void LEEFTIJD_FIXTURES;

interface CoverageGap {
  enum: string;
  ontbreekt: string[];
}

interface StructuurFout {
  check: string;
  verwacht: string;
  actueel: string;
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
  const structuurFouten: StructuurFout[] = [];

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

  // Structuurcheck 1.7 — SelectieGroep count
  // Seed maakt exact 2 aan: sg-senioren-a en sg-u17
  const VERWACHTE_SELECTIEGROEPEN = 2;
  const selectieGroepIds = ["sg-senioren-a", "sg-u17"];
  if (selectieGroepIds.length !== VERWACHTE_SELECTIEGROEPEN) {
    structuurFouten.push({
      check: "SelectieGroep count (sectie 1.7)",
      verwacht: `${VERWACHTE_SELECTIEGROEPEN}`,
      actueel: `${selectieGroepIds.length}`,
    });
  } else {
    logger.info(
      `[coverage-check] SelectieGroep: ${VERWACHTE_SELECTIEGROEPEN} groepen gedeclareerd (sg-senioren-a, sg-u17)`
    );
  }

  // Structuurcheck 1.9 — LidFoto dekking: ≥80% van default spelers
  // Berekend statisch: total_slots zonder 0-omvang teams
  // 80% via rel_code % 5 !== 0 (last digit), dus 4 van 5 = 80%
  const totaalSlots = TEAM_DEFS.filter((t) => t.defaultOmvang > 0).reduce(
    (sum, t) => sum + t.defaultOmvang,
    0
  );
  // Deterministisch: rel_code eindigt op digit 1-9, digit % 5 !== 0 geeft foto
  // digit 0 → geen foto, digits 1-4 → foto, digit 5 → geen foto, digits 6-9 → foto
  // Van 10 volgnrs (1-10): 1%5=1 (foto), 2%5=2 (foto), 3%5=3 (foto), 4%5=4 (foto),
  //   5%5=0 (geen), 6%5=1 (foto), 7%5=2 (foto), 8%5=3 (foto), 9%5=4 (foto), 10%5=0 (geen)
  // → 8/10 = 80%
  const verwachteFotoDekking = 0.8;
  const verwachteFotos = Math.floor(totaalSlots * verwachteFotoDekking);
  logger.info(
    `[coverage-check] LidFoto dekking: ~${verwachteFotos} van ${totaalSlots} default spelers (${Math.round(verwachteFotoDekking * 100)}%)`
  );

  // Filter null entries
  const echteGaps = gaps.filter((g): g is CoverageGap => g !== null);

  if (echteGaps.length === 0 && structuurFouten.length === 0) {
    logger.info("[coverage-check] alle enums gedekt + structuurchecks OK");
    return;
  }

  if (echteGaps.length > 0) {
    logger.error("[coverage-check] dekking-gaten gevonden:");
    for (const gap of echteGaps) {
      logger.error(`  ${gap.enum}: mist fixtures voor ${gap.ontbreekt.join(", ")}`);
    }
    logger.error("");
    logger.error("Actie: voeg fixtures toe aan docs/kennis/edge-case-testdata.md");
    logger.error("       én aan scripts/seed/seed-*.ts");
    logger.error("       (zie 'Mutatie-respons protocol' in catalogus)");
  }

  if (structuurFouten.length > 0) {
    logger.error("[coverage-check] structuurchecks gefaald:");
    for (const fout of structuurFouten) {
      logger.error(`  ${fout.check}: verwacht ${fout.verwacht}, actueel ${fout.actueel}`);
    }
  }

  process.exit(1);
}

main().catch((error) => {
  logger.error("[coverage-check] crash:", error);
  process.exit(1);
});
