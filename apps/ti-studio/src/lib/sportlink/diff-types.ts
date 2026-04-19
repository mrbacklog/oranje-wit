import type { SportlinkLid } from "./types";

/** Resultaat van de diff engine (Sportlink ↔ Speler vergelijking) */
export interface SyncDiff {
  nieuwe: NieuwLid[];
  afgemeld: AfgemeldLid[];
  fuzzyMatches: FuzzyMatch[];
  stats: {
    ledenVergeleken: number;
    spelersInPool: number;
    ongewijzigd: number;
  };
}

export type LidType =
  | "korfbalspeler"
  | "recreant"
  | "algemeen-reserve"
  | "niet-spelend"
  | "nieuw-lid";

export interface NieuwLid {
  lid: SportlinkLid;
  lidType: LidType;
}

export type AfmeldReden = "afmelddatum" | "niet-actief" | "niet-spelend" | "verdwenen";

export interface AfgemeldLid {
  lid: SportlinkLid;
  spelerId: string;
  spelerNaam: string;
  reden: AfmeldReden;
}

export interface FuzzyMatch {
  lid: SportlinkLid;
  spelerId: string;
  spelerNaam: string;
}
