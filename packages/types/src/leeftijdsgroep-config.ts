/**
 * Leeftijdsgroep-configuratie — VASTE structuur per leeftijdsgroep.
 *
 * Dit is de hardcoded referentie die de database-versie valideert.
 * De database is leidend voor items; deze constante definieert de vaste structuur:
 * pijlernamen, schaaltype, USS-parameters, gewichten.
 *
 * Bron: docs/jeugdontwikkeling/vaardigheidsraamwerk-v3.md
 *       docs/jeugdontwikkeling/scoremodel-v2-concept.md
 *       docs/jeugdontwikkeling/technische-specificatie.md
 */

// ============================================================
// Types
// ============================================================

export type PijlerCode =
  | "BAL"
  | "BEWEGEN"
  | "SPEL"
  | "SAMEN"
  | "IK" // Blauw/Groen
  | "AANVALLEN"
  | "VERDEDIGEN"
  | "TECHNIEK"
  | "TACTIEK" // Geel+
  | "MENTAAL"
  | "FYSIEK" // Geel+
  | "SOCIAAL" // Oranje+
  | "SCOREN"
  | "SPELINTELLIGENTIE"; // Rood

export type Blok = "korfbalacties" | "spelerskwaliteiten" | "persoonlijk";

export type SchaalTypeV3 =
  | "observatie" // Paars: checkbox "Geobserveerd"
  | "ja_nogniet" // Blauw: 2 niveaus (Ja / Nog niet)
  | "goed_oke_nogniet" // Groen: 3 niveaus (Goed / Oke / Nog niet)
  | "sterren" // Geel: 1-5
  | "slider"; // Oranje/Rood: 1-10

export type LeeftijdsgroepNaamV3 = "paars" | "blauw" | "groen" | "geel" | "oranje" | "rood";

/** Alias — LeeftijdsgroepNaam en LeeftijdsgroepNaamV3 zijn identiek */
export type LeeftijdsgroepNaam = LeeftijdsgroepNaamV3;

/** Configuratie van een enkele pijler */
export interface PijlerConfig {
  code: PijlerCode;
  naam: string;
  icoon: string;
  blok: Blok | null; // null voor Blauw/Groen (geen blokken)
  gewicht: number; // USS-gewicht (bijv. 0.25)
}

/** Volledige configuratie per leeftijdsgroep */
export interface LeeftijdsgroepConfig {
  band: LeeftijdsgroepNaamV3;
  leeftijdMin: number;
  leeftijdMax: number;
  schaalType: SchaalTypeV3;
  schaalMin: number;
  schaalMax: number;
  schaalMediaan: number;
  halveBereik: number;
  bandbreedteCoach: number; // B_coach (USS-punten)
  bandbreedteScout: number; // B_scout (USS-punten)
  kernItemsTarget: number; // Target: ~10
  pijlers: PijlerConfig[];
  heeftFysiekProfiel: boolean;
  heeftSignaalvlag: boolean; // sociale veiligheid
  signaalvlagType: "ja_nee" | "scorend" | null;
  heeftInzoom: boolean; // false bij blauw/groen, true bij geel+
}

// ============================================================
// KNKV 8-acties mapping per pijler (voor inzoom, geel+)
// ============================================================

/** De 8 KNKV-acties en welke pijler ze voeden per leeftijdsgroep */
export const KNKV_ACTIES_MAPPING = {
  1: {
    naam: "Schieten",
    pijlerGeel: "AANVALLEN" as PijlerCode,
    pijlerRood: "SCOREN" as PijlerCode,
  },
  2: {
    naam: "Vrijlopen om te schieten",
    pijlerGeel: "AANVALLEN" as PijlerCode,
    pijlerRood: "AANVALLEN" as PijlerCode,
  },
  3: {
    naam: "Vrijpassen om te schieten",
    pijlerGeel: "AANVALLEN" as PijlerCode,
    pijlerRood: "AANVALLEN" as PijlerCode,
  },
  4: {
    naam: "In balbezit blijven",
    pijlerGeel: "AANVALLEN" as PijlerCode,
    pijlerRood: "AANVALLEN" as PijlerCode,
  },
  5: {
    naam: "Voorkomen van schieten",
    pijlerGeel: "VERDEDIGEN" as PijlerCode,
    pijlerRood: "VERDEDIGEN" as PijlerCode,
  },
  6: {
    naam: "Voorkomen van vrijlopen",
    pijlerGeel: "VERDEDIGEN" as PijlerCode,
    pijlerRood: "VERDEDIGEN" as PijlerCode,
  },
  7: {
    naam: "Voorkomen van vrijpassen",
    pijlerGeel: "VERDEDIGEN" as PijlerCode,
    pijlerRood: "VERDEDIGEN" as PijlerCode,
  },
  8: {
    naam: "In balbezit komen",
    pijlerGeel: "VERDEDIGEN" as PijlerCode,
    pijlerRood: "VERDEDIGEN" as PijlerCode,
  },
} as const;

