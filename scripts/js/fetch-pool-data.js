#!/usr/bin/env node

/**
 * Haal alle PoolStand en PoolStandRegel data op voor seizoen 2025-2026
 * Output: CSV en JSON met team-info, punten, positie, etc.
 */

import { PrismaClient } from "@oranje-wit/database";

const prisma = new PrismaClient();

async function main() {
  const seizoen = "2025-2026";

  console.log(`\n=== PoolStand data ophalen voor seizoen ${seizoen} ===\n`);

  // Query: alle PoolStands met gerelateerde regels
  const poolStanden = await prisma.poolStand.findMany({
    where: { seizoen },
    include: {
      regels: {
        orderBy: { positie: "asc" },
      },
    },
    orderBy: [{ periode: "asc" }, { niveau: "asc" }, { pool: "asc" }],
  });

  console.log(`Gevonden: ${poolStanden.length} pools\n`);

  if (poolStanden.length === 0) {
    console.log("Geen pools gevonden voor dit seizoen.");
    await prisma.$disconnect();
    process.exit(0);
  }

  // Aggregeer data per niveau
  const niveaus = {};
  const alleRegels = [];

  for (const poolStand of poolStanden) {
    const key = `${poolStand.periode} - ${poolStand.niveau || "onbekend"}`;
    if (!niveaus[key]) {
      niveaus[key] = {
        periode: poolStand.periode,
        niveau: poolStand.niveau,
        pools: [],
        teams: [],
        totaalTeams: 0,
        totaalOWTeams: 0,
      };
    }

    niveaus[key].pools.push(poolStand.pool);

    for (const regel of poolStand.regels) {
      niveaus[key].teams.push(regel.teamNaam);
      niveaus[key].totaalTeams++;
      if (regel.isOW) {
        niveaus[key].totaalOWTeams++;
      }

      alleRegels.push({
        periode: poolStand.periode,
        pool: poolStand.pool,
        niveau: poolStand.niveau || "onbekend",
        regio: poolStand.regio || "",
        positie: regel.positie,
        teamNaam: regel.teamNaam,
        isOW: regel.isOW ? "JA" : "NEE",
        gespeeld: regel.gespeeld,
        gewonnen: regel.gewonnen,
        gelijk: regel.gelijk,
        verloren: regel.verloren,
        punten: regel.punten,
        doelpuntenVoor: regel.doelpuntenVoor,
        doelpuntenTegen: regel.doelpuntenTegen,
        doelverschil: regel.doelpuntenVoor - regel.doelpuntenTegen,
      });
    }
  }

  // Samenvatting per niveau
  console.log("=== SAMENVATTING PER NIVEAU/PERIODE ===\n");
  for (const [key, data] of Object.entries(niveaus).sort()) {
    console.log(`${key}`);
    console.log(`  Pools: ${data.pools.join(", ")}`);
    console.log(`  Teams: ${data.totaalTeams} (waarvan ${data.totaalOWTeams} OW)\n`);
  }

  // Alle regels uitgebreid
  console.log("\n=== VOLLEDIGE TEAMDATA ===\n");
  console.log(
    "periode,pool,niveau,regio,positie,teamNaam,isOW,gespeeld,gewonnen,gelijk,verloren,punten,doelpuntenVoor,doelpuntenTegen,doelverschil"
  );

  for (const regel of alleRegels) {
    console.log(
      `${regel.periode},${regel.pool},${regel.niveau},${regel.regio},${regel.positie},${regel.teamNaam},${regel.isOW},${regel.gespeeld},${regel.gewonnen},${regel.gelijk},${regel.verloren},${regel.punten},${regel.doelpuntenVoor},${regel.doelpuntenTegen},${regel.doelverschil}`
    );
  }

  // JSON export
  console.log("\n\n=== JSON EXPORT ===\n");
  console.log(
    JSON.stringify(
      {
        seizoen,
        totaalPools: poolStanden.length,
        totaalTeams: alleRegels.length,
        owTeams: alleRegels.filter((r) => r.isOW === "JA").length,
        data: alleRegels,
      },
      null,
      2
    )
  );

  // Statistieken per niveau
  console.log("\n\n=== STATISTIEKEN PER NIVEAU ===\n");
  const niveauStats = {};
  for (const regel of alleRegels) {
    if (!niveauStats[regel.niveau]) {
      niveauStats[regel.niveau] = {
        teams: 0,
        owTeams: 0,
        gemiddeldePunten: [],
        gemiddeldeGespeeld: [],
      };
    }
    niveauStats[regel.niveau].teams++;
    if (regel.isOW === "JA") niveauStats[regel.niveau].owTeams++;
    niveauStats[regel.niveau].gemiddeldePunten.push(regel.punten);
    niveauStats[regel.niveau].gemiddeldeGespeeld.push(regel.gespeeld);
  }

  for (const [niveau, stats] of Object.entries(niveauStats).sort()) {
    const gemPunten = (stats.gemiddeldePunten.reduce((a, b) => a + b, 0) / stats.teams).toFixed(1);
    const gemGespeeld = (stats.gemiddeldeGespeeld.reduce((a, b) => a + b, 0) / stats.teams).toFixed(
      1
    );
    console.log(
      `${niveau}: ${stats.teams} teams (${stats.owTeams} OW) | gem. punten: ${gemPunten} | gem. gespeeld: ${gemGespeeld}`
    );
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Fout:", error);
  process.exit(1);
});
