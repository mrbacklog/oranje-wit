/**
 * Categorie-kaders: types, defaults en constanten voor het
 * configureerbare categorie-overzicht in de blauwdruk.
 */

// ============================================================
// Types
// ============================================================

export interface CategorieSettings {
  // Teamsamenstelling
  minSpelers: number;
  optimaalSpelers: number;
  maxAfwijkingPercentage: number; // berekent max = ceil(optimaal * (1 + pct/100))

  // Gender
  verplichtMinV: number;
  verplichtMinM: number;
  gewenstMinV: number;
  gewenstMinM: number;
  monogenderToestaan: boolean;

  // Leeftijdsgrenzen (korfballeeftijd, 2 decimalen)
  // Kern: ideale range waar teams zouden moeten zitten
  gemiddeldeLeeftijdKernMin: number | null;
  gemiddeldeLeeftijdKernMax: number | null;
  // Overlap: bredere range die de KNKV accepteert (op basis van score/sterkte)
  gemiddeldeLeeftijdOverlapMin: number | null;
  gemiddeldeLeeftijdOverlapMax: number | null;
  maxLeeftijd: number | null; // null = geen limiet
  bandbreedteLeeftijd: number | null; // null = geen limiet

  // KNKV score-drempel (punten waaronder/waarboven team in deze kleur valt)
  scoreDrempel: number | null; // null = n.v.t.

  // Speeltijd
  speeltijdMinuten: number;
  speeltijdZuiver: boolean;

  // Spelvorm
  korfhoogte: number; // 2.5 | 3 | 3.5
  balMaat: number; // 3 | 4 | 5
  wisselsAantal: number | null; // null = onbeperkt
  vakwisselType: "doelpunten" | "tijd" | "nvt";

  // Prioriteit (max 3)
  prioriteiten: string[];
}

/** Per-categorie kaders opgeslagen in Blauwdruk.kaders JSON */
export type CategorieKaders = Record<string, Partial<CategorieSettings>>;

// ============================================================
// Constanten
// ============================================================

export const PRIORITEIT_OPTIES = [
  "Plezier",
  "Sociaal",
  "Ontwikkeling",
  "Teamsterkte",
  "Doorstroming",
  "Retentie",
  "Genderbalans",
] as const;

export const KORFHOOGTE_OPTIES = [2.5, 3, 3.5] as const;
export const BALMAAT_OPTIES = [3, 4, 5] as const;
export const VAKWISSEL_OPTIES = [
  { value: "doelpunten" as const, label: "Na 2 doelpunten" },
  { value: "tijd" as const, label: "Op tijd" },
  { value: "nvt" as const, label: "N.v.t." },
];

// ============================================================
// Categorie-definities (vaste structuur, niet configureerbaar)
// ============================================================

export interface CategorieDefinitie {
  sleutel: string;
  label: string;
  kleur: string; // Tailwind kleur voor top-bar
  type: "b-viertal" | "b-achttal" | "a-categorie" | "senioren" | "kangoeroes";
  leeftijdRange: string; // weergavetekst
  spelvorm: string; // "4-tal" | "8-tal" | "–"
}

// Volgorde: oudste → jongste (Senioren, A-cat, B-kleuren, Kangoeroes)
export const CATEGORIEEN: CategorieDefinitie[] = [
  { sleutel: "SENIOREN_A", label: "Senioren A", kleur: "bg-gray-600", type: "senioren", leeftijdRange: "19+ jaar", spelvorm: "8-tal" },
  { sleutel: "SENIOREN_B", label: "Senioren B", kleur: "bg-gray-400", type: "senioren", leeftijdRange: "19+ jaar", spelvorm: "8-tal" },
  { sleutel: "JEUGD_A", label: "Jeugd A (U-teams)", kleur: "bg-rose-600", type: "a-categorie", leeftijdRange: "13–18 jaar", spelvorm: "8-tal" },
  { sleutel: "ROOD", label: "Rood", kleur: "bg-red-500", type: "b-achttal", leeftijdRange: "13–18 jaar", spelvorm: "8-tal" },
  { sleutel: "ORANJE", label: "Oranje", kleur: "bg-orange-500", type: "b-achttal", leeftijdRange: "11–14 jaar", spelvorm: "8-tal" },
  { sleutel: "GEEL", label: "Geel", kleur: "bg-yellow-500", type: "b-achttal", leeftijdRange: "9–12 jaar", spelvorm: "8-tal" },
  { sleutel: "GROEN", label: "Groen", kleur: "bg-green-500", type: "b-viertal", leeftijdRange: "7–10 jaar", spelvorm: "4-tal" },
  { sleutel: "BLAUW", label: "Blauw", kleur: "bg-blue-500", type: "b-viertal", leeftijdRange: "5–8 jaar", spelvorm: "4-tal" },
  { sleutel: "KANGOEROES", label: "Kangoeroes", kleur: "bg-purple-400", type: "kangoeroes", leeftijdRange: "4–6 jaar", spelvorm: "–" },
];

