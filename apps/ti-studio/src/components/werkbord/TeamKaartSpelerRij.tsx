// apps/ti-studio/src/components/werkbord/TeamKaartSpelerRij.tsx
// Dunne wrapper die delegeert naar SpelerRij (compact/normaal) of SpelerKaart (detail).
"use client";
import "./tokens.css";
import { SpelerKaart } from "./SpelerKaart";
import { SpelerRij, SPELER_RIJ_HOOGTE } from "./SpelerRij";
import type { WerkbordSpelerInTeam, ZoomLevel } from "./types";

export { SPELER_RIJ_HOOGTE };

// ── Schaalprincipe ──────────────────────────────────────────────────────────
//
// compact  (scale 0.4–0.8): chip-variant — badge-chip die wrappt
// normaal  (scale 0.8–1.2): rij-variant — avatar + naam + leeftijd
// detail   (scale 1.2–1.5): SpelerKaart (FIFA-stijl profielkaart)

interface TeamKaartSpelerRijProps {
  spelerInTeam: WerkbordSpelerInTeam;
  teamId: string;
  selectieGroepId?: string | null;
  zoomLevel: ZoomLevel;
  openMemoCount?: number;
  onSpelerClick?: (spelerId: string, teamId: string | null) => void;
}

export function TeamKaartSpelerRij({
  spelerInTeam,
  teamId,
  selectieGroepId,
  zoomLevel,
  openMemoCount = 0,
  onSpelerClick,
}: TeamKaartSpelerRijProps) {
  // detail-variant: SpelerKaart (FIFA-stijl, behoudt eigen drag-logica)
  if (zoomLevel === "detail") {
    return (
      <SpelerKaart
        speler={spelerInTeam.speler}
        vanTeamId={teamId}
        vanSelectieGroepId={selectieGroepId ?? null}
        onClick={onSpelerClick ? () => onSpelerClick(spelerInTeam.speler.id, teamId) : undefined}
      />
    );
  }

  // normaal en compact delegeren naar SpelerRij
  return (
    <SpelerRij
      spelerInTeam={spelerInTeam}
      teamId={teamId}
      selectieGroepId={selectieGroepId}
      variant={zoomLevel === "normaal" ? "normaal" : "compact"}
      openMemoCount={openMemoCount}
      onSpelerClick={onSpelerClick}
    />
  );
}
