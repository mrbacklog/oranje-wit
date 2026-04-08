import type { SpelersKaartProps } from "./spelers-kaart";
import type { PijlerConfig, LeeftijdsgroepNaamV3 } from "@oranje-wit/types";
import { LEEFTIJDSGROEP_CONFIG } from "@oranje-wit/types";

export type KaartSize = "mini" | "small" | "medium" | "large";

export const SIZE_CONFIG: Record<KaartSize, { cls: string }> = {
  mini: { cls: "w-[60px] h-[90px]" },
  small: { cls: "w-[120px] h-[180px]" },
  medium: { cls: "w-[200px] h-[300px]" },
  large: { cls: "w-[300px] h-[450px]" },
};

export const AGE_GRADIENTS: Record<number, { from: string; to: string }> = {
  5: { from: "var(--age-5-from)", to: "var(--age-5-to)" },
  6: { from: "var(--age-6-from)", to: "var(--age-6-to)" },
  7: { from: "var(--age-7-from)", to: "var(--age-7-to)" },
  8: { from: "var(--age-8-from)", to: "var(--age-8-to)" },
  9: { from: "var(--age-9-from)", to: "var(--age-9-to)" },
  10: { from: "var(--age-10-from)", to: "var(--age-10-to)" },
  11: { from: "var(--age-11-from)", to: "var(--age-11-to)" },
  12: { from: "var(--age-12-from)", to: "var(--age-12-to)" },
  13: { from: "var(--age-13-from)", to: "var(--age-13-to)" },
  14: { from: "var(--age-14-from)", to: "var(--age-14-to)" },
  15: { from: "var(--age-15-from)", to: "var(--age-15-to)" },
  16: { from: "var(--age-16-from)", to: "var(--age-16-to)" },
  17: { from: "var(--age-17-from)", to: "var(--age-17-to)" },
  18: { from: "var(--age-18-from)", to: "var(--age-18-to)" },
};

export const TIER_STYLES: Record<string, { border: string; overlay: string }> = {
  brons: { border: "var(--tier-brons-border)", overlay: "var(--tier-brons-bg-overlay)" },
  zilver: { border: "var(--tier-zilver-border)", overlay: "var(--tier-zilver-bg-overlay)" },
  goud: { border: "var(--tier-goud-border)", overlay: "var(--tier-goud-bg-overlay)" },
};

// Gradient-rand per tier (v4 kaart shell)
export const TIER_BORDER_GRADIENTS: Record<string, string> = {
  brons: "linear-gradient(160deg, #d4954a, #cd7f32, #8b5e23, #cd7f32)",
  zilver: "linear-gradient(160deg, #e8e8e8, #c0c0c0, #808080, #e8e8e8)",
  goud: "linear-gradient(160deg, #ffe44d, #ffd700, #b8960f, #ffe44d)",
};

// Schild glow per tier
export const SCHILD_GLOWS: Record<string, string> = {
  brons: "drop-shadow(0 4px 12px rgba(0,0,0,.55)) drop-shadow(0 0 14px rgba(205,127,50,.6))",
  zilver: "drop-shadow(0 4px 12px rgba(0,0,0,.55)) drop-shadow(0 0 18px rgba(192,192,192,.7))",
  goud: "drop-shadow(0 4px 12px rgba(0,0,0,.55)) drop-shadow(0 0 22px rgba(255,215,0,.8))",
};

// Ring gradient per tier (schild rand)
export const SCHILD_RING_GRADIENTS: Record<string, string> = {
  brons: "linear-gradient(160deg, #d4954a, #cd7f32, #8b5e23)",
  zilver: "linear-gradient(160deg, #e8e8e8, #c0c0c0, #808080)",
  goud: "linear-gradient(160deg, #ffe44d, #ffd700, #b8960f)",
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
