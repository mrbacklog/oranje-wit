/**
 * Validatieregels voor de itemcatalogus.
 *
 * Controleert of de items in een leeftijdsgroep voldoen aan de
 * vaardigheidsraamwerk-regels (kern-items per pijler, totaal, etc.).
 */

import type { LeeftijdsgroepConfig } from "@oranje-wit/types";

// ============================================================
// Types
// ============================================================

export type RegelStatus = "ok" | "fout" | "waarschuwing";

export interface ValidatieRegel {
  regel: string;
  status: RegelStatus;
  detail: string;
}

export interface ValidatieResult {
  geldig: boolean;
  regels: ValidatieRegel[];
  totaalKernItems: number;
  totaalItems: number;
}

/** Minimale item-representatie voor validatie */
export interface ValidatieItem {
  id: string;
  pijlerId: string;
  itemCode: string;
  label: string;
  vraagTekst: string;
  isKern: boolean;
  actief: boolean;
}

/** Minimale pijler-representatie voor validatie */
export interface ValidatiePijler {
  id: string;
  code: string;
  naam: string;
  items: ValidatieItem[];
}

// ============================================================
// Validatie
// ============================================================

/**
 * Valideer de itemcatalogus voor een leeftijdsgroep.
 * Controleert:
 * 1. Elke pijler heeft minimaal 1 kern-item
 * 2. Totaal kern-items tussen 8 en 12
 * 3. Elke pijler heeft minimaal 1 item (kern of verdieping)
 * 4. Geen lege formuleringen
 */
export function valideerItemcatalogus(
  pijlers: ValidatiePijler[],
  config: LeeftijdsgroepConfig
): ValidatieResult {
  const regels: ValidatieRegel[] = [];
  let totaalKernItems = 0;
  let totaalItems = 0;

  // Per pijler checken
  for (const pijler of pijlers) {
    const actieveItems = pijler.items.filter((i) => i.actief);
    const kernItems = actieveItems.filter((i) => i.isKern);
    totaalKernItems += kernItems.length;
    totaalItems += actieveItems.length;

    // Regel 1: Elke pijler minimaal 1 kern-item
    if (kernItems.length === 0) {
      regels.push({
        regel: `Pijler "${pijler.naam}" heeft geen kern-items`,
        status: "fout",
        detail: `Voeg minimaal 1 kern-item toe aan ${pijler.naam}`,
      });
    } else {
      regels.push({
        regel: `Pijler "${pijler.naam}" heeft ${kernItems.length} kern-item(s)`,
        status: "ok",
        detail: `${kernItems.length} kern-item(s)`,
      });
    }

    // Regel 3: Elke pijler heeft minimaal 1 item
    if (actieveItems.length === 0) {
      regels.push({
        regel: `Pijler "${pijler.naam}" heeft geen actieve items`,
        status: "fout",
        detail: `Voeg minimaal 1 item toe aan ${pijler.naam}`,
      });
    }

    // Regel 4: Geen lege formuleringen
    for (const item of actieveItems) {
      if (!item.vraagTekst || item.vraagTekst.trim().length === 0) {
        regels.push({
          regel: `Item "${item.label}" heeft een lege formulering`,
          status: "fout",
          detail: `Vul de formulering in voor "${item.label}" (${pijler.naam})`,
        });
      }
      if (!item.label || item.label.trim().length === 0) {
        regels.push({
          regel: `Item in pijler "${pijler.naam}" heeft een leeg label`,
          status: "fout",
          detail: `Vul het label in`,
        });
      }
    }
  }

  // Regel 2: Totaal kern-items tussen 8 en 12
  const target = config.kernItemsTarget;
  if (totaalKernItems < 8) {
    regels.push({
      regel: `Te weinig kern-items: ${totaalKernItems} (minimaal 8)`,
      status: "fout",
      detail: `Voeg meer kern-items toe (target: ${target})`,
    });
  } else if (totaalKernItems > 12) {
    regels.push({
      regel: `Te veel kern-items: ${totaalKernItems} (maximaal 12)`,
      status: "waarschuwing",
      detail: `Overweeg items te markeren als verdieping (target: ${target})`,
    });
  } else {
    regels.push({
      regel: `Kern-items: ${totaalKernItems} (target: ${target})`,
      status: "ok",
      detail: `${totaalKernItems} kern-items, target is ${target}`,
    });
  }

  const geldig = regels.every((r) => r.status !== "fout");

  return {
    geldig,
    regels,
    totaalKernItems,
    totaalItems,
  };
}
