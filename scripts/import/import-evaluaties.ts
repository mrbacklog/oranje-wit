/**
 * Import evaluaties uit Lovable evaluatie-app JSON exports
 * naar de gedeelde Railway PostgreSQL database.
 *
 * Gebruik: npx tsx scripts/import/import-evaluaties.ts [pad-naar-json]
 *
 * Zonder pad: zoekt het nieuwste bestand in data/evaluaties/
 */

import "dotenv/config";
import fs from "fs";
import path from "path";

// Prisma client direct aanmaken (CLI script, niet via Next.js)
import { PrismaClient } from "../../packages/database/src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// --- Types voor de Lovable export JSON ---

interface EvaluatieExport {
  ronde: {
    naam: string;
    deadline: string;
    status: string;
    aangemaakt: string;
  };
  teams: TeamEvaluatie[];
}

interface TeamEvaluatie {
  team_naam: string;
  staf: { naam: string; email: string; type: string }[];
  spelers: { naam: string; geslacht: string }[];
  evaluaties: TrainerEvaluatie[];
}

interface TrainerEvaluatie {
  trainer_naam: string;
  ingediend_op: string;
  plezier: { score: number; toelichting: string };
  ontwikkeling: { score: number; toelichting: string };
  prestatie: { score: number; toelichting: string };
  opmerkingen: string | null;
  coordinator_memo: string | null;
  speler_beoordelingen: SpelerBeoordeling[];
}

interface SpelerBeoordeling {
  naam: string;
  niveau: number;
  inzet: number;
  groei: number;
  opmerkingen: string | null;
}

// --- Helpers ---

function extractSeizoen(rondeNaam: string): string {
  // "2025-2026 Evaluatieronde 1" → "2025-2026"
  const match = rondeNaam.match(/(\d{4}-\d{4})/);
  if (!match) throw new Error(`Kan seizoen niet extraheren uit: ${rondeNaam}`);
  return match[1];
}

function normalizeName(naam: string): string {
  return naam.trim().toLowerCase().replace(/\s+/g, " ");
}

async function findSpelerByName(
  naam: string,
  spelersMap: Map<string, { id: string; roepnaam: string; achternaam: string }>
): Promise<string | null> {
  const normalized = normalizeName(naam);

  // Exacte match op "roepnaam achternaam"
  for (const [, speler] of spelersMap) {
    const fullName = normalizeName(`${speler.roepnaam} ${speler.achternaam}`);
    if (fullName === normalized) return speler.id;
  }

  // Probeer zonder tussenvoegsel: "Robin van den Berg" vs "Robin Berg" niet matchen
  // maar "Robin Zwanenburg" moet "Robin Zwanenburg" matchen
  // Probeer achternaam-match als roepnaam overeenkomt
  const parts = normalized.split(" ");
  const voornaam = parts[0];
  const achternaam = parts[parts.length - 1];

  for (const [, speler] of spelersMap) {
    const spelerVoornaam = normalizeName(speler.roepnaam);
    const spelerAchternaam = normalizeName(speler.achternaam);
    if (spelerVoornaam === voornaam && spelerAchternaam === achternaam) {
      return speler.id;
    }
  }

  return null;
}

// --- Hoofdlogica ---

async function importEvaluaties(jsonPath: string) {
  console.log(`\nEvaluaties importeren uit: ${jsonPath}\n`);

  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data: EvaluatieExport = JSON.parse(raw);

  const seizoen = extractSeizoen(data.ronde.naam);
  console.log(`Seizoen: ${seizoen}`);
  console.log(`Ronde: ${data.ronde.naam}`);
  console.log(`Teams: ${data.teams.length}\n`);

  // Laad alle spelers voor naam-matching
  const spelers = await prisma.speler.findMany({
    select: { id: true, roepnaam: true, achternaam: true },
  });
  const spelersMap = new Map(spelers.map((s) => [s.id, s]));
  console.log(`${spelers.length} spelers in database voor matching\n`);

  let imported = 0;
  let skipped = 0;
  const unmatched: string[] = [];

  for (const team of data.teams) {
    console.log(`--- ${team.team_naam} ---`);

    for (const evaluatie of team.evaluaties) {
      for (const beoordeling of evaluatie.speler_beoordelingen) {
        const spelerId = await findSpelerByName(beoordeling.naam, spelersMap);

        if (!spelerId) {
          unmatched.push(`${beoordeling.naam} (${team.team_naam})`);
          skipped++;
          continue;
        }

        const scores = {
          niveau: beoordeling.niveau,
          inzet: beoordeling.inzet,
          groei: beoordeling.groei,
          team_plezier: evaluatie.plezier.score,
          team_plezier_toelichting: evaluatie.plezier.toelichting,
          team_ontwikkeling: evaluatie.ontwikkeling.score,
          team_ontwikkeling_toelichting: evaluatie.ontwikkeling.toelichting,
          team_prestatie: evaluatie.prestatie.score,
          team_prestatie_toelichting: evaluatie.prestatie.toelichting,
          team_naam: team.team_naam,
        };

        await prisma.evaluatie.upsert({
          where: {
            spelerId_seizoen: { spelerId, seizoen },
          },
          create: {
            spelerId,
            seizoen,
            scores,
            opmerking: beoordeling.opmerkingen,
            coach: evaluatie.trainer_naam,
          },
          update: {
            scores,
            opmerking: beoordeling.opmerkingen,
            coach: evaluatie.trainer_naam,
          },
        });

        imported++;
      }
    }
  }

  console.log(`\n=== Resultaat ===`);
  console.log(`Geïmporteerd: ${imported}`);
  console.log(`Overgeslagen: ${skipped}`);

  if (unmatched.length > 0) {
    console.log(`\nNiet-gematchte spelers (${unmatched.length}):`);
    for (const naam of [...new Set(unmatched)]) {
      console.log(`  - ${naam}`);
    }
  }

  await prisma.$disconnect();
  await pool.end();
}

// --- CLI ---

async function main() {
  const explicitPath = process.argv[2];

  let jsonPath: string;

  if (explicitPath) {
    jsonPath = path.resolve(explicitPath);
  } else {
    // Zoek nieuwste JSON in data/evaluaties/
    const dir = path.resolve(__dirname, "../../data/evaluaties");
    if (!fs.existsSync(dir)) {
      console.error(`Map niet gevonden: ${dir}`);
      process.exit(1);
    }

    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse();

    if (files.length === 0) {
      console.error(`Geen JSON bestanden gevonden in ${dir}`);
      process.exit(1);
    }

    jsonPath = path.join(dir, files[0]);
  }

  if (!fs.existsSync(jsonPath)) {
    console.error(`Bestand niet gevonden: ${jsonPath}`);
    process.exit(1);
  }

  await importEvaluaties(jsonPath);
}

main().catch((err) => {
  console.error("Import fout:", err);
  process.exit(1);
});
