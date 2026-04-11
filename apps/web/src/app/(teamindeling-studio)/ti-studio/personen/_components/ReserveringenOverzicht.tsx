"use client";

import { useState } from "react";
import type { StudioReservering } from "../reserveringen-actions";
import { NieuweReserveringDialog } from "./NieuweReserveringDialog";

const KLEUR_DOT: Record<string, string> = {
  BLAUW: "#3b82f6",
  GROEN: "#22c55e",
  GEEL: "#eab308",
  ORANJE: "#f97316",
  ROOD: "#ef4444",
  SENIOR: "#94a3b8",
  blauw: "#3b82f6",
  groen: "#22c55e",
  geel: "#eab308",
  oranje: "#f97316",
  rood: "#ef4444",
  senior: "#94a3b8",
};

interface Props {
  reserveringen: StudioReservering[];
}

export function ReserveringenOverzicht({ reserveringen }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortKey, setSortKey] = useState<"titel" | "indeling">("titel");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function handleSort(key: "titel" | "indeling") {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const gesorteerd = [...reserveringen].sort((a, b) => {
    const cmp =
      sortKey === "titel"
        ? a.titel.localeCompare(b.titel, "nl")
        : (a.team?.naam ?? "zzz").localeCompare(b.team?.naam ?? "zzz", "nl");
    return sortDir === "asc" ? cmp : -cmp;
  });

  function SortIcon({ col }: { col: "titel" | "indeling" }) {
    if (sortKey !== col) return <span style={{ opacity: 0.3, fontSize: "0.65rem" }}> ↕</span>;
    return (
      <span style={{ fontSize: "0.65rem", color: "var(--ow-oranje-500)" }}>
        {" "}
        {sortDir === "asc" ? "↑" : "↓"}
      </span>
    );
  }

  const thStyle: React.CSSProperties = {
    padding: "0.625rem 0.875rem",
    textAlign: "left",
    fontSize: "0.6875rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "var(--text-secondary)",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            color: "var(--text-secondary)",
          }}
        >
          Reserveringen ({reserveringen.length})
        </span>
        <button
          onClick={() => setDialogOpen(true)}
          style={{
            padding: "0.375rem 0.75rem",
            borderRadius: 7,
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            fontSize: "0.8125rem",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          + Nieuwe reservering
        </button>
      </div>
      <div
        style={{
          background: "var(--surface-card)",
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid var(--border-default)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
              <th onClick={() => handleSort("titel")} style={thStyle}>
                Titel
                <SortIcon col="titel" />
              </th>
              <th style={{ ...thStyle, cursor: "default" }}>Geslacht</th>
              <th onClick={() => handleSort("indeling")} style={thStyle}>
                Indeling
                <SortIcon col="indeling" />
              </th>
            </tr>
          </thead>
          <tbody>
            {gesorteerd.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  style={{
                    padding: "1.5rem",
                    textAlign: "center",
                    color: "var(--text-secondary)",
                    fontSize: "0.875rem",
                  }}
                >
                  Geen reserveringen aangemaakt
                </td>
              </tr>
            )}
            {gesorteerd.map((r, i) => (
              <tr
                key={r.id}
                style={{
                  borderBottom:
                    i < gesorteerd.length - 1 ? "1px solid var(--border-default)" : "none",
                }}
              >
                <td
                  style={{
                    padding: "0.625rem 0.875rem",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {r.titel}
                </td>
                <td style={{ padding: "0.625rem 0.875rem" }}>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.1rem 0.4rem",
                      borderRadius: 99,
                      background:
                        r.geslacht === "V" ? "rgba(236,72,153,0.15)" : "rgba(59,130,246,0.15)",
                      color: r.geslacht === "V" ? "#f9a8d4" : "#93c5fd",
                      fontWeight: 700,
                    }}
                  >
                    {r.geslacht === "V" ? "♀" : "♂"}
                  </span>
                </td>
                <td style={{ padding: "0.625rem 0.875rem" }}>
                  {r.team ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        background: "rgba(34,197,94,0.1)",
                        border: "1px solid rgba(34,197,94,0.25)",
                        borderRadius: 6,
                        padding: "0.2rem 0.5rem",
                        fontSize: "0.75rem",
                        color: "#4ade80",
                        fontWeight: 500,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: KLEUR_DOT[r.team.kleur ?? ""] ?? "#6b7280",
                        }}
                      />
                      {r.team.naam}
                    </span>
                  ) : (
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.8125rem" }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <NieuweReserveringDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
