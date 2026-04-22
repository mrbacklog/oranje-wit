// apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx
"use client";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { logger, korfbalPeildatum, type Seizoen } from "@oranje-wit/types";
import { Toolbar } from "./Toolbar";
import { SpelersPoolDrawer } from "./SpelersPoolDrawer";
import { StafPoolDrawer } from "./StafPoolDrawer";
import { WerkbordCanvas } from "./WerkbordCanvas";
import { TeamDrawer } from "./TeamDrawer";
import { VersiesDrawer } from "./VersiesDrawer";
import SpelerProfielDialog from "../SpelerProfielDialog";
import { TeamDialog } from "../TeamDialog";
import { useZoom } from "./hooks/useZoom";
import { useWerkbordState, type WerkbordMode } from "./hooks/useWerkbordState";
import type { TiStudioShellProps } from "./types";
import type { DrawerData } from "@/app/(protected)/indeling/drawer-actions";
import { getVersiesVoorDrawer } from "@/app/(protected)/indeling/drawer-actions";
import { getWhatIfVoorCanvas } from "@/app/(protected)/indeling/whatif-canvas-actions";
import { HoverKaartProvider } from "./HoverSpelersKaart";
import { PeildatumProvider } from "./peildatum-context";

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

  const [actieveWhatIfId, setActieveWhatIfId] = useState<string | null>(null);
  const [actieveWhatIfMeta, setActieveWhatIfMeta] = useState<{
    vraag: string;
    basisVersieNummer: number;
  } | null>(null);

  const { zoom, setZoom, zoomIn, zoomOut, resetZoom, zoomLevel, zoomPercent } = useZoom();

  const werkbordMode: WerkbordMode = useMemo(
    () =>
      actieveWhatIfId ? { kind: "whatif", whatIfId: actieveWhatIfId } : { kind: "werkversie" },
    [actieveWhatIfId]
  );

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
    herorderTeamsLokaal,
    voegTeamLokaalToe,
    koppelSelectieLokaal,
    ontkoppelSelectieLokaal,
    updateSelectieNaamLokaal,
    toggleBundeling,
    onDropSpelerOpSelectieFn,
    herlaadStaat,
  } = useWerkbordState(
    initieleState.versieId,
    initieleState.teams,
    initieleState.alleSpelers,
    initieleState.validatie,
    werkbordMode
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

  // Mode-switch: herlaad canvas-state vanaf de server (werkversie of variant)
  // Refs naar initieleState voorkomen een herlaad-loop als de parent opnieuw rendert
  // met nieuwe array-references — we willen alleen herladen bij een mode-wissel.
  const initieleStateRef = useRef(initieleState);
  useEffect(() => {
    initieleStateRef.current = initieleState;
  }, [initieleState]);
  useEffect(() => {
    let geannuleerd = false;
    const snapshot = initieleStateRef.current;
    if (actieveWhatIfId) {
      getWhatIfVoorCanvas(actieveWhatIfId)
        .then((res) => {
          if (geannuleerd) return;
          if (!res.ok) {
            logger.warn("What-if canvas laden mislukt:", res.error);
            setActieveWhatIfId(null);
            setActieveWhatIfMeta(null);
            herlaadStaat(snapshot.teams, snapshot.alleSpelers, snapshot.validatie);
            return;
          }
          herlaadStaat(res.data.teams, res.data.alleSpelers, res.data.validatie);
        })
        .catch((error) => {
          if (geannuleerd) return;
          logger.warn("What-if canvas laden fout:", error);
        });
    } else {
      herlaadStaat(snapshot.teams, snapshot.alleSpelers, snapshot.validatie);
    }
    return () => {
      geannuleerd = true;
    };
  }, [actieveWhatIfId, herlaadStaat]);

  const openWhatIfOpCanvas = useCallback(
    (whatIfId: string, meta: { vraag: string; basisVersieNummer: number }) => {
      setActieveWhatIfId(whatIfId);
      setActieveWhatIfMeta(meta);
    },
    []
  );

  const terugNaarWerkversie = useCallback(() => {
    setActieveWhatIfId(null);
    setActieveWhatIfMeta(null);
  }, []);

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
  const peildatum = useMemo(
    () => korfbalPeildatum(initieleState.seizoen as Seizoen),
    [initieleState.seizoen]
  );

  return (
    <PeildatumProvider value={peildatum}>
      <HoverKaartProvider>
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
            variantActief={actieveWhatIfId !== null}
            variantVraag={actieveWhatIfMeta?.vraag ?? null}
            variantBasis={actieveWhatIfMeta?.basisVersieNummer ?? null}
            onTerugNaarWerkversie={terugNaarWerkversie}
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
              versieId={versieId}
              werkindelingId={initieleState.werkindelingId}
              werkindelingNaam={initieleState.naam}
              variantBadge={
                actieveWhatIfId && actieveWhatIfMeta
                  ? {
                      vraag: actieveWhatIfMeta.vraag,
                      basisVersieNummer: actieveWhatIfMeta.basisVersieNummer,
                    }
                  : null
              }
              onTerugNaarWerkversie={terugNaarWerkversie}
            />
            <TeamDrawer
              open={panelRechts === "teams"}
              geselecteerdTeamId={geselecteerdTeamId}
              teams={teams}
              validatie={validatie}
              versieId={versieId}
              onClose={() => setPanelRechts(null)}
              onTeamSelect={setGeselecteerdTeamId}
              onNieuwTeam={voegTeamLokaalToe}
              onConfigUpdated={updateTeamLokaal}
              onValidatieUpdated={(update) => updateValidatieLokaal([update])}
              onTeamVerwijderd={verwijderTeamLokaal}
              onSelectieGekoppeld={koppelSelectieLokaal}
              onSelectieOntkoppeld={ontkoppelSelectieLokaal}
              onSelectieNaamUpdated={updateSelectieNaamLokaal}
              onToggleBundeling={toggleBundeling}
              onTeamsHerordend={herorderTeamsLokaal}
            />
            <VersiesDrawer
              open={panelRechts === "versies"}
              data={drawerData}
              werkindelingId={initieleState.werkindelingId}
              gebruikerEmail={gebruikerEmail}
              onClose={() => setPanelRechts(null)}
              onRefresh={() => setDrawerRefreshTeller((n) => n + 1)}
              actieveWhatIfId={actieveWhatIfId}
              onOpenWhatIfOpCanvas={openWhatIfOpCanvas}
            />
          </div>
          <SpelerProfielDialog
            spelerId={profielSpelerId}
            open={profielSpelerId !== null}
            onClose={() => setProfielSpelerId(null)}
            teamId={profielTeamId ?? undefined}
            kadersId={initieleState.kadersId}
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
      </HoverKaartProvider>
    </PeildatumProvider>
  );
}
