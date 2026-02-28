/**
 * Impact-analyse: berekent best case, verwacht en worst case
 * op basis van spelerstatus (twijfelaars/stoppers).
 */

import type { TeamData, SpelerData } from "./regels";

export interface ImpactAnalyse {
  teamNaam: string;
  huidig: TeamTelling;
  bestCase: TeamTelling; // Alle twijfelaars blijven
  verwacht: TeamTelling; // Stoppers weg, twijfelaars 50/50
  worstCase: TeamTelling; // Stoppers + twijfelaars weg
}

export interface TeamTelling {
  totaal: number;
  m: number;
  v: number;
  beschrijving: string;
}

export function berekenImpact(team: TeamData): ImpactAnalyse {
  const beschikbaar = team.spelers.filter(
    (s) =>
      !s.status ||
      s.status === "BESCHIKBAAR" ||
      s.status === "NIEUW_POTENTIEEL" ||
      s.status === "NIEUW_DEFINITIEF"
  );
  const twijfelaars = team.spelers.filter((s) => s.status === "TWIJFELT");
  const stoppers = team.spelers.filter((s) => s.status === "GAAT_STOPPEN");

  const huidig = telSpelers(team.spelers);
  const bestCase = telSpelers([...beschikbaar, ...twijfelaars]);
  const verwacht = telSpelers([
    ...beschikbaar,
    // 50% van twijfelaars behouden (rond naar boven)
    ...twijfelaars.slice(0, Math.ceil(twijfelaars.length / 2)),
  ]);
  const worstCase = telSpelers(beschikbaar);

  return {
    teamNaam: team.naam,
    huidig: {
      ...huidig,
      beschrijving: `${huidig.m}M + ${huidig.v}V = ${huidig.totaal} (incl. ${stoppers.length} stopper(s), ${twijfelaars.length} twijfelaar(s))`,
    },
    bestCase: {
      ...bestCase,
      beschrijving: `${bestCase.m}M + ${bestCase.v}V = ${bestCase.totaal} (alle twijfelaars blijven, stoppers weg)`,
    },
    verwacht: {
      ...verwacht,
      beschrijving: `${verwacht.m}M + ${verwacht.v}V = ${verwacht.totaal} (50% twijfelaars blijft, stoppers weg)`,
    },
    worstCase: {
      ...worstCase,
      beschrijving: `${worstCase.m}M + ${worstCase.v}V = ${worstCase.totaal} (alleen beschikbare spelers)`,
    },
  };
}

function telSpelers(spelers: SpelerData[]): Omit<TeamTelling, "beschrijving"> {
  return {
    totaal: spelers.length,
    m: spelers.filter((s) => s.geslacht === "M").length,
    v: spelers.filter((s) => s.geslacht === "V").length,
  };
}
