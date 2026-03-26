/**
 * Clearance-systeem voor spelersdata — c.k.v. Oranje Wit
 *
 * Spelersscores zijn gevoelige persoonlijke data. Het clearance-niveau
 * bepaalt wat een gebruiker te zien krijgt. Hogere clearance = meer detail.
 *
 * Zie: memory/project_shared_packages.md
 */

/** Clearance-niveaus voor spelersdata-zichtbaarheid */
export type Clearance = 0 | 1 | 2 | 3;

/** Beschrijving per clearance-niveau */
export const CLEARANCE_LABELS: Record<Clearance, string> = {
  0: "Geen scores", // Scouts bij verzoeken
  1: "Verhouding", // Trainers: relatief binnen team
  2: "Rating", // TC-leden: USS-getal + trend
  3: "Spelerskaart", // TC-kern: volledige kaart
};

/** Welke data-elementen zichtbaar zijn per clearance-niveau */
export const CLEARANCE_ZICHTBAARHEID: Record<
  Clearance,
  {
    naam: boolean;
    leeftijd: boolean;
    team: boolean;
    relatievePositie: boolean;
    ussScore: boolean;
    trend: boolean;
    pijlerScores: boolean;
    radar: boolean;
    rapporten: boolean;
    historie: boolean;
  }
> = {
  0: {
    naam: true,
    leeftijd: true,
    team: true,
    relatievePositie: false,
    ussScore: false,
    trend: false,
    pijlerScores: false,
    radar: false,
    rapporten: false,
    historie: false,
  },
  1: {
    naam: true,
    leeftijd: true,
    team: true,
    relatievePositie: true,
    ussScore: false,
    trend: false,
    pijlerScores: false,
    radar: false,
    rapporten: false,
    historie: false,
  },
  2: {
    naam: true,
    leeftijd: true,
    team: true,
    relatievePositie: true,
    ussScore: true,
    trend: true,
    pijlerScores: false,
    radar: false,
    rapporten: false,
    historie: false,
  },
  3: {
    naam: true,
    leeftijd: true,
    team: true,
    relatievePositie: true,
    ussScore: true,
    trend: true,
    pijlerScores: true,
    radar: true,
    rapporten: true,
    historie: true,
  },
};

/** Data-structuur voor de SpelersKaart component */
export interface SpelersKaartData {
  // Altijd beschikbaar (clearance 0+)
  id: string;
  roepnaam: string;
  achternaam: string;
  leeftijd: number;
  team: string;
  kleur: string;
  geslacht: "M" | "V";

  // Clearance 1+: relatieve positie
  relatievePositie?: number; // 0-100 percentiel binnen team

  // Clearance 2+: USS score en trend
  ussScore?: number;
  ussTrend?: number; // positief = stijgend

  // Clearance 3+: volledige spelerskaart
  pijlerScores?: {
    schot: number;
    aanval: number;
    passing: number;
    verdediging: number;
    fysiek: number;
    mentaal: number;
  };
  aantalRapporten?: number;
  betrouwbaarheid?: string;
  tier?: "brons" | "zilver" | "goud";
}