// ============================================================
// Configuratie per leeftijdsgroep
// ============================================================

export const LEEFTIJDSGROEP_CONFIG: Record<LeeftijdsgroepNaamV3, LeeftijdsgroepConfig> = {
  paars: {
    band: "paars",
    leeftijdMin: 4,
    leeftijdMax: 5,
    schaalType: "observatie",
    schaalMin: 0,
    schaalMax: 1,
    schaalMediaan: 0.5,
    halveBereik: 0.5,
    bandbreedteCoach: 0,
    bandbreedteScout: 0, // geen USS bij Paars
    kernItemsTarget: 3,
    pijlers: [], // Paars: geen pijlers, alleen observatienotitie
    heeftFysiekProfiel: false,
    heeftSignaalvlag: false,
    signaalvlagType: null,
    heeftInzoom: false,
  },
  blauw: {
    band: "blauw",
    leeftijdMin: 5,
    leeftijdMax: 7,
    schaalType: "ja_nogniet",
    schaalMin: 0,
    schaalMax: 100,
    schaalMediaan: 50,
    halveBereik: 50,
    bandbreedteCoach: 15,
    bandbreedteScout: 18,
    kernItemsTarget: 10,
    pijlers: [
      { code: "BAL", naam: "Bal", icoon: "ball", blok: null, gewicht: 0.25 },
      { code: "BEWEGEN", naam: "Bewegen", icoon: "run", blok: null, gewicht: 0.25 },
      { code: "SPEL", naam: "Spel", icoon: "game", blok: null, gewicht: 0.25 },
      { code: "SAMEN", naam: "Samen", icoon: "team", blok: null, gewicht: 0.125 },
      { code: "IK", naam: "Ik", icoon: "star", blok: null, gewicht: 0.125 },
    ],
    heeftFysiekProfiel: false,
    heeftSignaalvlag: true,
    signaalvlagType: "ja_nee",
    heeftInzoom: false,
  },
  groen: {
    band: "groen",
    leeftijdMin: 8,
    leeftijdMax: 9,
    schaalType: "goed_oke_nogniet",
    schaalMin: 0,
    schaalMax: 100,
    schaalMediaan: 50,
    halveBereik: 50,
    bandbreedteCoach: 18,
    bandbreedteScout: 22,
    kernItemsTarget: 10,
    pijlers: [
      { code: "BAL", naam: "Bal", icoon: "ball", blok: null, gewicht: 0.25 },
      { code: "BEWEGEN", naam: "Bewegen", icoon: "run", blok: null, gewicht: 0.25 },
      { code: "SPEL", naam: "Spel", icoon: "game", blok: null, gewicht: 0.25 },
      { code: "SAMEN", naam: "Samen", icoon: "team", blok: null, gewicht: 0.125 },
      { code: "IK", naam: "Ik", icoon: "star", blok: null, gewicht: 0.125 },
    ],
    heeftFysiekProfiel: false,
    heeftSignaalvlag: true,
    signaalvlagType: "ja_nee",
    heeftInzoom: false,
  },
  geel: {
    band: "geel",
    leeftijdMin: 10,
    leeftijdMax: 12,
    schaalType: "sterren",
    schaalMin: 1.0,
    schaalMax: 5.0,
    schaalMediaan: 3.0,
    halveBereik: 2.0,
    bandbreedteCoach: 20,
    bandbreedteScout: 28,
    kernItemsTarget: 10,
    pijlers: [
      { code: "AANVALLEN", naam: "Aanvallen", icoon: "zap", blok: "korfbalacties", gewicht: 0.18 },
      {
        code: "VERDEDIGEN",
        naam: "Verdedigen",
        icoon: "shield",
        blok: "korfbalacties",
        gewicht: 0.18,
      },
      {
        code: "TECHNIEK",
        naam: "Techniek",
        icoon: "target",
        blok: "spelerskwaliteiten",
        gewicht: 0.18,
      },
      {
        code: "TACTIEK",
        naam: "Tactiek",
        icoon: "puzzle",
        blok: "spelerskwaliteiten",
        gewicht: 0.18,
      },
      {
        code: "MENTAAL",
        naam: "Mentaal",
        icoon: "brain",
        blok: "spelerskwaliteiten",
        gewicht: 0.14,
      },
      {
        code: "FYSIEK",
        naam: "Fysiek",
        icoon: "muscle",
        blok: "spelerskwaliteiten",
        gewicht: 0.14,
      },
    ],
    heeftFysiekProfiel: true,
    heeftSignaalvlag: true,
    signaalvlagType: "scorend",
    heeftInzoom: true,
  },
  oranje: {
    band: "oranje",
    leeftijdMin: 13,
    leeftijdMax: 15,
    schaalType: "slider",
    schaalMin: 1.0,
    schaalMax: 10.0,
    schaalMediaan: 5.5,
    halveBereik: 4.5,
    bandbreedteCoach: 22,
    bandbreedteScout: 30,
    kernItemsTarget: 10,
    pijlers: [
      { code: "AANVALLEN", naam: "Aanvallen", icoon: "zap", blok: "korfbalacties", gewicht: 0.16 },
      {
        code: "VERDEDIGEN",
        naam: "Verdedigen",
        icoon: "shield",
        blok: "korfbalacties",
        gewicht: 0.16,
      },
      {
        code: "TECHNIEK",
        naam: "Techniek",
        icoon: "target",
        blok: "spelerskwaliteiten",
        gewicht: 0.16,
      },
      {
        code: "TACTIEK",
        naam: "Tactiek",
        icoon: "puzzle",
        blok: "spelerskwaliteiten",
        gewicht: 0.16,
      },
      { code: "MENTAAL", naam: "Mentaal", icoon: "brain", blok: "persoonlijk", gewicht: 0.12 },
      { code: "SOCIAAL", naam: "Sociaal", icoon: "users", blok: "persoonlijk", gewicht: 0.12 },
      { code: "FYSIEK", naam: "Fysiek", icoon: "muscle", blok: "persoonlijk", gewicht: 0.12 },
    ],
    heeftFysiekProfiel: true,
    heeftSignaalvlag: true,
    signaalvlagType: "scorend",
    heeftInzoom: true,
  },
  rood: {
    band: "rood",
    leeftijdMin: 16,
    leeftijdMax: 18,
    schaalType: "slider",
    schaalMin: 1.0,
    schaalMax: 10.0,
    schaalMediaan: 5.5,
    halveBereik: 4.5,
    bandbreedteCoach: 25,
    bandbreedteScout: 32,
    kernItemsTarget: 9, // 9 pijlers, 1 kern-item per pijler
    pijlers: [
      { code: "AANVALLEN", naam: "Aanvallen", icoon: "zap", blok: "korfbalacties", gewicht: 0.12 },
      {
        code: "VERDEDIGEN",
        naam: "Verdedigen",
        icoon: "shield",
        blok: "korfbalacties",
        gewicht: 0.12,
      },
      { code: "SCOREN", naam: "Scoren", icoon: "target", blok: "korfbalacties", gewicht: 0.12 },
      {
        code: "TECHNIEK",
        naam: "Techniek",
        icoon: "wrench",
        blok: "spelerskwaliteiten",
        gewicht: 0.12,
      },
      {
        code: "TACTIEK",
        naam: "Tactiek",
        icoon: "puzzle",
        blok: "spelerskwaliteiten",
        gewicht: 0.1,
      },
      {
        code: "SPELINTELLIGENTIE",
        naam: "Spelintelligentie",
        icoon: "brain",
        blok: "spelerskwaliteiten",
        gewicht: 0.1,
      },
      { code: "MENTAAL", naam: "Mentaal", icoon: "lightbulb", blok: "persoonlijk", gewicht: 0.1 },
      { code: "SOCIAAL", naam: "Sociaal", icoon: "users", blok: "persoonlijk", gewicht: 0.1 },
      { code: "FYSIEK", naam: "Fysiek", icoon: "muscle", blok: "persoonlijk", gewicht: 0.12 },
    ],
    heeftFysiekProfiel: true,
    heeftSignaalvlag: true,
    signaalvlagType: "scorend",
    heeftInzoom: true,
  },
};

