/**
 * Geunificeerde Score Schaal (USS) — c.k.v. Oranje Wit
 *
 * Bron: rules/score-model.md (Single Source of Truth)
 *
 * De USS plaatst teams en spelers op dezelfde schaal (0-200).
 * Drie bronnen voeden de USS:
 *   1. KNKV teamratings (B-categorie, directe mapping)
 *   2. Scouting spelersscores (0-99, per leeftijdsgroep)
 *   3. Coach-evaluaties (niveau 1-5)
 */

import { HUIDIGE_PEILDATUM } from "./constanten";
import {
  berekenKorfbalLeeftijd,
  berekenKorfbalLeeftijdExact,
  valtBinnenCategorie,
} from "./korfballeeftijd";
import type { LeeftijdsgroepNaam } from "./leeftijdsgroep-config";

// ============================================================
// Types (LeeftijdsgroepNaam wordt geimporteerd uit leeftijdsgroep-config)
// ============================================================

export type { LeeftijdsgroepNaam };

export type SeizoensPeriode = "veld_najaar" | "zaal" | "veld_voorjaar" | "seizoenseinde";

// ============================================================
// Constanten — basislijn logistische curve
// ============================================================

/** Parameters voor de logistische basislijnfunctie S(l) = sMax / (1 + e^(-k*(l-l0))) */
export const USS_CONFIG = {
  /** Asymptotisch maximum (top senioren) */
  sMax: 180,
  /** Steilheid van de groei */
  k: 0.35,
  /** Inflectiepunt (leeftijd waar groei het snelst is) */
  l0: 12.5,
} as const;

// ============================================================
// Constanten — A-categorie teamscores
// ============================================================

/** Vaste USS-waarden per A-categorie combinatie (categorie-klasse) */
export const A_CATEGORIE_USS: Record<string, number> = {
  "U19-HK": 175,
  "U19-OK": 170,
  "U17-HK": 160,
  "U19-1": 155,
  "U17-1": 147,
  "U15-HK": 143,
  "U19-2": 142,
  "U17-2": 135,
  "U15-1": 128,
};

// ============================================================
// Constanten — scouting conversie per leeftijdsgroep
// ============================================================

interface ScoutingUSSParams {
  /** USS-waarde bij de middelste leeftijd van de groep */
  ussBasis: number;
  /** Mediaan van de scouting score-range */
  mediaan: number;
  /** Halve range = (max - min) / 2 */
  halveRange: number;
  /** USS-spreiding voor deze groep */
  bandbreedte: number;
}

/**
 * Parameters afgeleid van KNKV-teamratings (conceptindelingen veld voorjaar 2026).
 *
 * ussBasis = midpoint van de waargenomen KNKV-range voor die leeftijdsgroep
 * bandbreedte = halve KNKV-range
 *
 * Hierdoor mapt scouting min→KNKV min, scouting max→KNKV max.
 *
 * | Groep  | KNKV range | ussBasis | bandbreedte |
 * |--------|-----------|----------|-------------|
 * | Blauw  | 12-55     | 34       | 22          |
 * | Groen  | 50-90     | 70       | 20          |
 * | Geel   | 60-120    | 90       | 30          |
 * | Oranje | 73-125    | 99       | 26          |
 * | Rood   | 80-125    | 103      | 23          |
 */
export const SCOUTING_USS_PARAMS: Record<LeeftijdsgroepNaam, ScoutingUSSParams> = {
  paars: { ussBasis: 18, mediaan: 20, halveRange: 20, bandbreedte: 13 },
  blauw: { ussBasis: 34, mediaan: 20, halveRange: 20, bandbreedte: 22 },
  groen: { ussBasis: 70, mediaan: 30, halveRange: 25, bandbreedte: 20 },
  geel: { ussBasis: 90, mediaan: 42.5, halveRange: 27.5, bandbreedte: 30 },
  oranje: { ussBasis: 99, mediaan: 55, halveRange: 30, bandbreedte: 26 },
  rood: { ussBasis: 103, mediaan: 67, halveRange: 32, bandbreedte: 23 },
};

// ============================================================
// Constanten — coach-evaluatie
// ============================================================

/** Verwachte USS-spreiding binnen een team */
export const TEAM_BANDBREEDTE = 20;

/** Gewichten scouting vs coach op basis van aantal scouting-rapporten */
export const GEWICHTEN: {
  minRapporten: number;
  wScout: number;
  wCoach: number;
}[] = [
  { minRapporten: 10, wScout: 0.9, wCoach: 0.1 },
  { minRapporten: 5, wScout: 0.8, wCoach: 0.2 },
  { minRapporten: 3, wScout: 0.6, wCoach: 0.4 },
  { minRapporten: 1, wScout: 0.4, wCoach: 0.6 },
  { minRapporten: 0, wScout: 0.0, wCoach: 1.0 },
];

