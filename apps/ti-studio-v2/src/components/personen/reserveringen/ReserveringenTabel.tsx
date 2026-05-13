"use client";

import type { ReserveringRijData } from "@/components/personen/types";

interface ReserveringenTabelProps {
  data: ReserveringRijData[];
}

export function ReserveringenTabel({ data }: ReserveringenTabelProps) {
  if (data.length === 0) {
    return (
      <div
        style={{
          background: "var(--bg-1)",
          borderRadius: "var(--radius-md)",
          padding: "32px 16px",
          textAlign: "center",
          color: "var(--text-3)",
          fontSize: 13,
        }}
      >
        Geen reserveringsspelers gevonden.
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--bg-1)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 80px 200px",
          gap: 14,
          padding: "10px 16px",
          borderBottom: "1px solid var(--bg-2)",
        }}
      >
        {["Titel", "Geslacht", "Indeling"].map((k, i) => (
          <span
            key={i}
            style={{
              fontSize: 9,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontWeight: 700,
            }}
          >
            {k}
          </span>
        ))}
      </div>

      {/* Rijen */}
      {data.map((r) => (
        <div
          key={r.id}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 80px 200px",
            gap: 14,
            padding: "12px 16px",
            borderBottom: "1px solid var(--border-0)",
            alignItems: "center",
            borderLeft: "3px solid rgba(255,255,255,.15)",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{r.titel}</span>
          <span
            style={{
              fontSize: 11,
              color: "var(--text-2)",
              fontWeight: 600,
            }}
          >
            {r.geslacht === "M" ? "Heer" : "Dame"}
          </span>
          <span
            style={{
              fontSize: 12,
              color: r.teamNaam ? "#4ade80" : "var(--text-muted)",
            }}
          >
            {r.teamNaam ?? "—"}
          </span>
        </div>
      ))}
    </div>
  );
}
