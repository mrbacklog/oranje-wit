"use client";

import { useState, useMemo, useCallback } from "react";
import type { TeamData, SpelerData } from "./types";
import type { TeamCategorie, Kleur } from "@oranje-wit/database";
import type { TeamValidatie, ValidatieMelding } from "@/lib/validatie/regels";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import ZoomCanvas from "./editor/ZoomCanvas";
import SortableTeamKaart from "./editor/SortableTeamKaart";
import SortableSelectieBlok from "./editor/SortableSelectieBlok";
import NieuwTeamDialoog from "./NieuwTeamDialoog";
import ValidatieRapport from "./ValidatieRapport";
import VoorstelDialoog from "./VoorstelDialoog";

interface WerkgebiedProps {
  scenarioId: string;
  teams: TeamData[];
  zichtbareTeamIds: Set<string>;
  validatieMap?: Map<string, TeamValidatie>;
  dubbeleMeldingen?: ValidatieMelding[];
  onCreateTeam: (data: { naam: string; categorie: TeamCategorie; kleur?: Kleur }) => void;
  onDeleteTeam: (teamId: string) => void;
  onKoppelSelectie: (teamIds: string[]) => void;
  onOntkoppelSelectie: (groepLeiderId: string) => void;
  onWhatIfOpen?: () => void;
  onSpelerClick?: (speler: SpelerData, teamId?: string) => void;
  onEditTeam?: (teamId: string) => void;
  onReorderTeams?: (vanIndex: number, naarIndex: number) => void;
}

export default function Werkgebied({
  scenarioId,
  teams,
  zichtbareTeamIds,
  validatieMap,
  dubbeleMeldingen,
  onCreateTeam,
  onDeleteTeam,
  onKoppelSelectie,
  onOntkoppelSelectie,
  onWhatIfOpen,
  onSpelerClick,
  onEditTeam,
  onReorderTeams,
}: WerkgebiedProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rapportOpen, setRapportOpen] = useState(false);
  const [voorstelOpen, setVoorstelOpen] = useState(false);
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
        const leden = zichtbareTeams.filter((t) => t.selectieGroepId === team.id);
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

  // IDs voor SortableContext — selectie-groepen + losse teams
  const sortableIds = useMemo(() => {
    const ids: string[] = [];
    for (const [leiderId] of selectieGroepen) ids.push(`selectie-${leiderId}`);
    for (const t of losseTeams) ids.push(t.id);
    return ids;
  }, [selectieGroepen, losseTeams]);

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
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-white px-4 py-2">
        <span className="text-sm text-gray-500">
          {zichtbareTeams.length} van {teams.length} teams zichtbaar
        </span>
        <div className="flex items-center gap-2">
          {geselecteerd.size > 0 && (
            <>
              <span className="text-xs text-gray-400">{geselecteerd.size} geselecteerd</span>
              <button
                onClick={() => setGeselecteerd(new Set())}
                className="px-2 py-1 text-xs text-gray-500 transition-colors hover:text-gray-700"
              >
                Deselecteer
              </button>
              <button
                onClick={handleKoppel}
                disabled={!kanKoppelen}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  kanKoppelen
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "cursor-not-allowed bg-gray-200 text-gray-400"
                }`}
              >
                Koppel als selectie
              </button>
            </>
          )}
          <button
            onClick={() => setVoorstelOpen(true)}
            className="rounded-lg border border-purple-300 px-3 py-1.5 text-xs font-medium text-purple-600 transition-colors hover:bg-purple-50"
          >
            AI Voorstel
          </button>
          {onWhatIfOpen && (
            <button
              onClick={onWhatIfOpen}
              className="rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
            >
              What-if
            </button>
          )}
          <button
            onClick={() => setRapportOpen(true)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Validatierapport
          </button>
          <button
            onClick={() => setDialogOpen(true)}
            className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-orange-600"
          >
            + Nieuw team
          </button>
        </div>
      </div>

      {/* Zoomable grid */}
      <ZoomCanvas>
        {(detailLevel) =>
          zichtbareTeams.length === 0 ? (
            <div className="flex h-[400px] items-center justify-center">
              <p className="text-sm text-gray-400">
                Selecteer teams in de navigator om ze hier te tonen.
              </p>
            </div>
          ) : (
            <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
              <div className="grid auto-rows-min grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {/* Selectie-groepen */}
                {Array.from(selectieGroepen.entries()).map(([leiderId, groepTeams]) => (
                  <SortableSelectieBlok
                    key={`selectie-${leiderId}`}
                    sortId={`selectie-${leiderId}`}
                    teams={groepTeams}
                    validatieMap={validatieMap}
                    detailLevel={detailLevel}
                    onOntkoppel={onOntkoppelSelectie}
                    onDelete={onDeleteTeam}
                    onSpelerClick={onSpelerClick}
                    onEditTeam={onEditTeam}
                  />
                ))}
                {/* Losse teams */}
                {losseTeams.map((team) => (
                  <div
                    key={team.id}
                    onClick={() => toggleSelectie(team.id)}
                    className={`cursor-pointer rounded-lg transition-all ${
                      geselecteerd.has(team.id) ? "ring-2 ring-orange-400 ring-offset-1" : ""
                    }`}
                  >
                    <SortableTeamKaart
                      sortId={team.id}
                      team={team}
                      validatie={validatieMap?.get(team.id)}
                      detailLevel={detailLevel}
                      onDelete={onDeleteTeam}
                      onSpelerClick={
                        onSpelerClick ? (speler) => onSpelerClick(speler, team.id) : undefined
                      }
                      onEditTeam={onEditTeam}
                    />
                  </div>
                ))}
              </div>
            </SortableContext>
          )
        }
      </ZoomCanvas>

      <NieuwTeamDialoog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={onCreateTeam}
      />

      <VoorstelDialoog
        open={voorstelOpen}
        onClose={() => setVoorstelOpen(false)}
        scenarioId={scenarioId}
      />

      {rapportOpen && validatieMap && (
        <ValidatieRapport
          teams={teams}
          validatieMap={validatieMap}
          dubbeleMeldingen={dubbeleMeldingen ?? []}
          onClose={() => setRapportOpen(false)}
        />
      )}
    </div>
  );
}
