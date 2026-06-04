"use client";
import type { PresentatieStaf } from "../presentatie-types";

interface StafPresentatieLijstProps {
  staf: PresentatieStaf[];
  fidelity: "center" | "side";
}

function initialen(naam: string): string {
  return naam
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

export function StafPresentatieLijst({ staf, fidelity }: StafPresentatieLijstProps) {
  if (staf.length === 0) return null;

  return (
    <div
      style={{
        marginTop: 14,
        borderTop: "1px solid var(--border-0)",
        paddingTop: 11,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--ok)",
          marginBottom: 8,
        }}
      >
        Staf — {staf.length}
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {staf.map((s) => (
          <div
            key={s.stafId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: fidelity === "center" ? 9 : 7,
              background: "rgba(34,197,94,.06)",
              border: "1px solid rgba(34,197,94,.2)",
              borderRadius: 9,
              padding: fidelity === "center" ? "7px 13px 7px 8px" : "5px 10px 5px 7px",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: fidelity === "center" ? 30 : 24,
                height: fidelity === "center" ? 30 : 24,
                borderRadius: "50%",
                background: "rgba(34,197,94,.15)",
                border: "1.5px solid var(--ok)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: fidelity === "center" ? 10 : 8,
                fontWeight: 700,
                color: "var(--ok)",
                flexShrink: 0,
              }}
            >
              {initialen(s.naam)}
            </div>
            {/* Naam + rol */}
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: fidelity === "center" ? 13 : 11,
                  fontWeight: 600,
                  color: "var(--text-1)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: fidelity === "center" ? 140 : 100,
                }}
              >
                {s.naam}
              </div>
              {s.rol && (
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-3)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.rol}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
