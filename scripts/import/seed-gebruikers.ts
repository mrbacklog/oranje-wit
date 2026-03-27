/**
 * Seed de initiële gebruikers naar de Gebruiker-tabel.
 *
 * Migreert de 3 hardcoded allowlist-gebruikers naar de database.
 * Idempotent via upsert — veilig om meerdere keren te draaien.
 *
 * Draai met:
 *   pnpm dlx tsx -r dotenv/config scripts/import/seed-gebruikers.ts
 */

import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../../packages/database/.env") });
import { prisma } from "../../packages/database/src/index";

// De 3 TC-leden uit de oorspronkelijke allowlist
const GEBRUIKERS = [
  {
    email: "antjanlaban@gmail.com",
    naam: "Antjan Laban",
    rol: "EDITOR" as const,
    isAdmin: true,
  },
  {
    email: "merelvangurp@gmail.com",
    naam: "Merel van Gurp",
    rol: "EDITOR" as const,
    isAdmin: false,
  },
  {
    email: "thomasisarin@gmail.com",
    naam: "Thomas Isarin",
    rol: "EDITOR" as const,
    isAdmin: false,
  },
];

async function main() {
  console.log("Seed gebruikers...\n");

  for (const g of GEBRUIKERS) {
    const result = await prisma.gebruiker.upsert({
      where: { email: g.email },
      update: {
        naam: g.naam,
        rol: g.rol,
        isAdmin: g.isAdmin,
      },
      create: {
        email: g.email,
        naam: g.naam,
        rol: g.rol,
        isAdmin: g.isAdmin,
        actief: true,
      },
    });
    console.log(
      `  ${result.isAdmin ? "[ADMIN]" : "       "} ${result.naam} (${result.email}) — ${result.rol}`
    );
  }

  console.log(`\nKlaar: ${GEBRUIKERS.length} gebruikers geseeded.`);
}

main()
  .catch((e) => {
    console.error("Seed mislukt:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
