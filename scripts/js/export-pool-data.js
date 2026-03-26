/**
 * export-pool-data.js
 *
 * Exporteert alle PoolStand en PoolStandRegel data voor seizoenen 2025-2026 en 2024-2025.
 * Output: CSV + JSON + statistieken
 *
 * Gebruik: node scripts/js/export-pool-data.js
 */

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SEIZOENEN = ["2025-2026", "2024-2025"];

async function fetchPoolData(seizoen) {
  const query = `
    SELECT
      ps.id,
      ps.seizoen,
      ps.periode,
      ps.pool,
      ps.niveau,
      ps.regio,
      ps.stand_datum,
      psr.positie,
      psr.team_naam,
      psr.is_ow,
      psr.gs as gespeeld,
      psr.wn as gewonnen,
      psr.gl as gelijk,
      psr.vl as verloren,
      psr.pt as punten,
      psr.vr as doelpunten_voor,
      psr.tg as doelpunten_tegen
    FROM pool_standen ps
    LEFT JOIN pool_stand_regels psr ON ps.id = psr.pool_stand_id
    WHERE ps.seizoen = $1
    ORDER BY ps.periode, ps.niveau, ps.pool, psr.positie
  `;

  const { rows } = await pool.query(query, [seizoen]);
  return rows;
}

function aggregateByNiveau(rows) {
  const niveaus = {};

  for (const row of rows) {
    if (!row.team_naam) continue;

    const niveau = row.niveau || "onbekend";
    if (!niveaus[niveau]) {
      niveaus[niveau] = {
        teams: 0,
        ow_teams: 0,
        pools: new Set(),
        periodes: new Set(),
        punten: [],
        gespeeld: [],
      };
    }

    niveaus[niveau].teams++;
    if (row.is_ow) niveaus[niveau].ow_teams++;
    niveaus[niveau].pools.add(row.pool);
    niveaus[niveau].periodes.add(row.periode);
    niveaus[niveau].punten.push(row.punten || 0);
    niveaus[niveau].gespeeld.push(row.gespeeld || 0);
  }

  // Compute stats
  for (const niveau in niveaus) {
    const stats = niveaus[niveau];
    const punten = stats.punten.filter((p) => p > 0);
    const gespeeld = stats.gespeeld.filter((g) => g > 0);

    niveaus[niveau].stats = {
      totaalTeams: stats.teams,
      owTeams: stats.ow_teams,
      pools: Array.from(stats.pools).sort(),
      periodes: Array.from(stats.periodes).sort(),
      punten: {
        min: punten.length ? Math.min(...punten) : null,
        max: punten.length ? Math.max(...punten) : null,
        gem: punten.length ? (punten.reduce((a, b) => a + b, 0) / stats.teams).toFixed(1) : null,
      },
      gespeeld: {
        gem: gespeeld.length
          ? (gespeeld.reduce((a, b) => a + b, 0) / stats.teams).toFixed(1)
          : null,
      },
    };

    delete niveaus[niveau].punten;
    delete niveaus[niveau].gespeeld;
    delete niveaus[niveau].pools;
    delete niveaus[niveau].periodes;
    delete niveaus[niveau].teams;
    delete niveaus[niveau].ow_teams;
  }

  return niveaus;
}

