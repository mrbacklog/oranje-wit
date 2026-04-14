// Check hoeveel spelers een geboortedatum hebben in de DB.
import { PrismaClient } from "../packages/database/src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const totaal = (await prisma.$queryRawUnsafe(`
    SELECT
      COUNT(*)::int AS totaal,
      COUNT(geboortedatum)::int AS met_datum,
      (COUNT(*) - COUNT(geboortedatum))::int AS zonder_datum
    FROM "Speler"
  `)) as Array<{ totaal: number; met_datum: number; zonder_datum: number }>;
  console.log("Speler-populatie:", totaal[0]);

  const namen = [
    "India",
    "Amber",
    "Demi",
    "Merel",
    "Loïs",
    "Xanne",
    "Carmen",
    "Eva",
    "Lindi",
    "Meike",
    "Roos",
    "Sara",
  ];
  const sample = (await prisma.$queryRawUnsafe(
    `
    SELECT roepnaam, achternaam, geboortejaar, geboortedatum
    FROM "Speler"
    WHERE roepnaam = ANY($1::text[])
    ORDER BY roepnaam, achternaam
    LIMIT 30
  `,
    namen
  )) as Array<{
    roepnaam: string;
    achternaam: string;
    geboortejaar: number;
    geboortedatum: Date | null;
  }>;
  console.log("\nSample uit 1e Sen selectie:");
  for (const s of sample) {
    const gd = s.geboortedatum ? s.geboortedatum.toISOString().slice(0, 10) : "(NULL)";
    console.log(
      `  ${s.roepnaam.padEnd(12)} ${s.achternaam.padEnd(25)} gj=${s.geboortejaar}  gd=${gd}`
    );
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
