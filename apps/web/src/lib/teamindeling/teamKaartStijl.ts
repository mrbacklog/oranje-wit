/**
 * Centrale stijllogica voor teamkaarten.
 * Twee-laags systeem: categorie-rand (altijd) + validatie-ring (optioneel).
 * Dark theme: alle klassen gebruiken CSS tokens.
 */

import type { TeamCategorie, Kleur } from "@oranje-wit/database";

/** KNKV kleurband gradients (als inline style) */
export const KLEUR_GRADIENT: Record<string, string> = {
  PAARS: "linear-gradient(135deg, #a855f7, #818cf8)",
  BLAUW: "linear-gradient(135deg, #3b82f6, #60a5fa)",
  GROEN: "linear-gradient(135deg, #22c55e, #a3c928)",
  GEEL: "linear-gradient(135deg, #eab308, #ca8a04)",
  ORANJE: "linear-gradient(135deg, #f97316, #ea580c)",
  ROOD: "linear-gradient(135deg, #ef4444, #b91c1c)",
};

/** Geeft de gradient string terug voor de teamkleur-header-band */
export function teamKleurGradient(kleur: Kleur | null): string {
  if (!kleur) return "linear-gradient(135deg, #374151, #1f2937)";
  return KLEUR_GRADIENT[kleur] ?? "linear-gradient(135deg, #374151, #1f2937)";
}

/** Bepaal de categorie-rand classes voor een los team */
export function categorieRandKlassen(categorie: TeamCategorie, _kleur: Kleur | null): string {
  if (categorie === "SENIOREN") {
    return "border border-[var(--border-default)]";
  }
  if (categorie === "A_CATEGORIE") {
    return "border border-dashed border-[var(--border-default)]";
  }
  // B_CATEGORIE
  return "border-2 border-[var(--border-default)]";
}

/** Bepaal de achtergrondkleur op basis van categorie */
export function categorieAchtergrond(_categorie: TeamCategorie, _kleur: Kleur | null): string {
  return "bg-[var(--surface-card)]";
}

/** Bepaal de header border-kleur */
export function categorieHeaderBorder(_categorie: TeamCategorie, _kleur: Kleur | null): string {
  return "border-b border-[var(--border-default)]";
}

/** Bepaal de footer border-kleur */
export function categorieFooterBorder(_categorie: TeamCategorie, _kleur: Kleur | null): string {
  return "border-t border-[var(--border-default)]";
}

/** Bepaal de validatie-ring classes (stapelt bovenop categorie-rand) */
export function validatieRingKlassen(
  validatieStatus: "ROOD" | "ORANJE" | "GROEN" | undefined,
  isOver: boolean
): string {
  if (isOver)
    return "ring-2 ring-[var(--ow-oranje-500)]/60 ring-offset-1 ring-offset-[var(--surface-card)]";
  if (validatieStatus === "ROOD") return "ring-2 ring-red-300 ring-offset-1";
  if (validatieStatus === "ORANJE") return "ring-1 ring-orange-300";
  return "";
}
