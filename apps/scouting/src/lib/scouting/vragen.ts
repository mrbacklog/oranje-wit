import type { SchaalType, LeeftijdsgroepNaam } from "./leeftijdsgroep";
import {
  VRAGEN_PAARS_BLAUW,
  VRAGEN_GROEN,
  VRAGEN_GEEL,
  VRAGEN_ORANJE,
  VRAGEN_ROOD,
} from "./vragen-data";

export type Pijler = "SCH" | "AAN" | "PAS" | "VER" | "FYS" | "MEN";

export const PIJLER_LABELS: Record<Pijler, string> = {
  SCH: "Schieten",
  AAN: "Aanval",
  PAS: "Passen",
  VER: "Verdediging",
  FYS: "Fysiek",
  MEN: "Mentaal",
};

export const PIJLER_ICONEN: Record<Pijler, string> = {
  SCH: "🎯",
  AAN: "⚡",
  PAS: "🤝",
  VER: "🛡️",
  FYS: "💪",
  MEN: "🧠",
};

export interface ScoutingVraag {
  id: string;
  pijler: Pijler;
  label: string;
  vraagTekst: string;
}

export interface ScoutingGroepConfig {
  schaalType: SchaalType;
  maxScore: number;
  vragen: ScoutingVraag[];
}

export const SCOUTING_CONFIG: Record<LeeftijdsgroepNaam, ScoutingGroepConfig> = {
  paars: {
    schaalType: "smiley",
    maxScore: 3,
    vragen: VRAGEN_PAARS_BLAUW,
  },
  blauw: {
    schaalType: "smiley",
    maxScore: 3,
    vragen: VRAGEN_PAARS_BLAUW,
  },
  groen: {
    schaalType: "smiley",
    maxScore: 3,
    vragen: VRAGEN_GROEN,
  },
  geel: {
    schaalType: "sterren",
    maxScore: 5,
    vragen: VRAGEN_GEEL,
  },
  oranje: {
    schaalType: "sterren",
    maxScore: 5,
    vragen: VRAGEN_ORANJE,
  },
  rood: {
    schaalType: "slider",
    maxScore: 99,
    vragen: VRAGEN_ROOD,
  },
};

export function vragenPerPijler(groep: LeeftijdsgroepNaam): Record<Pijler, ScoutingVraag[]> {
  const config = SCOUTING_CONFIG[groep];
  const result: Record<Pijler, ScoutingVraag[]> = {
    SCH: [],
    AAN: [],
    PAS: [],
    VER: [],
    FYS: [],
    MEN: [],
  };

  for (const vraag of config.vragen) {
    result[vraag.pijler].push(vraag);
  }

  return result;
}

export function actievePijlers(groep: LeeftijdsgroepNaam): Pijler[] {
  const perPijler = vragenPerPijler(groep);
  return (Object.keys(perPijler) as Pijler[]).filter((p) => perPijler[p].length > 0);
}
