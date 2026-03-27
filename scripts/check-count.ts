import { prisma } from "../packages/database/src/index";

async function main() {
  const compCounts = await prisma.$queryRaw<{ competitie: string; cnt: number }[]>`
    SELECT competitie, COUNT(DISTINCT rel_code)::int AS cnt
    FROM competitie_spelers
    WHERE seizoen = '2025-2026'
    GROUP BY competitie
    ORDER BY competitie`;

  compCounts.forEach((r) => console.log(`${r.competitie}: ${r.cnt} spelers`));

  const total = await prisma.$queryRaw<{ totaal: number }[]>`
    SELECT COUNT(DISTINCT rel_code)::int AS totaal
    FROM competitie_spelers
    WHERE seizoen = '2025-2026'`;

  console.log(`\nTotaal uniek: ${total[0].totaal}`);

  await prisma.$disconnect();
}

main();
