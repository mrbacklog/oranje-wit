"use client";

import type { TeamKaartData } from "./werkbord-types";

const VAL_KLEUREN: Record<string, string> = {
  OK: "var(--val-ok)",
  WAARSCHUWING: "var(--val-warn)",
  FOUT: "var(--val-err)",
  ONBEKEND: "var(--border-default)",
};

interface TeamDetailDrawerProps {
  team: TeamKaartData | null;
  open: boolean;
  onTerug: () => void;
}

export function TeamDetailDrawer({ team, open, onTerug }: TeamDetailDrawerProps) {
  const valKleur = VAL_KLEUREN[team?.validatieStatus ?? "ONBEKEND"] ?? "var(--border-default)";

  return (
    <div
      className={`wb-drawer rechts${open && team ? "open" : ""}`}
      style={{ "--drawer-width": "290px" } as React.CSSProperties}
    >
      {team && (
        <>
          {/* Header */}
          <div className="wb-drawer-header">
            <button
              onClick={onTerug}
              style={{
                background: "none",
                border: "1px solid var(--border-default)",
                borderRadius: 6,
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--text-tertiary)",
                fontSize: 12,
                flexShrink: 0,
              }}
              aria-label="Terug naar teams"
            >
              ←
            </button>
            <span
              style={{
                flex: 1,
                marginLeft: 8,
                fontSize: 13,
                fontWeight: 700,
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {team.alias ?? team.naam}
            </span>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: valKleur,
                flexShrink: 0,
              }}
              title={`Validatie: ${team.validatieStatus}`}
            />
          </div>

          {/* Body */}
          <div className="wb-drawer-list ow-scroll" style={{ padding: "10px 12px" }}>
            {/* Validatie-meldingen */}
            {team.validatieMeldingen && team.validatieMeldingen.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--text-tertiary)",
                    marginBottom: 6,
                  }}
                >
                  Validatie
                </div>
                {team.validatieMeldingen.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 11,
                      color: "var(--text-secondary)",
                      padding: "4px 8px",
                      borderRadius: 4,
                      background: "rgba(239,68,68,.06)",
                      border: "1px solid rgba(239,68,68,.15)",
                      marginBottom: 4,
                    }}
                  >
                    {m}
                  </div>
                ))}
              </div>
            )}

            {/* Dames */}
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--sexe-v)",
                  marginBottom: 4,
                  opacity: 0.7,
                }}
              >
                Dames ({team.spelersDames.length})
              </div>
              {team.spelersDames.map((s) => (
                <div
                  key={s.spelerId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 6px",
                    borderRadius: 4,
                    fontSize: 12,
                    color: "var(--text-primary)",
                    borderBottom: "1px solid var(--border-light)",
                  }}
                >
                  <span style={{ flex: 1 }}>
                    {s.roepnaam} {s.tussenvoegsel ? `${s.tussenvoegsel} ` : ""}
                    {s.achternaam}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--text-tertiary)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {s.korfbalLeeftijd.toFixed(1)} jr
                  </span>
                </div>
              ))}
            </div>

            {/* Heren */}
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--sexe-h)",
                  marginBottom: 4,
                  opacity: 0.7,
                }}
              >
                Heren ({team.spelersHeren.length})
              </div>
              {team.spelersHeren.map((s) => (
                <div
                  key={s.spelerId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 6px",
                    borderRadius: 4,
                    fontSize: 12,
                    color: "var(--text-primary)",
                    borderBottom: "1px solid var(--border-light)",
                  }}
                >
                  <span style={{ flex: 1 }}>
                    {s.roepnaam} {s.tussenvoegsel ? `${s.tussenvoegsel} ` : ""}
                    {s.achternaam}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--text-tertiary)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {s.korfbalLeeftijd.toFixed(1)} jr
                  </span>
                </div>
              ))}
            </div>

            {/* Staf */}
            {team.staf.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--staf-accent)",
                    marginBottom: 4,
                    opacity: 0.7,
                  }}
                >
                  Staf ({team.staf.length})
                </div>
                {team.staf.map((s) => (
                  <div
                    key={s.stafId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 6px",
                      borderRadius: 4,
                      fontSize: 12,
                      color: "var(--text-primary)",
                      borderBottom: "1px solid var(--border-light)",
                    }}
                  >
                    <span style={{ flex: 1 }}>{s.naam}</span>
                    <span
                      style={{
                        fontSize: 9,
                        color: "var(--staf-rol-text)",
                        background: "var(--staf-accent-dim)",
                        border: "1px solid var(--staf-accent-border)",
                        borderRadius: 3,
                        padding: "1px 5px",
                        fontWeight: 600,
                      }}
                    >
                      {s.rollen[0] ?? "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Statistieken */}
            <div
              style={{
                display: "flex",
                gap: 12,
                padding: "8px 0",
                borderTop: "1px solid var(--border-light)",
                fontSize: 11,
                color: "var(--text-tertiary)",
              }}
            >
              <span>
                Totaal:{" "}
                <strong style={{ color: "var(--text-primary)" }}>
                  {team.spelersDames.length + team.spelersHeren.length}
                </strong>
              </span>
              <span>
                ♀{" "}
                <strong style={{ color: "rgba(236,72,153,.8)" }}>{team.spelersDames.length}</strong>
              </span>
              <span>
                ♂{" "}
                <strong style={{ color: "rgba(96,165,250,.8)" }}>{team.spelersHeren.length}</strong>
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