// ============================================================
// Pijler-ondertitels per leeftijdsgroep
// ============================================================

/** Korte beschrijving per pijler per leeftijdsgroep (voor spelerskaart-header) */
export const PIJLER_ONDERTITELS: Partial<
  Record<LeeftijdsgroepNaamV3, Partial<Record<PijlerCode, string>>>
> = {
  blauw: {
    BAL: "Gooien en vangen",
    BEWEGEN: "Rennen en bewegen",
    SPEL: "Aanval en verdediging",
    SAMEN: "Samenspelen",
    IK: "Durven en plezier",
  },
  groen: {
    BAL: "Schieten en passen",
    BEWEGEN: "Vrijlopen en meelopen",
    SPEL: "Keuzes in het spel",
    SAMEN: "Samenspelen en praten",
    IK: "Doorzetten en omgaan met verliezen",
  },
  geel: {
    AANVALLEN: "Vrijlopen, passen, balbezit",
    VERDEDIGEN: "Dekken, onderscheppen, druk",
    TECHNIEK: "Schot, pass, voetwerk",
    TACTIEK: "Keuzes en samenspel",
    MENTAAL: "Inzet, concentratie, plezier",
    FYSIEK: "Snelheid, uithouding, soepelheid",
  },
  oranje: {
    AANVALLEN: "Vrijlopen, spelcreatie, omschakeling",
    VERDEDIGEN: "Dekken, onderscheppen, rebound",
    TECHNIEK: "Schotvariatie, passtechniek, balbehandeling",
    TACTIEK: "Overzicht, besluitvorming, samenspel",
    MENTAAL: "Inzet, concentratie, weerbaarheid",
    SOCIAAL: "Communicatie, teamsfeer, rolacceptatie",
    FYSIEK: "Snelheid, kracht, uithouding",
  },
  rood: {
    AANVALLEN: "Vrijlopen, spelcreatie, positiespel",
    VERDEDIGEN: "Dekken, onderscheppen, organiseren",
    SCOREN: "Afronding, schotvariatie, druk",
    TECHNIEK: "Schot, pass, balbehandeling",
    TACTIEK: "Opstellingen, samenspel, tempo",
    SPELINTELLIGENTIE: "Spellezing, anticipatie, adaptatie",
    MENTAAL: "Inzet, concentratie, drukbestendigheid",
    SOCIAAL: "Communicatie, coaching, teamsfeer",
    FYSIEK: "Snelheid, kracht, herstel",
  },
};

