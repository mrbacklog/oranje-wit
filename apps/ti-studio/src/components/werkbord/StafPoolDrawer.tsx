// apps/web/src/components/ti-studio/werkbord/StafPoolDrawer.tsx
"use client";
import { useState } from "react";
import "./tokens.css";
import type { WerkbordStaf } from "./types";
import { StafKaart } from "./StafKaart";

type StafFilter = "alle" | "zonder_team" | "ingedeeld";

interface StafPoolDrawerProps {
  open: boolean;
  staf: WerkbordStaf[];
  onClose: () => void;
  onStafClick?: (stafId: string) => void;
}

export function StafPoolDrawer({ open, staf, onClose, onStafClick }: StafPoolDrawerProps) {
  const [zoek, setZoek] = useState("");
  const [filter, setFilter] = useState<StafFilter>("alle");

  const gefilterd = staf
    .filter((s) => {
      if (zoek && !s.naam.toLowerCase().includes(zoek.toLowerCase())) return false;
      if (filter === "zonder_team" && s.teams.length > 0) return false;
      if (filter === "ingedeeld" && s.teams.length === 0) return false;
      return true;
    })
    .sort((a, b) => a.naam.localeCompare(b.naam, "nl"));

  return (
    <aside
      style={{
        width: open ? "var(--pool-w)" : 0,
        background: "var(--bg-1)",
        borderRight: "1px solid var(--border-0)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        transition: "width 200ms ease, opacity 200ms ease",
        overflow: "hidden",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
        position: "relative",
        zIndex: 20,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 12px 8px",
          borderBottom: "1px solid var(--border-0)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: ".7px",
            color: "var(--text-3)",
          }}
        >
          Stafleden
        </div>
        <IconBtn onClick={onClose} title="Sluiten">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </IconBtn>
      </div>

      {/* Zoekbalk */}
      <div
        style={{
          padding: "8px 10px",
          position: "relative",
          borderBottom: "1px solid var(--border-0)",
          flexShrink: 0,
        }}
      >
        <svg
          style={{
            position: "absolute",
            left: 18,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-3)",
          }}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Zoek staflid..."
          value={zoek}
          onChange={(e) => setZoek(e.target.value)}
          style={{
            width: "100%",
            background: "var(--bg-0)",
            border: "1px solid var(--border-1)",
            borderRadius: 7,
            color: "var(--text-1)",
            fontSize: 12,
            fontFamily: "inherit",
            padding: "6px 10px 6px 28px",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Filter chips */}
      <div
        style={{
          padding: "7px 10px 6px",
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          borderBottom: "1px solid var(--border-0)",
          flexShrink: 0,
        }}
      >
        {(["alle", "zonder_team", "ingedeeld"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "3px 8px",
              borderRadius: 5,
              fontSize: 10,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              background: filter === f ? "var(--accent-dim)" : "var(--bg-2)",
              color: filter === f ? "var(--accent)" : "var(--text-3)",
              border: `1px solid ${filter === f ? "rgba(255,107,0,.3)" : "var(--border-1)"}`,
            }}
          >
            {{ alle: "Alle", zonder_team: "Geen team", ingedeeld: "Ingedeeld" }[f]}
          </button>
        ))}
      </div>

      {/* Staflijst */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div
          style={{
            padding: "10px 10px 4px",
            fontSize: 9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: ".6px",
            color: "var(--text-3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>Staf</span>
          <span style={{ color: "var(--text-2)", fontWeight: 700 }}>{gefilterd.length}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "4px 8px 12px" }}>
          {gefilterd.map((s) => (
            <div
              key={s.id}
              onClick={() => onStafClick?.(s.id)}
              style={{ cursor: onStafClick ? "pointer" : "default" }}
            >
              <StafKaart staf={s} />
            </div>
          ))}
        </div>

        {gefilterd.length === 0 && (
          <div
            style={{
              padding: "20px 12px",
              fontSize: 12,
              color: "var(--text-3)",
              textAlign: "center",
            }}
          >
            Geen stafleden gevonden
          </div>
        )}
      </div>
    </aside>
  );
}

function IconBtn({
  onClick,
  children,
  title,
}: {
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 26,
        height: 26,
        borderRadius: 6,
        background: "none",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-3)",
      }}
    >
      {children}
    </button>
  );
}
