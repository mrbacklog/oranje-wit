/**
 * Pin-validatie voor what-ifs.
 *
 * Controleert of pins (SPELER_POSITIE, SPELER_STATUS, STAF_POSITIE)
 * geschonden worden door de samengevoegde staat van what-if + werkindeling.
 *
 * Pin types:
 * - SPELER_POSITIE: speler moet in een specifiek team staan
 *   waarde: { teamNaam: string, teamId: string }
 * - SPELER_STATUS: speler mag niet verplaatst worden (status-pin)
 *   waarde: { teamNaam: string, teamId: string }
 * - STAF_POSITIE: staf moet bij een specifiek team staan
 *   waarde: { teamNaam: string, teamId: string }
 */

import type { WhatIfTeamData, PinSchending } from "./types";
import type { WerkindelingTeamData } from "./delta";

/** Pin-data in het formaat dat we nodig hebben voor validatie */
export interface PinDataVoorValidatie {
  id: string;
  type: "SPELER_POSITIE" | "SPELER_STATUS" | "STAF_POSITIE";
  spelerId: string | null;
  stafId: string | null;
  waarde: { teamNaam: string; teamId: string };
}

/**
 * Controleer of pins geschonden worden in een what-if.
 *
 * Bouwt een mapping van spelerId/stafId -> teamNaam voor de
 * samengevoegde staat, en vergelijkt met de pin-eisen.
 */
export function valideerPinsInWhatIf(
  whatIfTeams: WhatIfTeamData[],
  werkindelingTeams: WerkindelingTeamData[],
  pins: PinDataVoorValidatie[]
): PinSchending[] {
  if (pins.length === 0) return [];

  // Bouw lookups voor de samengevoegde staat
  const spelerNaarTeam = bouwSpelerNaarTeamLookup(whatIfTeams, werkindelingTeams);
  const stafNaarTeam = bouwStafNaarTeamLookup(whatIfTeams, werkindelingTeams);

  const schendingen: PinSchending[] = [];

  for (const pin of pins) {
    const schending = controleerPin(pin, spelerNaarTeam, stafNaarTeam);
    if (schending) {
      schendingen.push(schending);
    }
  }

  return schendingen;
}

// ============================================================
// Pin-controle per type
// ============================================================

function controleerPin(
  pin: PinDataVoorValidatie,
  spelerNaarTeam: Map<string, string>,
  stafNaarTeam: Map<string, string>
): PinSchending | null {
  switch (pin.type) {
    case "SPELER_POSITIE":
      return controleerSpelerPositie(pin, spelerNaarTeam);
    case "SPELER_STATUS":
      return controleerSpelerStatus(pin, spelerNaarTeam);
    case "STAF_POSITIE":
      return controleerStafPositie(pin, stafNaarTeam);
    default:
      return null;
  }
}

/**
 * SPELER_POSITIE: speler moet in het opgegeven team staan.
 */
function controleerSpelerPositie(
  pin: PinDataVoorValidatie,
  spelerNaarTeam: Map<string, string>
): PinSchending | null {
  if (!pin.spelerId) return null;

  const huidigTeam = spelerNaarTeam.get(pin.spelerId) ?? null;
  const verwachtTeam = pin.waarde.teamNaam;

  // Als de speler niet in het verwachte team staat, is de pin geschonden
  if (huidigTeam !== verwachtTeam) {
    return {
      pinId: pin.id,
      type: "SPELER_POSITIE",
      beschrijving: huidigTeam
        ? `Pin geschonden: speler moet in "${verwachtTeam}" staan, staat nu in "${huidigTeam}"`
        : `Pin geschonden: speler moet in "${verwachtTeam}" staan, is niet ingedeeld`,
      huidigTeam,
      verwachtTeam,
    };
  }

  return null;
}

/**
 * SPELER_STATUS: speler mag niet verplaatst worden uit het opgegeven team.
 * Werkt hetzelfde als SPELER_POSITIE: speler moet in het team blijven.
 */
function controleerSpelerStatus(
  pin: PinDataVoorValidatie,
  spelerNaarTeam: Map<string, string>
): PinSchending | null {
  if (!pin.spelerId) return null;

  const huidigTeam = spelerNaarTeam.get(pin.spelerId) ?? null;
  const verwachtTeam = pin.waarde.teamNaam;

  if (huidigTeam !== verwachtTeam) {
    return {
      pinId: pin.id,
      type: "SPELER_STATUS",
      beschrijving: huidigTeam
        ? `Status-pin geschonden: speler is verplaatst van "${verwachtTeam}" naar "${huidigTeam}"`
        : `Status-pin geschonden: speler is verwijderd uit "${verwachtTeam}"`,
      huidigTeam,
      verwachtTeam,
    };
  }

  return null;
}

/**
 * STAF_POSITIE: staf moet bij het opgegeven team staan.
 */
function controleerStafPositie(
  pin: PinDataVoorValidatie,
  stafNaarTeam: Map<string, string>
): PinSchending | null {
  if (!pin.stafId) return null;

  const huidigTeam = stafNaarTeam.get(pin.stafId) ?? null;
  const verwachtTeam = pin.waarde.teamNaam;

  if (huidigTeam !== verwachtTeam) {
    return {
      pinId: pin.id,
      type: "STAF_POSITIE",
      beschrijving: huidigTeam
        ? `Staf-pin geschonden: staf moet bij "${verwachtTeam}", staat nu bij "${huidigTeam}"`
        : `Staf-pin geschonden: staf moet bij "${verwachtTeam}", is niet ingedeeld`,
      huidigTeam,
      verwachtTeam,
    };
  }

  return null;
}

// ============================================================
// Lookups bouwen
// ============================================================

/**
 * Bouw een mapping spelerId -> teamNaam voor de samengevoegde staat.
 * What-if teams overschrijven werkindeling-teams (op basis van bronTeamId).
 */
function bouwSpelerNaarTeamLookup(
  whatIfTeams: WhatIfTeamData[],
  werkindelingTeams: WerkindelingTeamData[]
): Map<string, string> {
  const overschrevenIds = new Set(
    whatIfTeams.map((t) => t.bronTeamId).filter((id): id is string => id !== null)
  );

  const lookup = new Map<string, string>();

  // Eerst werkindeling-teams (niet-overschreven)
  for (const team of werkindelingTeams) {
    if (overschrevenIds.has(team.id)) continue;
    for (const s of team.spelers) {
      lookup.set(s.spelerId, team.naam);
    }
  }

  // Dan what-if teams (overschrijven)
  for (const team of whatIfTeams) {
    for (const s of team.spelers) {
      lookup.set(s.spelerId, team.naam);
    }
  }

  return lookup;
}

/**
 * Bouw een mapping stafId -> teamNaam voor de samengevoegde staat.
 */
function bouwStafNaarTeamLookup(
  whatIfTeams: WhatIfTeamData[],
  werkindelingTeams: WerkindelingTeamData[]
): Map<string, string> {
  const overschrevenIds = new Set(
    whatIfTeams.map((t) => t.bronTeamId).filter((id): id is string => id !== null)
  );

  const lookup = new Map<string, string>();

  for (const team of werkindelingTeams) {
    if (overschrevenIds.has(team.id)) continue;
    for (const s of team.staf) {
      lookup.set(s.stafId, team.naam);
    }
  }

  for (const team of whatIfTeams) {
    for (const s of team.staf) {
      lookup.set(s.stafId, team.naam);
    }
  }

  return lookup;
}
