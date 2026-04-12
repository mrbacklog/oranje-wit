"use client";

import { useState } from "react";
import type { WerkbordTeam, WerkbordValidatieItem } from "@/components/ti-studio/werkbord/types";
import { WerkitemPanel } from "./WerkitemPanel";
import { TeamKaartSpelerRij } from "./werkbord/TeamKaartSpelerRij";

// ──────────────────────────────────────────────────────────
// Design tokens
// ──────────────────────────────────────────────────────────

const T = {
  bg0: "#0a0a0a",
  bg1: "#141414",
  bg2: "#1e1e1e",
  bg3: "#262626",
  accent: "#ff6b00",
  accentDim: "rgba(255,107,0,.12)",
  text1: "#fafafa",
  text2: "#a3a3a3",
  text3: "#666666",
  border0: "#262626",
  border1: "#3a3a3a",
  ok: "#22c55e",
  okDim: "rgba(34,197,94,.12)",
  okBorder: "rgba(34,197,94,.3)",
  warn: "#eab308",
  warnDim: "rgba(234,179,8,.12)",
  warnBorder: "rgba(234,179,8,.3)",
  err: "#ef4444",
  errDim: "rgba(239,68,68,.12)",
  errBorder: "rgba(239,68,68,.3)",
};

const KLEUR_GRADIENT: Record<string, string> = {
  blauw: "linear-gradient(135deg, rgba(59,130,246,.3) 0%, rgba(59,130,246,.05) 100%)",
  groen: "linear-gradient(135deg, rgba(34,197,94,.3) 0%, rgba(34,197,94,.05) 100%)",
  geel: "linear-gradient(135deg, rgba(234,179,8,.3) 0%, rgba(234,179,8,.05) 100%)",
  oranje: "linear-gradient(135deg, rgba(249,115,22,.3) 0%, rgba(249,115,22,.05) 100%)",
  rood: "linear-gradient(135deg, rgba(239,68,68,.3) 0%, rgba(239,68,68,.05) 100%)",
  senior: "linear-gradient(135deg, rgba(129,140,248,.3) 0%, rgba(129,140,248,.05) 100%)",
};

const VAL_KLEUR: Record<string, string> = {
  ok: T.ok,
  warn: T.warn,
  err: T.err,
};

const VAL_DIM: Record<string, string> = {
  ok: T.okDim,
  warn: T.warnDim,
  err: T.errDim,
};

const VAL_BORDER: Record<string, string> = {
  ok: T.okBorder,
  warn: T.warnBorder,
  err: T.errBorder,
};

const VAL_ICOON: Record<string, string> = { ok: "✓", warn: "⚠", err: "✕" };

// ──────────────────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────────────────

export interface TeamDialogProps {
  teamId: string | null;
  teams: WerkbordTeam[];
  validatie: WerkbordValidatieItem[];
  onClose: () => void;
  kadersId: string;
  werkindelingId?: string;
}

// ──────────────────────────────────────────────────────────
// TeamDialog
// ──────────────────────────────────────────────────────────

