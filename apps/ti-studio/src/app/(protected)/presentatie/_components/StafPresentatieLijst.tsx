"use client";
import type { PresentatieStaf } from "../presentatie-types";

interface StafPresentatieLijstProps {
  staf: PresentatieStaf[];
  fidelity: "center" | "side";
}

/** Aantal vaste staf-plaatsen dat de footer altijd reserveert. */
const STAF_SLOTS = 8;

function initialen(naam: string): string {
  return naam
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

/**
 * Footer met 8 gereserveerde staf-plaatsen. Gevulde plaatsen tonen de staf
 * (avatar + naam + rol, groen accent); lege plaatsen blijven als placeholder
 * gereserveerd zodat de kaart-hoogte consistent is.
 */
export function StafPresentatieLijst({ staf, fidelity }: StafPresentatieLijstProps) {
  const isCenter = fidelity === "center";
  const kolommen = isCenter ? 4 : 2;
  const avatar = isCenter ? 28 : 22;

  // Vul aan tot STAF_SLOTS met null-placeholders.
  const slots: (PresentatieStaf | null)[] = Array.from(
    { length: STAF_SLOTS },
    (_, i) => staf[i] ?? null
  );

  return (
    <div
      style={{
        flexShrink: 0,
        borderTop: "1px solid var(--border-0)",
        background: "rgba(34,197,94,.03)",
        padding: isCenter ? "11px 20px 14px" : "9px 14px 12px",
      }}
    >
      <div
        style={{
          fontSize: isCenter ? 10 : 9,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--ok)",
          marginBottom: 9,
        }}
      >
        Staf — {staf.length}/{STAF_SLOTS}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${kolommen}, 1fr)`,
          gap: isCenter ? 8 : 6,
        }}
      >
        {slots.map((s, i) => {
          if (!s) {
            // Lege gereserveerde plaats
            return (
              <div
                key={`leeg-${i}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  borderRadius: 9,
                  border: "1px dashed var(--border-1)",
                  padding: isCenter ? "6px 9px" : "5px 7px",
                  opacity: 0.45,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    width: avatar,
                    height: avatar,
                    borderRadius: "50%",
                    border: "1.5px dashed var(--border-1)",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: isCenter ? 11 : 10,
                    color: "var(--text-3)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Vrij
                </span>
              </div>
            );
          }
          return (
            <div
              key={s.stafId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(34,197,94,.07)",
                border: "1px solid rgba(34,197,94,.22)",
                borderRadius: 9,
                padding: isCenter ? "6px 9px" : "5px 7px",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  width: avatar,
                  height: avatar,
                  borderRadius: "50%",
                  background: "rgba(34,197,94,.15)",
                  border: "1.5px solid var(--ok)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isCenter ? 10 : 8,
                  fontWeight: 700,
                  color: "var(--ok)",
                  flexShrink: 0,
                }}
              >
                {initialen(s.naam)}
              </div>
              <div style={{ minWidth: 0, overflow: "hidden" }}>
                <div
                  style={{
                    fontSize: isCenter ? 12 : 11,
                    fontWeight: 600,
                    color: "var(--text-1)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {s.naam}
                </div>
                {s.rol && (
                  <div
                    style={{
                      fontSize: isCenter ? 10 : 9,
                      color: "var(--text-3)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {s.rol}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
