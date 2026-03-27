"use client";

import { useState, useCallback, useMemo, useRef, lazy, Suspense } from "react";
import { logger } from "@oranje-wit/types";
import type { ScenarioData, SpelerData, SelectieGroepData } from "../types";
import { PEILJAAR } from "../types";
import { useScenarioEditor } from "../hooks/useScenarioEditor";
import { useValidatie } from "@/hooks/teamindeling/useValidatie";
import { useCardPositions, type CardInfo, type PositionMap } from "../hooks/useCardPositions";
import { useIsMobile } from "@/hooks/teamindeling/useIsMobile";
import DndProvider from "../DndContext";

const MobileScenarioEditor = lazy(() => import("../mobile/MobileScenarioEditor"));

import Werkgebied from "../Werkgebied";
import SpelersPool from "../SpelersPool";
import TeamEditPanel from "../TeamEditPanel";
import ValidatieRapport from "../ValidatieRapport";
import Drawer from "./Drawer";
import EditorToolbar, { type EditorMode } from "./EditorToolbar";
import PreviewMode from "./PreviewMode";
import EditorDialogs from "./EditorDialogs";
import { SideTabPool, SideTabsRight } from "./SideTabs";

interface ScenarioEditorFullscreenProps {
  scenario: ScenarioData;
  alleSpelers: SpelerData[];
  initialMode?: EditorMode;
  initialPosities?: PositionMap | null;
}