// ============================================================
// Defaults per categorie
// ============================================================

const D: Record<string, CategorieSettings> = {
  KANGOEROES: {
    minSpelers: 0, optimaalSpelers: 0, maxAfwijkingPercentage: 0,
    verplichtMinV: 0, verplichtMinM: 0, gewenstMinV: 0, gewenstMinM: 0, monogenderToestaan: true,
    gemiddeldeLeeftijdKernMin: 4.0, gemiddeldeLeeftijdKernMax: 6.0,
    gemiddeldeLeeftijdOverlapMin: 4.0, gemiddeldeLeeftijdOverlapMax: 6.0,
    maxLeeftijd: null, bandbreedteLeeftijd: null, scoreDrempel: null,
    speeltijdMinuten: 0, speeltijdZuiver: false,
    korfhoogte: 2.5, balMaat: 3, wisselsAantal: null, vakwisselType: "nvt",
    prioriteiten: ["Plezier"],
  },
  BLAUW: {
    minSpelers: 4, optimaalSpelers: 5, maxAfwijkingPercentage: 20,
    verplichtMinV: 0, verplichtMinM: 0, gewenstMinV: 2, gewenstMinM: 2, monogenderToestaan: true,
    gemiddeldeLeeftijdKernMin: 5.5, gemiddeldeLeeftijdKernMax: 7.5,
    gemiddeldeLeeftijdOverlapMin: 5.0, gemiddeldeLeeftijdOverlapMax: 8.0,
    maxLeeftijd: null, bandbreedteLeeftijd: 2.0, scoreDrempel: 55,
    speeltijdMinuten: 20, speeltijdZuiver: false,
    korfhoogte: 2.5, balMaat: 3, wisselsAantal: null, vakwisselType: "nvt",
    prioriteiten: ["Plezier"],
  },
  GROEN: {
    minSpelers: 4, optimaalSpelers: 5, maxAfwijkingPercentage: 20,
    verplichtMinV: 0, verplichtMinM: 0, gewenstMinV: 2, gewenstMinM: 2, monogenderToestaan: true,
    gemiddeldeLeeftijdKernMin: 7.5, gemiddeldeLeeftijdKernMax: 9.5,
    gemiddeldeLeeftijdOverlapMin: 7.0, gemiddeldeLeeftijdOverlapMax: 10.0,
    maxLeeftijd: null, bandbreedteLeeftijd: 2.0, scoreDrempel: 75,
    speeltijdMinuten: 20, speeltijdZuiver: false,
    korfhoogte: 3.0, balMaat: 4, wisselsAantal: null, vakwisselType: "nvt",
    prioriteiten: ["Sociaal", "Ontwikkeling"],
  },
  GEEL: {
    minSpelers: 8, optimaalSpelers: 10, maxAfwijkingPercentage: 40,
    verplichtMinV: 0, verplichtMinM: 0, gewenstMinV: 2, gewenstMinM: 2, monogenderToestaan: false,
    gemiddeldeLeeftijdKernMin: 9.5, gemiddeldeLeeftijdKernMax: 12.0,
    gemiddeldeLeeftijdOverlapMin: 9.0, gemiddeldeLeeftijdOverlapMax: 12.5,
    maxLeeftijd: null, bandbreedteLeeftijd: 3.0, scoreDrempel: 90,
    speeltijdMinuten: 25, speeltijdZuiver: false,
    korfhoogte: 3.0, balMaat: 4, wisselsAantal: null, vakwisselType: "tijd",
    prioriteiten: ["Ontwikkeling", "Sociaal"],
  },
  ORANJE: {
    minSpelers: 8, optimaalSpelers: 10, maxAfwijkingPercentage: 40,
    verplichtMinV: 0, verplichtMinM: 0, gewenstMinV: 2, gewenstMinM: 2, monogenderToestaan: false,
    gemiddeldeLeeftijdKernMin: 12.0, gemiddeldeLeeftijdKernMax: 13.5,
    gemiddeldeLeeftijdOverlapMin: 11.0, gemiddeldeLeeftijdOverlapMax: 14.0,
    maxLeeftijd: null, bandbreedteLeeftijd: 3.0, scoreDrempel: 100,
    speeltijdMinuten: 25, speeltijdZuiver: false,
    korfhoogte: 3.5, balMaat: 5, wisselsAantal: null, vakwisselType: "tijd",
    prioriteiten: ["Ontwikkeling", "Sociaal"],
  },
  ROOD: {
    minSpelers: 8, optimaalSpelers: 10, maxAfwijkingPercentage: 40,
    verplichtMinV: 0, verplichtMinM: 0, gewenstMinV: 2, gewenstMinM: 2, monogenderToestaan: false,
    gemiddeldeLeeftijdKernMin: 13.5, gemiddeldeLeeftijdKernMax: 18.0,
    gemiddeldeLeeftijdOverlapMin: 13.0, gemiddeldeLeeftijdOverlapMax: 18.5,
    maxLeeftijd: null, bandbreedteLeeftijd: 3.0, scoreDrempel: null,
    speeltijdMinuten: 30, speeltijdZuiver: false,
    korfhoogte: 3.5, balMaat: 5, wisselsAantal: null, vakwisselType: "doelpunten",
    prioriteiten: ["Sociaal", "Ontwikkeling"],
  },
  JEUGD_A: {
    minSpelers: 8, optimaalSpelers: 10, maxAfwijkingPercentage: 20,
    verplichtMinV: 4, verplichtMinM: 4, gewenstMinV: 5, gewenstMinM: 5, monogenderToestaan: false,
    gemiddeldeLeeftijdKernMin: 13.0, gemiddeldeLeeftijdKernMax: 18.0,
    gemiddeldeLeeftijdOverlapMin: 13.0, gemiddeldeLeeftijdOverlapMax: 19.0,
    maxLeeftijd: 18.99, bandbreedteLeeftijd: 2.0, scoreDrempel: null,
    speeltijdMinuten: 30, speeltijdZuiver: false,
    korfhoogte: 3.5, balMaat: 5, wisselsAantal: null, vakwisselType: "doelpunten",
    prioriteiten: ["Teamsterkte", "Ontwikkeling"],
  },
  SENIOREN_A: {
    minSpelers: 8, optimaalSpelers: 10, maxAfwijkingPercentage: 20,
    verplichtMinV: 4, verplichtMinM: 4, gewenstMinV: 5, gewenstMinM: 5, monogenderToestaan: false,
    gemiddeldeLeeftijdKernMin: null, gemiddeldeLeeftijdKernMax: null,
    gemiddeldeLeeftijdOverlapMin: null, gemiddeldeLeeftijdOverlapMax: null,
    maxLeeftijd: null, bandbreedteLeeftijd: null, scoreDrempel: null,
    speeltijdMinuten: 30, speeltijdZuiver: false,
    korfhoogte: 3.5, balMaat: 5, wisselsAantal: null, vakwisselType: "doelpunten",
    prioriteiten: ["Teamsterkte"],
  },
  SENIOREN_B: {
    minSpelers: 8, optimaalSpelers: 10, maxAfwijkingPercentage: 40,
    verplichtMinV: 0, verplichtMinM: 0, gewenstMinV: 2, gewenstMinM: 2, monogenderToestaan: false,
    gemiddeldeLeeftijdKernMin: null, gemiddeldeLeeftijdKernMax: null,
    gemiddeldeLeeftijdOverlapMin: null, gemiddeldeLeeftijdOverlapMax: null,
    maxLeeftijd: null, bandbreedteLeeftijd: null, scoreDrempel: null,
    speeltijdMinuten: 30, speeltijdZuiver: false,
    korfhoogte: 3.5, balMaat: 5, wisselsAantal: null, vakwisselType: "tijd",
    prioriteiten: ["Sociaal"],
  },
};

export const CATEGORIE_DEFAULTS = D;

/**
 * Merge opgeslagen kaders met defaults.
 * Opgeslagen waarden overschrijven defaults.
 */
export function getMergedSettings(
  sleutel: string,
  opgeslagen: CategorieKaders
): CategorieSettings {
  const defaults = CATEGORIE_DEFAULTS[sleutel];
  if (!defaults) throw new Error(`Onbekende categorie: ${sleutel}`);
  const override = opgeslagen[sleutel];
  if (!override) return { ...defaults };
  return { ...defaults, ...override };
}
