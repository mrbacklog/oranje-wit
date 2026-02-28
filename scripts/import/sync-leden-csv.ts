/**
 * Synchroniseer de leden-tabel vanuit docs/alle leden.csv
 *
 * - Upsert alle leden uit het CSV
 * - Verwijder leden die niet in het CSV staan (incl. OW-xxxx)
 * - Rapporteer resultaten
 *
 * Gebruik: npx tsx scripts/import/sync-leden-csv.ts
 */

import { Pool } from "pg";
import { readFileSync } from "fs";
import { resolve } from "path";
import "dotenv/config";

const CSV_PATH = resolve(__dirname, "../../docs/alle leden.csv");

function parseCsvLine(line: string): string[] {
  const vals: string[] = [];
  let current = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuote = !inQuote;
      continue;
    }
    if (line[i] === ";" && !inQuote) {
      vals.push(current);
      current = "";
      continue;
    }
    current += line[i];
  }
  vals.push(current);
  return vals;
}

interface LidRij {
  rel_code: string;
  roepnaam: string;
  voorletters: string;
  tussenvoegsel: string | null;
  achternaam: string;
  lidsoort: string;
  geslacht: string; // "M" | "V"
  geboortedatum: string | null;
  geboortejaar: number | null;
  email: string | null;
  registratie_datum: string | null;
  lid_sinds: string | null;
  afmelddatum: string | null;
}

function parseCsv(csvContent: string): LidRij[] {
  const lines = csvContent.split("\n").filter((l) => l.trim());
  const rows = lines.slice(1).map(parseCsvLine);

  return rows.map((r) => {
    const geslachtRaw = r[7]?.trim();
    const geslacht = geslachtRaw === "Man" ? "M" : geslachtRaw === "Vrouw" ? "V" : geslachtRaw;
    const gebdat = r[8]?.trim() || null;
    const geboortejaar = gebdat ? parseInt(gebdat.split("-")[0], 10) : null;

    return {
      rel_code: r[6]?.trim(),
      roepnaam: r[1]?.trim() || "",
      voorletters: r[2]?.trim() || "",
      tussenvoegsel: r[3]?.trim() || null,
      achternaam: r[4]?.trim(),
      lidsoort: r[5]?.trim(),
      geslacht,
      geboortedatum: gebdat,
      geboortejaar,
      email: r[9]?.trim() || null,
      registratie_datum: r[14]?.trim() || null,
      lid_sinds: r[15]?.trim() || null,
      afmelddatum: r[16]?.trim() || null,
    };
  });
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const csvContent = readFileSync(CSV_PATH, "utf8");
    const leden = parseCsv(csvContent);
    console.log(`CSV gelezen: ${leden.length} leden`);

    // Huidige DB-stand
    const dbResult = await pool.query("SELECT rel_code FROM leden");
    const dbCodes = new Set(dbResult.rows.map((r: any) => r.rel_code));
    const csvCodes = new Set(leden.map((l) => l.rel_code));

    let toegevoegd = 0;
    let bijgewerkt = 0;

    // Upsert alle leden
    for (const lid of leden) {
      if (!lid.rel_code) continue;

      const isNieuw = !dbCodes.has(lid.rel_code);

      await pool.query(
        `INSERT INTO leden (rel_code, roepnaam, achternaam, tussenvoegsel, voorletters,
           geslacht, geboortejaar, geboortedatum, lid_sinds, afmelddatum, lidsoort,
           email, registratie_datum)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (rel_code) DO UPDATE SET
           roepnaam = EXCLUDED.roepnaam,
           achternaam = EXCLUDED.achternaam,
           tussenvoegsel = EXCLUDED.tussenvoegsel,
           voorletters = EXCLUDED.voorletters,
           geslacht = EXCLUDED.geslacht,
           geboortejaar = EXCLUDED.geboortejaar,
           geboortedatum = EXCLUDED.geboortedatum,
           lid_sinds = EXCLUDED.lid_sinds,
           afmelddatum = EXCLUDED.afmelddatum,
           lidsoort = EXCLUDED.lidsoort,
           email = EXCLUDED.email,
           registratie_datum = EXCLUDED.registratie_datum,
           updated_at = now()`,
        [
          lid.rel_code,
          lid.roepnaam,
          lid.achternaam,
          lid.tussenvoegsel,
          lid.voorletters,
          lid.geslacht,
          lid.geboortejaar,
          lid.geboortedatum,
          lid.lid_sinds,
          lid.afmelddatum,
          lid.lidsoort,
          lid.email,
          lid.registratie_datum,
        ]
      );

      if (isNieuw) toegevoegd++;
      else bijgewerkt++;
    }

    console.log(`Upsert klaar: ${toegevoegd} toegevoegd, ${bijgewerkt} bijgewerkt`);

    // Verwijder leden die niet in CSV staan
    const teVerwijderen = [...dbCodes].filter((c) => !csvCodes.has(c));
    if (teVerwijderen.length > 0) {
      console.log(`\nTe verwijderen (niet in CSV): ${teVerwijderen.length}`);

      for (const code of teVerwijderen) {
        // Toon wie verwijderd wordt
        const lid = await pool.query(
          "SELECT rel_code, roepnaam, achternaam FROM leden WHERE rel_code = $1",
          [code]
        );
        const info = lid.rows[0];
        console.log(`  Verwijder: ${code} ${info?.roepnaam || ""} ${info?.achternaam || ""}`);

        // Verwijder gerelateerde rijen eerst (FK constraints)
        await pool.query("DELETE FROM speler_seizoenen WHERE rel_code = $1", [code]);
        await pool.query("DELETE FROM ledenverloop WHERE rel_code = $1", [code]);
        await pool.query("DELETE FROM leden WHERE rel_code = $1", [code]);
      }

      console.log(`${teVerwijderen.length} leden verwijderd`);
    } else {
      console.log("\nGeen leden te verwijderen.");
    }

    // Eindstand
    const eindstand = await pool.query("SELECT COUNT(*)::int as n FROM leden");
    console.log(`\nEindstand: ${eindstand.rows[0].n} leden in database`);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error("FOUT:", e.message);
  process.exit(1);
});
