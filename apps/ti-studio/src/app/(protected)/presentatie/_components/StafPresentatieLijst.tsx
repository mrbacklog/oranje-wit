"use client";
import type { PresentatieStaf } from "../presentatie-types";

interface StafPresentatieLijstProps {
  staf: PresentatieStaf[];
}

function initialen(naam: string): string {
  return naam
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

/**
 * Footer met aanwezige staf. Geen lege "Vrij"-plaatsen.
 * Als er geen staf is wordt niets getoond (behalve het label).
 */
export function StafPresentatieLijst({ staf }: StafPresentatieLijstProps) {
  if (staf.length === 0) {
    return (
      <div
        style={{
          flexShrink: 0,
          borderTop: "1px solid var(--border-0)",
          padding: "9px 20px 11px",
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--text-3)",
            opacity: 0.5,
          }}
        >
          Geen staf
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        flexShrink: 0,
        borderTop: "1px solid var(--border-0)",
        background: "rgba(34,197,94,.03)",
        padding: "9px 20px 12px",
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--ok)",
          marginBottom: 8,
        }}
      >
        Staf · {staf.length}
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 7,
        }}
      >
        {staf.map((s) => (
          <div
            key={s.stafId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: "rgba(34,197,94,.07)",
              border: "1px solid rgba(34,197,94,.22)",
              borderRadius: 9,
              padding: "5px 9px",
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "rgba(34,197,94,.15)",
                border: "1.5px solid var(--ok)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                fontWeight: 700,
                color: "var(--ok)",
                flexShrink: 0,
              }}
            >
              {initialen(s.naam)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-1)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: 140,
                }}
              >
                {s.naam}
              </div>
              {s.rol && (
                <div
                  style={{
                    fontSize: 9,
                    color: "var(--text-3)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: 140,
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
