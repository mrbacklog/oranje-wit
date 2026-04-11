// apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx
"use client";
import { useState, useCallback, useEffect } from "react";
import { logger } from "@oranje-wit/types";
import { Toolbar } from "./Toolbar";
import { SpelersPoolDrawer } from "./SpelersPoolDrawer";
import { StafPoolDrawer } from "./StafPoolDrawer";
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

type PanelLinks = "pool" | "staf" | null;
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
    opslaanStatus,
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

  const togglePanelLinks = useCallback((panel: "pool" | "staf") => {
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

  const alleReserveringen = initieleState.alleReserveringen ?? [];

  const arCount = alleSpelers.filter((s) => s.status === "ALGEMEEN_RESERVE").length;
  const inTeDelenTotaal = initieleState.totalSpelers - arCount;
  const ingeplandSpelers = alleSpelers.filter(
    (s) => s.teamId !== null || s.selectieGroepId !== null
  ).length;

  const versieId = initieleState.versieId;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "var(--toolbar) 1fr",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <Toolbar
        naam={initieleState.naam}
        versieNaam={initieleState.versieNaam}
        versieNummer={initieleState.versieNummer}
        totalSpelers={inTeDelenTotaal}
        arCount={arCount}
        ingeplandSpelers={ingeplandSpelers}
        panelLinks={panelLinks}
        panelRechts={panelRechts}
        onTogglePanelLinks={togglePanelLinks}
        onTogglePanelRechts={togglePanelRechts}
        onVersiesOpen={() => togglePanelRechts("versies")}
      />
      <div style={{ display: "flex", overflow: "hidden", position: "relative" }}>
        {opslaanStatus === "bezig" && (
          <div
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              zIndex: 100,
              background: "var(--bg-2)",
              border: "1px solid var(--border-1)",
              borderRadius: 6,
              padding: "4px 10px",
              fontSize: 11,
              color: "var(--text-2)",
            }}
          >
            Opslaan...
          </div>
        )}
        {opslaanStatus === "fout" && (
          <div
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              zIndex: 100,
              background: "rgba(239,68,68,.15)",
              border: "1px solid rgba(239,68,68,.4)",
              borderRadius: 6,
              padding: "4px 10px",
              fontSize: 11,
              color: "#ef4444",
            }}
          >
            Opslaan mislukt
          </div>
        )}
        <SpelersPoolDrawer
          open={panelLinks === "pool"}
          spelers={alleSpelers}
          reserveringen={alleReserveringen}
          onClose={() => setPanelLinks(null)}
        />
        <StafPoolDrawer
          open={panelLinks === "staf"}
          staf={initieleState.alleStaf}
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
          onToggleBundeling={toggleBundeling}
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