// ============================================================
// Functies — leeftijd
// ============================================================

/**
 * @deprecated Gebruik `berekenKorfbalLeeftijd` uit `./korfballeeftijd` direct.
 * Deze wrapper bestaat voor backwards compat binnen score-model.
 */
export function berekenExacteLeeftijd(
  geboortedatum: Date,
  peildatum: Date = HUIDIGE_PEILDATUM
): number {
  return berekenKorfbalLeeftijd(geboortedatum, geboortedatum.getFullYear(), peildatum);
}

/**
 * Check of een speler speelgerechtigd is voor een A-categorie.
 * Grens is strikt (`<`): een speler die op peildatum exact 15 wordt valt uit U15.
 * Gebruikt de kalenderjaar-aware exacte waarde om drift op verjaardagen te voorkomen.
 */
export function isSpeelgerechtigd(
  geboortedatum: Date,
  categorie: "U15" | "U17" | "U19",
  peildatum: Date = HUIDIGE_PEILDATUM
): boolean {
  const exact = berekenKorfbalLeeftijdExact(geboortedatum, geboortedatum.getFullYear(), peildatum);
  return valtBinnenCategorie(exact, categorie);
}

// ============================================================
// Functies — basislijn
// ============================================================

/**
 * Bereken de verwachte USS op basis van leeftijd (logistische curve).
 *
 * S(l) = S_max / (1 + e^(-k * (l - l_0)))
 */
export function berekenUSSBasislijn(leeftijd: number): number {
  const { sMax, k, l0 } = USS_CONFIG;
  return Math.round(sMax / (1 + Math.exp(-k * (leeftijd - l0))));
}

// ============================================================
// Functies — KNKV teamrating → USS
// ============================================================

/**
 * Converteer een KNKV B-categorie teamrating naar USS.
 * De KNKV-schaal (12-165) past direct in de USS (0-200).
 */
export function knkvNaarUSS(knkvRating: number): number {
  return Math.round(Math.max(0, Math.min(200, knkvRating)));
}

/**
 * Geef de USS voor een A-categorie team op basis van categorie en klasse.
 *
 * @param categorie "U15" | "U17" | "U19"
 * @param klasse "HK" | "OK" | "1" | "2"
 * @returns USS of null als combinatie onbekend is
 */
export function aCategorieUSS(categorie: string, klasse: string): number | null {
  const key = `${categorie}-${klasse}`;
  return A_CATEGORIE_USS[key] ?? null;
}

/**
 * Parse een A-categorie key uit een poolVeld naam.
 * Bijv. "U17-HK-07" → "U17-HK", "U19-2-08" → "U19-2"
 */
export function parseACatKey(poolVeld: string): string | null {
  const match = poolVeld.match(/^(U\d{2})-(HK|OK|\d+)/);
  if (!match) return null;
  return `${match[1]}-${match[2]}`;
}

// ============================================================
// Functies — scouting → USS
// ============================================================

/**
 * Converteer een scouting overall-score naar USS.
 *
 * Formule: USS = ussBasis + ((score - mediaan) / halveRange) * bandbreedte
 */
export function scoutingNaarUSS(score: number, groep: LeeftijdsgroepNaam): number {
  const p = SCOUTING_USS_PARAMS[groep];
  if (!p) return 0;
  const uss = p.ussBasis + ((score - p.mediaan) / p.halveRange) * p.bandbreedte;
  return Math.round(Math.max(0, Math.min(200, uss)));
}

// ============================================================
// Functies — coach-evaluatie → USS
// ============================================================

/**
 * Converteer een coach-evaluatie niveau (1-5) naar USS,
 * relatief aan het team-USS.
 *
 * Formule: USS = ussTeam + ((niveau - 3) / 2) * TEAM_BANDBREEDTE
 */
export function coachNaarUSS(ussTeam: number, niveau: number): number {
  const offset = ((niveau - 3) / 2) * TEAM_BANDBREEDTE;
  return Math.round(Math.max(0, Math.min(200, ussTeam + offset)));
}

// ============================================================
// Functies — gecombineerde speler-USS
// ============================================================

/**
 * Bereken de gecombineerde speler-USS uit scouting en coach-evaluatie.
 *
 * De gewichten verschuiven op basis van het aantal scouting-rapporten:
 * meer data → scouting weegt zwaarder.
 */
export function berekenSpelerUSS(
  ussScout: number | null,
  ussCoach: number | null,
  aantalRapporten: number
): number | null {
  if (ussScout == null && ussCoach == null) return null;
  if (ussScout == null) return ussCoach;
  if (ussCoach == null) return ussScout;

  const g = GEWICHTEN.find((w) => aantalRapporten >= w.minRapporten);
  if (!g) return ussScout; // fallback

  return Math.round(g.wScout * ussScout + g.wCoach * ussCoach);
}
