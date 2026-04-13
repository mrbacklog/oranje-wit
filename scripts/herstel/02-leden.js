/**
 * Herstel script: 02-leden.js
 * Herstelt de leden tabel met stamgegevens van alle 1690 leden.
 * Veilig herhaalbaar via ON CONFLICT (rel_code) DO UPDATE.
 */

require("dotenv").config({
  path: require("path").resolve(__dirname, "../../apps/web/.env"),
});
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const BATCH_SIZE = 100;

async function main() {
  const dataPath = path.resolve(__dirname, "../../data/leden/alle-leden.json");
  const raw = fs.readFileSync(dataPath, "utf-8");
  const data = JSON.parse(raw);
  const leden = data.leden;

  console.log(`Geladen: ${leden.length} leden uit ${dataPath}`);

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log("Verbonden met database.");

  let nieuw = 0;
  let bijgewerkt = 0;
  let fouten = 0;
  let overgeslagen = 0;

  const sql = `
    INSERT INTO leden (
      rel_code, roepnaam, achternaam, tussenvoegsel, voorletters,
      geslacht, geboortejaar, geboortedatum, lid_sinds, afmelddatum,
      lidsoort, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10,
      $11, NOW()
    )
    ON CONFLICT (rel_code) DO UPDATE SET
      roepnaam      = EXCLUDED.roepnaam,
      achternaam    = EXCLUDED.achternaam,
      tussenvoegsel = EXCLUDED.tussenvoegsel,
      voorletters   = EXCLUDED.voorletters,
      geslacht      = EXCLUDED.geslacht,
      geboortejaar  = EXCLUDED.geboortejaar,
      geboortedatum = EXCLUDED.geboortedatum,
      lid_sinds     = EXCLUDED.lid_sinds,
      afmelddatum   = EXCLUDED.afmelddatum,
      lidsoort      = EXCLUDED.lidsoort,
      updated_at    = NOW()
    RETURNING (xmax = 0) AS inserted
  `;

  for (let i = 0; i < leden.length; i += BATCH_SIZE) {
    const batch = leden.slice(i, i + BATCH_SIZE);

    for (const lid of batch) {
      if (!lid.rel_code) {
        console.warn(
          `WAARSCHUWING: Lid zonder rel_code overgeslagen — ${lid.roepnaam} ${lid.achternaam}`
        );
        overgeslagen++;
        continue;
      }

      try {
        const result = await client.query(sql, [
          lid.rel_code,
          lid.roepnaam,
          lid.achternaam,
          lid.tussenvoegsel ?? null,
          lid.voorletters ?? null,
          lid.geslacht,
          lid.geboortejaar ?? null,
          lid.geboortedatum ?? null,
          lid.lid_sinds ?? null,
          lid.afmelddatum ?? null,
          lid.lidsoort ?? null,
        ]);

        if (result.rows[0].inserted) {
          nieuw++;
        } else {
          bijgewerkt++;
        }
      } catch (err) {
        console.error(
          `FOUT bij rel_code ${lid.rel_code} (${lid.roepnaam} ${lid.achternaam}):`,
          err.message
        );
        fouten++;
      }
    }

    const verwerkt = Math.min(i + BATCH_SIZE, leden.length);
    console.log(
      `  Voortgang: ${verwerkt}/${leden.length} (nieuw: ${nieuw}, bijgewerkt: ${bijgewerkt}, fouten: ${fouten})`
    );
  }

  const telling = await client.query(
    "SELECT COUNT(*) as totaal, COUNT(CASE WHEN afmelddatum IS NULL THEN 1 END) as actief FROM leden"
  );
  const { totaal, actief } = telling.rows[0];

  await client.end();

  console.log("\n=== RAPPORT ===");
  console.log(`Nieuw ingevoegd:  ${nieuw}`);
  console.log(`Bijgewerkt:       ${bijgewerkt}`);
  console.log(`Overgeslagen:     ${overgeslagen}`);
  console.log(`Fouten:           ${fouten}`);
  console.log(`--- Database ---`);
  console.log(`Totaal in DB:     ${totaal}`);
  console.log(`Actief (geen afmelddatum): ${actief}`);

  if (fouten > 0) {
    console.error(`\nLET OP: ${fouten} fouten opgetreden!`);
    process.exit(1);
  } else {
    console.log("\nKLAAR — alle leden succesvol hersteld.");
  }
}

main().catch((err) => {
  console.error("Onverwachte fout:", err);
  process.exit(1);
});
