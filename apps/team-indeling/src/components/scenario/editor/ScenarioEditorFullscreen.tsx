"use client";

import { useState, useCallback } from "react";
import type { ScenarioData, SpelerData } from "../types";
import { useScenarioEditor } from "../hooks/useScenarioEditor";
import DndProvider from "../DndContext";
import Navigator from "../Navigator";
import Werkgebied from "../Werkgebied";
import SpelersPool from "../SpelersPool";
import SpelerDetail from "../SpelerDetail";
import ChatPanel from "../ChatPanel";
import TeamEditPanel from "../TeamEditPanel";
import WhatIfDialoog from "../WhatIfDialoog";
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

  const toggleNav = useCallback(() => setNavOpen((v) => !v), []);
  const togglePool = useCallback(() => setPoolOpen((v) => !v), []);

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
      <EditorToolbar
        scenario={scenario}
        navOpen={navOpen}
        poolOpen={poolOpen || showEditDrawer}
        onToggleNav={toggleNav}
        onTogglePool={togglePool}
      />

      {/* Hoofdgebied */}
      <DndProvider
        spelers={alleSpelers}
        onPoolToTeam={editor.handlePoolToTeam}
        onTeamToTeam={editor.handleTeamToTeam}
        onTeamToPool={editor.handleTeamToPool}
        onReorderTeams={editor.handleReorderTeams}
      >
        <div className="relative flex-1 overflow-hidden">
          {/* Center: Werkgebied + ChatPanel — neemt ALLE ruimte */}
          <div className="flex h-full flex-col">
            <Werkgebied
              scenarioId={scenario.id}
              teams={editor.teams}
              zichtbareTeamIds={editor.zichtbaar}
              validatieMap={editor.validatieMap}
              dubbeleMeldingen={editor.dubbeleMeldingen}
              onCreateTeam={editor.handleCreateTeam}
              onDeleteTeam={editor.handleDeleteTeam}
              onKoppelSelectie={editor.handleKoppelSelectie}
              onOntkoppelSelectie={editor.handleOntkoppelSelectie}
              onWhatIfOpen={() => editor.setWhatIfOpen(true)}
              onSpelerClick={editor.handleSpelerClick}
              onEditTeam={editor.handleEditTeam}
              onReorderTeams={editor.handleReorderTeams}
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
              onKoppelSelectie={editor.handleKoppelSelectie}
              onOntkoppelSelectie={editor.handleOntkoppelSelectie}
            />
          )}
        </Drawer>
      </DndProvider>

      {/* Dialogen (z-50, boven drawers) */}
      <WhatIfDialoog
        open={editor.whatIfOpen}
        onClose={() => editor.setWhatIfOpen(false)}
        teams={editor.teams}
        alleSpelers={alleSpelers}
      />

      {editor.verdeelData && (
        <VerdeelDialoog
          open={true}
          onClose={() => editor.setVerdeelData(null)}
          leiderTeam={editor.verdeelData.leiderTeam}
          lidTeams={editor.verdeelData.lidTeams}
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
