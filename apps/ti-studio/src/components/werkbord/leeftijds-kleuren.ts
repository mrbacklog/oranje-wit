/**
 * Leeftijdskleuren gebaseerd op KNKV Competitie 2.0 categoriekleuren
 * OW heeft "Paars" toegevoegd voor de jongste leeftijdsgroep (kangoeroe).
 *
 * Kleurenschema (goedgekeurd 2026-04-13, prototype spelerskaarten-v5.html):
 * Paars (4-5) → Blauw (6-7) → Groen (8-11) → Geel (12-13) → Oranje (14) → Rood (15-17) → Grijs (18+)
 */

const GRADIENT_MAP: Record<number, string> = {
  4: "linear-gradient(135deg, #6b21a8 0%, #9333ea 100%)",
  5: "linear-gradient(135deg, #9333ea 0%, #6d28d9 100%)",
  6: "linear-gradient(135deg, #6d28d9 0%, #2563eb 100%)",
  7: "linear-gradient(135deg, #2563eb 0%, #0369a1 100%)",
  8: "linear-gradient(135deg, #0284c7 0%, #0891b2 100%)",
  9: "linear-gradient(135deg, #0891b2 0%, #059669 100%)",
  10: "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
  11: "linear-gradient(135deg, #15803d 0%, #84cc16 100%)",
  12: "linear-gradient(135deg, #65a30d 0%, #ca8a04 100%)",
  13: "linear-gradient(135deg, #ca8a04 0%, #d97706 100%)",
  14: "linear-gradient(135deg, #d97706 0%, #ea580c 100%)",
  15: "linear-gradient(135deg, #ea580c 0%, #dc2626 100%)",
  16: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
  17: "linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)",
  18: "linear-gradient(135deg, #7f1d1d 0%, #4b5563 100%)",
};

const SENIOR_GRADIENT = "linear-gradient(135deg, #374151 0%, #1f2937 100%)";

const KLEUR_MAP: Record<number, string> = {
  4: "#9333ea",
  5: "#7c3aed",
  6: "#4f46e5",
  7: "#2563eb",
  8: "#0284c7",
  9: "#0891b2",
  10: "#16a34a",
  11: "#84cc16",
  12: "#ca8a04",
  13: "#d97706",
  14: "#ea580c",
  15: "#dc2626",
  16: "#b91c1c",
  17: "#7f1d1d",
  18: "#4b5563",
};

const SENIOR_KLEUR = "#475569";

/** CSS linear-gradient string voor de gegeven leeftijd (decimalen ok, neemt floor). */
export function leeftijdsGradient(leeftijd: number): string {
  const jaar = Math.floor(leeftijd);
  return GRADIENT_MAP[jaar] ?? SENIOR_GRADIENT;
}

/** Enkelvoudige hex-kleur voor border/glow/kleurband (decimalen ok, neemt floor). */
export function leeftijdsKleur(leeftijd: number): string {
  const jaar = Math.floor(leeftijd);
  return KLEUR_MAP[jaar] ?? SENIOR_KLEUR;
}
