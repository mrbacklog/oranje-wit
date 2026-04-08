"use client";

import { useState, useCallback, useTransition } from "react";
import { deletePin } from "@/app/(teamindeling-studio)/ti-studio/pins/actions";
import type { PinMetNamen } from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/actions";

interface KadersPinsLaagProps {
  kadersId: string;
  initialPins: PinMetNamen[];
}

function spelersNaam(pin: PinMetNamen): string {
  if (pin.speler) return `${pin.speler.roepnaam} ${pin.speler.achternaam}`;
  if (pin.staf) return pin.staf.naam;
  return "—";
}

function pinWaarde(pin: PinMetNamen): string {
  const w = pin.waarde as Record<string, unknown> | null;
  if (!w) return "—";
  if ("teamNaam" in w && typeof w.teamNaam === "string") return w.teamNaam;
  return Object.entries(w)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(", ");
}

const TYPE_LABEL: Record<string, string> = {
  SPELER_STATUS: "Status",
  SPELER_POSITIE: "Positie",
  STAF_POSITIE: "Staf",
};

export default function KadersPinsLaag({ kadersId: _kadersId, initialPins }: KadersPinsLaagProps) {
  const [pins, setPins] = useState<PinMetNamen[]>(initialPins);
  const [, startTransition] = useTransition();

  const handleUnpin = useCallback((pinId: string) => {
    setPins((prev) => prev.filter((p) => p.id !== pinId));
    startTransition(() => {
      deletePin(pinId);
    });
  }, []);

  // Groepeer per type
  const groepenMap = new Map<string, PinMetNamen[]>();
  for (const pin of pins) {
    const bestaand = groepenMap.get(pin.type) ?? [];
    bestaand.push(pin);
    groepenMap.set(pin.type, bestaand);
  }

  return (
    <section
      style={{
        background: "var(--surface-card)",
        borderRadius: 12,
        border: "1px solid var(--border-default)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 20px",
          borderBottom: pins.length > 0 ? "1px solid var(--border-default)" : "none",
        }}
      >
        <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 14, flex: 1 }}>
          Laag 3 — Pins & Reserveringen
        </span>
        <span
          style={{
            background: "rgba(168,85,247,0.15)",
            color: "#c084fc",
            border: "1px solid rgba(168,85,247,0.3)",
            borderRadius: 6,
            padding: "2px 10px",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.05em",
          }}
        >
          DAGELIJKS
        </span>
      </div>

      {/* Info-banner */}
      <div
        style={{
          margin: "12px 20px 0",
          background: "rgba(59,130,246,0.08)",
          border: "1px solid rgba(59,130,246,0.2)",
          borderRadius: 8,
          padding: "8px 12px",
          color: "#93c5fd",
          fontSize: 12,
        }}
      >
        Pinnen beheer je in de Indeling. Hier zie je de actuele stand.
      </div>

      <div style={{ padding: "12px 20px 20px" }}>
        {pins.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "24px 0",
              color: "var(--text-secondary)",
              fontSize: 13,
            }}
          >
            Geen actieve pins.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {Array.from(groepenMap.entries()).map(([type, lijst]) => (
              <div key={type}>
                {/* Type-header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      background: "var(--surface-sunken)",
                      color: "var(--text-secondary)",
                      borderRadius: 5,
                      padding: "2px 8px",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {TYPE_LABEL[type] ?? type}
                  </span>
                  <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>
                    ({lijst.length})
                  </span>
                </div>

                {/* Pin-rijen */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  {lijst.map((pin) => (
                    <div
                      key={pin.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: "var(--surface-sunken)",
                        borderRadius: 7,
                        padding: "8px 12px",
                        border: "1px solid var(--border-default)",
                      }}
                    >
                      {/* Geslacht-badge */}
                      {pin.speler && (
                        <span
                          style={{
                            background:
                              pin.speler.geslacht === "V"
                                ? "rgba(239,68,68,0.12)"
                                : "rgba(59,130,246,0.12)",
                            color: pin.speler.geslacht === "V" ? "#f87171" : "#60a5fa",
                            borderRadius: 4,
                            padding: "1px 6px",
                            fontSize: 10,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {pin.speler.geslacht}
                        </span>
                      )}

                      {/* Naam */}
                      <span
                        style={{
                          color: "var(--text-primary)",
                          fontSize: 13,
                          fontWeight: 500,
                          flex: 1,
                        }}
                      >
                        {spelersNaam(pin)}
                      </span>

                      {/* Waarde */}
                      <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                        {pinWaarde(pin)}
                      </span>

                      {/* Datum */}
                      <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>
                        {new Date(pin.gepindOp).toLocaleDateString("nl-NL", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>

                      {/* Unpin */}
                      <button
                        type="button"
                        onClick={() => handleUnpin(pin.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text-secondary)",
                          padding: "2px 4px",
                          borderRadius: 4,
                          lineHeight: 1,
                        }}
                        title="Ontpin"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
