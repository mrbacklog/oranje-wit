/**
 * Centrale stijllogica voor teamkaarten.
 * Twee-laags systeem: categorie-rand (altijd) + validatie-ring (optioneel).
 */

import type { TeamCategorie, Kleur } from "@oranje-wit/database";

/** Solid border-kleur per B-categorie kleur */
const KLEUR_RAND: Record<string, string> = {
  PAARS: "border-purple-400",
  BLAUW: "border-blue-400",
  GROEN: "border-emerald-400",
  GEEL: "border-yellow-400",
  ORANJE: "border-orange-400",
  ROOD: "border-red-400",
};

/** Subtiele achtergrondtint per B-categorie kleur */
const KLEUR_BG: Record<string, string> = {
  PAARS: "bg-purple-50/30",
  BLAUW: "bg-blue-50/30",
  GROEN: "bg-emerald-50/30",
  GEEL: "bg-yellow-50/30",
  ORANJE: "bg-orange-50/30",
  ROOD: "bg-red-50/30",
};

/** Header-border accent per kleur */
const KLEUR_HEADER: Record<string, string> = {
  PAARS: "border-purple-200",
  BLAUW: "border-blue-200",
  GROEN: "border-emerald-200",
  GEEL: "border-yellow-200",
  ORANJE: "border-orange-200",
  ROOD: "border-red-200",
};

/** Footer-border accent per kleur */
const KLEUR_FOOTER: Record<string, string> = {
  PAARS: "border-purple-100",
  BLAUW: "border-blue-100",
  GROEN: "border-emerald-100",
  GEEL: "border-yellow-100",
  ORANJE: "border-orange-100",
  ROOD: "border-red-100",
};

/** Bepaal de categorie-rand classes voor een los team */
export function categorieRandKlassen(categorie: TeamCategorie, kleur: Kleur | null): string {
  if (categorie === "SENIOREN") {
    return "border border-gray-300";
  }
  if (categorie === "A_CATEGORIE") {
    return "border-2 border-dashed border-orange-300";
  }
  // B_CATEGORIE: solid rand in kleurklasse
  return kleur ? `border-2 ${KLEUR_RAND[kleur] ?? "border-gray-200"}` : "border border-gray-200";
}

/** Bepaal de achtergrondkleur op basis van categorie */
export function categorieAchtergrond(categorie: TeamCategorie, kleur: Kleur | null): string {
  if (categorie === "SENIOREN") return "bg-gray-50/30";
  if (categorie === "A_CATEGORIE") return "bg-orange-50/20";
  return kleur ? (KLEUR_BG[kleur] ?? "bg-white") : "bg-white";
}

/** Bepaal de header border-kleur */
export function categorieHeaderBorder(categorie: TeamCategorie, kleur: Kleur | null): string {
  if (categorie === "B_CATEGORIE" && kleur) {
    return `border-b ${KLEUR_HEADER[kleur] ?? "border-gray-100"}`;
  }
  if (categorie === "A_CATEGORIE") return "border-b border-orange-100";
  return "border-b border-gray-100";
}

/** Bepaal de footer border-kleur */
export function categorieFooterBorder(categorie: TeamCategorie, kleur: Kleur | null): string {
  if (categorie === "B_CATEGORIE" && kleur) {
    return `border-t ${KLEUR_FOOTER[kleur] ?? "border-gray-100"}`;
  }
  if (categorie === "A_CATEGORIE") return "border-t border-orange-100";
  return "border-t border-gray-100";
}

/** Bepaal de validatie-ring classes (stapelt bovenop categorie-rand) */
export function validatieRingKlassen(
  validatieStatus: "ROOD" | "ORANJE" | "GROEN" | undefined,
  isOver: boolean
): string {
  if (isOver) return "ring-2 ring-orange-200 ring-offset-1";
  if (validatieStatus === "ROOD") return "ring-2 ring-red-300 ring-offset-1";
  if (validatieStatus === "ORANJE") return "ring-1 ring-orange-300";
  return "";
}
