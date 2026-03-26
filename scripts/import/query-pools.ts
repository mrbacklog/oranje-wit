/**
 * Query PoolStand data direct uit PostgreSQL
 * Gebruik: npx ts-node scripts/import/query-pools.ts
 */

import { PrismaClient } from "@oranje-wit/database";

const prisma = new PrismaClient();

async function main() {
  console.log("Ophalen PoolStand data...\n");

  for (const seizoen of ["2025-2026", "2024-2025"]) {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`PoolStand data voor ${seizoen}`);
    console.log(`${"=".repeat(80)}\n`);

    // Fetch all pool stands met regels
    const poolStanden = await prisma.poolStand.findMany({
      where: { seizoen },
      include: {
        regels: {
          orderBy: { positie: "asc" },
        },
      },
      orderBy: [{ periode: "asc" }, { niveau: "asc" }, { pool: "asc" }],
    });

    if (poolStanden.length === 0) {
      console.log(`⚠️  Geen data gevonden voor ${seizoen}\n`);
      continue;
    }

    console.log(
      `✓ ${poolStanden.length} pools, totaal ${poolStanden.reduce((sum, ps) => sum + ps.regels.length, 0)} teams\n`
    );

    // CSV header
    console.log(
      "seizoen,periode,pool,niveau,regio,stand_datum,positie,team_naam,is_ow,gespeeld,gewonnen,gelijk,verloren,punten,doelpunten_voor,doelpunten_tegen,doelverschil"
    );

    // Aggregatie per niveau
    const niveauStats: Record<
      string,
      {
        teams: number;
        ow_teams: number;
        pools: Set<string>;
        punten: number[];
        gespeeld: number[];
      }
    > = {};

    // Output CSV rows
    for (const poolStand of poolStanden) {
      for (const regel of poolStand.regels) {
        const doelverschil = regel.doelpuntenVoor - regel.doelpuntenTegen;
        console.log(
          `${seizoen},${poolStand.periode},${poolStand.pool},${poolStand.niveau || ""},${poolStand.regio || ""},${poolStand.standDatum || ""},${regel.positie},${regel.teamNaam},${regel.isOW ? "JA" : "NEE"},${regel.gespeeld},${regel.gewonnen},${regel.gelijk},${regel.verloren},${regel.punten},${regel.doelpuntenVoor},${regel.doelpuntenTegen},${doelverschil}`
        );

        // Aggregeer stats
        const niveau = poolStand.niveau || "onbekend";
        if (!niveauStats[niveau]) {
          niveauStats[niveau] = {
            teams: 0,
            ow_teams: 0,
            pools: new Set(),
            punten: [],
            gespeeld: [],
          };
        }
        niveauStats[niveau].teams++;
        if (regel.isOW) niveauStats[niveau].ow_teams++;
        niveauStats[niveau].pools.add(poolStand.pool);
        niveauStats[niveau].punten.push(regel.punten);
        niveauStats[niveau].gespeeld.push(regel.gespeeld);
      }
    }

    // Stats per niveau
    console.log("\n\n=== STATISTIEKEN PER NIVEAU ===\n");
    for (const [niveau, stats] of Object.entries(niveauStats).sort()) {
      const gemPunten = stats.punten.length
        ? (stats.punten.reduce((a, b) => a + b, 0) / stats.teams).toFixed(1)
        : "n/a";
      const gemGespeeld = stats.gespeeld.length
        ? (stats.gespeeld.reduce((a, b) => a + b, 0) / stats.teams).toFixed(1)
        : "n/a";
      const poolsStr = Array.from(stats.pools).sort().join(", ");

      console.log(`${niveau}`);
      console.log(`  Teams: ${stats.teams} (waarvan ${stats.ow_teams} OW)`);
      console.log(`  Pools: ${poolsStr}`);
      console.log(
        `  Punten: min=${Math.min(...stats.punten)}, max=${Math.max(...stats.punten)}, gem=${gemPunten}`
      );
      console.log(`  Gespeeld: gem=${gemGespeeld}\n`);
    }
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Fout:", error);
  process.exit(1);
});
