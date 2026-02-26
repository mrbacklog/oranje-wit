import "dotenv/config";
import { prisma } from "../src/lib/db/prisma";

async function main() {
  console.log("=== Database Verificatie ===\n");

  // OW tabellen
  console.log("--- Verenigingsmonitor (OW) tabellen ---");
  const leden = await prisma.lid.count();
  const seizoenen = await prisma.seizoen.count();
  const snapshots = await prisma.snapshot.count();
  const lidSnapshots = await prisma.lidSnapshot.count();
  const owTeams = await prisma.oWTeam.count();
  const periodes = await prisma.teamPeriode.count();
  const paden = await prisma.spelersPad.count();
  const verloop = await prisma.ledenverloop.count();
  const cohorten = await prisma.cohortSeizoen.count();
  const signaleringen = await prisma.signalering.count();

  console.log(`  leden:            ${leden}`);
  console.log(`  seizoenen:        ${seizoenen}`);
  console.log(`  snapshots:        ${snapshots}`);
  console.log(`  leden_snapshot:   ${lidSnapshots}`);
  console.log(`  teams:            ${owTeams}`);
  console.log(`  team_periodes:    ${periodes}`);
  console.log(`  spelerspaden:     ${paden}`);
  console.log(`  ledenverloop:     ${verloop}`);
  console.log(`  cohort_seizoenen: ${cohorten}`);
  console.log(`  signalering:      ${signaleringen}`);

  // TI tabellen
  console.log("\n--- Team-Indeling (TI) tabellen ---");
  const spelers = await prisma.speler.count();
  const staf = await prisma.staf.count();
  const blauwdrukken = await prisma.blauwdruk.count();
  const refTeams = await prisma.referentieTeam.count();
  const imports = await prisma.import.count();

  console.log(`  Speler:           ${spelers}`);
  console.log(`  Staf:             ${staf}`);
  console.log(`  Blauwdruk:        ${blauwdrukken}`);
  console.log(`  ReferentieTeam:   ${refTeams}`);
  console.log(`  Import:           ${imports}`);

  // Cross-check: TI speler ↔ OW lid
  console.log("\n--- Cross-check ---");
  const eersteSpeler = await prisma.speler.findFirst();
  if (eersteSpeler) {
    const lid = await prisma.lid.findUnique({ where: { relCode: eersteSpeler.id } });
    console.log(`  Speler ${eersteSpeler.roepnaam} (${eersteSpeler.id})`);
    console.log(`  → Lid:  ${lid ? lid.roepnaam + " " + lid.achternaam : "NIET GEVONDEN"}`);
  }

  console.log("\n=== Verificatie voltooid ===");
}

main()
  .catch((e) => console.error("FATAL:", e))
  .finally(() => process.exit(0));
