import { useMemo } from "react";
import type {
  TeamData as UITeamData,
  SelectieGroepData,
} from "@/components/teamindeling/scenario/types";
import type {
  TeamData as ValidatieTeamData,
  SpelerData as ValidatieSpelerData,
  TeamValidatie,
  ValidatieMelding,
  BlauwdrukKaders,
} from "@/lib/teamindeling/validatie/regels";
import { valideerTeam, valideerDubbeleSpelersOverTeams } from "@/lib/teamindeling/validatie/regels";
import {
  valideerSelectie,
  type SelectieValidatie,
} from "@/lib/teamindeling/validatie/selectie-regels";

/**
 * Map UI TeamData naar validatie-engine TeamData.
 */
function mapNaarValidatieTeam(team: UITeamData): ValidatieTeamData {
  return {
    naam: team.naam,
    categorie: team.categorie,
    kleur: team.kleur,
    niveau: team.niveau,
    spelers: team.spelers.map(
      (ts): ValidatieSpelerData => ({
        id: ts.spelerId,
        roepnaam: ts.speler.roepnaam,
        achternaam: ts.speler.achternaam,
        geboortejaar: ts.speler.geboortejaar,
        geboortedatum: ts.speler.geboortedatum,
        geslacht: ts.speler.geslacht,
        status: ts.statusOverride ?? ts.speler.status,
      })
    ),
  };
}

export interface ValidatieResultaat {
  /** Per team-ID de validatie */
  validatieMap: Map<string, TeamValidatie>;
  /** Meldingen voor dubbele spelers over teams heen */
  dubbeleMeldingen: ValidatieMelding[];
  /** Per selectieGroep-ID de validatie */
  selectieValidatieMap: Map<string, SelectieValidatie>;
}

/**
 * Hook die realtime validatie uitvoert op alle teams en selecties.
 * Herberekent alleen als inputs wijzigen (via useMemo).
 */
export function useValidatie(
  teams: UITeamData[],
  seizoenJaar: number,
  kaders?: BlauwdrukKaders,
  selectieGroepen?: SelectieGroepData[]
): ValidatieResultaat {
  return useMemo(() => {
    const validatieMap = new Map<string, TeamValidatie>();

    for (const team of teams) {
      const vTeam = mapNaarValidatieTeam(team);
      validatieMap.set(team.id, valideerTeam(vTeam, seizoenJaar, undefined, kaders));
    }

    // Sluit selectie-teams uit: hun spelers zitten in de selectiegroep
    const losseTeams = teams.filter((t) => !t.selectieGroepId).map(mapNaarValidatieTeam);
    const dubbeleMeldingen = valideerDubbeleSpelersOverTeams(losseTeams);

    // Valideer selecties als geheel
    const selectieValidatieMap = new Map<string, SelectieValidatie>();
    if (selectieGroepen) {
      for (const sg of selectieGroepen) {
        const lidTeams = teams.filter((t) => t.selectieGroepId === sg.id);
        const spelers = sg.spelers.map((ss) => ({
          id: ss.spelerId,
          geboortejaar: ss.speler.geboortejaar,
          geslacht: ss.speler.geslacht as "M" | "V",
        }));
        const teamInfos = lidTeams.map((t) => ({
          kleur: t.kleur,
          categorie: t.categorie,
        }));
        selectieValidatieMap.set(sg.id, valideerSelectie(spelers, teamInfos, seizoenJaar, kaders));
      }
    }

    return { validatieMap, dubbeleMeldingen, selectieValidatieMap };
  }, [teams, seizoenJaar, kaders, selectieGroepen]);
}