export function TeamDialog({
  teamId,
  teams,
  validatie,
  onClose,
  kadersId,
  werkindelingId,
}: TeamDialogProps) {
  const [activeTab, setActiveTab] = useState<"overzicht" | "validatie" | "werkitems">("overzicht");

  const team = teamId ? (teams.find((t) => t.id === teamId) ?? null) : null;

  const teamValidatie = validatie
    .filter((v) => v.teamId === teamId)
    .sort((a, b) => {
      const volgorde = { err: 0, warn: 1, ok: 2 };
      return (volgorde[a.type] ?? 3) - (volgorde[b.type] ?? 3);
    });

  if (!team) return null;

  const gradient = KLEUR_GRADIENT[team.kleur] ?? KLEUR_GRADIENT.senior;
  const isSelectie = team.formaat === "selectie";
  const teamLabel = isSelectie
    ? team.selectieNaam || team.naam
    : `${team.naam} (${team.categorie})`;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.6)",
          zIndex: 900,
        }}
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 560,
          height: 640,
          maxWidth: "calc(100vw - 32px)",
          maxHeight: "calc(100vh - 64px)",
          background: T.bg1,
          border: `1px solid ${T.border0}`,
          borderRadius: 14,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          zIndex: 901,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* Header kleurband */}
        <div
          style={{
            background: gradient,
            borderBottom: `1px solid ${T.border0}`,
            padding: "16px 20px 12px",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text1, lineHeight: 1.3 }}>
                {teamLabel}
                {team.werkitems.some(
                  (w) => w.status === "OPEN" || w.status === "IN_BESPREKING"
                ) && (
                  <span
                    style={{ fontSize: 11, color: T.accent, marginLeft: 6 }}
                    title="Open werkitems"
                  >
                    ▲
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: T.text2,
                  marginTop: 3,
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                }}
              >
                <span>{team.formaat}</span>
                <span style={{ color: T.border1 }}>·</span>
                <span style={{ color: "rgba(236,72,153,.9)" }}>♀ {team.dames.length}</span>
                <span style={{ color: "rgba(96,165,250,.9)" }}>♂ {team.heren.length}</span>
                {team.validatieStatus !== "ok" && (
                  <>
                    <span style={{ color: T.border1 }}>·</span>
                    <span style={{ color: VAL_KLEUR[team.validatieStatus] }}>
                      {VAL_ICOON[team.validatieStatus]} {team.validatieCount} melding
                      {team.validatieCount !== 1 ? "en" : ""}
                    </span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: T.text3,
                fontSize: 20,
                lineHeight: 1,
                padding: "0 2px",
                flexShrink: 0,
              }}
              aria-label="Sluiten"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: `1px solid ${T.border0}`,
            flexShrink: 0,
          }}
        >
          {(["overzicht", "validatie", "werkitems"] as const).map((tab) => {
            const isActive = activeTab === tab;
            const labels = {
              overzicht: "Overzicht",
              validatie: "Validatie",
              werkitems: "Notities",
            };
            const openWerkitems = team.werkitems.filter(
              (w) => w.status === "OPEN" || w.status === "IN_BESPREKING"
            ).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: isActive ? `2px solid ${T.accent}` : "2px solid transparent",
                  color: isActive ? T.text1 : T.text2,
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  padding: "10px 16px",
                  cursor: "pointer",
                  fontFamily: "Inter, system-ui, sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                {labels[tab]}
                {tab === "werkitems" && openWerkitems > 0 && (
                  <span style={{ fontSize: 8, color: T.accent }}>▲</span>
                )}
                {tab === "validatie" && team.validatieCount > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "1px 5px",
                      borderRadius: 8,
                      background: VAL_DIM[team.validatieStatus],
                      color: VAL_KLEUR[team.validatieStatus],
                      fontWeight: 700,
                    }}
                  >
                    {team.validatieCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab inhoud */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 20,
          }}
        >
          {/* ── Overzicht tab ── */}
          {activeTab === "overzicht" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Selectie-niveau spelers (gebundeld) */}
              {isSelectie && team.gebundeld && (
                <>
                  {team.selectieDames.length > 0 && (
                    <div>
                      <div style={sectieLabel("rgba(236,72,153,.65)")}>♀ Dames — selectie</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                        {team.selectieDames.map((sit) => (
                          <TeamKaartSpelerRij
                            key={sit.id}
                            spelerInTeam={sit}
                            teamId={team.id}
                            selectieGroepId={team.selectieGroepId}
                            zoomLevel="detail"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {team.selectieHeren.length > 0 && (
                    <div>
                      <div style={sectieLabel("rgba(96,165,250,.65)")}>♂ Heren — selectie</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                        {team.selectieHeren.map((sit) => (
                          <TeamKaartSpelerRij
                            key={sit.id}
                            spelerInTeam={sit}
                            teamId={team.id}
                            selectieGroepId={team.selectieGroepId}
                            zoomLevel="detail"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ height: 1, background: T.border0 }} />
                </>
              )}

              {/* Dames + Heren kolommen */}
              <div
                style={{
                  display: "flex",
                  flexDirection: team.formaat === "viertal" ? "column" : "row",
                  gap: team.formaat === "viertal" ? 8 : 0,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={sectieLabel("rgba(236,72,153,.65)")}>♀ Dames</div>
                  {team.dames.length === 0 ? (
                    <div style={{ fontSize: 11, color: T.text3, padding: "4px 8px" }}>
                      Geen dames
                    </div>
                  ) : (
                    team.dames.map((sp) => (
                      <TeamKaartSpelerRij
                        key={sp.id}
                        spelerInTeam={sp}
                        teamId={team.id}
                        zoomLevel="detail"
                      />
                    ))
                  )}
                </div>
                {team.formaat !== "viertal" && (
                  <div style={{ width: 1, background: T.border0, flexShrink: 0 }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={sectieLabel("rgba(96,165,250,.65)")}>♂ Heren</div>
                  {team.heren.length === 0 ? (
                    <div style={{ fontSize: 11, color: T.text3, padding: "4px 8px" }}>
                      Geen heren
                    </div>
                  ) : (
                    team.heren.map((sp) => (
                      <TeamKaartSpelerRij
                        key={sp.id}
                        spelerInTeam={sp}
                        teamId={team.id}
                        zoomLevel="detail"
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Staf */}
              {team.staf.length > 0 && (
                <div>
                  <div style={sectieLabel(T.text3)}>Staf</div>
                  {team.staf.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "4px 8px",
                        fontSize: 12,
                        color: T.text2,
                      }}
                    >
                      <span style={{ color: T.text3, fontSize: 10 }}>{s.rol}</span>
                      <span>{s.naam}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer stats */}
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  padding: "10px 12px",
                  background: T.bg2,
                  borderRadius: 8,
                  fontSize: 11,
                  color: T.text2,
                  marginTop: 4,
                }}
              >
                <span>
                  <strong style={{ color: T.text1 }}>
                    {team.dames.length + team.heren.length}
                  </strong>{" "}
                  spelers
                </span>
                {team.ussScore !== null && (
                  <span>
                    USS <strong style={{ color: T.text1 }}>{team.ussScore.toFixed(1)}</strong>
                  </span>
                )}
                {team.gemiddeldeLeeftijd !== null && (
                  <span>
                    Gem. leeftijd{" "}
                    <strong style={{ color: T.text1 }}>{team.gemiddeldeLeeftijd.toFixed(1)}</strong>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── Validatie tab ── */}
          {activeTab === "validatie" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {teamValidatie.length === 0 ? (
                <div
                  style={{
                    padding: "16px 12px",
                    textAlign: "center",
                    color: T.text3,
                    fontSize: 13,
                  }}
                >
                  ✓ Geen validatiemeldingen — alles in orde
                </div>
              ) : (
                teamValidatie.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: VAL_DIM[item.type],
                      border: `1px solid ${VAL_BORDER[item.type]}`,
                      display: "flex",
                      gap: 10,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        color: VAL_KLEUR[item.type],
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      {VAL_ICOON[item.type]}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: T.text1,
                          display: "flex",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        {item.regel}
                        {item.laag && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: "1px 5px",
                              borderRadius: 4,
                              background: T.bg3,
                              color: T.text3,
                              fontWeight: 500,
                            }}
                          >
                            {item.laag}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: T.text2, marginTop: 3 }}>
                        {item.beschrijving}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Werkitems tab ── */}
          {activeTab === "werkitems" && (
            <WerkitemPanel
              entiteitType="TEAM"
              teamId={team.id}
              kadersId={kadersId}
              werkindelingId={werkindelingId}
              initieleWerkitems={team.werkitems ?? []}
            />
          )}
        </div>
      </div>
    </>
  );
}

// ──────────────────────────────────────────────────────────
// Hulpfunctie
// ──────────────────────────────────────────────────────────

function sectieLabel(kleur: string): React.CSSProperties {
  return {
    fontSize: 8,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: ".6px",
    color: kleur,
    padding: "3px 8px 2px",
    borderBottom: "1px solid rgba(255,255,255,.04)",
  };
}
