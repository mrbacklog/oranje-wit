"use client";

import type { ScenarioData, SpelerData, TeamData, SelectieGroepData, PinData } from "../types";
import type { EditorMode } from "./EditorToolbar";
import type { PositionMap } from "../hooks/useCardPositions";
import type { TeamValidatie } from "@/lib/teamindeling/validatie/regels";

import ViewWerkgebied from "../view/ViewWerkgebied";
import SpelerDetail from "../SpelerDetail";
import EditorToolbar from "./EditorToolbar";

interface PreviewModeProps {
  scenario: ScenarioData;
  teams: TeamData[];
  zichtbareTeams: TeamData[];
  mode: EditorMode;
  showRanking: boolean;
  syncingScores: boolean;
  selectieGroepMap: Map<string, SelectieGroepData>;
  previewValidatieMap: Map<string, TeamValidatie> | undefined;
  pinnedSpelerIds: Set<string>;
  positions: PositionMap;
  detailSpeler: SpelerData | null;
  detailTeamId: string | null;
  pinMap: Map<string, PinData>;
  blauwdrukId: string | null;
  compactMode?: boolean;
  onToggleRanking: () => void;
  onToggleCompact?: () => void;
  onSyncScores: () => void;
  onToggleMode: () => void;
  onRepositionCard: (cardId: string, x: number, y: number) => void;
  onSpelerClick: (speler: SpelerData) => void;
  onTogglePin: (spelerId: string, teamNaam: string, teamId: string) => void;
  onCloseDetail: () => void;
}

export default function PreviewMode({
  scenario,
  teams,
  zichtbareTeams,
  mode,
  showRanking,
  syncingScores,
  selectieGroepMap,
  previewValidatieMap,
  pinnedSpelerIds,
  positions,
  detailSpeler,
  detailTeamId,
  pinMap,
  blauwdrukId,
  compactMode,
  onToggleRanking,
  onToggleCompact,
  onSyncScores,
  onToggleMode,
  onRepositionCard,
  onSpelerClick,
  onTogglePin,
  onCloseDetail,
}: PreviewModeProps) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-gray-50">
      <EditorToolbar
        scenario={scenario}
        zichtbaar={zichtbareTeams.length}
        totaal={teams.length}
        mode={mode}
        showRanking={showRanking}
        compactMode={compactMode}
        onToggleRanking={onToggleRanking}
        onToggleCompact={onToggleCompact}
        onSyncScores={onSyncScores}
        syncingScores={syncingScores}
        onToggleMode={onToggleMode}
      />
      <div className="relative flex-1 overflow-hidden">
        <ViewWerkgebied
          teams={zichtbareTeams}
          selectieGroepMap={selectieGroepMap}
          validatieMap={previewValidatieMap}
          pinnedSpelerIds={pinnedSpelerIds}
          showRanking={showRanking}
          compactMode={compactMode}
          positions={positions}
          onRepositionCard={onRepositionCard}
          onSpelerClick={(speler) => onSpelerClick(speler)}
        />
      </div>

      {detailSpeler && (
        <SpelerDetail
          speler={detailSpeler}
          teamId={detailTeamId ?? undefined}
          teamNaam={detailTeamId ? teams.find((t) => t.id === detailTeamId)?.naam : undefined}
          pin={pinMap.get(detailSpeler.id) ?? null}
          showRanking={showRanking}
          blauwdrukId={blauwdrukId ?? undefined}
          onTogglePin={onTogglePin}
          onClose={onCloseDetail}
        />
      )}
    </div>
  );
}
