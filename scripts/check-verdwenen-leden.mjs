/**
 * Onderzoekt de leden die wel actief zijn in de database maar niet meer in Sportlink.
 * Toont herkomst, lidmaatschapsduur en competitiehistorie — geen geboortedatum of adres.
 *
 * Gebruik: node scripts/check-verdwenen-leden.mjs
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../packages/database/.env") });

const REL_CODES = ["NNJ36T7", "NNJ36W8", "NNJ36M8"];

const out = (s) => process.stdout.write(s + "\n");

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: false });
await client.connect();

const { rows: leden } = await client.query(
  `SELECT rel_code, roepnaam, voorletters, tussenvoegsel, achternaam, lidsoort, geslacht,
          geboortejaar, lid_sinds::text, registratie_datum::text, afmelddatum::text
     FROM leden WHERE rel_code = ANY($1) ORDER BY achternaam`,
  [REL_CODES]
);

for (const l of leden) {
  out(
    `\n### ${l.rel_code} — ${[l.roepnaam, l.tussenvoegsel, l.achternaam].filter(Boolean).join(" ")}`
  );
  out(
    `  voorletters=${l.voorletters ?? "-"}  lidsoort=${l.lidsoort ?? "-"}  geslacht=${l.geslacht ?? "-"}  geboortejaar=${l.geboortejaar ?? "-"}`
  );
  out(
    `  lid_sinds=${l.lid_sinds ?? "-"}  registratie=${l.registratie_datum ?? "-"}  afmelddatum=${l.afmelddatum ?? "-"}`
  );

  const { rows: cs } = await client.query(
    `SELECT seizoen, competitie, team, bron FROM competitie_spelers
      WHERE rel_code = $1 ORDER BY seizoen DESC, competitie`,
    [l.rel_code]
  );
  out(`  competitie_spelers: ${cs.length} rijen`);
  for (const r of cs.slice(0, 8))
    out(`    ${r.seizoen}  ${r.competitie}  ${r.team}  (bron: ${r.bron})`);

  const { rows: sp } = await client.query(
    `SELECT id, roepnaam, achternaam, status::text FROM "Speler" WHERE id = $1`,
    [l.rel_code]
  );
  out(
    `  Speler-record (Team-Indeling): ${sp.length > 0 ? sp[0].roepnaam + " " + sp[0].achternaam + " (" + sp[0].status + ")" : "geen"}`
  );
}

// Zijn er meer leden zonder enige competitiehistorie? Dan is 'foutief record' een patroon.
const { rows: weesjes } = await client.query(
  `SELECT COUNT(*)::int AS aantal FROM leden l
    WHERE l.afmelddatum IS NULL
      AND NOT EXISTS (SELECT 1 FROM competitie_spelers c WHERE c.rel_code = l.rel_code)`
);
out(`\n### Actieve leden zonder enige competitiehistorie: ${weesjes[0].aantal}`);

await client.end();
