"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { logger } from "@oranje-wit/types";
import type { ScenarioData, SpelerData, SelectieGroepData, TeamData } from "../types";
import { PEILJAAR } from "../types";
import type { useScenarioEditor } from "../hooks/useScenarioEditor";
import type { useWhatIf } from "../hooks/useWhatIf";
import type { PositionMap } from "../hooks/useCardPositions";
import type { EditorMode } from "./EditorToolbar";
import type { VersieRij } from "@/components/teamindeling/werkindeling/VersiesDrawer";
import DndProvider from "../DndContext";
import Werkgebied from "../Werkgebied";
import SpelersPool from "../SpelersPool";
import TeamEditPanel from "../TeamEditPanel";
import EditorSidebars from "./EditorSidebars";
import EditorToolbar from "./EditorToolbar";
import WhatIfToolbar from "./WhatIfToolbar";
import WhatIfFooter from "./WhatIfFooter";
import Ribbon from "./Ribbon";
import EditorOverlays from "./EditorOverlays";
import { SideTabPool, SideTabsRight } from "./SideTabs";

interface EditModeLayoutProps {
  scenario: ScenarioData;
  alleSpelers: SpelerData[];
  editor: ReturnType<typeof useScenarioEditor>;
  whatIf: ReturnType<typeof useWhatIf>;
  mode: EditorMode;
  positions: PositionMap;
  versieRijen: VersieRij[];
  gebruikerEmail: string;
  onToggleMode: () => void;
  onUpdatePosition: (id: string, x: number, y: number) => void;
}

