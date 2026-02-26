"use client";

import { useState } from "react";
import type { TeamData } from "./types";
import type { TeamCategorie, Kleur } from "@oranje-wit/database";
import TeamKaart from "./TeamKaart";
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
}

export default function Werkgebied({
  teams,
  zichtbareTeamIds,
  onCreateTeam,
  onDeleteTeam,
}: WerkgebiedProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const zichtbareTeams = teams.filter((t) => zichtbareTeamIds.has(t.id));

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-gray-100 bg-white flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {zichtbareTeams.length} van {teams.length} teams zichtbaar
        </span>
        <button
          onClick={() => setDialogOpen(true)}
          className="px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition-colors"
        >
          + Nieuw team
        </button>
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
            {zichtbareTeams.map((team) => (
              <TeamKaart
                key={team.id}
                team={team}
                onDelete={onDeleteTeam}
              />
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
