/**
 * USS v2 — Scoremodel voor Vaardigheidsraamwerk v3.0
 *
 * Breidt USS v1 uit met:
 * - USS per pijler (niet alleen overall)
 * - Drie methoden: TEAM (coach), INDIVIDUEEL (scout), VERGELIJKING
 * - Vijf databronnen: KNKV teamrating, coach-evaluatie, scouting, vergelijking, team-context
 * - Leeftijdsgroep-specifieke kalibratie
 * - Recentheidscorrectie
 *
 * USS v1 functies blijven bestaan in score-model.ts voor backward compatibility.
 *
 * Bronnen:
 *   docs/jeugdontwikkeling/scoremodel-v2-concept.md
 *   docs/jeugdontwikkeling/technische-specificatie.md
 */

import type { LeeftijdsgroepNaamV3, PijlerCode } from "./leeftijdsgroep-config";
import { LEEFTIJDSGROEP_CONFIG } from "./leeftijdsgroep-config";
import { berekenUSSBasislijn } from "./score-model";

// ============================================================
// Types
// ============================================================

/** Positie van een speler in een vergelijkingssessie */
export interface VergelijkingPositie {
  spelerId: string;
  balkPositie: number; // 0-100
  bekendeUSS?: number; // als de speler een bekende USS heeft
}

/** Alle bronnen voor het combineren van USS */
export interface USSBronnen {
  ussCoach: number | null;
  ussScout: number | null;
  ussVergelijking: number | null;
  aantalScoutSessies: number;
  maandenOudCoach?: number;
  maandenOudScout?: number;
  maandenOudVergelijking?: number;
}

/** Resultaat van team-USS validatie */
export interface TeamValidatieResultaat {
  ussTeam: number;
  gemiddeldSpelerUSS: number;
  verschil: number;
  type: "overall" | "pijler";
  pijler?: string;
  signaal: "ok" | "aandacht" | "afwijking";
  mogelijkeOorzaak?: string;
}

/** Groei-indicatie */
export interface GroeiResultaat {
  verschil: number;
  percentage: number;
  label: "sterke_groei" | "groei" | "stabiel" | "achteruitgang";
}

/** Input voor de hoofdberekening */
export interface BerekenOverallUSSInput {
  band: LeeftijdsgroepNaamV3;
  ussTeam: number | null;
  leeftijd: number;
  coachPijlerScores: Record<string, number> | null;
  scoutPijlerScores: Record<string, number> | null;
  vergelijkingPijlerUSS: Record<string, number> | null;
  aantalScoutSessies: number;
  maandenOudCoach?: number;
  maandenOudScout?: number;
  maandenOudVergelijking?: number;
}

// ============================================================
// Constanten — gewichtentabel USS v2
// ============================================================

/**
 * Gewichtentabel: USS v2, sectie 9.2 van scoremodel-v2-concept.md
 *
 * De gewichten hangen af van het aantal scouting-sessies.
 * Meer scoutingdata = hogere weging voor scouting.
 */
const BRON_GEWICHTEN = [
  { minScoutSessies: 7, wScout: 0.65, wCoach: 0.2, wVerg: 0.15 },
  { minScoutSessies: 4, wScout: 0.55, wCoach: 0.3, wVerg: 0.15 },
  { minScoutSessies: 2, wScout: 0.45, wCoach: 0.4, wVerg: 0.15 },
  { minScoutSessies: 1, wScout: 0.3, wCoach: 0.55, wVerg: 0.15 },
  { minScoutSessies: 0, wScout: 0.0, wCoach: 0.85, wVerg: 0.15 },
] as const;

// ============================================================
// 1. berekenPijlerscore — items naar pijlerscore
// ============================================================

/**
 * Bereken de ruwe pijlerscore uit item-scores, per leeftijdsgroep-schaal.
 *
 * Codering per schaaltype:
 * - ja_nogniet:       Ja=1, Nog niet=0 -> percentage (0-100)
 * - goed_oke_nogniet: Goed=1, Oke=0.5, Nog niet=0 -> percentage (0-100)
 * - sterren:          Waarde 1.0-5.0 -> gemiddelde
 * - slider:           Waarde 1.0-10.0 -> gemiddelde
 *
 * @param itemScores  Array van numerieke scores voor items binnen een pijler
 * @param band        Leeftijdsgroep
 * @returns           Pijlerscore of null als geen items
 */
