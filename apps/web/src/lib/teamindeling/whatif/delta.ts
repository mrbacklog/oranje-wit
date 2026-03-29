import type { TeamDelta, WhatIfTeamData, ImpactSamenvatting } from "./types";

/**
 * Minimale team-data die we nodig hebben van de werkindeling.
 * Past op zowel Team (uit werkindeling) als WhatIfTeam.
 */
export interface WerkindelingTeamData {
  id: string;
  naam: string;
  spelers: { spelerId: string }[];
  staf: { stafId: string }[];
}

/**
 * Bereken de delta's tussen werkindeling-teams en what-if teams.
 *
 * Voor elk what-if team met een bronTeamId vergelijken we de speler-sets
 * en staf-sets met het corresponderende werkindeling-team. What-if teams
 * zonder bronTeamId zijn nieuw en worden als "alles toegevoegd" gerapporteerd.
 */
export function berekenWhatIfDelta(
  werkindelingTeams: WerkindelingTeamData[],
  whatIfTeams: WhatIfTeamData[]
): TeamDelta[] {
  const deltas: TeamDelta[] = [];

  // Bouw een lookup van werkindeling-teams per ID
  const werkTeamMap = new Map<string, WerkindelingTeamData>();
  for (const team of werkindelingTeams) {
    werkTeamMap.set(team.id, team);
  }

  for (const wiTeam of whatIfTeams) {
    if (wiTeam.bronTeamId === null) {
      // Nieuw team: alle spelers en staf zijn "in"
      const spelersIn = wiTeam.spelers.map((s) => s.spelerId);
      const stafIn = wiTeam.staf.map((s) => s.stafId);
      deltas.push({
        teamNaam: wiTeam.naam,
        bronTeamId: null,
        huidigAantal: 0,
        nieuwAantal: spelersIn.length,
        verschil: spelersIn.length,
        isNieuw: true,
        spelersIn,
        spelersUit: [],
        stafIn,
        stafUit: [],
        stafHuidig: 0,
        stafNieuw: stafIn.length,
      });
      continue;
    }

    // Bestaand team: vergelijk speler-sets en staf-sets
    const bronTeam = werkTeamMap.get(wiTeam.bronTeamId);
    if (!bronTeam) {
      // Bronteam niet gevonden (verwijderd?). Behandel als nieuw.
      const spelersIn = wiTeam.spelers.map((s) => s.spelerId);
      const stafIn = wiTeam.staf.map((s) => s.stafId);
      deltas.push({
        teamNaam: wiTeam.naam,
        bronTeamId: wiTeam.bronTeamId,
        huidigAantal: 0,
        nieuwAantal: spelersIn.length,
        verschil: spelersIn.length,
        isNieuw: true,
        spelersIn,
        spelersUit: [],
        stafIn,
        stafUit: [],
        stafHuidig: 0,
        stafNieuw: stafIn.length,
      });
      continue;
    }

    const huidigSpelerSet = new Set(bronTeam.spelers.map((s) => s.spelerId));
    const nieuwSpelerSet = new Set(wiTeam.spelers.map((s) => s.spelerId));
    const huidigStafSet = new Set(bronTeam.staf.map((s) => s.stafId));
    const nieuwStafSet = new Set(wiTeam.staf.map((s) => s.stafId));

    const spelersIn: string[] = [];
    const spelersUit: string[] = [];
    const stafIn: string[] = [];
    const stafUit: string[] = [];

    for (const id of nieuwSpelerSet) {
      if (!huidigSpelerSet.has(id)) spelersIn.push(id);
    }
    for (const id of huidigSpelerSet) {
      if (!nieuwSpelerSet.has(id)) spelersUit.push(id);
    }
    for (const id of nieuwStafSet) {
      if (!huidigStafSet.has(id)) stafIn.push(id);
    }
    for (const id of huidigStafSet) {
      if (!nieuwStafSet.has(id)) stafUit.push(id);
    }

    // Alleen rapporteren als er daadwerkelijk verschil is
    const heeftVerschil =
      spelersIn.length > 0 || spelersUit.length > 0 || stafIn.length > 0 || stafUit.length > 0;

    if (heeftVerschil) {
      deltas.push({
        teamNaam: wiTeam.naam,
        bronTeamId: wiTeam.bronTeamId,
        huidigAantal: huidigSpelerSet.size,
        nieuwAantal: nieuwSpelerSet.size,
        verschil: nieuwSpelerSet.size - huidigSpelerSet.size,
        isNieuw: false,
        spelersIn,
        spelersUit,
        stafIn,
        stafUit,
        stafHuidig: huidigStafSet.size,
        stafNieuw: nieuwStafSet.size,
      });
    }
  }

  return deltas;
}