async function main() {
  console.log("Exporteren PoolStand data voor Oranje Wit...\n");

  const allData = {};

  for (const seizoen of SEIZOENEN) {
    console.log(`Ophalen ${seizoen}...`);
    const rows = await fetchPoolData(seizoen);

    if (rows.length === 0) {
      console.log(`  ⚠️  Geen data gevonden\n`);
      continue;
    }

    const poolCount = new Set(rows.map((r) => r.pool)).size;
    const teamCount = rows.filter((r) => r.team_naam).length;
    console.log(`  ✓ ${poolCount} pools, ${teamCount} teams\n`);

    allData[seizoen] = {
      pools: poolCount,
      teams: teamCount,
      owTeams: rows.filter((r) => r.team_naam && r.is_ow).length,
      niveaus: aggregateByNiveau(rows),
      rows: rows
        .filter((r) => r.team_naam)
        .map((r) => ({
          seizoen: r.seizoen,
          periode: r.periode,
          pool: r.pool,
          niveau: r.niveau,
          regio: r.regio,
          standDatum: r.stand_datum,
          positie: r.positie,
          teamNaam: r.team_naam,
          isOW: r.is_ow,
          gespeeld: r.gespeeld,
          gewonnen: r.gewonnen,
          gelijk: r.gelijk,
          verloren: r.verloren,
          punten: r.punten,
          doelpuntenVoor: r.doelpunten_voor,
          doelpuntenTegen: r.doelpunten_tegen,
          doelverschil: (r.doelpunten_voor || 0) - (r.doelpunten_tegen || 0),
        })),
    };
  }

  // === CONSOLE OUTPUT ===
  console.log("\n" + "=".repeat(80));
  console.log("CONSOLE OUTPUT");
  console.log("=".repeat(80) + "\n");

  for (const seizoen of SEIZOENEN) {
    if (!allData[seizoen]) continue;

    const data = allData[seizoen];

    console.log(`\n${seizoen}`);
    console.log(`Pools: ${data.pools}, Teams: ${data.teams} (OW: ${data.owTeams})\n`);

    // Niveau summary
    console.log("NIVEAUS:");
    for (const [niveau, stats] of Object.entries(data.niveaus).sort()) {
      const s = stats.stats;
      console.log(`  ${niveau}`);
      console.log(`    Teams: ${s.totaalTeams} (OW: ${s.owTeams})`);
      console.log(`    Pools: ${s.pools.join(", ")}`);
      console.log(`    Punten: min=${s.punten.min}, max=${s.punten.max}, gem=${s.punten.gem}`);
      console.log(`    Gespeeld: gem=${s.gespeeld.gem}`);
    }

    // CSV dump
    console.log(
      "\nFULLE DATA (CSV):\nseizoen,periode,pool,niveau,regio,standDatum,positie,teamNaam,isOW,gespeeld,gewonnen,gelijk,verloren,punten,doelpuntenVoor,doelpuntenTegen,doelverschil"
    );
    for (const row of data.rows) {
      console.log(
        `${row.seizoen},${row.periode},${row.pool},${row.niveau || ""},${row.regio || ""},${row.standDatum || ""},${row.positie},${row.teamNaam},${row.isOW ? "JA" : "NEE"},${row.gespeeld},${row.gewonnen},${row.gelijk},${row.verloren},${row.punten},${row.doelpuntenVoor},${row.doelpuntenTegen},${row.doelverschil}`
      );
    }
  }

  // === JSON EXPORT ===
  const jsonOutput = {};
  for (const seizoen of SEIZOENEN) {
    if (allData[seizoen]) {
      const data = allData[seizoen];
      jsonOutput[seizoen] = {
        meta: {
          pools: data.pools,
          teams: data.teams,
          owTeams: data.owTeams,
        },
        niveaus: data.niveaus,
        teams: data.rows,
      };
    }
  }

  console.log("\n\n" + "=".repeat(80));
  console.log("JSON EXPORT");
  console.log("=".repeat(80) + "\n");
  console.log(JSON.stringify(jsonOutput, null, 2));

  // === WRITE FILES ===
  const outputDir = path.join(__dirname, "../../data/pool-export");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // CSV per seizoen
  for (const seizoen of SEIZOENEN) {
    if (!allData[seizoen]) continue;

    const csvFile = path.join(outputDir, `pool-${seizoen}.csv`);
    const csvLines = [
      "seizoen,periode,pool,niveau,regio,standDatum,positie,teamNaam,isOW,gespeeld,gewonnen,gelijk,verloren,punten,doelpuntenVoor,doelpuntenTegen,doelverschil",
    ];

    for (const row of allData[seizoen].rows) {
      csvLines.push(
        `${row.seizoen},${row.periode},${row.pool},${row.niveau || ""},${row.regio || ""},${row.standDatum || ""},${row.positie},${row.teamNaam},${row.isOW ? "JA" : "NEE"},${row.gespeeld},${row.gewonnen},${row.gelijk},${row.verloren},${row.punten},${row.doelpuntenVoor},${row.doelpuntenTegen},${row.doelverschil}`
      );
    }

    fs.writeFileSync(csvFile, csvLines.join("\n"));
    console.log(`\n✓ Geschreven: ${csvFile}`);
  }

  // JSON export
  const jsonFile = path.join(outputDir, "pool-data.json");
  fs.writeFileSync(jsonFile, JSON.stringify(jsonOutput, null, 2));
  console.log(`✓ Geschreven: ${jsonFile}`);

  await pool.end();
  console.log("\nGereed!");
}

main().catch((error) => {
  console.error("Fout:", error);
  process.exit(1);
});