export default function ScenarioEditorFullscreen({
  scenario,
  alleSpelers,
  initialMode = "edit",
  initialPosities = null,
}: ScenarioEditorFullscreenProps) {
  const isMobile = useIsMobile();
  const editor = useScenarioEditor(scenario, alleSpelers);
  const [mode, setMode] = useState<EditorMode>(initialMode);
  const [poolOpen, setPoolOpen] = useState(false);
  const [poolPinned, setPoolPinned] = useState(false);
  const [nieuwTeamOpen, setNieuwTeamOpen] = useState(false);
  const [rapportOpen, setRapportOpen] = useState(false);
  const [rapportPinned, setRapportPinned] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [syncingScores, setSyncingScores] = useState(false);
  const [werkbordOpen, setWerkbordOpen] = useState(false);
  const syncLockRef = useRef(false);

  const isPreview = mode === "preview";
  const toggleRanking = useCallback(() => setShowRanking((v) => !v), []);
  const toggleCompact = useCallback(() => setCompactMode((v) => !v), []);

  const handleSyncScores = useCallback(async () => {
    if (syncLockRef.current) return;
    syncLockRef.current = true;
    setSyncingScores(true);
    try {
      const res = await fetch(`/api/teamindeling/scenarios/${scenario.id}/teamscore-sync`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        logger.info("Teamscores gesynchroniseerd:", data);
        editor.refreshTeams();
      }
    } catch (error) {
      logger.warn("Sync teamscores mislukt:", error);
    } finally {
      setSyncingScores(false);
      syncLockRef.current = false;
    }
  }, [scenario.id, editor]);

  // Build card info for free-form positioning
  const cardInfos: CardInfo[] = useMemo(() => {
    const zichtbareTeams = editor.teams.filter((t) => editor.zichtbaar.has(t.id));
    const seen = new Set<string>();
    const infos: CardInfo[] = [];

    for (const team of zichtbareTeams) {
      if (team.selectieGroepId) {
        if (!seen.has(team.selectieGroepId)) {
          seen.add(team.selectieGroepId);
          infos.push({
            id: `selectie-${team.selectieGroepId}`,
            teamType: "ACHTAL",
            isSelectie: true,
          });
        }
      } else {
        infos.push({
          id: team.id,
          teamType: team.teamType ?? "ACHTAL",
          isSelectie: false,
        });
      }
    }
    return infos;
  }, [editor.teams, editor.zichtbaar]);

  const { positions, updatePosition } = useCardPositions(
    editor.versieId ?? null,
    cardInfos,
    initialPosities ?? null
  );

  const togglePool = useCallback(() => setPoolOpen((v) => !v), []);
  const toggleMode = useCallback(() => {
    setMode((m) => (m === "preview" ? "edit" : "preview"));
    setPoolOpen(false);
  }, []);

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

  const zichtbareTeams = useMemo(
    () => editor.teams.filter((t) => editor.zichtbaar.has(t.id)),
    [editor.teams, editor.zichtbaar]
  );
  const zichtbareCount = zichtbareTeams.length;

  const showPoolDrawer = poolOpen && !editor.editTeamId;
  const showEditDrawer = !!editor.editTeamId;

  // Preview: selectieGroepMap voor ViewWerkgebied
  const selectieGroepMap = useMemo(() => {
    const laatsteVersie = scenario.versies[0];
    const m = new Map<string, SelectieGroepData>();
    for (const sg of laatsteVersie?.selectieGroepen ?? []) m.set(sg.id, sg);
    return m;
  }, [scenario.versies]);

  // Preview: validatie
  const blauwdrukKaders = useMemo(
    () =>
      scenario.concept?.blauwdruk?.kaders as Record<string, Record<string, unknown>> | undefined,
    [scenario.concept?.blauwdruk?.kaders]
  );
  const { validatieMap: previewValidatieMap } = useValidatie(
    zichtbareTeams,
    PEILJAAR,
    blauwdrukKaders
  );

  if (!editor.laatsteVersie) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">Dit scenario heeft nog geen versie.</p>
      </div>
    );
  }

  // --- Mobile mode ---
  if (isMobile && !isPreview) {
    return (
      <Suspense
        fallback={
          <div
            className="fixed inset-0 z-40 flex items-center justify-center"
            style={{ backgroundColor: "var(--surface-page, #0f1115)" }}
          >
            <div style={{ color: "var(--text-tertiary, #6b7280)" }}>Laden...</div>
          </div>
        }
      >
        <MobileScenarioEditor
          scenario={scenario}
          alleSpelers={alleSpelers}
          initialMode={initialMode}
        />
      </Suspense>
    );
  }

  // --- Preview mode ---
  if (isPreview) {
    return (
      <PreviewMode
        scenario={scenario}
        teams={editor.teams}
        zichtbareTeams={zichtbareTeams}
        mode={mode}
        showRanking={showRanking}
        compactMode={compactMode}
        syncingScores={syncingScores}
        selectieGroepMap={selectieGroepMap}
        previewValidatieMap={previewValidatieMap}
        pinnedSpelerIds={editor.pinnedSpelerIds}
        positions={positions}
        detailSpeler={editor.detailSpeler}
        detailTeamId={editor.detailTeamId}
        pinMap={editor.pinMap}
        blauwdrukId={editor.blauwdrukId}
        onToggleRanking={toggleRanking}
        onToggleCompact={toggleCompact}
        onSyncScores={handleSyncScores}
        onToggleMode={toggleMode}
        onRepositionCard={updatePosition}
        onSpelerClick={(speler) => {
          editor.setDetailSpeler(speler);
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

  // SpelersPool content (hergebruikt in gepinde sidebar en drawer)
  const spelersPoolContent = (
    <SpelersPool
      spelers={alleSpelers}
      teams={editor.teams}
      selectieGroepen={editor.selectieGroepen}
      zichtbareTeamIds={editor.zichtbaar}
      pinnedSpelerIds={editor.pinnedSpelerIds}
      onSpelerClick={(speler) => editor.handleSpelerClick(speler)}
    />
  );

  // TeamEditPanel content
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

  // --- Edit mode ---
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-gray-50">
      <EditorToolbar
        scenario={scenario}
        zichtbaar={zichtbareCount}
        totaal={editor.teams.length}
        mode={mode}
        showRanking={showRanking}
        compactMode={compactMode}
        onToggleRanking={toggleRanking}
        onToggleCompact={toggleCompact}
        onToggleMode={toggleMode}
        onCreateTeam={() => setNieuwTeamOpen(true)}
      />

      <DndProvider
        spelers={alleSpelers}
        onPoolToTeam={editor.handlePoolToTeam}
        onTeamToTeam={editor.handleTeamToTeam}
        onTeamToPool={editor.handleTeamToPool}
      >
        {/* Flex-row: gepinde pool (links) | werkgebied | gepind rapport (rechts) */}
        <div className="flex flex-1 overflow-hidden">
          {/* Gepinde SpelersPool sidebar */}
          {poolPinned && showPoolDrawer && (
            <Drawer
              open={true}
              onClose={handleClosePool}
              side="left"
              width="w-80"
              title="Spelerspool"
              pinnable
              pinned
              onTogglePin={handleTogglePoolPin}
            >
              {spelersPoolContent}
            </Drawer>
          )}

          {/* Gepinde TeamEditPanel sidebar */}
          {poolPinned && showEditDrawer && (
            <Drawer
              open={true}
              onClose={() => editor.setEditTeamId(null)}
              side="left"
              width="w-80"
              title="Team bewerken"
              pinnable
              pinned
              onTogglePin={handleTogglePoolPin}
            >
              {teamEditContent}
            </Drawer>
          )}

          {/* Hoofdgebied */}
          <div className="relative flex-1 overflow-hidden">
            {/* Side-tab: Spelerspool (links) — verberg als gepind */}
            {!poolPinned && (
              <SideTabPool
                poolOpen={poolOpen}
                showEditDrawer={showEditDrawer}
                onToggle={togglePool}
              />
            )}

            {/* Side-tabs rechts: Validatie + Werkbord */}
            <SideTabsRight
              rapportPinned={rapportPinned}
              werkbordOpen={werkbordOpen}
              onOpenRapport={() => setRapportOpen(true)}
              onOpenWerkbord={() => setWerkbordOpen(true)}
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
              onSpelerClick={editor.handleSpelerClick}
              onEditTeam={editor.handleEditTeam}
              positions={positions}
              onRepositionCard={updatePosition}
            />
          </div>

          {/* Gepind ValidatieRapport sidebar */}
          {rapportPinned && rapportOpen && editor.validatieMap && (
            <ValidatieRapport
              teams={editor.teams}
              validatieMap={editor.validatieMap}
              dubbeleMeldingen={editor.dubbeleMeldingen ?? []}
              onClose={handleCloseRapport}
              pinned
              onTogglePin={handleToggleRapportPin}
            />
          )}
        </div>

        {/* Niet-gepinde SpelersPool drawer (links, overlay) */}
        {!poolPinned && (
          <Drawer
            open={showPoolDrawer}
            onClose={() => setPoolOpen(false)}
            side="left"
            width="w-80"
            title="Spelerspool"
            pinnable
            pinned={false}
            onTogglePin={handleTogglePoolPin}
          >
            {spelersPoolContent}
          </Drawer>
        )}

        {/* Niet-gepinde TeamEditPanel drawer (links, overlay, vervangt pool) */}
        {!poolPinned && (
          <Drawer
            open={showEditDrawer}
            onClose={() => editor.setEditTeamId(null)}
            side="left"
            width="w-80"
          >
            {teamEditContent}
          </Drawer>
        )}
      </DndProvider>

      {/* Dialogen en overlays */}
      <EditorDialogs
        scenarioId={scenario.id}
        teams={editor.teams}
        showRanking={showRanking}
        nieuwTeamOpen={nieuwTeamOpen}
        onCloseNieuwTeam={() => setNieuwTeamOpen(false)}
        onCreateTeam={editor.handleCreateTeam}
        rapportPinned={rapportPinned}
        rapportOpen={rapportOpen}
        validatieMap={editor.validatieMap}
        dubbeleMeldingen={editor.dubbeleMeldingen ?? []}
        onCloseRapport={handleCloseRapport}
        onToggleRapportPin={handleToggleRapportPin}
        werkbordOpen={werkbordOpen}
        onCloseWerkbord={() => setWerkbordOpen(false)}
        blauwdrukId={editor.blauwdrukId}
        verdeelData={editor.verdeelData}
        onCloseVerdeel={() => editor.setVerdeelData(null)}
        onVerdeelBevestig={editor.handleVerdeelBevestig}
        detailSpeler={editor.detailSpeler}
        detailTeamId={editor.detailTeamId}
        pinMap={editor.pinMap}
        onTogglePin={editor.handleTogglePin}
        onCloseDetail={() => {
          editor.setDetailSpeler(null);
          editor.setDetailTeamId(null);
        }}
      />
    </div>
  );
}
