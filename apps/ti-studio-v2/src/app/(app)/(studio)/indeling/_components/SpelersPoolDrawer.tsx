"use client";

import { useState } from "react";
import type { PoolSpeler } from "./werkbord-types";
import { RijkeRij } from "@/components/speler/contexts/RijkeRij";
import { useWerkbordDropTarget } from "./hooks/useWerkbordDropTarget";
import { useWerkbordDraggable } from "./hooks/useWerkbordDraggable";
import type { WerkbordDragData } from "./hooks/useWerkbordDraggable";
import type { SpelerStatus, WerkitemStatus } from "@oranje-wit/database";

type PoolFilter = "zonder" | "ingedeeld" | "alle";

function cx(...args: (string | false | null | undefined)[]): string {
  return args.filter(Boolean).join(" ");
}

// Niet beschikbaar voor team-indeling: afgemeld of bewust niet-spelend.
// NIEUW_POTENTIEEL / NIEUW_DEFINITIEF tonen we wél — die zijn juist kandidaat.
// Geport uit v1 (commit a3ba7609).
const NIET_INDEELBAAR = new Set<string>(["GAAT_STOPPEN", "GESTOPT", "NIET_SPELEND", "RECREANT"]);

// ── PoolRijWrapper — combineert drag-logica met RijkeRij ────────────────────

interface PoolRijWrapperProps {
  speler: PoolSpeler;
  onClick: (spelerId: string) => void;
}

function PoolRijWrapper({ speler, onClick }: PoolRijWrapperProps) {
  const { ref, isDragging } = useWerkbordDraggable({
    rel_code: speler.spelerId,
    bron: "spelerpool",
  });

  const isNietIndeelbaar = NIET_INDEELBAAR.has(speler.status);

  return (
    <div
      ref={ref}
      data-testid={`speler-card-${speler.spelerId}-spelerpool`}
      style={{
        cursor: isDragging ? "grabbing" : isNietIndeelbaar ? "pointer" : "grab",
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <RijkeRij
        speler={{
          relCode: speler.spelerId,
          roepnaam: speler.roepnaam,
          tussenvoegsel: speler.tussenvoegsel,
          achternaam: speler.achternaam,
          geslacht: speler.geslacht,
          leeftijd: speler.korfbalLeeftijd,
          status: speler.status as SpelerStatus,
          isNieuw: speler.isNieuw,
          hasFoto: speler.hasFoto,
          memoStatus: (speler.memoStatus as WerkitemStatus | null | undefined) ?? null,
          huidigTeam: speler.huidigTeamNaam,
          indelingTeam: speler.ingedeeldTeamNaam,
        }}
        variant="pool"
        draggable={false}
        onClick={() => onClick(speler.spelerId)}
      />
    </div>
  );
}

// ── SpelersPoolDrawer ───────────────────────────────────────────────────────

interface SpelersPoolDrawerProps {
  spelers: PoolSpeler[];
  open: boolean;
  peildatum: Date;
  onSpelerClick: (spelerId: string) => void;
  onDropNaarPool?: (data: WerkbordDragData) => void;
}

export function SpelersPoolDrawer({
  spelers,
  open,
  onSpelerClick,
  onDropNaarPool,
}: SpelersPoolDrawerProps) {
  const [zoek, setZoek] = useState("");
  const [filter, setFilter] = useState<PoolFilter>("zonder");

  const { ref: dropRef, isOver } = useWerkbordDropTarget({
    doelBron: "spelerpool",
    onDrop: (data) => onDropNaarPool?.(data),
    // Drawer alleen actief als open
    disabled: !open,
  });

  const gefilterd = spelers.filter((s) => {
    const zoekMatch =
      !zoek ||
      s.roepnaam.toLowerCase().includes(zoek.toLowerCase()) ||
      s.achternaam.toLowerCase().includes(zoek.toLowerCase());

    const filterMatch =
      filter === "alle"
        ? true
        : filter === "zonder"
          ? s.ingedeeldTeamId === null && !NIET_INDEELBAAR.has(s.status)
          : s.ingedeeldTeamId !== null;

    return zoekMatch && filterMatch;
  });

  return (
    <div
      ref={dropRef}
      className={cx("wb-drawer", "links", open && "open")}
      data-testid="drop-zone-spelerpool"
      style={
        {
          "--drawer-width": "357px",
          outline: isOver ? "2px solid var(--val-ok)" : "none",
          outlineOffset: -2,
        } as React.CSSProperties
      }
    >
      <div className="wb-drawer-header">
        <span className="wb-drawer-title">
          Spelerspool <span className="count">{spelers.length}</span>
        </span>
      </div>

      <div className="wb-drawer-search">
        <input
          type="text"
          placeholder="Zoek speler..."
          value={zoek}
          onChange={(e) => setZoek(e.target.value)}
        />
      </div>

      <div className="wb-drawer-filters">
        {(["zonder", "ingedeeld", "alle"] as PoolFilter[]).map((f) => (
          <button
            key={f}
            className={cx("wb-filter-chip", filter === f && "active")}
            onClick={() => setFilter(f)}
          >
            {f === "zonder" ? "Zonder team" : f === "ingedeeld" ? "Ingedeeld" : "Alle"}
          </button>
        ))}
      </div>

      <div className="wb-drawer-list ow-scroll">
        {gefilterd.length === 0 ? (
          <span style={{ fontSize: 11, color: "var(--text-muted)", padding: "8px 4px" }}>
            Geen spelers
          </span>
        ) : (
          gefilterd.map((s) => (
            <PoolRijWrapper key={s.spelerId} speler={s} onClick={onSpelerClick} />
          ))
        )}
      </div>
    </div>
  );
}