// ============================================================
// Hulpfuncties
// ============================================================

/** Haal de config op voor een leeftijdsgroep */
export function getGroepConfig(band: LeeftijdsgroepNaamV3): LeeftijdsgroepConfig {
  return LEEFTIJDSGROEP_CONFIG[band];
}

/** Haal alle pijlercodes op voor een leeftijdsgroep */
export function getPijlerCodes(band: LeeftijdsgroepNaamV3): PijlerCode[] {
  return LEEFTIJDSGROEP_CONFIG[band].pijlers.map((p) => p.code);
}

/** Haal de gewichten op als Record<PijlerCode, number> */
export function getPijlerGewichten(
  band: LeeftijdsgroepNaamV3
): Partial<Record<PijlerCode, number>> {
  const config = LEEFTIJDSGROEP_CONFIG[band];
  const result: Partial<Record<PijlerCode, number>> = {};
  for (const p of config.pijlers) {
    result[p.code] = p.gewicht;
  }
  return result;
}

/** Haal de ondertitel op voor een specifieke pijler bij een leeftijdsgroep */
export function getPijlerOndertitel(
  band: LeeftijdsgroepNaamV3,
  pijler: PijlerCode
): string | undefined {
  return PIJLER_ONDERTITELS[band]?.[pijler];
}

/** Check of een leeftijdsgroep inzoom-functionaliteit heeft */
export function heeftInzoom(band: LeeftijdsgroepNaamV3): boolean {
  return LEEFTIJDSGROEP_CONFIG[band].heeftInzoom;
}

/** Geef de blokindeling terug voor een leeftijdsgroep */
export function getBlokIndeling(band: LeeftijdsgroepNaamV3): Record<string, PijlerConfig[]> {
  const config = LEEFTIJDSGROEP_CONFIG[band];
  const blokken: Record<string, PijlerConfig[]> = {};

  for (const pijler of config.pijlers) {
    const blokNaam = pijler.blok ?? "basis";
    if (!blokken[blokNaam]) {
      blokken[blokNaam] = [];
    }
    blokken[blokNaam].push(pijler);
  }

  return blokken;
}
