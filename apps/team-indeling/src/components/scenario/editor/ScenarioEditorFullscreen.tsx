"use client";

import { useState, useCallback, useMemo } from "react";
import type { ScenarioData, SpelerData } from "../types";
import { useScenarioEditor } from "../hooks/useScenarioEditor";
import { useCardPositions, type CardInfo } from "../hooks/useCardPositions";
import DndProvider from "../DndContext";
import Navigator from "../Navigator";
import Werkgebied from "../Werkgebied";
import SpelersPool from "../SpelersPool";
import SpelerDetail from "../SpelerDetail";
import ChatPanel from "../ChatPanel";
import TeamEditPanel from "../TeamEditPanel";
import VerdeelDialoog from "../VerdeelDialoog";
import Drawer from "./Drawer";
import EditorToolbar from "./EditorToolbar";

interface ScenarioEditorFullscreenProps {
  scenario: ScenarioData;
  alleSpelers: SpelerData[];
}

export default function ScenarioEditorFullscreen({
  scenario,
  alleSpelers,
}: ScenarioEditorFullscreenProps) {
  const editor = useScenarioEditor(scenario, alleSpelers);
  const [navOpen, setNavOpen] = useState(false);
  const [poolOpen, setPoolOpen] = useState(false);

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

  const { positions, updatePosition } = useCardPositions(scenario.id, cardInfos);

  const toggleNav = useCallback(() => setNavOpen((v) => !v), []);
  const togglePool = useCallback(() => setPoolOpen((v) => !v), []);

  const zichtbareCount = editor.teams.filter((t) => editor.zichtbaar.has(t.id)).length;

  // TeamEditPanel vervangt pool-drawer wanneer open
  const showPoolDrawer = poolOpen && !editor.editTeamId;
  const showEditDrawer = !!editor.editTeamId;

  if (!editor.laatsteVersie) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">Dit scenario heeft nog geen versie.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-gray-50">
      {/* Top toolbar */}
      <EditorToolbar scenario={scenario} zichtbaar={zichtbareCount} totaal={editor.teams.length} />

      {/* Hoofdgebied */}
      <DndProvider
        spelers={alleSpelers}
        onPoolToTeam={editor.handlePoolToTeam}
        onTeamToTeam={editor.handleTeamToTeam}
        onTeamToPool={editor.handleTeamToPool}
        onRepositionCard={updatePosition}
      >
        <div className="relative flex-1 overflow-hidden">
          {/* Side-tab: Teamlijst (links) */}
          <button
            onClick={toggleNav}
            className={`absolute top-1/2 left-0 z-20 flex -translate-y-1/2 flex-col items-center gap-1 rounded-r-lg border border-l-0 border-gray-200 px-1.5 py-3 shadow-md transition-colors ${
              navOpen
                ? "border-orange-200 bg-orange-50 text-orange-600"
                : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
            title={navOpen ? "Verberg teamlijst" : "Toon teamlijst"}
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            <span
              className="text-[9px] font-medium"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              Teamlijst
            </span>
          </button>

          {/* Side-tab: Spelerspool (rechts) */}
          <button
            onClick={togglePool}
            className={`absolute top-1/2 right-0 z-20 flex -translate-y-1/2 flex-col items-center gap-1 rounded-l-lg border border-r-0 border-gray-200 px-1.5 py-3 shadow-md transition-colors ${
              poolOpen || showEditDrawer
                ? "border-orange-200 bg-orange-50 text-orange-600"
                : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
            title={poolOpen ? "Verberg spelerspool" : "Toon spelerspool"}
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-[9px] font-medium" style={{ writingMode: "vertical-rl" }}>
              Spelerspool
            </span>
          </button>

          {/* Center: Werkgebied + ChatPanel — neemt ALLE ruimte */}
          <div className="flex h-full flex-col">
            <Werkgebied
              scenarioId={scenario.id}
              teams={editor.teams}
              zichtbareTeamIds={editor.zichtbaar}
              validatieMap={editor.validatieMap}
              dubbeleMeldingen={editor.dubbeleMeldingen}
              selectieGroepMap={editor.selectieGroepMap}
              onCreateTeam={editor.handleCreateTeam}
              onDeleteTeam={editor.handleDeleteTeam}
              onKoppelSelectie={editor.handleKoppelSelectie}
              onOntkoppelSelectie={editor.handleOntkoppelSelectie}
              onSpelerClick={editor.handleSpelerClick}
              onEditTeam={editor.handleEditTeam}
              positions={positions}
            />
            <ChatPanel
              scenarioId={scenario.id}
              versieId={editor.versieId!}
              onMutatie={editor.refreshTeams}
            />
          </div>
        </div>

        {/* Navigator drawer (links, geen title — Navigator heeft eigen header) */}
        <Drawer open={navOpen} onClose={() => setNavOpen(false)} side="left" width="w-64">
          <Navigator
            teams={editor.teams}
            zichtbaar={editor.zichtbaar}
            onToggle={editor.handleToggle}
            onToggleAlles={editor.handleToggleAlles}
          />
        </Drawer>

        {/* SpelersPool drawer (rechts, geen title — Pool heeft eigen header) */}
        <Drawer open={showPoolDrawer} onClose={() => setPoolOpen(false)} side="right" width="w-80">
          <SpelersPool
            spelers={alleSpelers}
            teams={editor.teams}
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

      {/* Dialogen (z-50, boven drawers) */}
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
