"use client";

import { useState, useCallback, useMemo, useRef, lazy, Suspense } from "react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { logger } from "@oranje-wit/types";
import type { ScenarioData, SpelerData, SelectieGroepData, TeamData } from "../types";
import { SpelerProfielDialog, TeamoverzichtDialog, DaisyWidget } from "@/components/ti-studio";
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
import EditorSidebars from "./EditorSidebars";
import EditorToolbar, { type EditorMode } from "./EditorToolbar";
import PreviewMode from "./PreviewMode";
import EditorDialogs from "./EditorDialogs";
import { SideTabPool, SideTabsRight } from "./SideTabs";
import WhatIfStartDialoog from "./WhatIfStartDialoog";
import WhatIfToolbar from "./WhatIfToolbar";
import WhatIfFooter from "./WhatIfFooter";
import WhatIfSidebar from "./WhatIfSidebar";
import { useWhatIf } from "../hooks/useWhatIf";
import VersiesDrawer from "@/components/teamindeling/werkindeling/VersiesDrawer";
import Ribbon from "./Ribbon";

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

  const whatIf = useWhatIf({ teams: editor.teams, onRefreshTeams: editor.refreshTeams });

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

  const zichtbareTeams = editor.teams.filter((t) => editor.zichtbaar.has(t.id));
  const zichtbareCount = zichtbareTeams.length;

  // Teller: hoeveel spelers zijn al ingedeeld in een team
  const ingedeeldSpelers = useMemo(
    () => new Set(editor.teams.flatMap((t) => t.spelers.map((ts) => ts.speler.id))).size,
    [editor.teams]
  );
  const totaalSpelers = alleSpelers.length;

  const showPoolDrawer = poolOpen && !editor.editTeamId;
  const showEditDrawer = !!editor.editTeamId;

  const selectieGroepMap = new Map<string, SelectieGroepData>(
    (scenario.versies[0]?.selectieGroepen ?? []).map((sg) => [sg.id, sg])
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

  // Preview: validatie
  const blauwdrukKaders = (scenario as any).blauwdruk?.kaders as
    | Record<string, Record<string, unknown>>
    | undefined;
  const { validatieMap: previewValidatieMap } = useValidatie(
    zichtbareTeams,
    PEILJAAR,
    blauwdrukKaders
  );

  if (!editor.laatsteVersie) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#0f1115]">
        <p className="text-sm text-gray-400">Dit scenario heeft nog geen versie.</p>
      </div>
    );
  }

  if (isMobile && !isPreview) {
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
        kadersId={editor.kadersId}
        onToggleRanking={toggleRanking}
        onToggleCompact={toggleCompact}
        onSyncScores={handleSyncScores}
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

  // SpelersPool content (hergebruikt in gepinde sidebar en drawer)
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

  // Ribbon actieve tab bepalen
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

  return (
    <div className="absolute inset-0 flex" style={{ background: "var(--surface-base, #0a0a0a)" }}>
      {/* Ribbon — links, volledige hoogte, verborgen bij what-if en mobile */}
      {!whatIf.isWhatIfModus && !isMobile && (
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

      {/* Rechter kolom: toolbar bovenaan + body */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Toolbar: what-if modus of normaal */}
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
            zichtbaar={zichtbareCount}
            totaal={editor.teams.length}
            mode={mode}
            showRanking={showRanking}
            compactMode={compactMode}
            zoomLabel={zoomLabel}
            ingedeeldSpelers={ingedeeldSpelers}
            totaalSpelers={totaalSpelers}
            onToggleRanking={toggleRanking}
            onToggleCompact={toggleCompact}
            onToggleMode={toggleMode}
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

            {/* Hoofdgebied */}
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
                onRepositionCard={updatePosition}
                whatIfZones={whatIf.whatIfZones ?? undefined}
                onZoomLabelChange={setZoomLabel}
              />
            </div>
          </div>
        </DndProvider>

        {/* What-if footer — alleen in what-if modus */}
        {whatIf.isWhatIfModus && (
          <WhatIfFooter
            bezig={whatIf.whatIfBezig}
            heeftHardefouten={whatIf.whatIfHeeftHardefouten}
            onVerwerpen={whatIf.handleVerwerpWhatIf}
            onBewaren={whatIf.handleVerlaatWhatIf}
            onToepassen={whatIf.handleToepassenWhatIf}
          />
        )}

        {/* Dialogen en overlays */}
        <EditorDialogs
          werkindelingId={scenario.id}
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
          kadersId={editor.kadersId}
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

        {/* What-if zijbalk (rechts, overlay) */}
        <WhatIfSidebar
          open={whatIfOpen}
          werkindelingId={scenario.id}
          panelKey={whatIf.whatIfPanelKey}
          activeWhatIfId={whatIf.activeWhatIfId}
          onClose={() => setWhatIfOpen(false)}
          onNieuw={() => setWhatIfDialoogOpen(true)}
          onActiveer={whatIf.handleActiveerWhatIf}
        />

        {/* What-if aanmaak-dialoog */}
        <WhatIfStartDialoog
          open={whatIfDialoogOpen}
          werkindelingId={scenario.id}
          teams={editor.teams}
          onClose={() => setWhatIfDialoogOpen(false)}
          onCreated={() => setWhatIfOpen(true)}
        />

        {/* Versies zijbalk (rechts, overlay) */}
        <VersiesDrawer
          open={versiesOpen}
          versies={versieRijen}
          gebruikerEmail={gebruikerEmail}
          onClose={() => setVersiesOpen(false)}
        />

        {/* Speler profiel dialog */}
        <SpelerProfielDialog
          spelerId={spelerProfielId}
          open={!!spelerProfielId}
          onClose={() => setSpelerProfielId(null)}
        />

        {/* Team overzicht dialog */}
        <TeamoverzichtDialog
          team={teamOverzichtTeam}
          open={!!teamOverzichtTeam}
          onClose={() => setTeamOverzichtTeam(null)}
          onSpelerVerwijderd={(spelerId, teamId) => {
            logger.info("Speler verwijderd uit team via overzicht:", { spelerId, teamId });
          }}
        />

        {/* Daisy AI assistent widget */}
        <DaisyWidget />
      </div>
      {/* einde rechter kolom */}
    </div>
  );
}
