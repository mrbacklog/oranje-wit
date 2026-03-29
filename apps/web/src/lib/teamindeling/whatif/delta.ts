import type { TeamDelta, WhatIfTeamData } from "./types";

/**
 * Minimale team-data die we nodig hebben van de werkindeling.
 * Past op zowel Team (uit werkindeling) als WhatIfTeam.
 */
interface WerkindelingTeamData {
  id: string;
  naam: string;
  spelers: { spelerId: string }[];
}

/**
 * Bereken de delta's tussen werkindeling-teams en what-if teams.
 *
 * Voor elk what-if team met een bronTeamId vergelijken we de speler-sets
 * met het corresponderende werkindeling-team. What-if teams zonder
 * bronTeamId zijn nieuw en worden als "alles toegevoegd" gerapporteerd.
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
      // Nieuw team: alle spelers zijn "in"
      const spelersIn = wiTeam.spelers.map((s) => s.spelerId);
      deltas.push({
        teamNaam: wiTeam.naam,
        bronTeamId: null,
        huidigAantal: 0,
        nieuwAantal: spelersIn.length,
        verschil: spelersIn.length,
        isNieuw: true,
        spelersIn,
        spelersUit: [],
      });
      continue;
    }

    // Bestaand team: vergelijk speler-sets
    const bronTeam = werkTeamMap.get(wiTeam.bronTeamId);
    if (!bronTeam) {
      // Bronteam niet gevonden (verwijderd?). Behandel als nieuw.
      const spelersIn = wiTeam.spelers.map((s) => s.spelerId);
      deltas.push({
        teamNaam: wiTeam.naam,
        bronTeamId: wiTeam.bronTeamId,
        huidigAantal: 0,
        nieuwAantal: spelersIn.length,
        verschil: spelersIn.length,
        isNieuw: true,
        spelersIn,
        spelersUit: [],
      });
      continue;
    }

    const huidigSet = new Set(bronTeam.spelers.map((s) => s.spelerId));
    const nieuwSet = new Set(wiTeam.spelers.map((s) => s.spelerId));

    const spelersIn: string[] = [];
    const spelersUit: string[] = [];

    for (const id of nieuwSet) {
      if (!huidigSet.has(id)) spelersIn.push(id);
    }
    for (const id of huidigSet) {
      if (!nieuwSet.has(id)) spelersUit.push(id);
    }

    // Alleen rapporteren als er daadwerkelijk verschil is
    if (spelersIn.length > 0 || spelersUit.length > 0) {
      deltas.push({
        teamNaam: wiTeam.naam,
        bronTeamId: wiTeam.bronTeamId,
        huidigAantal: huidigSet.size,
        nieuwAantal: nieuwSet.size,
        verschil: nieuwSet.size - huidigSet.size,
        isNieuw: false,
        spelersIn,
        spelersUit,
      });
    }
  }

  return deltas;
}
