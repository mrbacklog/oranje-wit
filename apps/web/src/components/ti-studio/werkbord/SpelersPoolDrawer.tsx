// apps/web/src/components/ti-studio/werkbord/SpelersPoolDrawer.tsx
"use client";
import { useState } from "react";
import "./tokens.css";
import type { WerkbordSpeler, SpelerFilter } from "./types";
import { SpelerKaart } from "./SpelerKaart";

const HUIDIG_SEIZOEN_EINDJAAR = 2026;

interface SpelersPoolDrawerProps {
  open: boolean;
  spelers: WerkbordSpeler[];
  onClose: () => void;
}

export function SpelersPoolDrawer({ open, spelers, onClose }: SpelersPoolDrawerProps) {
  const [zoek, setZoek] = useState("");
  const [filter, setFilter] = useState<SpelerFilter>("zonder_team");
  const [geslachtFilter, setGeslachtFilter] = useState<"alle" | "v" | "m">("alle");

  const arSpelers = spelers
    .filter((sp) => sp.status === "ALGEMEEN_RESERVE")
    .filter((sp) => {
      if (!zoek) return true;
      return `${sp.roepnaam} ${sp.achternaam}`.toLowerCase().includes(zoek.toLowerCase());
    });

  const gefilterd = spelers.filter((sp) => {
    if (sp.status === "ALGEMEEN_RESERVE") return false;
    if (sp.selectieGroepId !== null) return false;
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
              <SpelerKaart
                key={sp.id}
                speler={sp}
                vanTeamId={sp.teamId}
                seizoenEindjaar={HUIDIG_SEIZOEN_EINDJAAR}
              />
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
              <SpelerKaart
                key={sp.id}
                speler={sp}
                vanTeamId={sp.teamId}
                seizoenEindjaar={HUIDIG_SEIZOEN_EINDJAAR}
              />
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
        {arSpelers.length > 0 && (
          <>
            <div
              style={{
                margin: "8px 10px 0",
                borderTop: "1px solid var(--border-0)",
              }}
            />
            <div
              style={{
                padding: "8px 10px 4px",
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
              <span>Algemeen Reserve</span>
              <span style={{ color: "var(--text-2)", fontWeight: 700 }}>{arSpelers.length}</span>
            </div>
            {arSpelers.map((sp) => (
              <SpelerKaart
                key={sp.id}
                speler={sp}
                vanTeamId={null}
                seizoenEindjaar={HUIDIG_SEIZOEN_EINDJAAR}
              />
            ))}
          </>
        )}
      </div>
    </aside>
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
