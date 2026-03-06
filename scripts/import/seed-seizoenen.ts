/**
 * Seed toekomstige blauwdruk-seizoenen (2026-2027 t/m 2035-2036).
 * Stelt 2025-2026 in als het initiële werkseizoen als er nog geen is.
 */

import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../../packages/database/.env") });
import { prisma } from "../../packages/database/src/index";

const TOEKOMSTIGE_SEIZOENEN = [
  "2026-2027",
  "2027-2028",
  "2028-2029",
  "2029-2030",
  "2030-2031",
  "2031-2032",
  "2032-2033",
  "2033-2034",
  "2034-2035",
  "2035-2036",
];

const INITIEEL_WERKSEIZOEN = "2025-2026";

async function main() {
  // Maak toekomstige seizoenen aan (als ze nog niet bestaan)
  for (const seizoen of TOEKOMSTIGE_SEIZOENEN) {
    await prisma.blauwdruk.upsert({
      where: { seizoen },
      create: {
        seizoen,
        kaders: {},
        speerpunten: [],
        toelichting: "",
        isWerkseizoen: false,
      },
      update: {},
    });
    process.stdout.write(`✓ ${seizoen}\n`);
  }

  // Controleer of er al een werkseizoen is
  const bestaandWerkseizoen = await prisma.blauwdruk.findFirst({
    where: { isWerkseizoen: true },
    select: { seizoen: true },
  });

  if (bestaandWerkseizoen) {
    process.stdout.write(`\nWerkseizoen al ingesteld: ★ ${bestaandWerkseizoen.seizoen}\n`);
  } else {
    // Stel initieel werkseizoen in
    await prisma.blauwdruk.upsert({
      where: { seizoen: INITIEEL_WERKSEIZOEN },
      create: {
        seizoen: INITIEEL_WERKSEIZOEN,
        kaders: {},
        speerpunten: [],
        toelichting: "",
        isWerkseizoen: true,
      },
      update: { isWerkseizoen: true },
    });
    process.stdout.write(`\nWerkseizoen ingesteld: ★ ${INITIEEL_WERKSEIZOEN}\n`);
  }

  process.stdout.write(
    `\nKlaar! ${TOEKOMSTIGE_SEIZOENEN.length} seizoenen aangemaakt/gecontroleerd.\n`
  );
}

main()
  .catch((e) => {
    process.stderr.write(`Fout: ${String(e)}\n`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
