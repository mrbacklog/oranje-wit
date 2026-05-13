// apps/ti-studio-v2/src/components/kader/DoelgroepSectie.tsx

interface DoelgroepItem {
  dbEnum: string;
  label: string;
  kleur: string;
  teams: string[];
  memoCount: number;
}

interface DoelgroepSectieProps {
  doelgroepen: DoelgroepItem[];
}

export function DoelgroepSectie({ doelgroepen }: DoelgroepSectieProps) {
  const kaartStyle = (isFullWidth: boolean): React.CSSProperties => ({
    background: "var(--surface-card)",
    border: "1px solid var(--border-light)",
    borderRadius: 10,
    padding: 12,
    gridColumn: isFullWidth ? "1 / -1" : undefined,
  });

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10,
        marginBottom: 20,
      }}
    >
      {doelgroepen.map((dg) => {
        const isKorfbalplezier = dg.dbEnum === "KORFBALPLEZIER";
        return (
          <div key={dg.dbEnum} style={kaartStyle(isKorfbalplezier)}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: dg.kleur,
                }}
              >
                {dg.label}
              </span>
              {dg.memoCount > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--ow-accent)",
                    fontWeight: 600,
                  }}
                >
                  {dg.memoCount} open
                </span>
              )}
            </div>
            {dg.teams.length > 0 ? (
              <div>
                {dg.teams.map((team) => (
                  <div
                    key={team}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "5px 8px",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: dg.kleur,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {team}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  fontStyle: "italic",
                }}
              >
                Geen teamtypes
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
