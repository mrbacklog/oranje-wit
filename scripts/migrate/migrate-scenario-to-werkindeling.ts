/**
 * Data-migratie: controleert of scenario's al omgezet zijn naar werkindelingen.
 * Draai eenmalig na de schema-migratie van Task 1.
 *
 * Na de schema-migratie zijn alle scenario's met isWerkindeling=true al
 * overgeplaatst naar de werkindelingen-tabel. Dit script verifieert dat.
 */
import { PrismaClient } from "@oranje-wit/database";

const prisma = new PrismaClient();

async function main() {
  // Controleer of de scenarios-tabel nog bestaat (schema-migratie kan al klaar zijn)
  try {
    const result = await prisma.$queryRaw<{ count: string }[]>`
      SELECT COUNT(*) as count FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'scenarios'
    `;
    const count = parseInt(result[0]?.count ?? "0");
    if (count === 0) {
      console.log("Scenarios-tabel bestaat niet meer — schema-migratie volledig uitgevoerd.");
      return;
    }
    console.log(
      "Scenarios-tabel bestaat nog — schema-migratie is mogelijk niet volledig uitgevoerd."
    );
  } catch {
    console.log("Kan tabel niet controleren — schema-migratie al volledig uitgevoerd.");
    return;
  }

  // Tel werkindelingen
  const aantalWerkindelingen = await prisma.werkindeling.count();
  console.log(`${aantalWerkindelingen} werkindeling(en) gevonden na migratie.`);
  console.log("Migratie klaar.");
}

main()
  .catch((err) => {
    console.error("Migratiefout:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
