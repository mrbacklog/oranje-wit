/**
 * What-if validatie: draait de bestaande validatie-engine op what-if teams
 * plus de samengevoegde staat met ongewijzigde werkindeling-teams.
 *
 * Twee lagen:
 * 1. KNKV-regels (valideerTeam per team + cross-team duplicaten)
 * 2. Blauwdruk-kader-afwijkingen (valideerBlauwdrukKaders)
 */

import type {
  TeamData,
  ValidatieMelding,
  BlauwdrukKaders,
  TeamgrootteOverrides,
} from "../validatie/types";
import { valideerTeam, valideerDubbeleSpelersOverTeams } from "../validatie/regels";
import type { WhatIfTeamData, WhatIfValidatie, KaderAfwijking } from "./types";
import { valideerBlauwdrukKaders, type TeamAantalKaders } from "./kader-validatie";
import type { WerkindelingTeamData } from "./delta";

// ============================================================
// Mapping: WhatIfTeamData -> TeamData (validatie-engine input)
// ============================================================

/** Speler-lookup voor het mappen van what-if teams naar validatie TeamData */
export interface SpelerLookup {
  id: string;
  roepnaam: string;
  achternaam: string;
  geboortejaar: number;
  geboortedatum?: string | null;
  geslacht: "M" | "V";
}

/**
 * Map een WhatIfTeamData naar het TeamData formaat dat valideerTeam verwacht.
 * Vereist een speler-lookup om de spelergegevens op te halen.
 */
export function whatIfTeamNaarTeamData(
  wiTeam: WhatIfTeamData,
  spelerLookup: Map<string, SpelerLookup>
): TeamData {
  return {
    naam: wiTeam.naam,
    categorie: mapCategorie(wiTeam.categorie),
    kleur: wiTeam.kleur as TeamData["kleur"],
    niveau: null,
    gebundeld: wiTeam.gebundeld ?? false,
    spelers: wiTeam.spelers
      .map((wis) => {
        const speler = spelerLookup.get(wis.spelerId);
        if (!speler) return null;
        return {
          id: speler.id,
          roepnaam: speler.roepnaam,
          achternaam: speler.achternaam,
          geboortejaar: speler.geboortejaar,
          geboortedatum: speler.geboortedatum,
          geslacht: speler.geslacht,
          status: wis.statusOverride ?? undefined,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null),
  };
}

function mapCategorie(cat: string): "SENIOREN" | "A_CATEGORIE" | "B_CATEGORIE" {
  if (cat === "SENIOREN") return "SENIOREN";
  if (cat === "A_CATEGORIE") return "A_CATEGORIE";
  return "B_CATEGORIE";
}

// ============================================================
// Hoofd-validatie
// ============================================================

export interface ValideerWhatIfOptions {
  /** Blauwdruk-kaders voor teamgrootte en gender */
  kaders?: BlauwdrukKaders;
  /** Teamgrootte overrides */
  overrides?: TeamgrootteOverrides;
  /** Teamaantal-kaders per categorie voor blauwdruk-afwijking check */
  teamAantalKaders?: TeamAantalKaders;
}

/**
 * Valideer een what-if: controleer alle what-if teams plus
 * de samengevoegde staat met ongewijzigde werkindeling-teams.
 *
 * Bouwt een samengevoegde teamlijst: what-if teams vervangen bronteams,
 * ongewijzigde werkindeling-teams blijven erin. Draait dan:
 * 1. valideerTeam() op elk what-if team
 * 2. valideerDubbeleSpelersOverTeams() op de samengevoegde lijst
 * 3. blauwdruk-kader-validatie op de samengevoegde lijst
 */
export function valideerWhatIf(
  whatIfTeams: WhatIfTeamData[],
  werkindelingTeams: WerkindelingTeamData[],
  spelerLookup: Map<string, SpelerLookup>,
  peildatum: Date,
  options?: ValideerWhatIfOptions
): WhatIfValidatie {
  const { kaders, overrides, teamAantalKaders } = options ?? {};

  // 1. Bouw samengevoegde teamlijst
  const samengevoegd = bouwSamengevoegdeTeamlijst(whatIfTeams, werkindelingTeams, spelerLookup);

  // 2. Valideer elk what-if team individueel
  const teamValidaties = new Map<string, ReturnType<typeof valideerTeam>>();
  for (const wiTeam of whatIfTeams) {
    const teamData = whatIfTeamNaarTeamData(wiTeam, spelerLookup);
    const resultaat = valideerTeam(teamData, peildatum, overrides, kaders);
    teamValidaties.set(wiTeam.id, resultaat);
  }

  // 3. Cross-team duplicaten op samengevoegde lijst
  const crossTeamMeldingen = valideerDubbeleSpelersOverTeams(samengevoegd);

  // 4. Blauwdruk-kader-validatie
  const kaderAfwijkingen = teamAantalKaders
    ? valideerBlauwdrukKaders(samengevoegd, teamAantalKaders)
    : [];

  // 5. Bepaal of er harde fouten of afwijkingen zijn
  const heeftHardefouten =
    [...teamValidaties.values()].some((v) => v.status === "ROOD") ||
    crossTeamMeldingen.some((m) => m.ernst === "kritiek");

  const heeftAfwijkingen = kaderAfwijkingen.length > 0;

  return {
    teamValidaties,
    crossTeamMeldingen,
    kaderAfwijkingen,
    heeftHardefouten,
    heeftAfwijkingen,
  };
}

// ============================================================
// Samengevoegde teamlijst
// ============================================================

/**
 * Bouw een samengevoegde teamlijst: what-if teams vervangen hun bronteams,
 * ongeraakte werkindeling-teams worden behouden.
 */
function bouwSamengevoegdeTeamlijst(
  whatIfTeams: WhatIfTeamData[],
  werkindelingTeams: WerkindelingTeamData[],
  spelerLookup: Map<string, SpelerLookup>
): TeamData[] {
  // Bronteams die door what-if teams vervangen worden
  const overschrevenIds = new Set(
    whatIfTeams.map((t) => t.bronTeamId).filter((id): id is string => id !== null)
  );

  const resultaat: TeamData[] = [];

  // Voeg ongeraakte werkindeling-teams toe
  for (const werkTeam of werkindelingTeams) {
    if (overschrevenIds.has(werkTeam.id)) continue;
    resultaat.push(werkindelingTeamNaarTeamData(werkTeam, spelerLookup));
  }

  // Voeg what-if teams toe
  for (const wiTeam of whatIfTeams) {
    resultaat.push(whatIfTeamNaarTeamData(wiTeam, spelerLookup));
  }

  return resultaat;
}

/**
 * Map een minimale werkindeling-team naar TeamData.
 * WerkindelingTeamData heeft alleen spelerId, dus we moeten opzoeken.
 */
function werkindelingTeamNaarTeamData(
  werkTeam: WerkindelingTeamData,
  spelerLookup: Map<string, SpelerLookup>
): TeamData {
  return {
    naam: werkTeam.naam,
    // Default categorie — werkindeling-teams die niet in de what-if zitten
    // worden alleen gebruikt voor cross-team duplicaat-check
    categorie: "SENIOREN",
    kleur: null,
    spelers: werkTeam.spelers
      .map((s) => {
        const speler = spelerLookup.get(s.spelerId);
        if (!speler) return null;
        return {
          id: speler.id,
          roepnaam: speler.roepnaam,
          achternaam: speler.achternaam,
          geboortejaar: speler.geboortejaar,
          geboortedatum: speler.geboortedatum,
          geslacht: speler.geslacht,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null),
  };
}
