"use client";

import { useState } from "react";

interface KadersKnkvLaagProps {
  kadersJson: Record<string, unknown> | null;
}

interface KnkvCategorie {
  sleutel: string;
  label: string;
  minV: number;
  maxV: number;
  minM: number;
  maxM: number;
  accentKleur: string;
}

const KNKV_CATEGORIEEN: KnkvCategorie[] = [
  {
    sleutel: "SENIOREN",
    label: "Senioren",
    minV: 3,
    maxV: 4,
    minM: 3,
    maxM: 4,
    accentKleur: "#6b7280",
  },
  {
    sleutel: "A_CATEGORIE",
    label: "A-categorie (U15/U17/U19)",
    minV: 3,
    maxV: 4,
    minM: 3,
    maxM: 4,
    accentKleur: "var(--ow-oranje-500)",
  },
  {
    sleutel: "B_ACHTTAL",
    label: "B-categorie 8-tal (Rood/Oranje/Geel)",
    minV: 2,
    maxV: 4,
    minM: 2,
    maxM: 4,
    accentKleur: "#f59e0b",
  },
  {
    sleutel: "B_VIERTAL",
    label: "B-categorie 4-tal (Groen/Blauw)",
    minV: 0,
    maxV: 2,
    minM: 0,
    maxM: 2,
    accentKleur: "#22c55e",
  },
];

export default function KadersKnkvLaag({ kadersJson: _kadersJson }: KadersKnkvLaagProps) {
  const [open, setOpen] = useState(false);

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
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 20px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ color: "var(--text-secondary)", fontSize: 12, userSelect: "none" }}>
          {open ? "▼" : "▶"}
        </span>
        <span
          style={{
            color: "var(--text-primary)",
            fontWeight: 600,
            fontSize: 14,
            flex: 1,
          }}
        >
          Laag 1 — KNKV Reglementen
        </span>
        <span
          style={{
            background: "rgba(59,130,246,0.15)",
            color: "#60a5fa",
            border: "1px solid rgba(59,130,246,0.3)",
            borderRadius: 6,
            padding: "2px 10px",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.05em",
          }}
        >
          VAST
        </span>
      </button>

      {/* Body */}
      {open && (
        <div style={{ padding: "0 20px 20px" }}>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: 12,
              marginBottom: 16,
              lineHeight: 1.6,
            }}
          >
            KNKV-reglementen zijn niet bewerkbaar en dienen als validatiereferentie.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 12,
            }}
          >
            {KNKV_CATEGORIEEN.map((cat) => (
              <div
                key={cat.sleutel}
                style={{
                  background: "var(--surface-sunken)",
                  borderRadius: 8,
                  padding: "12px 14px",
                  border: "1px solid var(--border-default)",
                }}
              >
                {/* Categorie naam */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: cat.accentKleur,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      color: "var(--text-primary)",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {cat.label}
                  </span>
                </div>

                {/* V-rij */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: 11,
                      width: 20,
                    }}
                  >
                    V
                  </span>
                  <span
                    style={{
                      background: "rgba(239,68,68,0.12)",
                      color: "#f87171",
                      borderRadius: 4,
                      padding: "1px 6px",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    min {cat.minV}
                  </span>
                  <span style={{ color: "var(--text-secondary)", fontSize: 10 }}>—</span>
                  <span
                    style={{
                      background: "rgba(239,68,68,0.12)",
                      color: "#f87171",
                      borderRadius: 4,
                      padding: "1px 6px",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    max {cat.maxV}
                  </span>
                </div>

                {/* M-rij */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: 11,
                      width: 20,
                    }}
                  >
                    M
                  </span>
                  <span
                    style={{
                      background: "rgba(59,130,246,0.12)",
                      color: "#60a5fa",
                      borderRadius: 4,
                      padding: "1px 6px",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    min {cat.minM}
                  </span>
                  <span style={{ color: "var(--text-secondary)", fontSize: 10 }}>—</span>
                  <span
                    style={{
                      background: "rgba(59,130,246,0.12)",
                      color: "#60a5fa",
                      borderRadius: 4,
                      padding: "1px 6px",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    max {cat.maxM}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
