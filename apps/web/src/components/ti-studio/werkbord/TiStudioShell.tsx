// apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx
"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import "./tokens.css";
import { Ribbon } from "./Ribbon";
import { Toolbar } from "./Toolbar";
import { SpelersPoolDrawer } from "./SpelersPoolDrawer";
import { WerkbordCanvas } from "./WerkbordCanvas";
import { TeamDrawer } from "./TeamDrawer";
import { VersiesDrawer } from "./VersiesDrawer";
import { useZoom } from "./hooks/useZoom";
import type {
  TiStudioShellProps,
  WerkbordTeam,
  WerkbordSpeler,
  WerkbordSpelerInTeam,
} from "./types";
import type { DrawerData } from "@/app/(teamindeling-studio)/ti-studio/indeling/drawer-actions";
import { getVersiesVoorDrawer } from "@/app/(teamindeling-studio)/ti-studio/indeling/drawer-actions";

type ActivePanel = "pool" | "teams" | "werkbord" | "versies" | "kader" | null;

export function TiStudioShell({ initieleState, gebruikerEmail }: TiStudioShellProps) {
  const router = useRouter();
  const [activePanel, setActivePanel] = useState<ActivePanel>("teams");
  const [geselecteerdTeamId, setGeselecteerdTeamId] = useState<string | null>(null);
  const [showScores, setShowScores] = useState(true);
  const [drawerData, setDrawerData] = useState<DrawerData | null>(null);
  const { zoom, setZoom, zoomIn, zoomOut, resetZoom, zoomLevel, zoomPercent } = useZoom();

  // Mutable werkbord state
  const [teams, setTeams] = useState<WerkbordTeam[]>(initieleState.teams);
  const [alleSpelers, setAlleSpelers] = useState<WerkbordSpeler[]>(initieleState.alleSpelers);

  // Refs voor gebruik in SSE-handler (vermijdt stale closures)
  const alleSpelersRef = useRef(alleSpelers);
  useEffect(() => {
    alleSpelersRef.current = alleSpelers;
  }, [alleSpelers]);

  // Unieke sessie-ID per browser-tab (zodat we onze eigen SSE-events kunnen overslaan)
  const sessionId = useRef<string>(crypto.randomUUID());

  const versieId = initieleState.versieId;

  const gebruikerInitialen = gebruikerEmail
    .split("@")[0]
    .split(".")
    .map((p) => p.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);

  useEffect(() => {
    if (activePanel !== "versies") return;
    getVersiesVoorDrawer(initieleState.werkindelingId)
      .then(setDrawerData)
      .catch(() => {});
  }, [activePanel, initieleState.werkindelingId]);

  const togglePanel = useCallback((panel: "pool" | "teams" | "werkbord" | "versies" | "kader") => {
    setActivePanel((prev) => (prev === panel ? null : panel));
    if (panel !== "teams") setGeselecteerdTeamId(null);
  }, []);

  const openTeamDrawer = useCallback((teamId: string) => {
    setActivePanel("teams");
    setGeselecteerdTeamId(teamId);
  }, []);

  const hasErrors = initieleState.validatie.some((v) => v.type === "err");

  // ─── Lokale state-mutaties ─────────────────────────────────────────────────

  const verplaatsSpelerLokaal = useCallback(
    (
      spelerData: WerkbordSpeler,
      vanTeamId: string | null,
      naarTeamId: string,
      naarGeslacht: "V" | "M"
    ) => {
      setTeams((prev) =>
        prev.map((team) => {
          let updated = { ...team };
          if (vanTeamId && team.id === vanTeamId) {
            updated = {
              ...updated,
              dames: updated.dames.filter((s) => s.spelerId !== spelerData.id),
              heren: updated.heren.filter((s) => s.spelerId !== spelerData.id),
            };
          }
          if (team.id === naarTeamId) {
            const spelerInTeam: WerkbordSpelerInTeam = {
              id: `sit-${spelerData.id}-${naarTeamId}-${Date.now()}`,
              spelerId: spelerData.id,
              speler: { ...spelerData, teamId: naarTeamId },
              notitie: null,
            };
            if (naarGeslacht === "V") {
              updated = {
                ...updated,
                dames: [...updated.dames.filter((s) => s.spelerId !== spelerData.id), spelerInTeam],
              };
            } else {
              updated = {
                ...updated,
                heren: [...updated.heren.filter((s) => s.spelerId !== spelerData.id), spelerInTeam],
              };
            }
          }
          return updated;
        })
      );
      setAlleSpelers((prev) =>
        prev.map((s) => (s.id === spelerData.id ? { ...s, teamId: naarTeamId } : s))
      );
    },
    []
  );

  const verwijderSpelerUitTeamLokaal = useCallback((spelerId: string, vanTeamId: string) => {
    setTeams((prev) =>
      prev.map((team) => {
        if (team.id !== vanTeamId) return team;
        return {
          ...team,
          dames: team.dames.filter((s) => s.spelerId !== spelerId),
          heren: team.heren.filter((s) => s.spelerId !== spelerId),
        };
      })
    );
    setAlleSpelers((prev) => prev.map((s) => (s.id === spelerId ? { ...s, teamId: null } : s)));
  }, []);

  const verplaatsTeamKaartLokaal = useCallback((teamId: string, x: number, y: number) => {
    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId ? { ...t, canvasX: Math.max(0, x), canvasY: Math.max(0, y) } : t
      )
    );
  }, []);

  const updateTeamLokaal = useCallback((teamId: string, update: Partial<WerkbordTeam>) => {
    setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, ...update } : t)));
  }, []);

  const koppelSelectieLokaal = useCallback((teamId: string, selectieGroepId: string) => {
    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId ? { ...t, selectieGroepId, formaat: "selectie", selectieNaam: null } : t
      )
    );
  }, []);

  const ontkoppelSelectieLokaal = useCallback((selectieGroepId: string) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.selectieGroepId !== selectieGroepId) return t;
        // Herstel formaat op basis van teamCategorie + kleur (blauw/groen → viertal, rest → achtal)
        const formaatHerstel: "viertal" | "achtal" =
          t.teamCategorie === "B_CATEGORIE" && (t.kleur === "blauw" || t.kleur === "groen")
            ? "viertal"
            : "achtal";
        return { ...t, selectieGroepId: null, selectieNaam: null, formaat: formaatHerstel };
      })
    );
  }, []);

  const updateSelectieNaamLokaal = useCallback((selectieGroepId: string, naam: string) => {
    setTeams((prev) =>
      prev.map((t) =>
        t.selectieGroepId === selectieGroepId ? { ...t, selectieNaam: naam || null } : t
      )
    );
  }, []);

  // ─── API-calls + SSE ────────────────────────────────────────────────────────

  async function stuurMutatie(body: Record<string, unknown>) {
    try {
      await fetch(`/api/ti-studio/indeling/${versieId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, sessionId: sessionId.current }),
      });
    } catch {
      // Stil falen — optimistic update blijft, server-sync retry via SSE reconnect
    }
  }

  // Speler-verplaatsing: optimistic + opslaan
  const verplaatsSpeler = useCallback(
    (
      spelerData: WerkbordSpeler,
      vanTeamId: string | null,
      naarTeamId: string,
      naarGeslacht: "V" | "M"
    ) => {
      verplaatsSpelerLokaal(spelerData, vanTeamId, naarTeamId, naarGeslacht);
      stuurMutatie({
        type: "speler_verplaatst",
        spelerId: spelerData.id,
        vanTeamId,
        naarTeamId,
        naarGeslacht,
      });
    },
    [verplaatsSpelerLokaal] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Speler terug naar pool: optimistic + opslaan
  const verwijderSpelerUitTeam = useCallback(
    (spelerId: string, vanTeamId: string) => {
      verwijderSpelerUitTeamLokaal(spelerId, vanTeamId);
      stuurMutatie({ type: "speler_naar_pool", spelerId, vanTeamId });
    },
    [verwijderSpelerUitTeamLokaal] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Teamkaart verplaatsen: instant lokaal (tijdens drag), API-call alleen bij loslaten
  const verplaatsTeamKaart = useCallback(
    (teamId: string, x: number, y: number) => {
      verplaatsTeamKaartLokaal(teamId, x, y);
    },
    [verplaatsTeamKaartLokaal]
  );

  const slaTeamPositieOp = useCallback(
    (teamId: string, x: number, y: number) => {
      stuurMutatie({ type: "team_positie", teamId, x: Math.round(x), y: Math.round(y) });
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ─── SSE-verbinding ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!versieId) return;

    const es = new EventSource(`/api/ti-studio/indeling/${versieId}/stream`);

    es.onmessage = (e) => {
      let event: Record<string, unknown>;
      try {
        event = JSON.parse(e.data as string);
      } catch {
        return;
      }

      if (event.type === "ping") return;
      // Sla onze eigen events over (we hebben al optimistic update gedaan)
      if (event.sessionId === sessionId.current) return;

      if (event.type === "speler_verplaatst") {
        const sp = alleSpelersRef.current.find((s) => s.id === event.spelerId);
        if (sp) {
          verplaatsSpelerLokaal(
            sp,
            event.vanTeamId as string | null,
            event.naarTeamId as string,
            event.naarGeslacht as "V" | "M"
          );
        }
      } else if (event.type === "speler_naar_pool") {
        verwijderSpelerUitTeamLokaal(event.spelerId as string, event.vanTeamId as string);
      } else if (event.type === "team_positie") {
        verplaatsTeamKaartLokaal(event.teamId as string, event.x as number, event.y as number);
      }
    };

    return () => es.close();
  }, [versieId, verplaatsSpelerLokaal, verwijderSpelerUitTeamLokaal, verplaatsTeamKaartLokaal]);

  // ─── Render ────────────────────────────────────────────────────────────────

  const ingeplandSpelers = alleSpelers.filter((s) => s.teamId !== null).length;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "var(--ribbon) 1fr",
        gridTemplateRows: "var(--toolbar) 1fr",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 13,
        lineHeight: 1.5,
        background: "var(--bg-0)",
        color: "var(--text-1)",
        userSelect: "none",
      }}
    >
      <Ribbon
        activePanel={activePanel}
        onTogglePanel={togglePanel}
        gebruikerInitialen={gebruikerInitialen}
      />
      <Toolbar
        naam={initieleState.naam}
        versieNaam={initieleState.versieNaam}
        versieNummer={initieleState.versieNummer}
        status={initieleState.status}
        totalSpelers={initieleState.totalSpelers}
        ingeplandSpelers={ingeplandSpelers}
        onNieuwTeam={() => {}}
        onTerug={() => router.push("/ti-studio")}
      />
      <div
        style={{
          gridColumn: 2,
          gridRow: 2,
          display: "flex",
          overflow: "hidden",
        }}
      >
        <SpelersPoolDrawer
          open={activePanel === "pool"}
          spelers={alleSpelers}
          onClose={() => setActivePanel(null)}
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
          onTeamPositionChange={verplaatsTeamKaart}
          onTeamDragEnd={slaTeamPositieOp}
        />
        <TeamDrawer
          open={activePanel === "teams"}
          geselecteerdTeamId={geselecteerdTeamId}
          teams={teams}
          validatie={initieleState.validatie}
          versieId={versieId}
          onClose={() => setActivePanel(null)}
          onTeamSelect={setGeselecteerdTeamId}
          onNieuwTeam={() => {}}
          onConfigUpdated={updateTeamLokaal}
          onSelectieGekoppeld={koppelSelectieLokaal}
          onSelectieOntkoppeld={ontkoppelSelectieLokaal}
          onSelectieNaamUpdated={updateSelectieNaamLokaal}
        />
        <VersiesDrawer
          open={activePanel === "versies"}
          data={drawerData}
          werkindelingId={initieleState.werkindelingId}
          gebruikerEmail={gebruikerEmail}
          onClose={() => setActivePanel(null)}
        />
      </div>
    </div>
  );
}
