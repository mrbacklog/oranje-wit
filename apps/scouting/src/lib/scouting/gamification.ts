/**
 * Gamification-systeem voor OW Scout.
 *
 * Scouts verdienen XP door rapporten in te dienen en badges door
 * bepaalde mijlpalen te bereiken. Het level-systeem motiveert
 * consistent scouten.
 */

import { logger } from "@oranje-wit/types";

/** XP-waarden */
const XP_BASIS_RAPPORT = 15;
const XP_EERSTE_RAPPORT_VOOR_SPELER = 25;

/** Level-definities */
const LEVELS = [
  { level: 1, naam: "Beginner", xpNodig: 0 },
  { level: 2, naam: "Starter", xpNodig: 50 },
  { level: 3, naam: "Verkenner", xpNodig: 150 },
  { level: 4, naam: "Scout", xpNodig: 300 },
  { level: 5, naam: "Ervaren Scout", xpNodig: 500 },
  { level: 6, naam: "Senior Scout", xpNodig: 800 },
  { level: 7, naam: "Expert Scout", xpNodig: 1200 },
  { level: 8, naam: "Meester Scout", xpNodig: 1800 },
  { level: 9, naam: "Legende", xpNodig: 2500 },
  { level: 10, naam: "GOAT", xpNodig: 3500 },
] as const;

/** Badge-definities */
const BADGES = {
  eerste_rapport: {
    naam: "Eerste Rapport",
    beschrijving: "Je eerste scouting-rapport ingediend",
    check: (stats: ScoutStats) => stats.totaalRapporten >= 1,
  },
  vijf_rapporten: {
    naam: "Vijf in de pocket",
    beschrijving: "5 scouting-rapporten ingediend",
    check: (stats: ScoutStats) => stats.totaalRapporten >= 5,
  },
  tien_rapporten: {
    naam: "Dubbele cijfers",
    beschrijving: "10 scouting-rapporten ingediend",
    check: (stats: ScoutStats) => stats.totaalRapporten >= 10,
  },
  vijfentwintig_rapporten: {
    naam: "Kwart eeuw",
    beschrijving: "25 scouting-rapporten ingediend",
    check: (stats: ScoutStats) => stats.totaalRapporten >= 25,
  },
  vijftig_rapporten: {
    naam: "Halve Eeuw",
    beschrijving: "50 scouting-rapporten ingediend",
    check: (stats: ScoutStats) => stats.totaalRapporten >= 50,
  },
  vijf_unieke_spelers: {
    naam: "Breed kijker",
    beschrijving: "5 verschillende spelers gescout",
    check: (stats: ScoutStats) => stats.uniekeSpelers >= 5,
  },
  tien_unieke_spelers: {
    naam: "Talentenjager",
    beschrijving: "10 verschillende spelers gescout",
    check: (stats: ScoutStats) => stats.uniekeSpelers >= 10,
  },
  drie_contexten: {
    naam: "Veelzijdig",
    beschrijving: "Gescouted in wedstrijd, training en overig",
    check: (stats: ScoutStats) => stats.contexten >= 3,
  },
  wedstrijd_specialist: {
    naam: "Wedstrijd-specialist",
    beschrijving: "10 wedstrijdrapporten ingediend",
    check: (stats: ScoutStats) => stats.wedstrijdRapporten >= 10,
  },
} as const;

export type BadgeId = keyof typeof BADGES;

interface ScoutStats {
  totaalRapporten: number;
  uniekeSpelers: number;
  contexten: number;
  wedstrijdRapporten: number;
  bestaandeBadges: string[];
}

/**
 * Bereken hoeveel XP een scout krijgt voor een nieuw rapport.
 */
export function berekenXP(isEersteVoorSpeler: boolean): number {
  let xp = XP_BASIS_RAPPORT;

  if (isEersteVoorSpeler) {
    xp += XP_EERSTE_RAPPORT_VOOR_SPELER;
  }

  return xp;
}

/**
 * Bepaal het level en voortgang op basis van totale XP.
 */
export function bepaalLevel(xp: number): {
  level: number;
  naam: string;
  xpVoorVolgend: number;
  voortgang: number;
} {
  let huidigLevel: { level: number; naam: string; xpNodig: number } = LEVELS[0];

  for (const levelDef of LEVELS) {
    if (xp >= levelDef.xpNodig) {
      huidigLevel = levelDef;
    } else {
      break;
    }
  }

  // Bepaal XP tot volgend level
  const huidigIndex = LEVELS.findIndex((l) => l.level === huidigLevel.level);
  const volgendLevel = LEVELS[huidigIndex + 1];

  const xpVoorVolgend = volgendLevel ? volgendLevel.xpNodig - xp : 0;

  const voortgang = volgendLevel
    ? (xp - huidigLevel.xpNodig) / (volgendLevel.xpNodig - huidigLevel.xpNodig)
    : 1;

  return {
    level: huidigLevel.level,
    naam: huidigLevel.naam,
    xpVoorVolgend,
    voortgang: Math.min(1, Math.max(0, voortgang)),
  };
}

/**
 * Check welke nieuwe badges een scout heeft verdiend na een nieuw rapport.
 * Retourneert alleen de badges die nog niet eerder zijn toegekend.
 */
export function checkBadges(stats: ScoutStats): string[] {
  const nieuweBadges: string[] = [];

  for (const [id, badge] of Object.entries(BADGES)) {
    if (stats.bestaandeBadges.includes(id)) continue;

    if (badge.check(stats)) {
      nieuweBadges.push(id);
      logger.info(`Badge ontgrendeld: ${badge.naam}`);
    }
  }

  return nieuweBadges;
}

/**
 * Haal badge-info op (naam + beschrijving).
 */
export function getBadgeInfo(badgeId: string): { naam: string; beschrijving: string } | null {
  const badge = BADGES[badgeId as BadgeId];
  if (!badge) return null;
  return { naam: badge.naam, beschrijving: badge.beschrijving };
}

/**
 * Alle beschikbare level-definities.
 */
export function getAlleLevels() {
  return [...LEVELS];
}
