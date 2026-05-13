// apps/ti-studio-v2/src/components/kader/KaderPagina.tsx
"use client";

import { useState } from "react";
import type { KaderPaginaData } from "./types";
import { KaderKaart } from "./KaderKaart";
import { DoelgroepSectie } from "./DoelgroepSectie";
import { MemoRij } from "./MemoRij";
import {
  TEAMTYPES,
  DOELGROEP_LABEL,
  DOELGROEP_KLEUR,
  DOELGROEP_VOLGORDE,
  CATEGORIE_DESC,
} from "@/lib/kader-mapping";

export type KaderTab = "kaders" | "memos";

interface KaderPaginaProps {
  data: KaderPaginaData;
}

export function KaderPagina({ data }: KaderPaginaProps) {
  const [activeTab, setActiveTab] = useState<KaderTab>("kaders");
  const [openKaartIds, setOpenKaartIds] = useState<Set<string>>(new Set());

  function toggleKaart(id: string) {
    setOpenKaartIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // Groepeer teamtypes op categorie (volgorde uit TEAMTYPES array)
  const categorieGroepen = TEAMTYPES.reduce<Map<string, typeof TEAMTYPES>>((acc, tt) => {
    const groep = acc.get(tt.categorie) ?? [];
    groep.push(tt);
    acc.set(tt.categorie, groep);
    return acc;
  }, new Map());

  // Open memos tellen voor tab-badge
  const openMemoCount = data.memos.filter((m) => m.status === "OPEN").length;

  // Doelgroep-secties bouwen
  const doelgroepItems = DOELGROEP_VOLGORDE.map((dbEnum) => {
    const teams = TEAMTYPES.filter((tt) => tt.doelgroep === dbEnum).map((tt) => tt.label);
    const memoCount = data.memos.filter(
      (m) => m.doelgroep === dbEnum && m.status === "OPEN"
    ).length;
    return {
      dbEnum,
      label: DOELGROEP_LABEL[dbEnum],
      kleur: DOELGROEP_KLEUR[dbEnum],
      teams,
      memoCount,
    };
  });

  // Memos groeperen op doelgroep voor de memo-tab
  const memoGroepen = DOELGROEP_VOLGORDE.map((dbEnum) => ({
    dbEnum,
    label: DOELGROEP_LABEL[dbEnum],
    kleur: DOELGROEP_KLEUR[dbEnum],
    memos: data.memos.filter((m) => m.doelgroep === dbEnum),
  })).filter((g) => g.memos.length > 0);

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
            Kader
          </h1>
          <p
            style={{
              fontSize: 12,
              color: "var(--text-tertiary)",
              margin: "2px 0 0",
            }}
          >
            Teamkaders en doelgroep-aandachtspunten
          </p>
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "3px 10px",
            background: "rgba(255,255,255,.04)",
            border: "1px solid rgba(255,255,255,.08)",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-secondary)",
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#22c55e",
              flexShrink: 0,
            }}
          />
          {data.seizoen.replace("-", "–")}
        </span>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 2,
          borderBottom: "1px solid var(--border-light)",
          marginBottom: 20,
        }}
      >
        <button
          onClick={() => setActiveTab("kaders")}
          style={{
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 600,
            color: activeTab === "kaders" ? "var(--ow-accent)" : "var(--text-tertiary)",
            cursor: "pointer",
            border: "none",
            background: "none",
            borderBottom:
              activeTab === "kaders" ? "2px solid var(--ow-accent)" : "2px solid transparent",
            marginBottom: -1,
            fontFamily: "inherit",
            transition: "color 120ms",
          }}
        >
          Teamkaders
        </button>
        <button
          onClick={() => setActiveTab("memos")}
          style={{
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 600,
            color: activeTab === "memos" ? "var(--ow-accent)" : "var(--text-tertiary)",
            cursor: "pointer",
            border: "none",
            background: "none",
            borderBottom:
              activeTab === "memos" ? "2px solid var(--ow-accent)" : "2px solid transparent",
            marginBottom: -1,
            fontFamily: "inherit",
            transition: "color 120ms",
          }}
        >
          Memo&apos;s
          {openMemoCount > 0 && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "1px 6px",
                borderRadius: 8,
                background: "rgba(255,107,0,.1)",
                color: "var(--ow-accent)",
                marginLeft: 6,
              }}
            >
              {openMemoCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab: Teamkaders */}
      {activeTab === "kaders" && (
        <div>
          {/* Doelgroep-overzicht secties */}
          <DoelgroepSectie doelgroepen={doelgroepItems} />

          {/* Kaart-groepen per categorie */}
          {Array.from(categorieGroepen.entries()).map(([categorie, teamtypes]) => (
            <div key={categorie} style={{ marginBottom: 24 }}>
              {/* Groep header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                  paddingBottom: 6,
                  borderBottom: "1px solid var(--border-light)",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--text-muted)",
                  }}
                >
                  {categorie}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-tertiary)",
                    marginLeft: "auto",
                  }}
                >
                  {CATEGORIE_DESC[categorie]}
                </span>
              </div>

              {/* Kaart grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 10,
                  alignItems: "start",
                }}
              >
                {teamtypes.map((tt) => {
                  const kader = data.teamtypeKaders[tt.id];
                  if (!kader) return null;
                  return (
                    <KaderKaart
                      key={tt.id}
                      teamtypeId={tt.id}
                      label={tt.label}
                      kleurCss={tt.kleurCss}
                      doelgroepLabel={DOELGROEP_LABEL[tt.doelgroep]}
                      leeftijdRange={tt.leeftijdRange}
                      kader={kader}
                      isOpen={openKaartIds.has(tt.id)}
                      isGewijzigd={false}
                      isBCategorie={tt.isBCategorie}
                      isUTeam={tt.isUTeam}
                      knkvInfo={tt.knkvInfo}
                      onToggle={() => toggleKaart(tt.id)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Memo's */}
      {activeTab === "memos" && (
        <div>
          {memoGroepen.length === 0 ? (
            <div
              style={{
                padding: "40px 0",
                textAlign: "center",
                fontSize: 13,
                color: "var(--text-tertiary)",
              }}
            >
              Geen memo&apos;s gevonden voor dit seizoen.
            </div>
          ) : (
            memoGroepen.map((groep) => {
              const openCount = groep.memos.filter((m) => m.status === "OPEN").length;
              return (
                <div key={groep.dbEnum} style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--text-muted)",
                      marginBottom: 6,
                      paddingBottom: 4,
                      borderBottom: "1px solid var(--border-light)",
                    }}
                  >
                    {groep.label}
                    {openCount > 0 && (
                      <span
                        style={{
                          fontWeight: 400,
                          color: "var(--ow-accent)",
                          marginLeft: 6,
                        }}
                      >
                        &middot; {openCount} open
                      </span>
                    )}
                  </div>
                  {groep.memos.map((memo) => (
                    <MemoRij key={memo.id} memo={memo} />
                  ))}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
