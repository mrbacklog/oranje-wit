"use client";

import { useState, useMemo, useCallback } from "react";
import type { TeamData } from "./types";
import type { TeamCategorie, Kleur } from "@oranje-wit/database";
import TeamKaart from "./TeamKaart";
import SelectieBlok from "./SelectieBlok";
import NieuwTeamDialoog from "./NieuwTeamDialoog";

interface WerkgebiedProps {
  teams: TeamData[];
  zichtbareTeamIds: Set<string>;
  onCreateTeam: (data: {
    naam: string;
    categorie: TeamCategorie;
    kleur?: Kleur;
  }) => void;
  onDeleteTeam: (teamId: string) => void;
  onKoppelSelectie: (teamIds: string[]) => void;
  onOntkoppelSelectie: (groepLeiderId: string) => void;
}

export default function Werkgebied({
  teams,
  zichtbareTeamIds,
  onCreateTeam,
  onDeleteTeam,
  onKoppelSelectie,
  onOntkoppelSelectie,
}: WerkgebiedProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [geselecteerd, setGeselecteerd] = useState<Set<string>>(new Set());

  const zichtbareTeams = teams.filter((t) => zichtbareTeamIds.has(t.id));

  // Groepeer teams op selectie
  const { selectieGroepen, losseTeams } = useMemo(() => {
    const groepen = new Map<string, TeamData[]>();
    const los: TeamData[] = [];

    for (const team of zichtbareTeams) {
      if (team.selectieGroepId) {
        // Dit team hoort bij een selectie-groep
        const groep = groepen.get(team.selectieGroepId) ?? [];
        groep.push(team);
        groepen.set(team.selectieGroepId, groep);
      } else {
        // Check of dit team zelf een leider is (andere teams verwijzen ernaar)
        const leden = zichtbareTeams.filter(
          (t) => t.selectieGroepId === team.id
        );
        if (leden.length > 0) {
          const groep = groepen.get(team.id) ?? [];
          groep.unshift(team); // leider eerst
          groepen.set(team.id, groep);
        } else {
          los.push(team);
        }
      }
    }

    return { selectieGroepen: groepen, losseTeams: los };
  }, [zichtbareTeams]);

  const toggleSelectie = useCallback((teamId: string) => {
    setGeselecteerd((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      return next;
    });
  }, []);

  const handleKoppel = useCallback(() => {
    if (geselecteerd.size < 2) return;
    onKoppelSelectie(Array.from(geselecteerd));
    setGeselecteerd(new Set());
  }, [geselecteerd, onKoppelSelectie]);

  const kanKoppelen = geselecteerd.size >= 2;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-gray-100 bg-white flex items-center justify-between gap-2">
        <span className="text-sm text-gray-500">
          {zichtbareTeams.length} van {teams.length} teams zichtbaar
        </span>
        <div className="flex items-center gap-2">
          {geselecteerd.size > 0 && (
            <>
              <span className="text-xs text-gray-400">
                {geselecteerd.size} geselecteerd
              </span>
              <button
                onClick={() => setGeselecteerd(new Set())}
                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Deselecteer
              </button>
              <button
                onClick={handleKoppel}
                disabled={!kanKoppelen}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  kanKoppelen
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Koppel als selectie
              </button>
            </>
          )}
          <button
            onClick={() => setDialogOpen(true)}
            className="px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition-colors"
          >
            + Nieuw team
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-4">
        {zichtbareTeams.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400">
              Selecteer teams in de navigator om ze hier te tonen.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 auto-rows-min">
            {/* Selectie-groepen */}
            {Array.from(selectieGroepen.entries()).map(([leiderId, groepTeams]) => (
              <SelectieBlok
                key={`selectie-${leiderId}`}
                teams={groepTeams}
                onOntkoppel={onOntkoppelSelectie}
                onDelete={onDeleteTeam}
              />
            ))}
            {/* Losse teams */}
            {losseTeams.map((team) => (
              <div
                key={team.id}
                onClick={() => toggleSelectie(team.id)}
                className={`cursor-pointer rounded-lg transition-all ${
                  geselecteerd.has(team.id)
                    ? "ring-2 ring-orange-400 ring-offset-1"
                    : ""
                }`}
              >
                <TeamKaart team={team} onDelete={onDeleteTeam} />
              </div>
            ))}
          </div>
        )}
      </div>

      <NieuwTeamDialoog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={onCreateTeam}
      />
    </div>
  );
}
