// scripts/verify-korfballeeftijd.mjs
// Runtime verificatie: korfballeeftijd op peildatum klopt voor echte spelers.
// Vergelijkt centrale functie tegen onafhankelijke referentieberekening.

import "dotenv/config";
import { PrismaClient } from "../packages/database/src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import {
  berekenKorfbalLeeftijd,
  berekenKorfbalLeeftijdExact,
  korfbalPeildatum,
  formatKorfbalLeeftijd,
  valtBinnenCategorie,
  HUIDIG_SEIZOEN,
  HUIDIGE_PEILDATUM,
} from "@oranje-wit/types";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function referentieLeeftijd(geboortedatum, peildatum) {
  // Onafhankelijke berekening ter kruiscontrole.
  // Gebruik ms-verschil / (365.25 * 86.4e6)
  const ms = peildatum.getTime() - geboortedatum.getTime();
  return Math.round((ms / (365.25 * 86400000)) * 100) / 100;
}

async function main() {
  console.log("=== Korfballeeftijd verificatie ===\n");

  console.log(`HUIDIG_SEIZOEN      : ${HUIDIG_SEIZOEN}`);
  console.log(`HUIDIGE_PEILDATUM   : ${HUIDIGE_PEILDATUM.toISOString().slice(0, 10)}`);
  console.log(
    `korfbalPeildatum('2026-2027') : ${korfbalPeildatum("2026-2027").toISOString().slice(0, 10)}`
  );
  console.log(
    `korfbalPeildatum('2025-2026') : ${korfbalPeildatum("2025-2026").toISOString().slice(0, 10)}`
  );
  console.log();

  // Peildatum waarmee de huidige TI Studio werkt voor seizoen 2026-2027
  const peildatum = korfbalPeildatum("2026-2027");
  console.log(`Test-peildatum : ${peildatum.toISOString().slice(0, 10)}\n`);

  // 1) Kunstmatige edge-cases
  console.log("--- Edge cases (kunstmatig) ---");
  const edges = [
    { naam: "15.00 precies (geb 31-12-2011)", gd: new Date("2011-12-31"), gj: 2011 },
    { naam: "15.003 (geb 30-12-2011)", gd: new Date("2011-12-30"), gj: 2011 },
    { naam: "14.997 (geb 01-01-2012)", gd: new Date("2012-01-01"), gj: 2012 },
    { naam: "14.00 precies (geb 31-12-2012)", gd: new Date("2012-12-31"), gj: 2012 },
    { naam: "Schrikkeldag (geb 29-02-2012)", gd: new Date("2012-02-29"), gj: 2012 },
  ];
  for (const e of edges) {
    const exact = berekenKorfbalLeeftijdExact(e.gd, e.gj, peildatum);
    const afgerond = berekenKorfbalLeeftijd(e.gd, e.gj, peildatum);
    const ref = referentieLeeftijd(e.gd, peildatum);
    const u15 = valtBinnenCategorie(exact, "U15") ? "✓ U15" : "✗ niet U15";
    const match = Math.abs(afgerond - ref) < 1e-9 ? "✓" : "✗ MISMATCH";
    console.log(
      `  ${e.naam.padEnd(36)} exact=${exact.toFixed(6)}  afgerond=${formatKorfbalLeeftijd(afgerond)}  ref=${ref.toFixed(2)}  ${match}  ${u15}`
    );
  }
  console.log();

  // 2) Echte spelers uit de database (optioneel — skip als DB niet bereikbaar)
  console.log("--- Echte spelers uit database (random sample) ---");
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
  } catch {
    console.log("  (database niet bereikbaar — sla live sample over)");
    await prisma.$disconnect().catch(() => undefined);
    await pool.end().catch(() => undefined);
    process.exit(0);
  }
  const spelers = (await prisma.$queryRawUnsafe(`
    SELECT rel_code, roepnaam, achternaam, geboortedatum, geboortejaar
    FROM "Speler"
    WHERE geboortedatum IS NOT NULL
    ORDER BY random()
    LIMIT 10
  `)) as Array<{
    rel_code: string;
    roepnaam: string;
    achternaam: string;
    geboortedatum: Date;
    geboortejaar: number;
  }>;

  let mismatches = 0;
  for (const s of spelers) {
    const exact = berekenKorfbalLeeftijdExact(s.geboortedatum, s.geboortejaar, peildatum);
    const afgerond = berekenKorfbalLeeftijd(s.geboortedatum, s.geboortejaar, peildatum);
    const ref = referentieLeeftijd(s.geboortedatum, peildatum);
    const match = Math.abs(afgerond - ref) < 1e-9;
    if (!match) mismatches++;
    const u15 = valtBinnenCategorie(exact, "U15") ? "U15" : "   ";
    const u17 = valtBinnenCategorie(exact, "U17") ? "U17" : "   ";
    const u19 = valtBinnenCategorie(exact, "U19") ? "U19" : "   ";
    console.log(
      `  ${s.roepnaam} ${s.achternaam}`.padEnd(30) +
        `geb ${s.geboortedatum.toISOString().slice(0, 10)}  ` +
        `exact=${exact.toFixed(4)}  weergave=${formatKorfbalLeeftijd(afgerond)}  ` +
        `ref=${ref.toFixed(2)}  ${match ? "✓" : "✗"}  [${u15} ${u17} ${u19}]`
    );
  }
  console.log();

  // 3) Jongste en oudste U15-speler
  console.log("--- U15 grenscontrole (oudste en jongste actieve spelers in seizoensrange) ---");
  // Grens: geboortejaar 2011 of 2012 → potentieel U15 voor seizoen 2026-2027
  const u15Kandidaten = (await prisma.$queryRawUnsafe(`
    SELECT rel_code, roepnaam, achternaam, geboortedatum, geboortejaar
    FROM "Speler"
    WHERE geboortedatum IS NOT NULL
      AND geboortejaar BETWEEN 2011 AND 2013
    ORDER BY geboortedatum ASC
  `)) as Array<{
    rel_code: string;
    roepnaam: string;
    achternaam: string;
    geboortedatum: Date;
    geboortejaar: number;
  }>;
  if (u15Kandidaten.length > 0) {
    const oudste = u15Kandidaten[0];
    const jongste = u15Kandidaten[u15Kandidaten.length - 1];
    for (const [label, s] of [
      ["Oudste", oudste],
      ["Jongste", jongste],
    ]) {
      const exact = berekenKorfbalLeeftijdExact(s.geboortedatum, s.geboortejaar, peildatum);
      const u15 = valtBinnenCategorie(exact, "U15");
      console.log(
        `  ${label.padEnd(8)} ${s.roepnaam} ${s.achternaam} (${s.geboortedatum.toISOString().slice(0, 10)})  ` +
          `exact=${exact.toFixed(4)}  ${u15 ? "✓ U15 toegestaan" : "✗ NIET U15"}`
      );
    }
  } else {
    console.log("  (geen kandidaten gevonden in range 2011-2013)");
  }
  console.log();

  console.log(`=== Totaal mismatches: ${mismatches} ===`);
  await prisma.$disconnect();
  await pool.end();
  process.exit(mismatches > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
