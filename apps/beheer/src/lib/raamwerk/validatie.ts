/**
 * Validatieregels voor het vaardigheidsraamwerk.
 * Worden gedraaid bij het publiceren en on-demand vanuit de editor.
 */

export type ValidatieLevel = "ERROR" | "WARNING" | "INFO";

export interface ValidatieResultaat {
  regel: string;
  level: ValidatieLevel;
  band?: string;
  pijler?: string;
  item?: string;
  bericht: string;
}

interface PijlerData {
  code: string;
  naam: string;
  items: Array<{ itemCode: string; label: string; laag: string | null; actief: boolean }>;
}

interface GroepData {
  band: string;
  schaalType: string;
  maxScore: number;
  doelAantal: number;
  pijlers: PijlerData[];
}

interface VersieData {
  status: string;
  groepen: GroepData[];
}

// Welke lagen verplicht zijn per band
const LAAG_VEREIST_VANAF: Record<string, boolean> = {
  blauw: false,
  groen: false,
  geel: true,
  oranje: true,
  rood: true,
};

export function valideerCatalogus(versie: VersieData): ValidatieResultaat[] {
  const resultaten: ValidatieResultaat[] = [];

  // STATUS_LOCK: ACTIEF/GEARCHIVEERD niet bewerkbaar
  if (versie.status !== "CONCEPT") {
    resultaten.push({
      regel: "STATUS_LOCK",
      level: "ERROR",
      bericht: `Catalogus heeft status ${versie.status} en kan niet worden gepubliceerd`,
    });
    return resultaten; // Geen verdere validatie nodig
  }

  for (const groep of versie.groepen) {
    const actieveItems = groep.pijlers.flatMap((p) => p.items.filter((i) => i.actief));
    const totaalItems = actieveItems.length;

    // BAND_ITEM_RANGE: Items binnen doel +/- 20%
    if (groep.doelAantal > 0) {
      const min = Math.floor(groep.doelAantal * 0.8);
      const max = Math.ceil(groep.doelAantal * 1.2);
      if (totaalItems < min || totaalItems > max) {
        resultaten.push({
          regel: "BAND_ITEM_RANGE",
          level: "WARNING",
          band: groep.band,
          bericht: `${groep.band}: ${totaalItems} items (doel: ${groep.doelAantal}, bereik: ${min}-${max})`,
        });
      }
    }

    for (const pijler of groep.pijlers) {
      const actievePijlerItems = pijler.items.filter((i) => i.actief);

      // PIJLER_MIN_1: Elke pijler heeft minstens 1 actief item
      if (actievePijlerItems.length === 0) {
        resultaten.push({
          regel: "PIJLER_MIN_1",
          level: "ERROR",
          band: groep.band,
          pijler: pijler.code,
          bericht: `${groep.band}/${pijler.naam}: geen actieve items`,
        });
      }

      // PIJLER_BALANS: Geen pijler >50% van alle items
      if (totaalItems > 0 && actievePijlerItems.length / totaalItems > 0.5) {
        resultaten.push({
          regel: "PIJLER_BALANS",
          level: "WARNING",
          band: groep.band,
          pijler: pijler.code,
          bericht: `${groep.band}/${pijler.naam}: ${actievePijlerItems.length}/${totaalItems} items (>50%)`,
        });
      }

      // LAAG_VERPLICHT: Geel+: items moeten laag hebben
      if (LAAG_VEREIST_VANAF[groep.band]) {
        for (const item of actievePijlerItems) {
          // Alleen voor korfbalactie-pijlers (SCH, AAN, PAS, VER), niet voor FYS/MEN/SOC
          const isKorfbalactie = ["SCH", "AAN", "PAS", "VER"].includes(pijler.code);
          if (isKorfbalactie && !item.laag) {
            resultaten.push({
              regel: "LAAG_VERPLICHT",
              level: "ERROR",
              band: groep.band,
              pijler: pijler.code,
              item: item.itemCode,
              bericht: `${groep.band}/${pijler.naam}/${item.label}: laag ontbreekt (technisch/tactisch/mentaal)`,
            });
          }
        }
      }
    }
  }

  return resultaten;
}

export function heeftErrors(resultaten: ValidatieResultaat[]): boolean {
  return resultaten.some((r) => r.level === "ERROR");
}

export function telPerLevel(resultaten: ValidatieResultaat[]): Record<ValidatieLevel, number> {
  return {
    ERROR: resultaten.filter((r) => r.level === "ERROR").length,
    WARNING: resultaten.filter((r) => r.level === "WARNING").length,
    INFO: resultaten.filter((r) => r.level === "INFO").length,
  };
}
