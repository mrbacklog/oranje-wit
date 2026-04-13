#!/usr/bin/env node
/**
 * Herstel: laad historische competitie_spelers uit git snapshots (2010-2026).
 * Commit: 993acf3
 * Gebruik: node scripts/herstel/08-snapshots-historisch.js
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../../apps/web/.env") });
const { Client } = require("pg");
const { execSync } = require("child_process");
const path = require("path");

const GIT_COMMIT = "993acf3";
const SNAPSHOTS = [
  "2010-06-01.json",
  "2011-06-01.json",
  "2012-06-01.json",
  "2013-06-01.json",
  "2014-06-01.json",
  "2015-06-01.json",
  "2016-06-01.json",
  "2017-06-01.json",
  "2018-06-01.json",
  "2019-06-01.json",
  "2020-06-01.json",
  "2021-06-01.json",
  "2022-06-01.json",
  "2023-06-01.json",
  "2024-06-01.json",
  "2025-06-01.json",
];

const REPO_ROOT = path.resolve(__dirname, "../..");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  let totaalIngevoegd = 0;
  let totaalOvergeslagen = 0;

  for (const bestand of SNAPSHOTS) {
    const gitPad = `data/leden/snapshots/${bestand}`;

    let json;
    try {
      json = execSync(`git show ${GIT_COMMIT}:${gitPad}`, {
        cwd: REPO_ROOT,
        maxBuffer: 10 * 1024 * 1024,
      }).toString("utf8");
    } catch (e) {
      console.log(`SKIP ${bestand}: niet gevonden in git (${e.message.slice(0, 60)})`);
      continue;
    }

    const data = JSON.parse(json);
    const seizoen = data._meta.seizoen;
    const betrouwbaar = data._meta.betrouwbaarheid === "hoog";
    const leden = data.leden || [];

    let ingevoegd = 0;
    let overgeslagen = 0;

    for (const lid of leden) {
      if (!lid.rel_code) {
        overgeslagen++;
        continue;
      }
      // Sla inactieve leden over als het status-veld bestaat
      if (lid.status && lid.status !== "actief") {
        overgeslagen++;
        continue;
      }

      try {
        const result = await client.query(
          `INSERT INTO competitie_spelers (rel_code, seizoen, competitie, team, geslacht, bron, betrouwbaar)
           VALUES ($1, $2, 'veld_najaar', $3, $4, 'snapshot', $5)
           ON CONFLICT (rel_code, seizoen, competitie) DO NOTHING`,
          [lid.rel_code, seizoen, lid.team || null, lid.geslacht || null, betrouwbaar]
        );
        if (result.rowCount > 0) ingevoegd++;
        else overgeslagen++;
      } catch (_e) {
        // FK-fout (rel_code niet in leden tabel): stilletjes overslaan
        overgeslagen++;
      }
    }

    console.log(`${seizoen} (${bestand}): ${ingevoegd} ingevoegd, ${overgeslagen} overgeslagen`);
    totaalIngevoegd += ingevoegd;
    totaalOvergeslagen += overgeslagen;
  }

  const { rows } = await client.query("SELECT COUNT(*) FROM competitie_spelers");
  const { rows: dist } = await client.query(
    "SELECT COUNT(DISTINCT rel_code) as spelers, COUNT(DISTINCT seizoen) as seizoenen FROM competitie_spelers"
  );

  console.log("\n=== Totaal ===");
  console.log(`Ingevoegd:        ${totaalIngevoegd}`);
  console.log(`Overgeslagen:     ${totaalOvergeslagen}`);
  console.log(`Totaal in DB:     ${rows[0].count} records`);
  console.log(`Unieke spelers:   ${dist[0].spelers}`);
  console.log(`Unieke seizoenen: ${dist[0].seizoenen}`);

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
