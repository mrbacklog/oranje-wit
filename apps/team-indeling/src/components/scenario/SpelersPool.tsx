"use client";

import { useState, useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { SpelerData, TeamData, SpelerFilter } from "./types";
import { korfbalLeeftijd } from "./types";
import SpelerFilters from "./SpelerFilters";
import SpelerKaart from "./SpelerKaart";
import SpelerDetail from "./SpelerDetail";

interface SpelersPoolProps {
  spelers: SpelerData[];
  teams: TeamData[];
  zichtbareTeamIds: Set<string>;
}

export default function SpelersPool({
  spelers,
  teams,
  zichtbareTeamIds,
}: SpelersPoolProps) {
  const [zoekterm, setZoekterm] = useState("");
  const [filter, setFilter] = useState<SpelerFilter>("zonder_team");
  const [detailSpeler, setDetailSpeler] = useState<SpelerData | null>(null);

  const { setNodeRef, isOver } = useDroppable({
    id: "spelerspool",
    data: { type: "pool" },
  });

  // Bepaal welke spelers al in een team zitten
  const ingedeeldeSpelerIds = useMemo(() => {
    const ids = new Set<string>();
    for (const team of teams) {
      for (const ts of team.spelers) {
        ids.add(ts.spelerId);
      }
    }
    return ids;
  }, [teams]);

  // Bepaal leeftijds-/geslachtbereik van zichtbare teams voor "passend" filter
  const passendeSpelerIds = useMemo(() => {
    const ids = new Set<string>();
    const zichtbareTeams = teams.filter((t) => zichtbareTeamIds.has(t.id));
    if (zichtbareTeams.length === 0) return ids;

    // Verzamel leeftijden van bestaande spelers in zichtbare teams
    const leeftijden = new Set<number>();
    for (const team of zichtbareTeams) {
      for (const ts of team.spelers) {
        leeftijden.add(Math.floor(korfbalLeeftijd(ts.speler.geboortedatum, ts.speler.geboortejaar)));
      }
    }

    // Als er geen spelers in de teams zitten, maak alle spelers passend
    if (leeftijden.size === 0) {
      spelers.forEach((s) => ids.add(s.id));
      return ids;
    }

    const minLeeftijd = Math.min(...leeftijden) - 1;
    const maxLeeftijd = Math.max(...leeftijden) + 1;

    for (const speler of spelers) {
      const leeftijd = Math.floor(korfbalLeeftijd(speler.geboortedatum, speler.geboortejaar));
      if (leeftijd >= minLeeftijd && leeftijd <= maxLeeftijd) {
        ids.add(speler.id);
      }
    }
    return ids;
  }, [spelers, teams, zichtbareTeamIds]);

  // Filter spelers
  const gefilterdeSpelers = useMemo(() => {
    let result = spelers;

    // Zoekfilter
    if (zoekterm.trim()) {
      const term = zoekterm.toLowerCase();
      result = result.filter(
        (s) =>
          s.roepnaam.toLowerCase().includes(term) ||
          s.achternaam.toLowerCase().includes(term)
      );
    }

    // Type filter
    switch (filter) {
      case "zonder_team":
        result = result.filter((s) => !ingedeeldeSpelerIds.has(s.id));
        break;
      case "ingedeeld":
        result = result.filter((s) => ingedeeldeSpelerIds.has(s.id));
        break;
      case "passend":
        result = result.filter(
          (s) => passendeSpelerIds.has(s.id) && !ingedeeldeSpelerIds.has(s.id)
        );
        break;
      case "alle":
      default:
        break;
    }

    return result;
  }, [spelers, zoekterm, filter, ingedeeldeSpelerIds, passendeSpelerIds]);

  return (
    <aside
      ref={setNodeRef}
      className={`w-80 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col transition-colors ${
        isOver ? "bg-orange-50 border-orange-300" : ""
      }`}
    >
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">Spelerspool</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          {gefilterdeSpelers.length} van {spelers.length} spelers
        </p>
      </div>

      <div className="px-3 py-2 border-b border-gray-100">
        <SpelerFilters
          zoekterm={zoekterm}
          onZoektermChange={setZoekterm}
          filter={filter}
          onFilterChange={setFilter}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 max-h-[calc(100vh-16rem)]">
        {gefilterdeSpelers.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">
            Geen spelers gevonden
          </p>
        ) : (
          gefilterdeSpelers.map((speler) => (
            <SpelerKaart
              key={speler.id}
              speler={speler}
              onClick={() => setDetailSpeler(speler)}
            />
          ))
        )}
      </div>

      {/* Detail modal */}
      {detailSpeler && (
        <SpelerDetail
          speler={detailSpeler}
          onClose={() => setDetailSpeler(null)}
        />
      )}
    </aside>
  );
}