export default function EditModeLayout({
  scenario,
  alleSpelers,
  editor,
  whatIf,
  mode,
  positions,
  versieRijen,
  gebruikerEmail,
  onToggleMode,
  onUpdatePosition,
}: EditModeLayoutProps) {
  const [poolOpen, setPoolOpen] = useState(false);
  const [poolPinned, setPoolPinned] = useState(false);
  const [nieuwTeamOpen, setNieuwTeamOpen] = useState(false);
  const [rapportOpen, setRapportOpen] = useState(false);
  const [rapportPinned, setRapportPinned] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [syncingScores, setSyncingScores] = useState(false);
  const [werkbordOpen, setWerkbordOpen] = useState(false);
  const [whatIfOpen, setWhatIfOpen] = useState(false);
  const [whatIfDialoogOpen, setWhatIfDialoogOpen] = useState(false);
  const [versiesOpen, setVersiesOpen] = useState(false);
  const [zoomLabel, setZoomLabel] = useState("Normaal");
  const [spelerProfielId, setSpelerProfielId] = useState<string | null>(null);
  const [teamOverzichtTeam, setTeamOverzichtTeam] = useState<TeamData | null>(null);
  const syncLockRef = useRef(false);

  const handleSyncScores = useCallback(async () => {
    if (syncLockRef.current) return;
    syncLockRef.current = true;
    setSyncingScores(true);
    try {
      const res = await fetch(`/api/teamindeling/scenarios/${scenario.id}/teamscore-sync`, {
        method: "POST",
      });
      if (res.ok) {
        logger.info("Teamscores gesynchroniseerd:", await res.json());
        editor.refreshTeams();
      }
    } catch (error) {
      logger.warn("Sync teamscores mislukt:", error);
    } finally {
      setSyncingScores(false);
      syncLockRef.current = false;
    }
  }, [scenario.id, editor]);

  const handleTogglePoolPin = useCallback(() => {
    setPoolPinned((v) => {
      if (!v) setPoolOpen(true);
      return !v;
    });
  }, []);

  const handleClosePool = useCallback(() => {
    setPoolOpen(false);
    setPoolPinned(false);
  }, []);

  const handleToggleRapportPin = useCallback(() => {
    setRapportPinned((v) => {
      if (!v) setRapportOpen(true);
      return !v;
    });
  }, []);

  const handleCloseRapport = useCallback(() => {
    setRapportOpen(false);
    setRapportPinned(false);
  }, []);

  const togglePool = useCallback(() => setPoolOpen((v) => !v), []);

  const handleSpelerProfielOpen = useCallback(
    (speler: SpelerData) => {
      setSpelerProfielId(speler.id);
      editor.handleSpelerClick(speler);
    },
    [editor]
  );

  const handleTeamOverzichtOpen = useCallback(
    (teamId: string) => {
      const team = editor.teams.find((t) => t.id === teamId) ?? null;
      setTeamOverzichtTeam(team);
      editor.handleEditTeam(teamId);
    },
    [editor]
  );

  const ingedeeldSpelers = useMemo(
    () => new Set(editor.teams.flatMap((t) => t.spelers.map((ts) => ts.speler.id))).size,
    [editor.teams]
  );

  const zichtbareTeams = editor.teams.filter((t) => editor.zichtbaar.has(t.id));
  const showPoolDrawer = poolOpen && !editor.editTeamId;
  const showEditDrawer = !!editor.editTeamId;

  const ribbonActiveTab =
    poolOpen || !!editor.editTeamId
      ? "pool"
      : rapportOpen
        ? "validatie"
        : werkbordOpen
          ? "werkbord"
          : whatIfOpen
            ? "whatif"
            : versiesOpen
              ? "versies"
              : undefined;

  const spelersPoolContent = (
    <SpelersPool
      spelers={alleSpelers}
      teams={editor.teams}
      selectieGroepen={editor.selectieGroepen}
      zichtbareTeamIds={editor.zichtbaar}
      pinnedSpelerIds={editor.pinnedSpelerIds}
      onSpelerClick={handleSpelerProfielOpen}
    />
  );

  const teamEditContent = editor.editTeam && (
    <TeamEditPanel
      team={editor.editTeam}
      alleTeams={editor.teams}
      validatie={editor.validatieMap?.get(editor.editTeam.id)}
      onClose={() => editor.setEditTeamId(null)}
      onSpelerClick={(speler) => editor.handleSpelerClick(speler, editor.editTeam!.id)}
      onUpdateTeam={editor.handleUpdateTeam}
      onUpdateTeamType={editor.handleUpdateTeamType}
      onKoppelSelectie={editor.handleKoppelSelectie}
      onOntkoppelSelectie={editor.handleOntkoppelSelectie}
      onDeleteTeam={(teamId) => {
        editor.handleDeleteTeam(teamId);
        editor.setEditTeamId(null);
      }}
    />
  );

  return (
    <div className="absolute inset-0 flex" style={{ background: "var(--surface-base, #0a0a0a)" }}>
      {!whatIf.isWhatIfModus && (
        <Ribbon
          activeTab={ribbonActiveTab}
          gebruikerInitialen={gebruikerEmail.slice(0, 2).toUpperCase()}
          onOpenPool={togglePool}
          onOpenValidatie={() => setRapportOpen(true)}
          onOpenWerkbord={() => setWerkbordOpen(true)}
          onOpenWhatIf={() => setWhatIfDialoogOpen(true)}
          onOpenVersies={() => setVersiesOpen(true)}
        />
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {whatIf.isWhatIfModus ? (
          <WhatIfToolbar
            vraag={whatIf.activeWhatIfVraag}
            heeftHardefouten={whatIf.whatIfHeeftHardefouten}
            bezig={whatIf.whatIfBezig}
            onVerlaat={whatIf.handleVerlaatWhatIf}
            onToepassen={whatIf.handleToepassenWhatIf}
            onVerwerpen={whatIf.handleVerwerpWhatIf}
          />
        ) : (
          <EditorToolbar
            scenario={scenario}
            zichtbaar={zichtbareTeams.length}
            totaal={editor.teams.length}
            mode={mode}
            showRanking={showRanking}
            compactMode={compactMode}
            zoomLabel={zoomLabel}
            ingedeeldSpelers={ingedeeldSpelers}
            totaalSpelers={alleSpelers.length}
            onToggleRanking={() => setShowRanking((v) => !v)}
            onToggleCompact={() => setCompactMode((v) => !v)}
            onToggleMode={onToggleMode}
            onCreateTeam={() => setNieuwTeamOpen(true)}
            onOpenWhatIf={() => setWhatIfDialoogOpen(true)}
          />
        )}

        <DndProvider
          spelers={alleSpelers}
          onPoolToTeam={editor.handlePoolToTeam}
          onTeamToTeam={editor.handleTeamToTeam}
          onTeamToPool={editor.handleTeamToPool}
        >
          <div className="flex flex-1 overflow-hidden">
            <EditorSidebars
              poolPinned={poolPinned}
              showPoolDrawer={showPoolDrawer}
              showEditDrawer={showEditDrawer}
              spelersPoolContent={spelersPoolContent}
              teamEditContent={teamEditContent}
              rapportPinned={rapportPinned}
              rapportOpen={rapportOpen}
              teams={editor.teams}
              validatieMap={editor.validatieMap}
              dubbeleMeldingen={editor.dubbeleMeldingen ?? []}
              onClosePool={handleClosePool}
              onTogglePoolPin={handleTogglePoolPin}
              onCloseEditTeam={() => editor.setEditTeamId(null)}
              onCloseRapport={handleCloseRapport}
              onToggleRapportPin={handleToggleRapportPin}
            />

            <div className="relative flex-1 overflow-hidden">
              {!poolPinned && !whatIf.isWhatIfModus && (
                <SideTabPool
                  poolOpen={poolOpen}
                  showEditDrawer={showEditDrawer}
                  onToggle={togglePool}
                />
              )}
              <SideTabsRight
                rapportPinned={rapportPinned}
                werkbordOpen={werkbordOpen}
                whatIfOpen={whatIfOpen}
                versiesOpen={versiesOpen}
                onOpenRapport={() => setRapportOpen(true)}
                onOpenWerkbord={() => setWerkbordOpen(true)}
                onOpenWhatIf={() => setWhatIfOpen(true)}
                onOpenVersies={() => setVersiesOpen(true)}
              />
              <Werkgebied
                teams={editor.teams}
                zichtbareTeamIds={editor.zichtbaar}
                validatieMap={editor.validatieMap}
                selectieValidatieMap={editor.selectieValidatieMap}
                selectieGroepMap={editor.selectieGroepMap}
                pinnedSpelerIds={editor.pinnedSpelerIds}
                showRanking={showRanking}
                compactMode={compactMode}
                onDeleteTeam={editor.handleDeleteTeam}
                onKoppelSelectie={editor.handleKoppelSelectie}
                onOntkoppelSelectie={editor.handleOntkoppelSelectie}
                onUpdateSelectieNaam={editor.handleUpdateSelectieNaam}
                onSpelerClick={handleSpelerProfielOpen}
                onEditTeam={handleTeamOverzichtOpen}
                positions={positions}
                onRepositionCard={onUpdatePosition}
                whatIfZones={whatIf.whatIfZones ?? undefined}
                onZoomLabelChange={setZoomLabel}
              />
            </div>
          </div>
        </DndProvider>

        {whatIf.isWhatIfModus && (
          <WhatIfFooter
            bezig={whatIf.whatIfBezig}
            heeftHardefouten={whatIf.whatIfHeeftHardefouten}
            onVerwerpen={whatIf.handleVerwerpWhatIf}
            onBewaren={whatIf.handleVerlaatWhatIf}
            onToepassen={whatIf.handleToepassenWhatIf}
          />
        )}

        <EditorOverlays
          scenario={scenario}
          editor={editor}
          whatIf={whatIf}
          versieRijen={versieRijen}
          gebruikerEmail={gebruikerEmail}
          showRanking={showRanking}
          nieuwTeamOpen={nieuwTeamOpen}
          rapportOpen={rapportOpen}
          rapportPinned={rapportPinned}
          werkbordOpen={werkbordOpen}
          whatIfOpen={whatIfOpen}
          whatIfDialoogOpen={whatIfDialoogOpen}
          versiesOpen={versiesOpen}
          spelerProfielId={spelerProfielId}
          teamOverzichtTeam={teamOverzichtTeam}
          onCloseNieuwTeam={() => setNieuwTeamOpen(false)}
          onCloseRapport={handleCloseRapport}
          onToggleRapportPin={handleToggleRapportPin}
          onCloseWerkbord={() => setWerkbordOpen(false)}
          onCloseWhatIf={() => setWhatIfOpen(false)}
          onOpenWhatIfNieuw={() => setWhatIfDialoogOpen(true)}
          onOpenWhatIf={() => setWhatIfOpen(true)}
          onCloseWhatIfDialoog={() => setWhatIfDialoogOpen(false)}
          onCloseVersies={() => setVersiesOpen(false)}
          onCloseSpelerProfiel={() => setSpelerProfielId(null)}
          onCloseTeamOverzicht={() => setTeamOverzichtTeam(null)}
        />
      </div>
    </div>
  );
}
