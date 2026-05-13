"use client";

import { useState } from "react";
import type { PoolSpeler } from "./werkbord-types";
import { WbSpelerRij } from "./WbSpelerRij";

type PoolFilter = "zonder" | "ingedeeld" | "alle";

interface SpelersPoolDrawerProps {
  spelers: PoolSpeler[];
  open: boolean;
  peildatum: Date;
  onSpelerClick: (spelerId: string) => void;
}

export function SpelersPoolDrawer({ spelers, open, onSpelerClick }: SpelersPoolDrawerProps) {
  const [zoek, setZoek] = useState("");
  const [filter, setFilter] = useState<PoolFilter>("zonder");

  const gefilterd = spelers.filter((s) => {
    const zoekMatch =
      !zoek ||
      s.roepnaam.toLowerCase().includes(zoek.toLowerCase()) ||
      s.achternaam.toLowerCase().includes(zoek.toLowerCase());

    const filterMatch =
      filter === "alle"
        ? true
        : filter === "zonder"
          ? s.ingedeeldTeamId === null
          : s.ingedeeldTeamId !== null;

    return zoekMatch && filterMatch;
  });

  return (
    <div
      className={`wb-drawer links${open ? "open" : ""}`}
      style={{ "--drawer-width": "260px" } as React.CSSProperties}
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
            className={`wb-filter-chip${filter === f ? "active" : ""}`}
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
          gefilterd.map((s) => <WbSpelerRij key={s.spelerId} speler={s} onClick={onSpelerClick} />)
        )}
      </div>
    </div>
  );
}
