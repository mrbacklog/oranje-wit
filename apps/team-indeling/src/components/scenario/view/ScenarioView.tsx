"use client";

import { useState, useMemo } from "react";
import type { ScenarioData, SpelerData, TeamData, SelectieGroepData } from "../types";
import { PEILJAAR } from "../types";
import { useValidatie } from "@/hooks/useValidatie";
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
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        {/* Info bar */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-2">
          <span className="text-sm text-gray-500">{teams.length} teams</span>
        </div>

        {/* Read-only grid */}
        <ViewWerkgebied
          teams={teams}
          selectieGroepMap={selectieGroepMap}
          validatieMap={validatieMap}
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
