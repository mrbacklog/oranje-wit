import { prisma } from "../db/prisma";
import type { ScoutingGroepConfig, ScoutingVraag, Pijler } from "./vragen";
import type { LeeftijdsgroepNaam, SchaalType } from "./leeftijdsgroep";
import { logger } from "@oranje-wit/types";

/** Bekende pijlercodes die we veilig kunnen casten naar Pijler */
const BEKENDE_PIJLERS = new Set<string>(["SCH", "AAN", "PAS", "VER", "FYS", "MEN"]);

/**
 * Laad scouting-config uit de database (actief raamwerk).
 * Retourneert null als er geen actief raamwerk is.
 *
 * De band "paars" deelt items met "blauw" (zelfde vragen).
 * In de database bestaat alleen "blauw". Als groep "paars"
 * wordt gevraagd, gebruiken we de "blauw" groep.
 */
export async function laadRaamwerkVanDB(
  groep: LeeftijdsgroepNaam
): Promise<ScoutingGroepConfig | null> {
  // Paars gebruikt dezelfde items als blauw in de database
  const dbBand = groep === "paars" ? "blauw" : groep;

  // Zoek de ACTIEF versie
  const versie = await prisma.raamwerkVersie.findFirst({
    where: { status: "ACTIEF" },
  });

  if (!versie) {
    logger.info("Geen actieve raamwerkversie gevonden, fallback naar hardcoded");
    return null;
  }

  // Zoek de groep voor deze band
  const leeftijdsgroep = await prisma.leeftijdsgroep.findUnique({
    where: {
      versieId_band: {
        versieId: versie.id,
        band: dbBand,
      },
    },
    include: {
      pijlers: {
        orderBy: { volgorde: "asc" },
        include: {
          items: {
            where: { actief: true },
            orderBy: { volgorde: "asc" },
          },
        },
      },
    },
  });

  if (!leeftijdsgroep) {
    logger.warn(`Geen leeftijdsgroep gevonden voor band "${dbBand}" in versie ${versie.id}`);
    return null;
  }

  // Map de items naar ScoutingVraag[]
  const vragen: ScoutingVraag[] = [];

  for (const pijler of leeftijdsgroep.pijlers) {
    // Alleen bekende pijlers casten; onbekende (bijv. "SOC") overslaan
    if (!BEKENDE_PIJLERS.has(pijler.code)) {
      continue;
    }

    const pijlerCode = pijler.code as Pijler;

    for (const item of pijler.items) {
      vragen.push({
        id: item.itemCode,
        pijler: pijlerCode,
        label: item.label,
        vraagTekst: item.vraagTekst,
      });
    }
  }

  if (vragen.length === 0) {
    logger.warn(`Leeftijdsgroep "${dbBand}" heeft geen actieve items`);
    return null;
  }

  return {
    schaalType: leeftijdsgroep.schaalType as SchaalType,
    maxScore: leeftijdsgroep.maxScore,
    vragen,
  };
}
