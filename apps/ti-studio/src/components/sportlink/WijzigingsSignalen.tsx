interface WijzigingsSignaal {
  type: string;
  relCode: string;
  naam: string;
  beschrijving: string;
  oud: string | null;
  nieuw: string | null;
  bron: string;
}

const TYPE_STIJL: Record<string, { kleur: string; bg: string; border: string; label: string }> = {
  "nieuw-lid": {
    kleur: "#10b981",
    bg: "rgba(16, 185, 129, .08)",
    border: "rgba(16, 185, 129, .35)",
    label: "Nieuw lid",
  },
  afmelding: {
    kleur: "#ef4444",
    bg: "rgba(239, 68, 68, .08)",
    border: "rgba(239, 68, 68, .40)",
    label: "Afmelding",
  },
  "status-wijziging": {
    kleur: "#f59e0b",
    bg: "rgba(245, 158, 11, .08)",
    border: "rgba(245, 158, 11, .35)",
    label: "Status",
  },
  "activiteit-wijziging": {
    kleur: "#3b82f6",
    bg: "rgba(59, 130, 246, .08)",
    border: "rgba(59, 130, 246, .35)",
    label: "Activiteit",
  },
};

function typestijl(type: string) {
  return (
    TYPE_STIJL[type] ?? {
      kleur: "#a3a3a3",
      bg: "rgba(163, 163, 163, .08)",
      border: "rgba(163, 163, 163, .3)",
      label: type,
    }
  );
}

export function WijzigingsSignalen({ signalen }: { signalen: WijzigingsSignaal[] }) {
  if (signalen.length === 0) {
    return (
      <div
        style={{
          background: "var(--bg-1, #141414)",
          border: "1px solid var(--border-1, #3a3a3a)",
          borderRadius: 12,
          padding: "40px 28px",
          textAlign: "center",
          color: "var(--text-3, #666)",
          fontSize: 14,
        }}
      >
        Geen wijzigingen gedetecteerd — alles in sync
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          fontSize: 13,
          color: "var(--text-2, #a3a3a3)",
          marginBottom: 16,
        }}
      >
        <strong style={{ color: "var(--text-1, #fafafa)" }}>{signalen.length}</strong>{" "}
        {signalen.length === 1 ? "signaal gevonden" : "signalen gevonden"}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {signalen.map((s, i) => {
          const stijl = typestijl(s.type);
          return (
            <div
              key={`${s.relCode}-${i}`}
              style={{
                background: "var(--bg-1, #141414)",
                border: "1px solid var(--border-1, #3a3a3a)",
                borderRadius: 8,
                padding: "12px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: stijl.kleur,
                    background: stijl.bg,
                    border: `1px solid ${stijl.border}`,
                    borderRadius: 4,
                    padding: "2px 8px",
                    flexShrink: 0,
                  }}
                >
                  {stijl.label}
                </span>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1, #fafafa)" }}>
                  {s.naam}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-3, #666)",
                    marginLeft: "auto",
                    flexShrink: 0,
                  }}
                >
                  {s.bron}
                </span>
              </div>

              <div style={{ fontSize: 13, color: "var(--text-2, #a3a3a3)" }}>{s.beschrijving}</div>

              {(s.oud !== null || s.nieuw !== null) && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12,
                    color: "var(--text-3, #666)",
                  }}
                >
                  {s.oud !== null && (
                    <span
                      style={{
                        background: "rgba(239, 68, 68, .08)",
                        border: "1px solid rgba(239, 68, 68, .25)",
                        borderRadius: 4,
                        padding: "2px 6px",
                        color: "#ef4444",
                      }}
                    >
                      {s.oud}
                    </span>
                  )}
                  {s.oud !== null && s.nieuw !== null && <span>→</span>}
                  {s.nieuw !== null && (
                    <span
                      style={{
                        background: "rgba(16, 185, 129, .08)",
                        border: "1px solid rgba(16, 185, 129, .25)",
                        borderRadius: 4,
                        padding: "2px 6px",
                        color: "#10b981",
                      }}
                    >
                      {s.nieuw}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
