"use client";

import { useState, useMemo } from "react";
import type { ScenarioData, SpelerData, TeamData, SelectieGroepData } from "../types";
import { PEILJAAR } from "../types";
import { useValidatie } from "@/hooks/useValidatie";
import { useCardPositions, type CardInfo } from "../hooks/useCardPositions";
import ViewWerkgebied from "./ViewWerkgebied";
import SpelerDetail from "../SpelerDetail";

interface ScenarioViewProps {
  scenario: ScenarioData;
}

export default function ScenarioView({ scenario }: ScenarioViewProps) {
  const laatsteVersie = scenario.versies[0];
  const teams: TeamData[] = laatsteVersie?.teams ?? [];

  const selectieGroepMap = useMemo(() => {
    const m = new Map<string, SelectieGroepData>();
    for (const sg of laatsteVersie?.selectieGroepen ?? []) m.set(sg.id, sg);
    return m;
  }, [laatsteVersie?.selectieGroepen]);

  const blauwdrukKaders = useMemo(
    () =>
      scenario.concept?.blauwdruk?.kaders as Record<string, Record<string, unknown>> | undefined,
    [scenario.concept?.blauwdruk?.kaders]
  );

  const { validatieMap } = useValidatie(teams, PEILJAAR, blauwdrukKaders);

  // Card positioning (zelfde systeem als editor)
  const cardInfos: CardInfo[] = useMemo(() => {
    const seen = new Set<string>();
    const infos: CardInfo[] = [];

    const groepSpelers = new Map<string, (typeof teams)[0]["spelers"]>();
    for (const team of teams) {
      if (team.selectieGroepId) {
        const bestaand = groepSpelers.get(team.selectieGroepId) ?? [];
        bestaand.push(...team.spelers);
        groepSpelers.set(team.selectieGroepId, bestaand);
      }
    }

    for (const team of teams) {
      if (team.selectieGroepId) {
        if (!seen.has(team.selectieGroepId)) {
          seen.add(team.selectieGroepId);
          const spelers = groepSpelers.get(team.selectieGroepId) ?? [];
          infos.push({
            id: `selectie-${team.selectieGroepId}`,
            teamType: "ACHTAL",
            isSelectie: true,
            damesCount: spelers.filter((s) => s.speler.geslacht === "V").length,
            herenCount: spelers.filter((s) => s.speler.geslacht === "M").length,
          });
        }
      } else {
        infos.push({
          id: team.id,
          teamType: team.teamType ?? "VIERTAL",
          isSelectie: false,
          damesCount: team.spelers.filter((s) => s.speler.geslacht === "V").length,
          herenCount: team.spelers.filter((s) => s.speler.geslacht === "M").length,
        });
      }
    }
    return infos;
  }, [teams]);

  const { positions, updatePosition } = useCardPositions(scenario.id, cardInfos);

  // Speler detail popup
  const [detailSpeler, setDetailSpeler] = useState<SpelerData | null>(null);
  const [detailTeamId, setDetailTeamId] = useState<string | null>(null);

  const handleSpelerClick = (speler: SpelerData) => {
    setDetailSpeler(speler);
    setDetailTeamId(null);
  };

  if (!laatsteVersie) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-gray-400">Dit scenario heeft nog geen versie.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-[600px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        <ViewWerkgebied
          teams={teams}
          selectieGroepMap={selectieGroepMap}
          validatieMap={validatieMap}
          positions={positions}
          onRepositionCard={updatePosition}
          onSpelerClick={handleSpelerClick}
        />
      </div>

      {detailSpeler && (
        <SpelerDetail
          speler={detailSpeler}
          teamId={detailTeamId ?? undefined}
          onClose={() => {
            setDetailSpeler(null);
            setDetailTeamId(null);
          }}
        />
      )}
    </>
  );
}
