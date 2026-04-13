/**
 * Constanten en lookup-tabellen voor regelvalidatie.
 */

/** Standaard teamgrootte-grenzen (gebruikt als fallback). */
export const DEFAULT_TEAMGROOTTE = {
  viertal: { min: 4, ideaalMin: 5, ideaalMax: 6, max: 8 },
  achttal: { min: 8, ideaalMin: 9, ideaalMax: 11, max: 13 },
} as const;

export const KLEUR_FORMAT: Record<string, "viertal" | "achttal"> = {
  PAARS: "viertal",
  BLAUW: "viertal",
  GROEN: "viertal",
  GEEL: "achttal",
  ORANJE: "achttal",
  ROOD: "achttal",
};

/** Leeftijdsrange per kleur (individuele korfballeeftijd in peiljaar).
 *  Gebaseerd op landelijke conceptindelingen veld voorjaar 2026. */
export const KLEUR_LEEFTIJD: Record<string, { min: number; max: number }> = {
  PAARS: { min: 4, max: 6 },
  BLAUW: { min: 5, max: 8 },
  GROEN: { min: 7, max: 10 },
  GEEL: { min: 9, max: 13 },
  ORANJE: { min: 11, max: 15 },
  ROOD: { min: 13, max: 19 },
};

export const MIN_GEMIDDELDE_LEEFTIJD_8TAL = 9.0;

/** Volgorde van kleuren van jong naar oud. */
export const KLEUR_VOLGORDE = ["PAARS", "BLAUW", "GROEN", "GEEL", "ORANJE", "ROOD"] as const;

/** Veilige range gem. leeftijd per kleur (p5-p95 landelijke conceptindelingen veld voorjaar 2026).
 *  Teams buiten deze range lopen risico op herindeling naar een andere kleur. */
export const KLEUR_VEILIGE_RANGE: Record<string, { min: number; max: number }> = {
  PAARS: { min: 4.0, max: 5.5 },
  BLAUW: { min: 6.3, max: 7.8 },
  GROEN: { min: 7.6, max: 9.5 },
  GEEL: { min: 9.2, max: 11.8 },
  ORANJE: { min: 11.6, max: 13.8 },
  ROOD: { min: 13.8, max: 18.0 },
};
