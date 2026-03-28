/**
 * Verificatiescript: controleert welke database actief is
 * en hoeveel demo-data erin zit.
 */
import { config } from "dotenv";
import { resolve } from "path";

// Laad .env.local eerst (als het bestaat), dan .env als fallback
config({ path: resolve(__dirname, "..", ".env.local") });
config({ path: resolve(__dirname, "..", ".env") });

import { prisma } from "../packages/database/src/index";

async function main() {
  const dbUrl = process.env.DATABASE_URL ?? "onbekend";
  const isLokaal = dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1");

  const [leden, demo, comp] = await Promise.all([
    prisma.lid.count(),
    prisma.lid.count({ where: { relCode: { startsWith: "TSTN" } } }),
    prisma.competitieSpeler.count(),
  ]);

  console.log(`=== ${isLokaal ? "LOKALE" : "PRODUCTIE"} DATABASE ===`);
  console.log(`  URL:            ${dbUrl.replace(/:[^:]*@/, ":***@")}`);
  console.log(`  Leden totaal:   ${leden}`);
  console.log(`  Leden TSTN:     ${demo}`);
  console.log(`  CompSpelers:    ${comp}`);

  if (isLokaal && demo > 0) {
    console.log(`\n  Lokale DB met demo-data — correct.`);
  } else if (!isLokaal && demo === 0) {
    console.log(`\n  Productie DB zonder demo-data — correct.`);
  } else if (!isLokaal && demo > 0) {
    console.log(`\n  WAARSCHUWING: Productie DB bevat nog ${demo} demo-records!`);
  } else {
    console.log(`\n  Lokale DB zonder demo-data — draai pnpm seed:demo`);
  }

  await prisma.$disconnect();
}

main();
