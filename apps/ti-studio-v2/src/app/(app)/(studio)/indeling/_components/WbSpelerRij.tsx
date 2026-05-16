"use client";

import type { PoolSpeler } from "./werkbord-types";
import { useWerkbordDraggable, type DragBron } from "./hooks/useWerkbordDraggable";
import { SpelerAvatar } from "@/components/shared/SpelerAvatar";

function leeftijdGradient(leeftijd: number): string {
  const jaar = Math.max(4, Math.min(19, Math.floor(leeftijd)));
  return `var(--leeftijd-${jaar})`;
}

interface WbSpelerRijProps {
  speler: PoolSpeler;
  bron: DragBron;
  onClick: (spelerId: string) => void;
}

export function WbSpelerRij({ speler, bron, onClick }: WbSpelerRijProps) {
  const isVrouw = speler.geslacht === "V";
  const { ref, isDragging } = useWerkbordDraggable({ rel_code: speler.spelerId, bron });

  const statusKleur = isVrouw ? "var(--status-color, var(--sexe-v))" : "var(--status-color, var(--sexe-h))";

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
          height: 54,
        } as React.CSSProperties
      }
      onClick={() => onClick(speler.spelerId)}
      title={`${speler.roepnaam} ${speler.achternaam}`}
    >
      {/* Foto-avatar met fallback naar initialen */}
      <SpelerAvatar
        relCode={speler.spelerId}
        roepnaam={speler.roepnaam}
        achternaam={speler.achternaam}
        geslacht={speler.geslacht}
        size="md"
        style={{
          width: 40,
          height: 52,
          borderRadius: "4px 0 0 4px",
          outline: "none",
          boxShadow: `inset 0 0 0 1.5px ${statusKleur}`,
        }}
      />

      {/* Info-kolom */}
      <div className="info" style={{ flex: 1, minWidth: 0, padding: "0 6px" }}>
        <div className="nm">
          {speler.roepnaam} {speler.tussenvoegsel ? `${speler.tussenvoegsel} ` : ""}
          {speler.achternaam}
        </div>
        <div className="sub">
          {speler.huidigTeamNaam && <span className="tb">{speler.huidigTeamNaam}</span>}
          {speler.ingedeeldTeamId && (
            <span
              className="tb-i"
              style={{ color: "var(--indeling-text, #ff6b00)" }}
            >
              ingedeeld
            </span>
          )}
          {speler.openMemoCount > 0 && (
            <span style={{ color: "var(--memo-open)" }}>▲{speler.openMemoCount}</span>
          )}
        </div>
      </div>

      {/* Leeftijdsbalk — gradient conform prototype */}
      <div className="leeft" style={{ background: leeftijdGradient(speler.korfbalLeeftijd) }}>
        <span className="lb">{Math.floor(speler.korfbalLeeftijd)}</span>
        <span className="ld">.{String(Math.round((speler.korfbalLeeftijd % 1) * 10))}</span>
      </div>
    </div>
  );
}
