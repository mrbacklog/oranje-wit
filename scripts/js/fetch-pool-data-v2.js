#!/usr/bin/env node

/**
 * Haal alle PoolStand en PoolStandRegel data op voor seizoen 2025-2026
 * Output: CSV en JSON met team-info, punten, positie, etc.
 *
 * Gebruik: node scripts/js/fetch-pool-data-v2.js
 */

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    console.log("✓ Verbonden met database\n");

    const seizoen = "2025-2026";
    console.log(`=== PoolStand data ophalen voor seizoen ${seizoen} ===\n`);

    // Query: alle pools met teams
    const poolsResult = await pool.query(
      `
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
      `,
      [seizoen]
    );

    console.log(`Gevonden: ${poolsResult.rows.length} teamrecords\n`);

    if (poolsResult.rows.length === 0) {
      console.log("Geen pools gevonden voor dit seizoen.");
      await client.end();
      process.exit(0);
    }

    // Aggregeer per pool
    const poolMap = {};
    const niveauMap = {};

    for (const row of poolsResult.rows) {
      const poolKey = `${row.periode}|${row.pool}`;
      if (!poolMap[poolKey]) {
        poolMap[poolKey] = {
          periode: row.periode,
          pool: row.pool,
          niveau: row.niveau,
          regio: row.regio,
          standDatum: row.stand_datum,
          teams: [],
        };
      }

      if (row.team_naam) {
        poolMap[poolKey].teams.push({
          positie: row.positie,
          teamNaam: row.team_naam,
          isOW: row.is_ow,
          gespeeld: row.gespeeld,
          gewonnen: row.gewonnen,
          gelijk: row.gelijk,
          verloren: row.verloren,
          punten: row.punten,
          doelpuntenVoor: row.doelpunten_voor,
          doelpuntenTegen: row.doelpunten_tegen,
          doelverschil: row.doelpunten_voor - row.doelpunten_tegen,
        });
      }

      // Aggregeer stats per niveau
      const niveauKey = row.niveau || "onbekend";
      if (!niveauMap[niveauKey]) {
        niveauMap[niveauKey] = {
          teams: 0,
          owTeams: 0,
          pools: new Set(),
          minPunten: Infinity,
          maxPunten: -Infinity,
          gemiddeldePunten: [],
          gemiddeldeGespeeld: [],
        };
      }
      if (row.team_naam) {
        niveauMap[niveauKey].teams++;
        if (row.is_ow) niveauMap[niveauKey].owTeams++;
        niveauMap[niveauKey].pools.add(row.pool);
        niveauMap[niveauKey].minPunten = Math.min(niveauMap[niveauKey].minPunten, row.punten || 0);
        niveauMap[niveauKey].maxPunten = Math.max(niveauMap[niveauKey].maxPunten, row.punten || 0);
        niveauMap[niveauKey].gemiddeldePunten.push(row.punten || 0);
        niveauMap[niveauKey].gemiddeldeGespeeld.push(row.gespeeld || 0);
      }
    }

    // Print samenvatting
    console.log("=== SAMENVATTING PER NIVEAU ===\n");
    for (const [niveau, stats] of Object.entries(niveauMap).sort()) {
      const gemPunten = (stats.gemiddeldePunten.reduce((a, b) => a + b, 0) / stats.teams).toFixed(
        1
      );
      const gemGespeeld = (
        stats.gemiddeldeGespeeld.reduce((a, b) => a + b, 0) / stats.teams
      ).toFixed(1);
      console.log(`${niveau}`);
      console.log(`  Teams: ${stats.teams} (waarvan ${stats.owTeams} OW)`);
      console.log(`  Pools: ${Array.from(stats.pools).sort().join(", ")}`);
      console.log(`  Punten: min=${stats.minPunten}, max=${stats.maxPunten}, gem=${gemPunten}`);
      console.log(`  Gespeeld: gem=${gemGespeeld}\n`);
    }

    // CSV output
    console.log("=== CSV DATA ===\n");
    console.log(
      "periode,pool,niveau,regio,standDatum,positie,teamNaam,isOW,gespeeld,gewonnen,gelijk,verloren,punten,doelpuntenVoor,doelpuntenTegen,doelverschil"
    );

    for (const row of poolsResult.rows) {
      if (row.team_naam) {
        console.log(
          `${row.periode},${row.pool},${row.niveau || ""},${row.regio || ""},${row.stand_datum || ""},${row.positie},${row.team_naam},${row.is_ow ? "JA" : "NEE"},${row.gespeeld},${row.gewonnen},${row.gelijk},${row.verloren},${row.punten},${row.doelpunten_voor},${row.doelpunten_tegen},${row.doelpunten_voor - row.doelpunten_tegen}`
        );
      }
    }

    // JSON export
    console.log("\n\n=== JSON EXPORT ===\n");
    const jsonData = {
      seizoen,
      totaalPools: Object.keys(poolMap).length,
      totaalTeams: poolsResult.rows.filter((r) => r.team_naam).length,
      owTeams: poolsResult.rows.filter((r) => r.team_naam && r.is_ow).length,
      niveaus: Object.entries(niveauMap).reduce((acc, [niveau, stats]) => {
        acc[niveau] = {
          teams: stats.teams,
          owTeams: stats.owTeams,
          pools: Array.from(stats.pools).sort(),
          punten: {
            min: stats.minPunten,
            max: stats.maxPunten,
            gemiddelde: parseFloat(
              (stats.gemiddeldePunten.reduce((a, b) => a + b, 0) / stats.teams).toFixed(1)
            ),
          },
          gespeeld: {
            gemiddelde: parseFloat(
              (stats.gemiddeldeGespeeld.reduce((a, b) => a + b, 0) / stats.teams).toFixed(1)
            ),
          },
        };
        return acc;
      }, {}),
      teams: Object.values(poolMap).flatMap((pool) =>
        pool.teams.map((team) => ({
          periode: pool.periode,
          pool: pool.pool,
          niveau: pool.niveau,
          regio: pool.regio,
          standDatum: pool.standDatum,
          ...team,
        }))
      ),
    };

    console.log(JSON.stringify(jsonData, null, 2));

    await pool.end();
  } catch (error) {
    console.error("Fout:", error);
    process.exit(1);
  }
}

main();