export function berekenPijlerscore(
  itemScores: number[],
  band: LeeftijdsgroepNaamV3
): number | null {
  if (itemScores.length === 0) return null;

  const config = LEEFTIJDSGROEP_CONFIG[band];
  const gemiddelde = itemScores.reduce((a, b) => a + b, 0) / itemScores.length;

  switch (config.schaalType) {
    case "ja_nogniet":
      // Ja=1, Nog niet=0 -> percentage
      return Math.round(gemiddelde * 100);
    case "goed_oke_nogniet":
      // Goed=1, Oke=0.5, Nog niet=0 -> percentage
      return Math.round(gemiddelde * 100);
    case "sterren":
    case "slider":
      // Gemiddelde op de originele schaal (2 decimalen)
      return Math.round(gemiddelde * 100) / 100;
    case "observatie":
      return null; // Paars: geen score
    default:
      return null;
  }
}

// ============================================================
// 2. converteerCoachNaarUSS — TEAM-methode
// ============================================================

/**
 * Converteer een coach pijlerscore naar USS, verankerd aan USS_team.
 *
 * Formule: USS_coach_pijler = USS_team + ((pijlerscore - mediaan) / halve_bereik) * B_coach
 *
 * @param pijlerscore  Ruwe pijlerscore (percentage of gemiddelde)
 * @param band         Leeftijdsgroep
 * @param ussTeam      USS van het team (KNKV-rating of A-categorie)
 */
export function converteerCoachNaarUSS(
  pijlerscore: number,
  band: LeeftijdsgroepNaamV3,
  ussTeam: number
): number {
  const config = LEEFTIJDSGROEP_CONFIG[band];
  const { schaalMediaan, halveBereik, bandbreedteCoach } = config;

  if (halveBereik === 0 || bandbreedteCoach === 0) return ussTeam;

  const offset = ((pijlerscore - schaalMediaan) / halveBereik) * bandbreedteCoach;
  return Math.round(Math.max(0, Math.min(200, ussTeam + offset)));
}

/**
 * Bereken USS_coach voor alle pijlers + overall.
 */
export function berekenUSSCoach(
  pijlerScores: Record<string, number>,
  band: LeeftijdsgroepNaamV3,
  ussTeam: number
): { pijlers: Record<string, number>; overall: number } {
  const config = LEEFTIJDSGROEP_CONFIG[band];
  const pijlerUSS: Record<string, number> = {};

  for (const pijler of config.pijlers) {
    const score = pijlerScores[pijler.code];
    if (score != null) {
      pijlerUSS[pijler.code] = converteerCoachNaarUSS(score, band, ussTeam);
    }
  }

  // Overall = gewogen gemiddelde
  let som = 0;
  let gewichtSom = 0;
  for (const pijler of config.pijlers) {
    if (pijlerUSS[pijler.code] != null) {
      som += pijler.gewicht * pijlerUSS[pijler.code];
      gewichtSom += pijler.gewicht;
    }
  }

  const overall = gewichtSom > 0 ? Math.round(som / gewichtSom) : ussTeam;

  return { pijlers: pijlerUSS, overall };
}

// ============================================================
// 3. converteerScoutNaarUSS — INDIVIDUEEL-methode
// ============================================================

/**
 * Converteer een scout pijlerscore naar USS, verankerd aan basislijn(leeftijd).
 *
 * Formule: USS_scout_pijler = USS_basislijn(leeftijd) + ((pijlerscore - mediaan) / halve_bereik) * B_scout
 *
 * @param pijlerscore  Ruwe pijlerscore
 * @param band         Leeftijdsgroep
 * @param leeftijd     Exacte leeftijd in jaren
 */
