"use client";

import { useState } from "react";
import type { StafLid } from "./werkbord-types";
import { WbStafRij } from "./WbStafRij";

type StafFilter = "alle" | "zonder";

interface StafPoolDrawerProps {
  staf: StafLid[];
  open: boolean;
  onStafClick: (stafId: string) => void;
}

export function StafPoolDrawer({ staf, open, onStafClick }: StafPoolDrawerProps) {
  const [zoek, setZoek] = useState("");
  const [filter, setFilter] = useState<StafFilter>("alle");

  const gefilterd = staf.filter((s) => {
    const zoekMatch = !zoek || s.naam.toLowerCase().includes(zoek.toLowerCase());
    const filterMatch = filter === "alle" ? true : s.ingedeeldTeamIds.length === 0;
    return zoekMatch && filterMatch;
  });

  return (
    <div
      className={`wb-drawer links${open ? "open" : ""}`}
      style={{ "--drawer-width": "260px" } as React.CSSProperties}
    >
      <div className="wb-drawer-header">
        <span className="wb-drawer-title">
          Staf <span className="count">{staf.length}</span>
        </span>
      </div>

      <div className="wb-drawer-search">
        <input
          type="text"
          placeholder="Zoek staf..."
          value={zoek}
          onChange={(e) => setZoek(e.target.value)}
        />
      </div>

      <div className="wb-drawer-filters">
        {(["alle", "zonder"] as StafFilter[]).map((f) => (
          <button
            key={f}
            className={`wb-filter-chip${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "alle" ? "Alle" : "Zonder team"}
          </button>
        ))}
      </div>

      <div className="wb-drawer-list ow-scroll">
        {gefilterd.length === 0 ? (
          <span style={{ fontSize: 11, color: "var(--text-muted)", padding: "8px 4px" }}>
            Geen staf
          </span>
        ) : (
          gefilterd.map((s) => <WbStafRij key={s.stafId} staflid={s} onClick={onStafClick} />)
        )}
      </div>
    </div>
  );
}
