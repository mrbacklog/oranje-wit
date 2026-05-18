import { prisma } from "./types";
import { logger } from "@oranje-wit/types";

const WERKINDELING_ID = "wi-edge-2026-2027";
const KADERS_SEIZOEN = "2026-2027";

export async function seedWerkindelingEnVersies(): Promise<{ actieveVersieId: string }> {
  logger.info("[seed-whatif] werkindeling + versies aanmaken");

  // Kaders voor seizoen 2026-2027 (ouder van werkindeling)
  const kaders = await prisma.kaders.upsert({
    where: { seizoen: KADERS_SEIZOEN },
    create: {
      seizoen: KADERS_SEIZOEN,
      isWerkseizoen: true,
      kaders: {},
      speerpunten: [],
    },
    update: { isWerkseizoen: true },
  });

  // Werkindeling — id expliciet opgeven zodat upsert idempotent werkt
  const wi = await prisma.werkindeling.upsert({
    where: { id: WERKINDELING_ID },
    create: {
      id: WERKINDELING_ID,
      naam: "TI 2026-2027",
      kadersId: kaders.id,
    },
    update: { naam: "TI 2026-2027" },
  });

  // Versie 1 — Basis (actief)
  // Versie heeft auteur (required) en nummer; geen isActief veld in schema
  const versieActief = await prisma.versie.upsert({
    where: { id: "versie-edge-actief" },
    create: {
      id: "versie-edge-actief",
      werkindelingId: wi.id,
      nummer: 1,
      naam: "Basis",
      auteur: "seed-script",
    },
    update: { naam: "Basis" },
  });

  // Versie 2 — What-if conflict
  await prisma.versie.upsert({
    where: { id: "versie-edge-whatif-conflict" },
    create: {
      id: "versie-edge-whatif-conflict",
      werkindelingId: wi.id,
      nummer: 2,
      naam: "What-if conflict",
      auteur: "seed-script",
    },
    update: { naam: "What-if conflict" },
  });

  // Versie 3 — Leeg (lege canvas)
  await prisma.versie.upsert({
    where: { id: "versie-edge-leeg" },
    create: {
      id: "versie-edge-leeg",
      werkindelingId: wi.id,
      nummer: 3,
      naam: "Leeg",
      auteur: "seed-script",
    },
    update: { naam: "Leeg" },
  });

  logger.info("[seed-whatif] klaar — 1 werkindeling, 1 kaders, 3 versies");
  return { actieveVersieId: versieActief.id };
}