export function converteerScoutNaarUSS(
  pijlerscore: number,
  band: LeeftijdsgroepNaamV3,
  leeftijd: number
): number {
  const config = LEEFTIJDSGROEP_CONFIG[band];
  const { schaalMediaan, halveBereik, bandbreedteScout } = config;
  const basislijn = berekenUSSBasislijn(leeftijd);

  if (halveBereik === 0 || bandbreedteScout === 0) return basislijn;

  const offset = ((pijlerscore - schaalMediaan) / halveBereik) * bandbreedteScout;
  return Math.round(Math.max(0, Math.min(200, basislijn + offset)));
}

/**
 * Bereken USS_scout voor alle pijlers + overall.
 */
export function berekenUSSScout(
  pijlerScores: Record<string, number>,
  band: LeeftijdsgroepNaamV3,
  leeftijd: number
): { pijlers: Record<string, number>; overall: number } {
  const config = LEEFTIJDSGROEP_CONFIG[band];
  const pijlerUSS: Record<string, number> = {};

  for (const pijler of config.pijlers) {
    const score = pijlerScores[pijler.code];
    if (score != null) {
      pijlerUSS[pijler.code] = converteerScoutNaarUSS(score, band, leeftijd);
    }
  }

  let som = 0;
  let gewichtSom = 0;
  for (const pijler of config.pijlers) {
    if (pijlerUSS[pijler.code] != null) {
      som += pijler.gewicht * pijlerUSS[pijler.code];
      gewichtSom += pijler.gewicht;
    }
  }

  const basislijn = berekenUSSBasislijn(leeftijd);
  const overall = gewichtSom > 0 ? Math.round(som / gewichtSom) : basislijn;

  return { pijlers: pijlerUSS, overall };
}

// ============================================================
// 4. converteerVergelijkingNaarUSS — VERGELIJKING-methode
// ============================================================

/**
 * Converteer vergelijkingsposities naar USS per speler.
 *
 * Strategie:
 * 1. Als >= 2 ankers: lineaire interpolatie
 * 2. Als 1 anker: extrapolatie met B_coach als spreiding
 * 3. Als 0 ankers: fallback naar team-USS offset
 *
 * @param posities  Array van spelerposities op de balk
 * @param band      Leeftijdsgroep
 * @param ussTeam   Team-USS (fallback als geen ankers)
 * @returns         Record<spelerId, USS>
 */
export function converteerVergelijkingNaarUSS(
  posities: VergelijkingPositie[],
  band: LeeftijdsgroepNaamV3,
  ussTeam: number
): Record<string, number> {
  const config = LEEFTIJDSGROEP_CONFIG[band];
  const ankers = posities.filter((p) => p.bekendeUSS != null);
  const result: Record<string, number> = {};

  if (ankers.length >= 2) {
    // Lineaire interpolatie tussen twee ankers
    const a1 = ankers[0];
    const a2 = ankers[1];
    const posDiff = a2.balkPositie - a1.balkPositie;

    if (posDiff === 0) {
      // Gelijke positie: gemiddelde USS voor iedereen
      const gemUSS = Math.round((a1.bekendeUSS! + a2.bekendeUSS!) / 2);
      for (const pos of posities) {
        result[pos.spelerId] = gemUSS;
      }
    } else {
      const ussPerPunt = (a2.bekendeUSS! - a1.bekendeUSS!) / posDiff;
      for (const pos of posities) {
        const uss = a1.bekendeUSS! + (pos.balkPositie - a1.balkPositie) * ussPerPunt;
        result[pos.spelerId] = Math.round(Math.max(0, Math.min(200, uss)));
      }
    }
  } else if (ankers.length === 1) {
    // Een anker + bandbreedte
    const anker = ankers[0];
    const B = config.bandbreedteCoach;
    for (const pos of posities) {
      const uss = anker.bekendeUSS! + ((pos.balkPositie - anker.balkPositie) / 50) * B;
      result[pos.spelerId] = Math.round(Math.max(0, Math.min(200, uss)));
    }
  } else {
    // Geen ankers: fallback naar team-USS
    const B = config.bandbreedteCoach;
    for (const pos of posities) {
      const uss = ussTeam + ((pos.balkPositie - 50) / 50) * B;
      result[pos.spelerId] = Math.round(Math.max(0, Math.min(200, uss)));
    }
  }

  return result;
}

