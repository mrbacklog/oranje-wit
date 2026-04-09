// apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import "./tokens.css";
import { Ribbon } from "./Ribbon";
import { Toolbar } from "./Toolbar";
import { SpelersPoolDrawer } from "./SpelersPoolDrawer";
import { WerkbordCanvas } from "./WerkbordCanvas";
import { ValidatieDrawer } from "./ValidatieDrawer";
import { useZoom } from "./hooks/useZoom";
import type { TiStudioShellProps } from "./types";

type ActivePanel = "pool" | "validatie" | "werkbord" | null;

export function TiStudioShell({ initieleState, gebruikerEmail }: TiStudioShellProps) {
  const router = useRouter();
  const [activePanel, setActivePanel] = useState<ActivePanel>("validatie");
  const [showScores, setShowScores] = useState(true);
  const [whatIfActief, setWhatIfActief] = useState(false);
  const { zoom, setZoom, zoomIn, zoomOut, resetZoom, zoomLevel, zoomPercent } = useZoom();

  const gebruikerInitialen = gebruikerEmail
    .split("@")[0]
    .split(".")
    .map((p) => p.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);

  function togglePanel(panel: "pool" | "validatie" | "werkbord") {
    setActivePanel((prev) => (prev === panel ? null : panel));
  }

  const hasErrors = initieleState.validatie.some((v) => v.type === "err");

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
      {/* Ribbon — beslaat beide rijen */}
      <Ribbon
        activePanel={activePanel}
        onTogglePanel={togglePanel}
        onToggleWhatIf={() => setWhatIfActief((v) => !v)}
        validatieHasErrors={hasErrors}
        gebruikerInitialen={gebruikerInitialen}
      />

      {/* Toolbar */}
      <Toolbar
        naam={initieleState.naam}
        versieNaam={initieleState.versieNaam}
        versieNummer={initieleState.versieNummer}
        status={initieleState.status}
        totalSpelers={initieleState.totalSpelers}
        ingeplandSpelers={initieleState.ingeplandSpelers}
        zoomLevel={zoomLevel}
        zoomPercent={zoomPercent}
        showScores={showScores}
        whatIfActief={whatIfActief}
        onToggleWhatIf={() => setWhatIfActief((v) => !v)}
        onToggleScores={() => setShowScores((v) => !v)}
        onNieuwTeam={() => {}}
        onPreview={() => {}}
        onTerug={() => router.push("/ti-studio")}
      />

      {/* Body */}
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
          spelers={initieleState.alleSpelers}
          onClose={() => setActivePanel(null)}
        />
        <WerkbordCanvas
          teams={initieleState.teams}
          zoomLevel={zoomLevel}
          zoom={zoom}
          zoomPercent={zoomPercent}
          showScores={showScores}
          whatIfActief={whatIfActief}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onZoomReset={resetZoom}
          onZoomChange={setZoom}
          onBewerkenTeam={() => {}}
        />
        <ValidatieDrawer
          open={activePanel === "validatie"}
          teams={initieleState.teams}
          validatie={initieleState.validatie}
          onClose={() => setActivePanel(null)}
        />
      </div>
    </div>
  );
}
