/**
 * dry-run-source-counts.ts
 *
 * Telt rijen per significante tabel in de productie-bron — zonder iets
 * te schrijven. Geeft Antjan zicht op de omvang voordat seed-test-db
 * de test-database vult.
 *
 * Gebruik:
 *   pnpm tsx -r dotenv/config scripts/dry-run-source-counts.ts
 *
 * Vereist alleen DATABASE_URL_SOURCE in .env.local.
 */

import "dotenv/config";
import { Pool } from "pg";
import { logger } from "@oranje-wit/types";

const TABELLEN: { naam: string; schema: string }[] = [
  // Monitor-laag (snake_case via @@map)
  { naam: "leden", schema: "monitor" },
  { naam: "lid_fotos", schema: "monitor" },
  { naam: "competitie_spelers", schema: "monitor" },
  { naam: "seizoenen", schema: "monitor" },
  { naam: "teams", schema: "monitor" },
  { naam: "team_aliases", schema: "monitor" },
  { naam: "team_periodes", schema: "monitor" },
  { naam: "ledenverloop", schema: "monitor" },
  { naam: "cohort_seizoenen", schema: "monitor" },
  { naam: "signalering", schema: "monitor" },
  { naam: "sportlink_notificaties", schema: "monitor" },
  // TI Studio-laag (PascalCase, public schema)
  { naam: "Speler", schema: "ti-studio" },
  { naam: "Staf", schema: "ti-studio" },
  { naam: "Team", schema: "ti-studio" },
  { naam: "TeamSpeler", schema: "ti-studio" },
  { naam: "TeamStaf", schema: "ti-studio" },
  { naam: "Versie", schema: "ti-studio" },
  { naam: "Werkindeling", schema: "ti-studio" },
  { naam: "WhatIf", schema: "ti-studio" },
  { naam: "WhatIfTeam", schema: "ti-studio" },
  { naam: "Kaders", schema: "ti-studio" },
  { naam: "KadersSpeler", schema: "ti-studio" },
  { naam: "Werkitem", schema: "ti-studio" },
  { naam: "WerkitemToelichting", schema: "ti-studio" },
  { naam: "Evaluatie", schema: "ti-studio" },
  { naam: "EvaluatieRonde", schema: "ti-studio" },
  { naam: "EvaluatieUitnodiging", schema: "ti-studio" },
  { naam: "SpelerZelfEvaluatie", schema: "ti-studio" },
  { naam: "ScoutingRapport", schema: "ti-studio" },
  { naam: "ScoutingVerzoek", schema: "ti-studio" },
  { naam: "Aanmelding", schema: "ti-studio" },
  { naam: "User", schema: "auth" },
  { naam: "Gebruiker", schema: "auth" },
  { naam: "AiGesprek", schema: "ai" },
  { naam: "AiBericht", schema: "ai" },
];

async function tellen(): Promise<void> {
  const url = process.env.DATABASE_URL_SOURCE;
  if (!url) {
    logger.error("DATABASE_URL_SOURCE niet gezet in .env.local");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url, max: 2 });

  try {
    logger.info("=== Dry-run: telling per significante tabel ===");
    let totaal = 0;
    const resultaten: { schema: string; tabel: string; aantal: number; error?: string }[] = [];

    for (const t of TABELLEN) {
      try {
        const res = await pool.query(`SELECT COUNT(*)::int AS n FROM "${t.naam}"`);
        const n = res.rows[0]?.n ?? 0;
        resultaten.push({ schema: t.schema, tabel: t.naam, aantal: n });
        totaal += n;
      } catch (err) {
        resultaten.push({
          schema: t.schema,
          tabel: t.naam,
          aantal: 0,
          error: err instanceof Error ? err.message.split("\n")[0] : String(err),
        });
      }
    }

    // Geslachtsverdeling Lid (cruciaal voor werkindeling-realisme)
    const geslachten = await pool.query(`
      SELECT geslacht, COUNT(*)::int AS n FROM leden GROUP BY geslacht ORDER BY geslacht
    `);

    // Korfballeeftijd-verdeling per geboortejaar (laatste 25 jaar)
    const jaarVerdeling = await pool.query(`
      SELECT geboortejaar, COUNT(*)::int AS n
      FROM leden
      WHERE geboortejaar IS NOT NULL AND geboortejaar >= EXTRACT(YEAR FROM CURRENT_DATE) - 25
      GROUP BY geboortejaar
      ORDER BY geboortejaar DESC
    `);

    // Resultaten printen, gegroepeerd per schema
    let huidigSchema = "";
    for (const r of resultaten) {
      if (r.schema !== huidigSchema) {
        process.stdout.write(`\n--- ${r.schema} ---\n`);
        huidigSchema = r.schema;
      }
      const status = r.error ? "ERR" : "OK ";
      process.stdout.write(
        `  ${status}  ${r.tabel.padEnd(30)} ${String(r.aantal).padStart(6)}${r.error ? "  " + r.error : ""}\n`
      );
    }

    process.stdout.write(`\nTotaal (alleen succesvolle counts): ${totaal}\n`);

    process.stdout.write("\n--- Geslachtsverdeling Lid ---\n");
    for (const g of geslachten.rows) {
      process.stdout.write(`  ${g.geslacht ?? "?"}: ${g.n}\n`);
    }

    process.stdout.write("\n--- Geboortejaar Lid (laatste 25 jaar) ---\n");
    for (const j of jaarVerdeling.rows) {
      const bar = "█".repeat(Math.min(50, Math.round(j.n / 2)));
      process.stdout.write(`  ${j.geboortejaar}: ${String(j.n).padStart(4)}  ${bar}\n`);
    }
  } finally {
    await pool.end();
  }
}

tellen().catch((err: unknown) => {
  logger.error("dry-run faalde:", err);
  process.exit(1);
});
