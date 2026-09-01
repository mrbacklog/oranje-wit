/**
 * Voegt de handmatig aangemaakte spelers samen met hun echte rel_code, en haalt
 * gestopte spelers uit de selectiegroepen.
 *
 * De handmatige Speler-records hebben geen tegenhanger met de echte rel_code, en alle
 * foreign keys naar "Speler" staan op ON UPDATE CASCADE. Daarom hernoemen we het record
 * (id → rel_code) in plaats van te verhuizen-en-verwijderen: alle verwijzingen
 * (selectie, kaders, werkbord) gaan automatisch mee.
 *
 * Daarna worden de stamgegevens ververst uit de leden-tabel, die nu Sportlink volgt.
 *
 * Draait standaard als DRY-RUN. Toepassen: node scripts/merge-handmatige-spelers.mjs --apply
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../packages/database/.env") });

const APPLY = process.argv.includes("--apply");
const out = (s) => process.stdout.write(s + "\n");

const PAREN = [
  { handmatig: "HANDMATIG-cb5a6e89bd374005bb90434521b470b5", echt: "NJZ05M8" },
  { handmatig: "HANDMATIG-990923e8070f438faf4b144dd6bb5f76", echt: "NJY07J2" },
  { handmatig: "HANDMATIG-b27b78340f964cdd909fc4bae5c790a2", echt: "NKL26W4" },
  { handmatig: "HANDMATIG-96fda18ddeaf4213aa45e02af62c8225", echt: "NKR88F7" },
];

/** Gestopte spelers die nog in een selectiegroep staan. */
const UIT_SELECTIE = [
  { relCode: "NLX00H0", reden: "afgemeld per 2026-07-13" },
  { relCode: "NJY99R9", reden: "gestopt, terug naar oude vereniging" },
];

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: false });
await client.connect();

out(APPLY ? "=== TOEPASSEN ===" : "=== DRY-RUN (niets wordt gewijzigd) ===");

if (APPLY) await client.query("BEGIN");

try {
  out(`\n### Handmatige records hernoemen naar hun rel_code (${PAREN.length})`);
  for (const { handmatig, echt } of PAREN) {
    const { rows: sp } = await client.query(
      `SELECT roepnaam, achternaam, geboortejaar, status::text FROM "Speler" WHERE id = $1`,
      [handmatig]
    );
    const { rows: ld } = await client.query(
      `SELECT roepnaam, tussenvoegsel, achternaam, geboortejaar, geboortedatum, geslacht,
              lid_sinds::text AS lid_sinds
         FROM leden WHERE rel_code = $1`,
      [echt]
    );
    if (sp.length === 0) {
      out(`  ${handmatig}: geen Speler-record — overgeslagen`);
      continue;
    }
    if (ld.length === 0) {
      out(`  ${echt}: niet in leden — overgeslagen`);
      continue;
    }
    const { rows: bezet } = await client.query(`SELECT id FROM "Speler" WHERE id = $1`, [echt]);
    if (bezet.length > 0) {
      out(`  ${echt}: er bestaat al een Speler met deze rel_code — overgeslagen`);
      continue;
    }

    const l = ld[0];
    const volledigeAchternaam = [l.tussenvoegsel, l.achternaam].filter(Boolean).join(" ");
    out(
      `  ${handmatig}\n      → ${echt}  ${l.roepnaam} ${volledigeAchternaam}` +
        `  geboortejaar ${sp[0].geboortejaar} → ${l.geboortejaar}` +
        `  status ${sp[0].status} → NIEUW_DEFINITIEF`
    );

    if (APPLY) {
      await client.query(
        `UPDATE "Speler"
            SET id = $2, roepnaam = $3, achternaam = $4, geboortejaar = $5,
                geboortedatum = $6, geslacht = $7::"Geslacht", "lidSinds" = $8,
                status = 'NIEUW_DEFINITIEF'
          WHERE id = $1`,
        [
          handmatig,
          echt,
          l.roepnaam,
          volledigeAchternaam,
          l.geboortejaar,
          l.geboortedatum,
          l.geslacht,
          l.lid_sinds,
        ]
      );
    }
  }

  out(`\n### Uit de selectiegroepen halen (${UIT_SELECTIE.length})`);
  for (const { relCode, reden } of UIT_SELECTIE) {
    const { rows } = await client.query(
      `SELECT COALESCE(g.naam, 'Selectiegroep') AS groep, s.roepnaam, s.achternaam
         FROM "SelectieSpeler" ss
         JOIN "SelectieGroep" g ON g.id = ss."selectieGroepId"
         JOIN "Speler" s ON s.id = ss."spelerId"
        WHERE ss."spelerId" = $1`,
      [relCode]
    );
    if (rows.length === 0) {
      out(`  ${relCode}: staat in geen enkele selectiegroep`);
      continue;
    }
    for (const r of rows)
      out(`  ${relCode}  ${r.roepnaam} ${r.achternaam} uit "${r.groep}" — ${reden}`);
    if (APPLY) {
      await client.query(`DELETE FROM "SelectieSpeler" WHERE "spelerId" = $1`, [relCode]);
      await client.query(`UPDATE "Speler" SET status = 'GESTOPT' WHERE id = $1`, [relCode]);
    }
  }

  if (APPLY) {
    await client.query("COMMIT");
    out("\nCOMMIT — doorgevoerd.");
  } else {
    out("\nDry-run klaar. Draai met --apply om toe te passen.");
  }
} catch (e) {
  if (APPLY) await client.query("ROLLBACK");
  out(`\nFOUT — teruggedraaid: ${e.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
