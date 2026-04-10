// apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx
"use client";
import { useState, useCallback, useEffect } from "react";
import { logger } from "@oranje-wit/types";
import { Toolbar } from "./Toolbar";
import { SpelersPoolDrawer } from "./SpelersPoolDrawer";
import { WerkbordCanvas } from "./WerkbordCanvas";
import { TeamDrawer } from "./TeamDrawer";
import { VersiesDrawer } from "./VersiesDrawer";
import SpelerProfielDialog from "../SpelerProfielDialog";
import { TeamDialog } from "../TeamDialog";
import { useZoom } from "./hooks/useZoom";
import { useWerkbordState } from "./hooks/useWerkbordState";
import type { TiStudioShellProps } from "./types";
import type { DrawerData } from "@/app/(teamindeling-studio)/ti-studio/indeling/drawer-actions";
import { getVersiesVoorDrawer } from "@/app/(teamindeling-studio)/ti-studio/indeling/drawer-actions";

type PanelLinks = "pool" | null;
type PanelRechts = "teams" | "versies" | null;

export function TiStudioShell({ initieleState, gebruikerEmail }: TiStudioShellProps) {
  const [panelLinks, setPanelLinks] = useState<PanelLinks>(null);
  const [panelRechts, setPanelRechts] = useState<PanelRechts>("teams");
  const [geselecteerdTeamId, setGeselecteerdTeamId] = useState<string | null>(null);
  const [showScores, setShowScores] = useState(true);
  const [drawerData, setDrawerData] = useState<DrawerData | null>(null);
  const [drawerRefreshTeller, setDrawerRefreshTeller] = useState(0);
  const [profielSpelerId, setProfielSpelerId] = useState<string | null>(null);
  const [profielTeamId, setProfielTeamId] = useState<string | null>(null);

  const { zoom, setZoom, zoomIn, zoomOut, resetZoom, zoomLevel, zoomPercent } = useZoom();

  const {
    teams,
    alleSpelers,
    validatie,
    updateValidatieLokaal,
    verplaatsSpeler,
    verwijderSpelerUitTeam,
    verplaatsTeamKaart,
    slaTeamPositieOp,
    updateTeamLokaal,
    verwijderTeamLokaal,
    koppelSelectieLokaal,
    ontkoppelSelectieLokaal,
    updateSelectieNaamLokaal,
    toggleBundeling,
    onDropSpelerOpSelectieFn,
  } = useWerkbordState(
    initieleState.versieId,
    initieleState.teams,
    initieleState.alleSpelers,
    initieleState.validatie
  );

  const [dialogTeamId, setDialogTeamId] = useState<string | null>(null);
  const openTeamDialog = useCallback((teamId: string) => {
    setDialogTeamId(teamId);
  }, []);

  useEffect(() => {
    if (panelRechts !== "versies") return;
    getVersiesVoorDrawer(initieleState.werkindelingId)
      .then(setDrawerData)
      .catch((error) => {
        logger.warn("Versies drawer laden mislukt:", error);
      });
  }, [panelRechts, initieleState.werkindelingId, drawerRefreshTeller]);

  const togglePanelLinks = useCallback((panel: PanelLinks) => {
    setPanelLinks((prev) => (prev === panel ? null : panel));
  }, []);

  const togglePanelRechts = useCallback((panel: Exclude<PanelRechts, null>) => {
    setPanelRechts((prev) => (prev === panel ? null : panel));
    if (panel !== "teams") setGeselecteerdTeamId(null);
  }, []);

  const openTeamDrawer = useCallback((teamId: string) => {
    setPanelRechts("teams");
    setGeselecteerdTeamId(teamId);
  }, []);

  function openProfiel(spelerId: string, teamId: string | null) {
    setProfielSpelerId(spelerId);
    setProfielTeamId(teamId);
  }

  const ingeplandSpelers = alleSpelers.filter(
    (s) => s.teamId !== null || s.selectieGroepId !== null
  ).length;

  const versieId = initieleState.versieId;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "var(--toolbar) 1fr",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Toolbar
        naam={initieleState.naam}
        versieNaam={initieleState.versieNaam}
        versieNummer={initieleState.versieNummer}
        totalSpelers={initieleState.totalSpelers}
        ingeplandSpelers={ingeplandSpelers}
        panelLinks={panelLinks}
        panelRechts={panelRechts}
        onTogglePanelLinks={togglePanelLinks}
        onTogglePanelRechts={togglePanelRechts}
        onVersiesOpen={() => togglePanelRechts("versies")}
      />
      <div style={{ display: "flex", overflow: "hidden" }}>
        <SpelersPoolDrawer
          open={panelLinks === "pool"}
          spelers={alleSpelers}
          onClose={() => setPanelLinks(null)}
        />
        <WerkbordCanvas
          teams={teams}
          zoomLevel={zoomLevel}
          zoom={zoom}
          zoomPercent={zoomPercent}
          showScores={showScores}
          onToggleScores={() => setShowScores((v) => !v)}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onZoomReset={resetZoom}
          onZoomChange={setZoom}
          onOpenTeamDrawer={openTeamDrawer}
          onDropSpelerOpTeam={verplaatsSpeler}
          onReturneerNaarPool={(spelerData, vanTeamId) =>
            verwijderSpelerUitTeam(spelerData.id, vanTeamId)
          }
          onTeamPositionChange={verplaatsTeamKaart}
          onTeamDragEnd={slaTeamPositieOp}
          onSpelerClick={openProfiel}
          onDropSpelerOpSelectie={onDropSpelerOpSelectieFn}
          onToggleBundeling={toggleBundeling}
          onTitelKlik={openTeamDialog}
        />
        <TeamDrawer
          open={panelRechts === "teams"}
          geselecteerdTeamId={geselecteerdTeamId}
          teams={teams}
          validatie={validatie}
          versieId={versieId}
          onClose={() => setPanelRechts(null)}
          onTeamSelect={setGeselecteerdTeamId}
          onNieuwTeam={() => {}}
          onConfigUpdated={updateTeamLokaal}
          onValidatieUpdated={(update) => updateValidatieLokaal([update])}
          onTeamVerwijderd={verwijderTeamLokaal}
          onSelectieGekoppeld={koppelSelectieLokaal}
          onSelectieOntkoppeld={ontkoppelSelectieLokaal}
          onSelectieNaamUpdated={updateSelectieNaamLokaal}
        />
        <VersiesDrawer
          open={panelRechts === "versies"}
          data={drawerData}
          werkindelingId={initieleState.werkindelingId}
          gebruikerEmail={gebruikerEmail}
          onClose={() => setPanelRechts(null)}
          onRefresh={() => setDrawerRefreshTeller((n) => n + 1)}
        />
      </div>
      <SpelerProfielDialog
        spelerId={profielSpelerId}
        open={profielSpelerId !== null}
        onClose={() => setProfielSpelerId(null)}
        teamId={profielTeamId ?? undefined}
      />
      <TeamDialog
        teamId={dialogTeamId}
        teams={teams}
        validatie={validatie}
        onClose={() => setDialogTeamId(null)}
        kadersId={initieleState.kadersId}
        werkindelingId={initieleState.werkindelingId}
      />
    </div>
  );
}
