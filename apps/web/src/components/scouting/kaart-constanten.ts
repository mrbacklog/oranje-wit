import type { SpelersKaartProps } from "./spelers-kaart";
import type { PijlerConfig, LeeftijdsgroepNaamV3 } from "@oranje-wit/types";
import { LEEFTIJDSGROEP_CONFIG } from "@oranje-wit/types";

export type KaartSize = "mini" | "small" | "medium" | "large";

export const SIZE_CONFIG: Record<KaartSize, { cls: string }> = {
  mini: { cls: "w-[60px] h-[90px]" },
  small: { cls: "w-[120px] h-[180px]" },
  medium: { cls: "w-[180px] h-[270px]" },
  large: { cls: "w-[280px] h-[420px]" },
};

export const AGE_GRADIENTS: Record<number, { from: string; to: string }> = {
  5: { from: "#A855F7", to: "#818CF8" },
  6: { from: "#3B82F6", to: "#60A5FA" },
  7: { from: "#3B82F6", to: "#6DD5A3" },
  8: { from: "#22C55E", to: "#4ADE80" },
  9: { from: "#22C55E", to: "#BEF264" },
  10: { from: "#EAB308", to: "#BEF264" },
  11: { from: "#EAB308", to: "#FACC15" },
  12: { from: "#EAB308", to: "#FDBA74" },
  13: { from: "#F97316", to: "#FDE047" },
  14: { from: "#F97316", to: "#FB923C" },
  15: { from: "#F97316", to: "#FCA5A5" },
  16: { from: "#EF4444", to: "#FDBA74" },
  17: { from: "#EF4444", to: "#F87171" },
  18: { from: "#B91C1C", to: "#991B1B" },
};

export const TIER_STYLES: Record<string, { border: string; overlay: string }> = {
  brons: { border: "#CD7F32", overlay: "rgba(205, 127, 50, 0.08)" },
  zilver: { border: "#A8A9AD", overlay: "rgba(168, 169, 173, 0.08)" },
  goud: { border: "#D4A017", overlay: "rgba(212, 160, 23, 0.08)" },
};

// Legacy stat labels (backward compatible for old kaarten)
export const STAT_LABELS: Array<{ key: keyof SpelersKaartProps["stats"]; label: string }> = [
  { key: "schot", label: "SCH" },
  { key: "aanval", label: "AAN" },
  { key: "passing", label: "PAS" },
  { key: "verdediging", label: "VER" },
  { key: "fysiek", label: "FYS" },
  { key: "mentaal", label: "MEN" },
];

export const GROEP_LABELS: Record<string, string> = {
  paars: "Paars",
  blauw: "Blauw",
  groen: "Groen",
  geel: "Geel",
  oranje: "Oranje",
  rood: "Rood",
};

export function leeftijdNaarGroep(leeftijd: number): string {
  if (leeftijd <= 5) return "paars";
  if (leeftijd <= 7) return "blauw";
  if (leeftijd <= 9) return "groen";
  if (leeftijd <= 12) return "geel";
  if (leeftijd <= 15) return "oranje";
  return "rood";
}

export function getAgeGradient(leeftijd: number) {
  const clamped = Math.max(5, Math.min(18, leeftijd));
  return AGE_GRADIENTS[clamped] ?? AGE_GRADIENTS[14];
}

// ─── V3: dynamische pijler config voor kaart ───

/**
 * Haal de pijlers op voor een leeftijdsgroep, gegroepeerd per blok.
 * Gebruikt voor de dynamische spelerskaart.
 */
export function getPijlersVoorKaart(groep: string): {
  blokken: { naam: string; pijlers: PijlerConfig[] }[];
  allePijlers: PijlerConfig[];
} {
  const band = groep as LeeftijdsgroepNaamV3;
  const config = LEEFTIJDSGROEP_CONFIG[band];
  if (!config) return { blokken: [], allePijlers: [] };

  const blokMap = new Map<string, PijlerConfig[]>();
  for (const p of config.pijlers) {
    const blok = p.blok ?? "basis";
    if (!blokMap.has(blok)) blokMap.set(blok, []);
    blokMap.get(blok)!.push(p);
  }

  const BLOK_NAMEN: Record<string, string> = {
    korfbalacties: "Korfbalacties",
    spelerskwaliteiten: "Spelerskwaliteiten",
    persoonlijk: "Persoonlijk",
    basis: "Vaardigheden",
  };

  const blokken = Array.from(blokMap.entries()).map(([key, pijlers]) => ({
    naam: BLOK_NAMEN[key] ?? key,
    pijlers,
  }));

  return { blokken, allePijlers: config.pijlers };
}