// ============================================================
// 5. combineUSS — bronnen combineren
// ============================================================

/**
 * Vervalfactoren op basis van leeftijd van de score (in maanden).
 *
 * Scores ouder dan 6 maanden krijgen een vervaldiscount.
 */
function vervalfactor(maandenOud: number): number {
  if (maandenOud <= 3) return 1.0;
  if (maandenOud <= 6) return 0.9;
  if (maandenOud <= 12) return 0.7;
  return 0.4;
}

/**
 * Combineer USS uit meerdere bronnen met gewichten en recentheidscorrectie.
 *
 * Per pijler OF overall. Gewichten worden hernormaliseerd als een bron ontbreekt.
 *
 * @param bronnen  De beschikbare bron-USS waarden + metadata
 * @returns        Gecombineerde USS of null als geen data
 */
export function combineUSS(bronnen: USSBronnen): number | null {
  const { ussCoach, ussScout, ussVergelijking, aantalScoutSessies } = bronnen;

  // Vind de juiste gewichtentabel
  const rij = BRON_GEWICHTEN.find((r) => aantalScoutSessies >= r.minScoutSessies);
  if (!rij) return null;

  let { wScout, wCoach, wVerg } = rij;

  // Recentheidscorrectie
  const vfCoach = vervalfactor(bronnen.maandenOudCoach ?? 0);
  const vfScout = vervalfactor(bronnen.maandenOudScout ?? 0);
  const vfVerg = vervalfactor(bronnen.maandenOudVergelijking ?? 0);

  wCoach *= vfCoach;
  wScout *= vfScout;
  wVerg *= vfVerg;

  // Beschikbaarheidscheck: als een bron null is, herverdeel gewicht
  const beschikbaar: { w: number; uss: number }[] = [];
  if (ussCoach != null) beschikbaar.push({ w: wCoach, uss: ussCoach });
  if (ussScout != null) beschikbaar.push({ w: wScout, uss: ussScout });
  if (ussVergelijking != null) beschikbaar.push({ w: wVerg, uss: ussVergelijking });

  if (beschikbaar.length === 0) return null;

  // Hernormaliseer gewichten
  const totaalGewicht = beschikbaar.reduce((sum, b) => sum + b.w, 0);
  if (totaalGewicht === 0) return null;

  const uss = beschikbaar.reduce((sum, b) => sum + (b.w / totaalGewicht) * b.uss, 0);
  return Math.round(Math.max(0, Math.min(200, uss)));
}

// ============================================================
// 6. berekenOverallUSS — hoofdfunctie
// ============================================================

/**
 * Bereken de volledige speler-USS: per pijler + overall.
 *
 * Dit is de hoofdfunctie die alle bronnen combineert:
 * 1. Coach pijlerscores -> USS_coach per pijler (verankerd aan USS_team)
 * 2. Scout pijlerscores -> USS_scout per pijler (verankerd aan basislijn)
 * 3. Vergelijking USS per pijler (al in USS-schaal)
 * 4. Per pijler combineren met gewichten
 * 5. Overall = gewogen gemiddelde van pijler-USS
 */
