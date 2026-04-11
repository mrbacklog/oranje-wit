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
        gap: 20,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* TC — Algemeen */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>
              TC — Algemeen
            </span>
            {tcOpenCount > 0 && (
              <span
                style={{
                  fontSize: 10,
                  padding: "1px 7px",
                  borderRadius: 10,
                  background: "rgba(249,115,22,.15)",
                  color: "var(--accent)",
                  fontWeight: 700,
                }}
              >
                {tcOpenCount} open
              </span>
            )}
          </div>
        </div>
        <WerkitemPanel
          entiteitType="TEAM"
          kadersId={kadersId}
          doelgroep="ALLE"
          initieleWerkitems={tcAlgemeenWerkitems}
        />
      </div>

      {/* Scheidingslijn */}
      <div style={{ height: 1, background: "var(--border-0)" }} />

      {/* Per doelgroep */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-3)",
            textTransform: "uppercase",
            letterSpacing: ".6px",
            marginBottom: 12,
          }}
        >
          Memo&apos;s per doelgroep
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
                  border: `1px solid ${isOpen ? `${kleur}40` : "var(--border-0)"}`,
                  borderRadius: 8,
                  overflow: "hidden",
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
                    background: isOpen ? `${kleur}10` : "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "Inter, system-ui, sans-serif",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: kleur }}>
                      {DOELGROEP_LABEL[d]}
                    </span>
                    {openCount > 0 && (
                      <span
                        style={{
                          fontSize: 10,
                          padding: "1px 6px",
                          borderRadius: 8,
                          background: "rgba(249,115,22,.15)",
                          color: "var(--accent)",
                          fontWeight: 700,
                        }}
                      >
                        ▲ {openCount}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: "var(--text-3)" }}>{isOpen ? "▾" : "▸"}</span>
                </button>
                {isOpen && (
                  <div style={{ padding: "10px 14px", borderTop: `1px solid ${kleur}20` }}>
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
