"use client";

import type { PoolSpeler } from "./werkbord-types";
import { useWerkbordDraggable, type DragBron } from "./hooks/useWerkbordDraggable";

const CAT_KLEUREN: Record<string, string> = {
  blauw: "var(--cat-blauw)",
  groen: "var(--cat-groen)",
  geel: "var(--cat-geel)",
  oranje: "var(--cat-oranje)",
  rood: "var(--cat-rood)",
  senior: "var(--cat-senior)",
};

interface WbSpelerRijProps {
  speler: PoolSpeler;
  bron: DragBron;
  onClick: (spelerId: string) => void;
}

export function WbSpelerRij({ speler, bron, onClick }: WbSpelerRijProps) {
  const catKleur = CAT_KLEUREN[speler.leeftijdCategorie] ?? "var(--cat-senior)";
  const isVrouw = speler.geslacht === "V";
  const { ref, isDragging } = useWerkbordDraggable({ rel_code: speler.spelerId, bron });

  return (
    <div
      ref={ref}
      className="wb-speler-rij"
      data-testid={`speler-card-${speler.spelerId}-${bron}`}
      style={
        {
          "--status-color": isVrouw ? "var(--sexe-v)" : "var(--sexe-h)",
          cursor: isDragging ? "grabbing" : "grab",
          opacity: isDragging ? 0.5 : 1,
        } as React.CSSProperties
      }
      onClick={() => onClick(speler.spelerId)}
      title={`${speler.roepnaam} ${speler.achternaam}`}
    >
      {/* Avatar placeholder */}
      <div
        className="av"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isVrouw ? "rgba(217,70,239,.12)" : "rgba(37,99,235,.12)",
          fontSize: 12,
          fontWeight: 800,
          color: isVrouw ? "var(--sexe-v)" : "var(--sexe-h)",
        }}
      >
        {speler.roepnaam[0]?.toUpperCase()}
      </div>

      {/* Info */}
      <div className="info">
        <div className="nm">
          {speler.roepnaam} {speler.tussenvoegsel ? `${speler.tussenvoegsel} ` : ""}
          {speler.achternaam}
        </div>
        <div className="sub">
          {speler.huidigTeamNaam && <span className="tb">{speler.huidigTeamNaam}</span>}
          {speler.ingedeeldTeamId && <span style={{ color: "#4ade80" }}>✓</span>}
          {speler.openMemoCount > 0 && <span style={{ color: "#eab308" }}>▲</span>}
        </div>
      </div>

      {/* Leeftijdsbalk */}
      <div className="leeft" style={{ background: catKleur }}>
        <span className="lb">{Math.floor(speler.korfbalLeeftijd)}</span>
        <span className="ld">jr</span>
      </div>
    </div>
  );
}
