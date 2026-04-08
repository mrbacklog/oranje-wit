"use client";

import { useState, useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { SpelerData, TeamData, SelectieGroepData, SpelerFilter } from "./types";
import { korfbalLeeftijd } from "./types";
import SpelerFilters from "./SpelerFilters";
import SpelerKaart from "./SpelerKaart";

interface SpelersPoolProps {
  spelers: SpelerData[];
  teams: TeamData[];
  selectieGroepen: SelectieGroepData[];
  zichtbareTeamIds: Set<string>;
  pinnedSpelerIds?: Set<string>;
  onSpelerClick?: (speler: SpelerData) => void;
}

export default function SpelersPool({
  spelers,
  teams,
  selectieGroepen,
  zichtbareTeamIds,
  pinnedSpelerIds,
  onSpelerClick,
}: SpelersPoolProps) {
  const [zoekterm, setZoekterm] = useState("");
  const [filter, setFilter] = useState<SpelerFilter>("zonder_team");

  const { setNodeRef, isOver } = useDroppable({
    id: "spelerspool",
    data: { type: "pool" },
  });

  // Bepaal welke spelers al in een team of selectiegroep zitten
  const ingedeeldeSpelerIds = useMemo(() => {
    const ids = new Set<string>();
    for (const team of teams) {
      for (const ts of team.spelers) {
        ids.add(ts.spelerId);
      }
    }
    for (const sg of selectieGroepen) {
      for (const ss of sg.spelers) {
        ids.add(ss.spelerId);
      }
    }
    return ids;
  }, [teams, selectieGroepen]);

  // Bepaal leeftijds-/geslachtbereik van zichtbare teams voor "passend" filter
  const passendeSpelerIds = useMemo(() => {
    const ids = new Set<string>();
    const zichtbareTeams = teams.filter((t) => zichtbareTeamIds.has(t.id));
    if (zichtbareTeams.length === 0) return ids;

    // Verzamel leeftijden van bestaande spelers in zichtbare teams (incl. selectiegroepen)
    const leeftijden = new Set<number>();
    const gezienSelecties = new Set<string>();
    for (const team of zichtbareTeams) {
      if (team.selectieGroepId) {
        if (gezienSelecties.has(team.selectieGroepId)) continue;
        gezienSelecties.add(team.selectieGroepId);
        const sg = selectieGroepen.find((g) => g.id === team.selectieGroepId);
        if (sg) {
          for (const ss of sg.spelers) {
            leeftijden.add(
              Math.floor(korfbalLeeftijd(ss.speler.geboortedatum, ss.speler.geboortejaar))
            );
          }
        }
      } else {
        for (const ts of team.spelers) {
          leeftijden.add(
            Math.floor(korfbalLeeftijd(ts.speler.geboortedatum, ts.speler.geboortejaar))
          );
        }
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
  }, [spelers, teams, selectieGroepen, zichtbareTeamIds]);

  // Filter spelers
  const gefilterdeSpelers = useMemo(() => {
    let result = spelers;

    // Zoekfilter
    if (zoekterm.trim()) {
      const term = zoekterm.toLowerCase();
      result = result.filter(
        (s) => s.roepnaam.toLowerCase().includes(term) || s.achternaam.toLowerCase().includes(term)
      );
    }

    // Type filter
    switch (filter) {
      case "zonder_team":
        result = result.filter(
          (s) => !ingedeeldeSpelerIds.has(s.id) && s.status !== "ALGEMEEN_RESERVE"
        );
        break;
      case "ingedeeld":
        result = result.filter((s) => ingedeeldeSpelerIds.has(s.id));
        break;
      case "passend":
        result = result.filter(
          (s) =>
            passendeSpelerIds.has(s.id) &&
            !ingedeeldeSpelerIds.has(s.id) &&
            s.status !== "ALGEMEEN_RESERVE"
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
      className="flex w-80 flex-shrink-0 flex-col transition-colors"
      style={{
        background: isOver ? "#FF6B0011" : "var(--surface-card)",
        borderLeft: isOver
          ? "1px solid var(--ow-oranje-500)"
          : "1px solid var(--border-default)",
      }}
    >
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-default)" }}>
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Spelerspool
        </h3>
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>
          {gefilterdeSpelers.length} van {spelers.length} spelers
        </p>
      </div>

      <div className="px-3 py-2" style={{ borderBottom: "1px solid var(--border-default)" }}>
        <SpelerFilters
          zoekterm={zoekterm}
          onZoektermChange={setZoekterm}
          filter={filter}
          onFilterChange={setFilter}
        />
      </div>

      <div className="max-h-[calc(100vh-16rem)] flex-1 space-y-1 overflow-y-auto px-2 py-2">
        {gefilterdeSpelers.length === 0 ? (
          <p className="py-6 text-center text-xs" style={{ color: "var(--text-secondary)" }}>
            Geen spelers gevonden
          </p>
        ) : (
          gefilterdeSpelers.map((speler) => (
            <SpelerKaart
              key={speler.id}
              speler={speler}
              isPinned={pinnedSpelerIds?.has(speler.id)}
              onClick={() => onSpelerClick?.(speler)}
            />
          ))
        )}
      </div>
    </aside>
  );
}
