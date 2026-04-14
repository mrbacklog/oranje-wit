"use client";
import { useState } from "react";
import { WerkitemPanel } from "./WerkitemPanel";
import type { WerkbordWerkitem } from "./werkbord/types";

const DOELGROEP_LABEL: Record<string, string> = {
  KWEEKVIJVER: "Kweekvijver",
  ONTWIKKELHART: "Opleidingshart",
  TOP: "Topsport",
  WEDSTRIJDSPORT: "Wedstrijdsport",
  KORFBALPLEZIER: "Korfbalplezier",
};

const DOELGROEP_KLEUR: Record<string, string> = {
  KWEEKVIJVER: "#f9a8d4",
  ONTWIKKELHART: "#fbbf24",
  TOP: "#a78bfa",
  WEDSTRIJDSPORT: "#60a5fa",
  KORFBALPLEZIER: "#34d399",
};

const DOELGROEPEN = [
  "TOP",
  "WEDSTRIJDSPORT",
  "KORFBALPLEZIER",
  "ONTWIKKELHART",
  "KWEEKVIJVER",
] as const;

interface DoelgroepMemoSectieProps {
  kadersId: string;
  werkitemsPerDoelgroep: Record<string, WerkbordWerkitem[]>;
  tcAlgemeenWerkitems: WerkbordWerkitem[];
}

export function DoelgroepMemoSectie({
  kadersId,
  werkitemsPerDoelgroep,
  tcAlgemeenWerkitems,
}: DoelgroepMemoSectieProps) {
  const [openDoelgroepen, setOpenDoelgroepen] = useState<Set<string>>(
    () =>
      new Set(
        DOELGROEPEN.filter((d) =>
          (werkitemsPerDoelgroep[d] ?? []).some(
            (w) => w.status === "OPEN" || w.status === "IN_BESPREKING"
          )
        )
      )
  );

  function toggleDoelgroep(d: string) {
    setOpenDoelgroepen((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  }

  const tcOpenCount = tcAlgemeenWerkitems.filter(
    (w) => w.status === "OPEN" || w.status === "IN_BESPREKING"
  ).length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* TC — Algemeen */}
      <div
        style={{
          background: "var(--bg-1)",
          border: "1px solid var(--border-0)",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid var(--border-0)",
            background: "var(--bg-2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
              TC — Algemeen
            </span>
            {tcOpenCount > 0 && (
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 8px",
                  borderRadius: 10,
                  background: "rgba(249,115,22,.15)",
                  color: "var(--accent)",
                  fontWeight: 700,
                  border: "1px solid rgba(249,115,22,.2)",
                }}
              >
                ▲ {tcOpenCount}
              </span>
            )}
          </div>
        </div>
        <div style={{ padding: "12px 16px" }}>
          <WerkitemPanel
            entiteitType="TEAM"
            kadersId={kadersId}
            doelgroep="ALLE"
            initieleWerkitems={tcAlgemeenWerkitems}
          />
        </div>
      </div>

      {/* Per doelgroep */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-3)",
            textTransform: "uppercase",
            letterSpacing: ".6px",
            marginBottom: 10,
          }}
        >
          Per doelgroep
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {DOELGROEPEN.map((d) => {
            const items = werkitemsPerDoelgroep[d] ?? [];
            const openCount = items.filter(
              (w) => w.status === "OPEN" || w.status === "IN_BESPREKING"
            ).length;
            const isOpen = openDoelgroepen.has(d);
            const kleur = DOELGROEP_KLEUR[d] ?? "#9ca3af";
            return (
              <div
                key={d}
                style={{
                  border: `1px solid ${isOpen ? `${kleur}35` : "var(--border-0)"}`,
                  borderLeft: `4px solid ${isOpen ? kleur : `${kleur}50`}`,
                  borderRadius: 10,
                  overflow: "hidden",
                  transition: "border-color 150ms",
                }}
              >
                <button
                  onClick={() => toggleDoelgroep(d)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: isOpen ? `${kleur}0d` : "none",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 150ms",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: kleur,
                        flexShrink: 0,
                        display: "inline-block",
                      }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>
                      {DOELGROEP_LABEL[d]}
                    </span>
                    {openCount > 0 && (
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 7px",
                          borderRadius: 8,
                          background: `${kleur}20`,
                          color: kleur,
                          fontWeight: 700,
                          border: `1px solid ${kleur}35`,
                        }}
                      >
                        ▲ {openCount}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text-3)" }}>{isOpen ? "▾" : "▸"}</span>
                </button>
                {isOpen && (
                  <div
                    style={{
                      padding: "10px 14px",
                      borderTop: `1px solid ${kleur}20`,
                      background: `${kleur}05`,
                    }}
                  >
                    <WerkitemPanel
                      entiteitType="TEAM"
                      kadersId={kadersId}
                      doelgroep={d}
                      initieleWerkitems={items}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
