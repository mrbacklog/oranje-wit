/**
 * Seed-state — SHA-fingerprint van alle seed-bronnen + opslag in test-DB.
 *
 * Idee: bij elke CI-run berekenen we een hash over alle seed-scripts + schema.
 * Als de hash overeenkomt met wat in de test-DB staat, slaan we de full reseed
 * over (wipe + 25 min werk). Bij wijziging aan welke seed-bron dan ook: full
 * reseed.
 *
 * Tabel wordt lazy aangemaakt (CREATE TABLE IF NOT EXISTS) — geen migratie
 * nodig, blijft buiten Prisma-schema. Single-row tabel met id = "singleton".
 */
import { createHash } from "crypto";
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { prisma } from "./types";

const BRONNEN_ROOTS = [
  "scripts/seed",
  "scripts/seed-edge-cases.ts",
  "packages/database/prisma/schema.prisma",
];

function leesBestanden(pad: string): string[] {
  const stat = statSync(pad);
  if (stat.isFile()) return [pad];
  if (!stat.isDirectory()) return [];
  const resultaat: string[] = [];
  for (const entry of readdirSync(pad)) {
    if (entry.startsWith(".")) continue;
    const sub = join(pad, entry);
    const subStat = statSync(sub);
    if (subStat.isDirectory()) {
      resultaat.push(...leesBestanden(sub));
    } else if (entry.endsWith(".ts") || entry.endsWith(".prisma")) {
      resultaat.push(sub);
    }
  }
  return resultaat;
}

/**
 * SHA-256 over alle seed-bronnen (scripts/seed/**, scripts/seed-edge-cases.ts,
 * Prisma-schema). Bestanden worden gesorteerd voor stabiele output.
 */
export function berekenSeedSha(): string {
  const bronnen: string[] = [];
  for (const root of BRONNEN_ROOTS) {
    try {
      bronnen.push(...leesBestanden(root));
    } catch {
      // Bron ontbreekt — sla over (bv. lokale dev zonder packages)
    }
  }
  bronnen.sort();
  const hash = createHash("sha256");
  for (const bestand of bronnen) {
    hash.update(bestand);
    hash.update("\0");
    hash.update(readFileSync(bestand));
  }
  return hash.digest("hex");
}

async function ensureTable(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS seed_state (
      id TEXT PRIMARY KEY,
      sha TEXT NOT NULL,
      geseed_op TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

/**
 * Haal de opgeslagen SHA op (of null als nooit geseed).
 */
export async function getOpgeslagenSha(): Promise<string | null> {
  await ensureTable();
  const rows = await prisma.$queryRawUnsafe<Array<{ sha: string }>>(
    `SELECT sha FROM seed_state WHERE id = 'singleton'`
  );
  return rows[0]?.sha ?? null;
}

/**
 * Sla de huidige SHA op (upsert).
 */
export async function slaSeedShaOp(sha: string): Promise<void> {
  await prisma.$executeRawUnsafe(
    `
    INSERT INTO seed_state (id, sha, geseed_op)
    VALUES ('singleton', $1, NOW())
    ON CONFLICT (id) DO UPDATE SET sha = EXCLUDED.sha, geseed_op = NOW()
    `,
    sha
  );
}

/**
 * Wis de opgeslagen SHA — forceert volgende run tot volle reseed.
 * Aangeroepen door wipeAll() zodat een handmatige wipe de fingerprint reset.
 */
export async function wisSeedSha(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM seed_state WHERE id = 'singleton'`);
  } catch {
    // Tabel bestaat nog niet — geen probleem
  }
}
