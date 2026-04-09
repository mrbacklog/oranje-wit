"use client";

import { useState, useCallback, useMemo, lazy, Suspense } from "react";
import { logger } from "@oranje-wit/types";
import type { ScenarioData, SpelerData, SelectieGroepData } from "../types";
import { PEILJAAR } from "../types";
import { useScenarioEditor } from "../hooks/useScenarioEditor";
import { useValidatie } from "@/hooks/teamindeling/useValidatie";
import { useCardPositions, type CardInfo, type PositionMap } from "../hooks/useCardPositions";
import { useIsMobile } from "@/hooks/teamindeling/useIsMobile";
import { useWhatIf } from "../hooks/useWhatIf";
import type { EditorMode } from "./EditorToolbar";
import PreviewMode from "./PreviewMode";
import EditModeLayout from "./EditModeLayout";

const MobileScenarioEditor = lazy(() => import("../mobile/MobileScenarioEditor"));

interface ScenarioEditorFullscreenProps {
  scenario: ScenarioData;
  alleSpelers: SpelerData[];
  initialMode?: EditorMode;
  initialPosities?: PositionMap | null;
  gebruikerEmail?: string;
}

export default function ScenarioEditorFullscreen({
  scenario,
  alleSpelers,
  initialMode = "edit",
  initialPosities = null,
  gebruikerEmail = "systeem",
}: ScenarioEditorFullscreenProps) {
  const isMobile = useIsMobile();
  const editor = useScenarioEditor(scenario, alleSpelers);
  const [mode, setMode] = useState<EditorMode>(initialMode);
  const whatIf = useWhatIf({ teams: editor.teams, onRefreshTeams: editor.refreshTeams });

  const toggleMode = useCallback(() => {
    setMode((m) => (m === "preview" ? "edit" : "preview"));
  }, []);

  const cardInfos: CardInfo[] = useMemo(() => {
    const seen = new Set<string>();
    return editor.teams
      .filter((t) => editor.zichtbaar.has(t.id))
      .reduce<CardInfo[]>((acc, team) => {
        if (team.selectieGroepId && !seen.has(team.selectieGroepId)) {
          seen.add(team.selectieGroepId);
          acc.push({
            id: `selectie-${team.selectieGroepId}`,
            teamType: "ACHTAL",
            isSelectie: true,
          });
        } else if (!team.selectieGroepId) {
          acc.push({ id: team.id, teamType: team.teamType ?? "ACHTAL", isSelectie: false });
        }
        return acc;
      }, []);
  }, [editor.teams, editor.zichtbaar]);

  const { positions, updatePosition } = useCardPositions(
    editor.versieId ?? null,
    cardInfos,
    initialPosities ?? null
  );

  const versieRijen = useMemo(
    () =>
      (scenario.versies as any[]).map((v: any, i: number) => ({
        id: v.id,
        nummer: v.nummer,
        naam: v.naam ?? null,
        auteur: v.auteur,
        createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : String(v.createdAt),
        isHuidig: i === 0,
      })),
    [scenario.versies]
  );

  // Preview validatie
  const zichtbareTeams = editor.teams.filter((t) => editor.zichtbaar.has(t.id));
  const blauwdrukKaders = (scenario as any).blauwdruk?.kaders as
    | Record<string, Record<string, unknown>>
    | undefined;
  const { validatieMap: previewValidatieMap } = useValidatie(
    zichtbareTeams,
    PEILJAAR,
    blauwdrukKaders
  );

  const selectieGroepMap = new Map<string, SelectieGroepData>(
    (scenario.versies[0]?.selectieGroepen ?? []).map((sg) => [sg.id, sg])
  );

  if (!editor.laatsteVersie) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#0f1115]">
        <p className="text-sm text-gray-400">Dit scenario heeft nog geen versie.</p>
      </div>
    );
  }

  if (isMobile && mode !== "preview") {
    const fallback = (
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ backgroundColor: "var(--surface-page, #0f1115)" }}
      >
        <div style={{ color: "var(--text-tertiary, #6b7280)" }}>Laden...</div>
      </div>
    );
    return (
      <Suspense fallback={fallback}>
        <MobileScenarioEditor
          scenario={scenario}
          alleSpelers={alleSpelers}
          initialMode={initialMode}
        />
      </Suspense>
    );
  }

  if (mode === "preview") {
    return (
      <PreviewMode
        scenario={scenario}
        teams={editor.teams}
        zichtbareTeams={zichtbareTeams}
        mode={mode}
        showRanking={false}
        compactMode={false}
        syncingScores={false}
        selectieGroepMap={selectieGroepMap}
        previewValidatieMap={previewValidatieMap}
        pinnedSpelerIds={editor.pinnedSpelerIds}
        positions={positions}
        detailSpeler={editor.detailSpeler}
        detailTeamId={editor.detailTeamId}
        pinMap={editor.pinMap}
        kadersId={editor.kadersId}
        onToggleRanking={() => {}}
        onToggleCompact={() => {}}
        onSyncScores={async () => {
          logger.info("Sync scores vanuit preview");
        }}
        onToggleMode={toggleMode}
        onRepositionCard={updatePosition}
        onSpelerClick={(s) => {
          editor.setDetailSpeler(s);
          editor.setDetailTeamId(null);
        }}
        onTogglePin={editor.handleTogglePin}
        onCloseDetail={() => {
          editor.setDetailSpeler(null);
          editor.setDetailTeamId(null);
        }}
      />
    );
  }

  return (
    <EditModeLayout
      scenario={scenario}
      alleSpelers={alleSpelers}
      editor={editor}
      whatIf={whatIf}
      mode={mode}
      positions={positions}
      versieRijen={versieRijen}
      gebruikerEmail={gebruikerEmail}
      onToggleMode={toggleMode}
      onUpdatePosition={updatePosition}
    />
  );
}
