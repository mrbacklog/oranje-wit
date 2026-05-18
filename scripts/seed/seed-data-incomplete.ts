import { prisma } from "./types";
import { logger } from "@oranje-wit/types";

/**
 * Sectie 1.5: Data-incomplete fixtures.
 *
 * Schema-beperkingen t.o.v. catalogus:
 * - geslacht is non-nullable in Prisma-schema (Geslacht enum); fixture 990030000002
 *   gebruikt geslacht "V" als placeholder — UI-logica wordt getest door roepnaam-label.
 * - geboortejaar is non-nullable; fixture 990030000001 gebruikt geboortejaar=0 als sentinel.
 */
export async function seedDataIncomplete(): Promise<void> {
  logger.info("[seed-data-incomplete] 3 incomplete-fixtures");

  // 990030000001 — geen geboortedatum (geboortejaar=0 als sentinel, geboortedatum=null)
  await prisma.speler.upsert({
    where: { id: "990030000001" },
    create: {
      id: "990030000001",
      roepnaam: "Edge-GeenGB-V",
      achternaam: "Edge",
      geslacht: "V",
      geboortejaar: 0,
      geboortedatum: null,
      status: "BESCHIKBAAR",
    },
    update: { roepnaam: "Edge-GeenGB-V", geboortejaar: 0, geboortedatum: null },
  });

  // 990030000002 — geslacht onbekend (schema vereist non-null; M als onbekend-placeholder)
  // Verwacht gedrag: team-validatie negeert sexe-balans voor spelers met geboortejaar=0
  await prisma.speler.upsert({
    where: { id: "990030000002" },
    create: {
      id: "990030000002",
      roepnaam: "Edge-GeenGesl",
      achternaam: "Edge",
      geslacht: "M",
      geboortejaar: 2000,
      geboortedatum: new Date("2000-06-15"),
      status: "BESCHIKBAAR",
    },
    update: { roepnaam: "Edge-GeenGesl" },
  });

  // 990030000003 — lege roepnaam (UI valt terug op relCode als label)
  await prisma.speler.upsert({
    where: { id: "990030000003" },
    create: {
      id: "990030000003",
      roepnaam: "",
      achternaam: "Edge",
      geslacht: "M",
      geboortejaar: 2000,
      geboortedatum: new Date("2000-06-15"),
      status: "BESCHIKBAAR",
    },
    update: { roepnaam: "" },
  });

  logger.info("[seed-data-incomplete] klaar");
}
