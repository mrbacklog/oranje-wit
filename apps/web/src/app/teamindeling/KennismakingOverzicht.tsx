"use client";

import type {
  KennismakingConfig,
  KennismakingDagSlots,
} from "@/lib/teamindeling/kennismakingstraining";

// ── Kleuren (zelfde palet als PubliekeTeamindeling) ───────────────────────────

const C = {
  oranje: "#ff6600",
  tekst: "#111827",
  subTekst: "#6b7280",
  border: "#e5e7eb",
  achtergrond: "#f9fafb",
  wit: "#ffffff",
  blauw: "#1d4ed8",
  blauwLicht: "rgba(29,78,216,0.08)",
} as const;

// ── Overzicht van alle beschikbare dagen/velden ───────────────────────────────

export function KennismakingOverzicht({ config }: { config: KennismakingConfig }) {
  if (config.beschikbaarheid.length === 0) return null;

  return (
    <div
      style={{
        background: C.wit,
        borderRadius: 16,
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        padding: "28px 32px",
        marginTop: 24,
      }}
    >
      <h2
        style={{
          margin: "0 0 4px",
          fontSize: 18,
          fontWeight: 700,
          color: C.tekst,
        }}
      >
        Kennismakingstrainingen
      </h2>
      <p style={{ margin: "0 0 20px", fontSize: 14, color: C.subTekst }}>
        Beschikbaarheid van velden — 17:30 tot 22:30
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {config.beschikbaarheid.map((dag) => (
          <div
            key={dag.datum}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 16,
              padding: "12px 16px",
              background: C.achtergrond,
              borderRadius: 10,
              border: `1px solid ${C.border}`,
            }}
          >
            <div style={{ minWidth: 140 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.tekst }}>{dag.label}</div>
              <div style={{ fontSize: 12, color: C.subTekst }}>
                {dag.begin} – {dag.eind}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {dag.velden.map((veld) => (
                <span
                  key={veld}
                  style={{
                    background: "rgba(255,102,0,0.08)",
                    border: `1px solid rgba(255,102,0,0.25)`,
                    borderRadius: 99,
                    padding: "3px 12px",
                    fontSize: 13,
                    fontWeight: 500,
                    color: C.oranje,
                  }}
                >
                  {veld}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p style={{ margin: "16px 0 0", fontSize: 12, color: C.subTekst }}>
        De tijdblokken per team staan vermeld op de teamkaart. Neem contact op met de TC voor
        inschrijving.
      </p>
    </div>
  );
}

// ── Per-team weergave op de teamkaart ─────────────────────────────────────────

export function KennismakingTeamSectie({
  dagSlots,
  duurMinuten,
}: {
  dagSlots: KennismakingDagSlots[];
  duurMinuten: number;
}) {
  if (dagSlots.length === 0) return null;

  const isVast = dagSlots.some((d) => d.vast);

  return (
    <div
      style={{
        marginTop: 20,
        paddingTop: 16,
        borderTop: `1px solid ${C.border}`,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: C.subTekst,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span>📅</span> Kennismakingstraining
        {isVast ? (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#7c3aed",
              background: "rgba(124,58,237,0.08)",
              border: "1px solid rgba(124,58,237,0.25)",
              borderRadius: 99,
              padding: "1px 8px",
              textTransform: "none",
              letterSpacing: 0,
            }}
          >
            Vast gereserveerd
          </span>
        ) : (
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: C.blauw,
              background: C.blauwLicht,
              borderRadius: 99,
              padding: "1px 8px",
              textTransform: "none",
              letterSpacing: 0,
            }}
          >
            {duurMinuten} min
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {dagSlots.map(({ dag, slots, vast }) => (
          <div key={dag.datum} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div
              style={{
                minWidth: 120,
                fontSize: 13,
                fontWeight: 500,
                color: C.tekst,
                paddingTop: 2,
              }}
            >
              {dag.label}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {dag.velden.map((veld) => (
                <div
                  key={veld}
                  style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}
                >
                  <span style={{ fontSize: 11, color: C.subTekst, minWidth: 54 }}>{veld}</span>
                  {slots.map((slot) => (
                    <span
                      key={slot.begin}
                      style={
                        vast
                          ? {
                              background: "rgba(124,58,237,0.08)",
                              border: "1px solid rgba(124,58,237,0.25)",
                              borderRadius: 6,
                              padding: "2px 8px",
                              fontSize: 12,
                              color: "#7c3aed",
                              fontWeight: 600,
                              fontVariantNumeric: "tabular-nums",
                            }
                          : {
                              background: C.blauwLicht,
                              border: `1px solid rgba(29,78,216,0.2)`,
                              borderRadius: 6,
                              padding: "2px 8px",
                              fontSize: 12,
                              color: C.blauw,
                              fontWeight: 500,
                              fontVariantNumeric: "tabular-nums",
                            }
                      }
                    >
                      {slot.begin}–{slot.eind}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