export function berekenOverallUSS(input: BerekenOverallUSSInput): {
  ussPijlers: Record<string, number>;
  ussOverall: number;
} {
  const config = LEEFTIJDSGROEP_CONFIG[input.band];
  const effectiefUssTeam = input.ussTeam ?? berekenUSSBasislijn(input.leeftijd);

  // Stap 1: Bereken per-bron per-pijler USS
  const coachUSS = input.coachPijlerScores
    ? berekenUSSCoach(input.coachPijlerScores, input.band, effectiefUssTeam)
    : null;

  const scoutUSS = input.scoutPijlerScores
    ? berekenUSSScout(input.scoutPijlerScores, input.band, input.leeftijd)
    : null;

  // Stap 2: Combineer per pijler
  const ussPijlers: Record<string, number> = {};

  for (const pijler of config.pijlers) {
    const gecombineerd = combineUSS({
      ussCoach: coachUSS?.pijlers[pijler.code] ?? null,
      ussScout: scoutUSS?.pijlers[pijler.code] ?? null,
      ussVergelijking: input.vergelijkingPijlerUSS?.[pijler.code] ?? null,
      aantalScoutSessies: input.aantalScoutSessies,
      maandenOudCoach: input.maandenOudCoach,
      maandenOudScout: input.maandenOudScout,
      maandenOudVergelijking: input.maandenOudVergelijking,
    });

    if (gecombineerd != null) {
      ussPijlers[pijler.code] = gecombineerd;
    }
  }

  // Stap 3: Overall = gewogen gemiddelde van pijler-USS
  let som = 0;
  let gewichtSom = 0;
  for (const pijler of config.pijlers) {
    if (ussPijlers[pijler.code] != null) {
      som += pijler.gewicht * ussPijlers[pijler.code];
      gewichtSom += pijler.gewicht;
    }
  }

  const ussOverall = gewichtSom > 0 ? Math.round(som / gewichtSom) : effectiefUssTeam;

  return { ussPijlers, ussOverall };
}

// ============================================================
// 7. valideerTeamUSS — cross-validatie
// ============================================================

/**
 * Valideer team-USS tegen gemiddelde speler-USS.
 *
 * USS_team moet ongeveer gelijk zijn aan gemiddelde(USS_speler).
 * Signaleert afwijkingen overall en per pijler.
 *
 * @param ussTeam           Team-USS (KNKV-rating)
 * @param spelerUSSWaarden  Array van overall USS per speler
 * @param pijlerUSSWaarden  Optional: per pijler een array van USS-waarden
 */
export function valideerTeamUSS(
  ussTeam: number,
  spelerUSSWaarden: number[],
  pijlerUSSWaarden?: Record<string, number[]>
): TeamValidatieResultaat[] {
  const resultaten: TeamValidatieResultaat[] = [];

  // Overall check
  if (spelerUSSWaarden.length > 0) {
    const gem = Math.round(spelerUSSWaarden.reduce((a, b) => a + b, 0) / spelerUSSWaarden.length);
    const verschil = gem - ussTeam;
    resultaten.push({
      ussTeam,
      gemiddeldSpelerUSS: gem,
      verschil,
      type: "overall",
      signaal: Math.abs(verschil) > 15 ? "afwijking" : Math.abs(verschil) > 8 ? "aandacht" : "ok",
      mogelijkeOorzaak:
        verschil > 15
          ? "Spelers sterker dan resultaten — coaching-effect?"
          : verschil < -15
            ? "Team presteert boven individueel niveau — chemie!"
            : undefined,
    });
  }

  // Per-pijler check
  if (pijlerUSSWaarden) {
    for (const [pijler, waarden] of Object.entries(pijlerUSSWaarden)) {
      if (waarden.length === 0) continue;
      const gem = Math.round(waarden.reduce((a, b) => a + b, 0) / waarden.length);
      const verschil = gem - ussTeam;
      resultaten.push({
        ussTeam,
        gemiddeldSpelerUSS: gem,
        verschil,
        type: "pijler",
        pijler,
        signaal:
          Math.abs(verschil) > 20 ? "afwijking" : Math.abs(verschil) > 10 ? "aandacht" : "ok",
      });
    }
  }

  return resultaten;
}

// ============================================================
// 8. berekenGroei — groei-indicator
// ============================================================

/**
 * Bereken groei-indicator tussen twee meetmomenten.
 *
 * @param huidigeUSS  Huidige USS-score
 * @param vorigeUSS   Vorige USS-score
 * @returns           Groeiresultaat met label
 */
export function berekenGroei(huidigeUSS: number, vorigeUSS: number): GroeiResultaat {
  const verschil = huidigeUSS - vorigeUSS;
  const percentage = vorigeUSS > 0 ? Math.round((verschil / vorigeUSS) * 100) : 0;

  let label: GroeiResultaat["label"];
  if (verschil >= 10) {
    label = "sterke_groei";
  } else if (verschil >= 3) {
    label = "groei";
  } else if (verschil >= -3) {
    label = "stabiel";
  } else {
    label = "achteruitgang";
  }

  return { verschil, percentage, label };
}