/**
 * Bereken de volledige impact-samenvatting van een what-if.
 *
 * Naast de directe delta's (gewijzigde teams in de what-if) identificeert
 * dit ook impact-teams: werkindeling-teams die NIET in de what-if zitten
 * maar wél spelers of staf kwijtraken doordat die naar een what-if team
 * zijn verplaatst.
 */
export function berekenImpactSamenvatting(
  werkindelingTeams: WerkindelingTeamData[],
  whatIfTeams: WhatIfTeamData[]
): ImpactSamenvatting {
  // 1. Bereken directe delta's
  const gewijzigdeTeams = berekenWhatIfDelta(werkindelingTeams, whatIfTeams);

  // 2. Identificeer impact-teams
  // Verzamel alle bronTeamIds die al in de what-if zitten
  const whatIfBronTeamIds = new Set(
    whatIfTeams.map((t) => t.bronTeamId).filter((id): id is string => id !== null)
  );

  // Verzamel alle speler-IDs die in de what-if teams zitten
  const whatIfSpelerIds = new Set(whatIfTeams.flatMap((t) => t.spelers.map((s) => s.spelerId)));

  // Verzamel alle staf-IDs die in de what-if teams zitten
  const whatIfStafIds = new Set(whatIfTeams.flatMap((t) => t.staf.map((s) => s.stafId)));

  const impactTeams: TeamDelta[] = [];

  for (const werkTeam of werkindelingTeams) {
    // Skip teams die al in de what-if zitten
    if (whatIfBronTeamIds.has(werkTeam.id)) continue;

    // Check of dit team spelers of staf kwijtraakt aan de what-if
    const verlorenSpelers = werkTeam.spelers
      .filter((s) => whatIfSpelerIds.has(s.spelerId))
      .map((s) => s.spelerId);

    const verlorenStaf = werkTeam.staf
      .filter((s) => whatIfStafIds.has(s.stafId))
      .map((s) => s.stafId);

    if (verlorenSpelers.length > 0 || verlorenStaf.length > 0) {
      impactTeams.push({
        teamNaam: werkTeam.naam,
        bronTeamId: werkTeam.id,
        huidigAantal: werkTeam.spelers.length,
        nieuwAantal: werkTeam.spelers.length - verlorenSpelers.length,
        verschil: -verlorenSpelers.length,
        isNieuw: false,
        spelersIn: [],
        spelersUit: verlorenSpelers,
        stafIn: [],
        stafUit: verlorenStaf,
        stafHuidig: werkTeam.staf.length,
        stafNieuw: werkTeam.staf.length - verlorenStaf.length,
      });
    }
  }

  // 3. Bereken totalen
  const alleDeltas = [...gewijzigdeTeams, ...impactTeams];
  const totaalSpelersVerplaatst = alleDeltas.reduce(
    (sum, d) => sum + d.spelersIn.length + d.spelersUit.length,
    0
  );
  // Elke verplaatste speler telt dubbel (uit + in), deel door 2
  // Maar voor impact-teams tellen ze alleen als uit, dus tel unieke speler-moves
  const uniqueSpelerMoves = new Set([
    ...alleDeltas.flatMap((d) => d.spelersIn),
    ...alleDeltas.flatMap((d) => d.spelersUit),
  ]);

  const uniqueStafMoves = new Set([
    ...alleDeltas.flatMap((d) => d.stafIn),
    ...alleDeltas.flatMap((d) => d.stafUit),
  ]);

  const nieuwTeams = gewijzigdeTeams.filter((d) => d.isNieuw).length;

  return {
    gewijzigdeTeams,
    impactTeams,
    totaalSpelersVerplaatst: uniqueSpelerMoves.size,
    totaalStafVerplaatst: uniqueStafMoves.size,
    nieuwTeams,
  };
}
