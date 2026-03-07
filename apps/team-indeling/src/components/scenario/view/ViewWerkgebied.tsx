"use client";

import { useMemo } from "react";
import type { TeamData, SpelerData, SelectieGroepData } from "../types";
import type { TeamValidatie } from "@/lib/validatie/regels";
import ViewTeamKaart from "./ViewTeamKaart";
import ViewSelectieBlok from "./ViewSelectieBlok";

interface ViewWerkgebiedProps {
  teams: TeamData[];
  selectieGroepMap?: Map<string, SelectieGroepData>;
  validatieMap?: Map<string, TeamValidatie>;
  onSpelerClick?: (speler: SpelerData) => void;
}

export default function ViewWerkgebied({
  teams,
  selectieGroepMap,
  validatieMap,
  onSpelerClick,
}: ViewWerkgebiedProps) {
  const { selectieGroepen, losseTeams } = useMemo(() => {
    const groepen = new Map<string, TeamData[]>();
    const los: TeamData[] = [];

    for (const team of teams) {
      if (team.selectieGroepId) {
        const groep = groepen.get(team.selectieGroepId) ?? [];
        groep.push(team);
        groepen.set(team.selectieGroepId, groep);
      } else {
        los.push(team);
      }
    }

    return { selectieGroepen: groepen, losseTeams: los };
  }, [teams]);

  return (
    <div className="flex-1 overflow-auto p-4">
      {teams.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-gray-400">Dit scenario heeft nog geen teams.</p>
        </div>
      ) : (
        <div className="grid auto-rows-min grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from(selectieGroepen.entries()).map(([groepId, groepTeams]) => (
            <ViewSelectieBlok
              key={`selectie-${groepId}`}
              teams={groepTeams}
              selectieGroep={selectieGroepMap?.get(groepId)}
              validatieMap={validatieMap}
              onSpelerClick={onSpelerClick}
            />
          ))}
          {losseTeams.map((team) => (
            <ViewTeamKaart
              key={team.id}
              team={team}
              validatie={validatieMap?.get(team.id)}
              onSpelerClick={onSpelerClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
