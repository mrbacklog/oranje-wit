import { useMemo } from "react";
import type { TeamData as UITeamData } from "@/components/scenario/types";
import type {
  TeamData as ValidatieTeamData,
  SpelerData as ValidatieSpelerData,
  TeamValidatie,
  ValidatieMelding,
  BlauwdrukKaders,
} from "@/lib/validatie/regels";
import { valideerTeam, valideerDubbeleSpelersOverTeams } from "@/lib/validatie/regels";

/**
 * Map UI TeamData naar validatie-engine TeamData.
 */
function mapNaarValidatieTeam(team: UITeamData): ValidatieTeamData {
  return {
    naam: team.naam,
    categorie: team.categorie,
    kleur: team.kleur,
    niveau: team.niveau,
    spelers: team.spelers.map((ts): ValidatieSpelerData => ({
      id: ts.spelerId,
      roepnaam: ts.speler.roepnaam,
      achternaam: ts.speler.achternaam,
      geboortejaar: ts.speler.geboortejaar,
      geslacht: ts.speler.geslacht,
      status: ts.statusOverride ?? ts.speler.status,
    })),
  };
}

export interface ValidatieResultaat {
  /** Per team-ID de validatie */
  validatieMap: Map<string, TeamValidatie>;
  /** Meldingen voor dubbele spelers over teams heen */
  dubbeleMeldingen: ValidatieMelding[];
}

/**
 * Hook die realtime validatie uitvoert op alle teams.
 * Herberekent alleen als `teams` wijzigt (via useMemo).
 */
export function useValidatie(
  teams: UITeamData[],
  seizoenJaar: number,
  kaders?: BlauwdrukKaders
): ValidatieResultaat {
  return useMemo(() => {
    const validatieMap = new Map<string, TeamValidatie>();
    const validatieTeams: ValidatieTeamData[] = [];

    for (const team of teams) {
      const vTeam = mapNaarValidatieTeam(team);
      validatieTeams.push(vTeam);
      validatieMap.set(team.id, valideerTeam(vTeam, seizoenJaar, undefined, kaders));
    }

    const dubbeleMeldingen = valideerDubbeleSpelersOverTeams(validatieTeams);

    return { validatieMap, dubbeleMeldingen };
  }, [teams, seizoenJaar, kaders]);
}
