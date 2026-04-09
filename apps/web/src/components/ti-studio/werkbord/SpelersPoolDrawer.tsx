// apps/web/src/components/ti-studio/werkbord/SpelersPoolDrawer.tsx
"use client";
import { useState } from "react";
import "./tokens.css";
import type { WerkbordSpeler, SpelerFilter } from "./types";

interface SpelersPoolDrawerProps {
  open: boolean;
  spelers: WerkbordSpeler[];
  onClose: () => void;
}

export function SpelersPoolDrawer({ open, spelers, onClose }: SpelersPoolDrawerProps) {
  const [zoek, setZoek] = useState("");
  const [filter, setFilter] = useState<SpelerFilter>("zonder_team");
  const [geslachtFilter, setGeslachtFilter] = useState<"alle" | "v" | "m">("alle");

  const gefilterd = spelers.filter((sp) => {
    const naam = `${sp.roepnaam} ${sp.achternaam}`.toLowerCase();
    if (zoek && !naam.includes(zoek.toLowerCase())) return false;
    if (geslachtFilter !== "alle" && sp.geslacht.toLowerCase() !== geslachtFilter) return false;
    if (
      filter === "zonder_team" &&
      (sp.teamId !== null || sp.status === "GAAT_STOPPEN" || sp.status === "GESTOPT")
    )
      return false;
    if (filter === "ingedeeld" && sp.teamId === null) return false;
    return true;
  });

  const dames = gefilterd.filter((sp) => sp.geslacht === "V");
  const heren = gefilterd.filter((sp) => sp.geslacht === "M");

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
          Spelerspool
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <IconBtn
            onClick={() => setGeslachtFilter(geslachtFilter === "v" ? "alle" : "v")}
            active={geslachtFilter === "v"}
            title="Alleen dames"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="12" cy="8" r="6" />
              <path d="M12 14v6M9 17h6" />
            </svg>
          </IconBtn>
          <IconBtn
            onClick={() => setGeslachtFilter(geslachtFilter === "m" ? "alle" : "m")}
            active={geslachtFilter === "m"}
            title="Alleen heren"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="10" cy="14" r="6" />
              <path d="M20 4l-6 6M14 4h6v6" />
            </svg>
          </IconBtn>
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
          placeholder="Zoek speler..."
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
        {(["zonder_team", "ingedeeld", "alle"] as const).map((f) => (
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
            {{ zonder_team: "Zonder team", ingedeeld: "Ingedeeld", alle: "Alle" }[f]}
          </button>
        ))}
      </div>

      {/* Spelerslijst */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {dames.length > 0 && (
          <>
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
              <span>Dames</span>
              <span style={{ color: "var(--text-2)", fontWeight: 700 }}>{dames.length}</span>
            </div>
            {dames.map((sp) => (
              <PoolRij key={sp.id} speler={sp} />
            ))}
          </>
        )}
        {heren.length > 0 && (
          <>
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
              <span>Heren</span>
              <span style={{ color: "var(--text-2)", fontWeight: 700 }}>{heren.length}</span>
            </div>
            {heren.map((sp) => (
              <PoolRij key={sp.id} speler={sp} />
            ))}
          </>
        )}
        {gefilterd.length === 0 && (
          <div
            style={{
              padding: "20px 12px",
              fontSize: 12,
              color: "var(--text-3)",
              textAlign: "center",
            }}
          >
            Geen spelers gevonden
          </div>
        )}
      </div>
    </aside>
  );
}

function PoolRij({ speler }: { speler: WerkbordSpeler }) {
  const geslacht = speler.geslacht.toLowerCase() as "v" | "m";
  const initialen = `${speler.roepnaam.charAt(0)}${speler.achternaam.charAt(0)}`.toUpperCase();
  const rating = speler.rating;

  const ratingKleur =
    rating && rating >= 7.5
      ? { bg: "rgba(34,197,94,.15)", color: "var(--ok)" }
      : rating && rating >= 6.5
        ? { bg: "rgba(234,179,8,.12)", color: "var(--warn)" }
        : { bg: "rgba(239,68,68,.12)", color: "var(--err)" };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "5px 10px",
        borderLeft: `2px solid ${geslacht === "v" ? "var(--pink)" : "var(--blue)"}`,
        opacity: speler.status === "GAAT_STOPPEN" ? 0.5 : 1,
        cursor: "grab",
      }}
    >
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          fontWeight: 700,
          background: geslacht === "v" ? "rgba(236,72,153,.2)" : "rgba(96,165,250,.2)",
          color: geslacht === "v" ? "var(--pink)" : "var(--blue)",
        }}
      >
        {initialen}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textDecoration: speler.status === "GAAT_STOPPEN" ? "line-through" : "none",
          }}
        >
          {speler.roepnaam} {speler.achternaam}
        </div>
        <div
          style={{
            fontSize: 10,
            color: "var(--text-3)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {new Date().getFullYear() - speler.geboortejaar}j{speler.teamId ? " · ingedeeld" : ""}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 3,
          flexShrink: 0,
        }}
      >
        {speler.isNieuw && (
          <span
            style={{
              fontSize: 9,
              color: "var(--ok)",
              background: "rgba(34,197,94,.1)",
              borderRadius: 3,
              padding: "1px 4px",
              fontWeight: 700,
            }}
          >
            N
          </span>
        )}
        {speler.gepind && <span style={{ fontSize: 10, color: "var(--accent)" }}>📌</span>}
        {speler.status === "AFGEMELD" && (
          <span style={{ fontSize: 10, color: "var(--err)" }}>⚠</span>
        )}
        {rating !== null && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 22,
              height: 16,
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 700,
              background: ratingKleur.bg,
              color: ratingKleur.color,
            }}
          >
            {rating.toFixed(1)}
          </div>
        )}
      </div>
    </div>
  );
}

function IconBtn({
  onClick,
  children,
  title,
  active = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  title: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 26,
        height: 26,
        borderRadius: 6,
        background: active ? "var(--accent-dim)" : "none",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: active ? "var(--accent)" : "var(--text-3)",
      }}
    >
      {children}
    </button>
  );
}
