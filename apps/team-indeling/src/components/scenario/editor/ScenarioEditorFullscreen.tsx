"use client";

import { useState, useCallback, useMemo } from "react";
import type { ScenarioData, SpelerData, SelectieGroepData } from "../types";
import { PEILJAAR } from "../types";
import { useScenarioEditor } from "../hooks/useScenarioEditor";
import { useValidatie } from "@/hooks/useValidatie";
import { useCardPositions, type CardInfo, type PositionMap } from "../hooks/useCardPositions";
import DndProvider from "../DndContext";
import Navigator from "../Navigator";
import Werkgebied from "../Werkgebied";
import ViewWerkgebied from "../view/ViewWerkgebied";
import SpelersPool from "../SpelersPool";
import SpelerDetail from "../SpelerDetail";
import ChatPanel from "../ChatPanel";
import TeamEditPanel from "../TeamEditPanel";
import VerdeelDialoog from "../VerdeelDialoog";
import Drawer from "./Drawer";
import EditorToolbar, { type EditorMode } from "./EditorToolbar";
import NieuwTeamDialoog from "../NieuwTeamDialoog";
import ValidatieRapport from "../ValidatieRapport";

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
  const editor = useScenarioEditor(scenario, alleSpelers);
  const [mode, setMode] = useState<EditorMode>(initialMode);
  const [navOpen, setNavOpen] = useState(false);
  const [poolOpen, setPoolOpen] = useState(false);
  const [nieuwTeamOpen, setNieuwTeamOpen] = useState(false);
  const [rapportOpen, setRapportOpen] = useState(false);

  const isPreview = mode === "preview";

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
          teamType: team.teamType ?? "VIERTAL",
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

  const toggleNav = useCallback(() => setNavOpen((v) => !v), []);
  const togglePool = useCallback(() => setPoolOpen((v) => !v), []);
  const toggleMode = useCallback(() => {
    setMode((m) => (m === "preview" ? "edit" : "preview"));
    setNavOpen(false);
    setPoolOpen(false);
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

  // --- Preview mode ---
  if (isPreview) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col bg-gray-50">
        <EditorToolbar
          scenario={scenario}
          zichtbaar={zichtbareCount}
          totaal={editor.teams.length}
          mode={mode}
          onToggleMode={toggleMode}
        />
        <div className="relative flex-1 overflow-hidden">
          <ViewWerkgebied
            teams={zichtbareTeams}
            selectieGroepMap={selectieGroepMap}
            validatieMap={previewValidatieMap}
            positions={positions}
            onRepositionCard={updatePosition}
            onSpelerClick={(speler) => {
              editor.setDetailSpeler(speler);
              editor.setDetailTeamId(null);
            }}
          />
        </div>

        {editor.detailSpeler && (
          <SpelerDetail
            speler={editor.detailSpeler}
            teamId={editor.detailTeamId ?? undefined}
            onClose={() => {
              editor.setDetailSpeler(null);
              editor.setDetailTeamId(null);
            }}
          />
        )}
      </div>
    );
  }

  // --- Edit mode ---
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-gray-50">
      <EditorToolbar
        scenario={scenario}
        zichtbaar={zichtbareCount}
        totaal={editor.teams.length}
        mode={mode}
        onToggleMode={toggleMode}
        onCreateTeam={() => setNieuwTeamOpen(true)}
      />

      <DndProvider
        spelers={alleSpelers}
        onPoolToTeam={editor.handlePoolToTeam}
        onTeamToTeam={editor.handleTeamToTeam}
        onTeamToPool={editor.handleTeamToPool}
      >
        <div className="relative flex-1 overflow-hidden">
          {/* Side-tab: Teamlijst (links) */}
          <button
            onClick={toggleNav}
            className={`absolute top-4 left-0 z-20 flex flex-col items-center gap-1.5 rounded-r-lg border border-l-0 px-2 py-4 shadow-md transition-colors ${
              navOpen
                ? "border-orange-300 bg-orange-500 text-white"
                : "border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100"
            }`}
            title={navOpen ? "Verberg teamlijst" : "Toon teamlijst"}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            <span
              className="text-[10px] font-semibold tracking-wide uppercase"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              Teamlijst
            </span>
          </button>

          {/* Side-tabs rechts: Validatie + Spelerspool */}
          <div className="absolute top-4 right-0 z-20 flex flex-col gap-1">
            <button
              onClick={() => setRapportOpen(true)}
              className="flex flex-col items-center gap-1.5 rounded-l-lg border border-r-0 border-orange-200 bg-orange-50 px-2 py-4 text-orange-600 shadow-md transition-colors hover:bg-orange-100"
              title="Validatierapport"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span
                className="text-[10px] font-semibold tracking-wide uppercase"
                style={{ writingMode: "vertical-rl" }}
              >
                Validatie
              </span>
            </button>
            <button
              onClick={togglePool}
              className={`flex flex-col items-center gap-1.5 rounded-l-lg border border-r-0 px-2 py-4 shadow-md transition-colors ${
                poolOpen || showEditDrawer
                  ? "border-orange-300 bg-orange-500 text-white"
                  : "border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100"
              }`}
              title={poolOpen ? "Verberg spelerspool" : "Toon spelerspool"}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span
                className="text-[10px] font-semibold tracking-wide uppercase"
                style={{ writingMode: "vertical-rl" }}
              >
                Spelerspool
              </span>
            </button>
          </div>

          {/* Center: Werkgebied + ChatPanel */}
          <div className="flex h-full flex-col">
            <Werkgebied
              teams={editor.teams}
              zichtbareTeamIds={editor.zichtbaar}
              validatieMap={editor.validatieMap}
              selectieGroepMap={editor.selectieGroepMap}
              onDeleteTeam={editor.handleDeleteTeam}
              onKoppelSelectie={editor.handleKoppelSelectie}
              onOntkoppelSelectie={editor.handleOntkoppelSelectie}
              onSpelerClick={editor.handleSpelerClick}
              onEditTeam={editor.handleEditTeam}
              positions={positions}
              onRepositionCard={updatePosition}
            />
            <ChatPanel
              scenarioId={scenario.id}
              versieId={editor.versieId!}
              onMutatie={editor.refreshTeams}
            />
          </div>
        </div>

        {/* Navigator drawer (links) */}
        <Drawer open={navOpen} onClose={() => setNavOpen(false)} side="left" width="w-64">
          <Navigator
            teams={editor.teams}
            zichtbaar={editor.zichtbaar}
            onToggle={editor.handleToggle}
            onToggleAlles={editor.handleToggleAlles}
          />
        </Drawer>

        {/* SpelersPool drawer (rechts) */}
        <Drawer open={showPoolDrawer} onClose={() => setPoolOpen(false)} side="right" width="w-80">
          <SpelersPool
            spelers={alleSpelers}
            teams={editor.teams}
            selectieGroepen={editor.selectieGroepen}
            zichtbareTeamIds={editor.zichtbaar}
            onSpelerClick={(speler) => editor.handleSpelerClick(speler)}
          />
        </Drawer>

        {/* TeamEditPanel drawer (rechts, vervangt pool) */}
        <Drawer
          open={showEditDrawer}
          onClose={() => editor.setEditTeamId(null)}
          side="right"
          width="w-80"
        >
          {editor.editTeam && (
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
          )}
        </Drawer>
      </DndProvider>

      {/* Dialogen */}
      <NieuwTeamDialoog
        open={nieuwTeamOpen}
        onClose={() => setNieuwTeamOpen(false)}
        onSubmit={editor.handleCreateTeam}
      />

      {rapportOpen && editor.validatieMap && (
        <ValidatieRapport
          teams={editor.teams}
          validatieMap={editor.validatieMap}
          dubbeleMeldingen={editor.dubbeleMeldingen ?? []}
          onClose={() => setRapportOpen(false)}
        />
      )}

      {editor.verdeelData && (
        <VerdeelDialoog
          open={true}
          onClose={() => editor.setVerdeelData(null)}
          selectieGroep={editor.verdeelData.selectieGroep}
          teams={editor.verdeelData.lidTeams}
          onBevestig={editor.handleVerdeelBevestig}
        />
      )}

      {editor.detailSpeler && (
        <SpelerDetail
          speler={editor.detailSpeler}
          teamId={editor.detailTeamId ?? undefined}
          onClose={() => {
            editor.setDetailSpeler(null);
            editor.setDetailTeamId(null);
          }}
        />
      )}
    </div>
  );
}
