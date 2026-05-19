import { prisma } from "./types";
import { logger } from "@oranje-wit/types";
import { getUniekeNaam } from "./namen-pool";

function naamUitPool(g: "M" | "V"): { roepnaam: string; achternaam: string } {
  const n = getUniekeNaam(g);
  if (!n) return { roepnaam: "Speler", achternaam: "Onbekend" };
  return {
    roepnaam: n.roepnaam,
    achternaam: n.tussenvoegsel ? `${n.tussenvoegsel} ${n.achternaam}` : n.achternaam,
  };
}

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

  // 990030000001 — geen geboortedatum (geboortejaar=0 als sentinel)
  const n1 = naamUitPool("V");
  await prisma.speler.upsert({
    where: { id: "990030000001" },
    create: {
      id: "990030000001",
      roepnaam: n1.roepnaam,
      achternaam: n1.achternaam,
      geslacht: "V",
      geboortejaar: 0,
      geboortedatum: null,
      status: "BESCHIKBAAR",
    },
    update: {
      roepnaam: n1.roepnaam,
      achternaam: n1.achternaam,
      geboortejaar: 0,
      geboortedatum: null,
    },
  });

  // 990030000002 — geslacht onbekend (schema vereist non-null; M als placeholder)
  const n2 = naamUitPool("M");
  await prisma.speler.upsert({
    where: { id: "990030000002" },
    create: {
      id: "990030000002",
      roepnaam: n2.roepnaam,
      achternaam: n2.achternaam,
      geslacht: "M",
      geboortejaar: 2000,
      geboortedatum: new Date("2000-06-15"),
      status: "BESCHIKBAAR",
    },
    update: { roepnaam: n2.roepnaam, achternaam: n2.achternaam },
  });

  // 990030000003 — lege roepnaam (UI valt terug op rel_code als label) — bewust leeg houden
  const n3 = naamUitPool("M");
  await prisma.speler.upsert({
    where: { id: "990030000003" },
    create: {
      id: "990030000003",
      roepnaam: "",
      achternaam: n3.achternaam,
      geslacht: "M",
      geboortejaar: 2000,
      geboortedatum: new Date("2000-06-15"),
      status: "BESCHIKBAAR",
    },
    update: { roepnaam: "", achternaam: n3.achternaam },
  });

  logger.info("[seed-data-incomplete] klaar");
}
