// apps/web/src/components/ti-studio/werkbord/TeamKaart.tsx
"use client";
import { useState } from "react";
import "./tokens.css";
import { TeamKaartSpelerRij } from "./TeamKaartSpelerRij";
import type { WerkbordTeam, WerkbordSpeler, KaartFormaat, ZoomLevel } from "./types";

const KAART_BREEDTE: Record<KaartFormaat, number> = {
  viertal: 140,
  achtal: 280,
  selectie: 560,
};
const KAART_HOOGTE_NORMAAL = 210;
const KAART_HOOGTE_DETAIL = 380;

const COMPACT_HEADER_HOOGTE: Record<KaartFormaat, number> = {
  viertal: 36,
  achtal: 40,
  selectie: 44,
};
const COMPACT_HEADER_FONT: Record<KaartFormaat, number> = {
  viertal: 13,
  achtal: 15,
  selectie: 17,
};
const COMPACT_STIP: Record<KaartFormaat, number> = {
  viertal: 9,
  achtal: 9,
  selectie: 10,
};
const COMPACT_ICON: Record<KaartFormaat, number> = {
  viertal: 16,
  achtal: 20,
  selectie: 28,
};
const COMPACT_TELLER: Record<KaartFormaat, number> = {
  viertal: 28,
  achtal: 32,
  selectie: 44,
};
const COMPACT_GAP: Record<KaartFormaat, number> = {
  viertal: 12,
  achtal: 36,
  selectie: 60,
};

const KNKV_KLEUR: Record<string, string> = {
  blauw: "var(--cat-blauw)",
  groen: "var(--cat-groen)",
  geel: "var(--cat-geel)",
  oranje: "var(--cat-oranje)",
  rood: "var(--cat-rood)",
  senior: "var(--cat-senior)",
};

const VAL_KLEUR: Record<string, string> = {
  ok: "var(--ok)",
  warn: "var(--warn)",
  err: "var(--err)",
};

interface TeamKaartProps {
  team: WerkbordTeam;
  partnerTeam?: WerkbordTeam | null;
  zoomLevel: ZoomLevel;
  showScores: boolean;
  isDragging: boolean;
  onOpenTeamDrawer: (teamId: string) => void;
  onDropSpeler: (
    spelerData: WerkbordSpeler,
    vanTeamId: string | null,
    naarGeslacht: "V" | "M"
  ) => void;
  onDropSpelerOpPartner?: (
    spelerData: WerkbordSpeler,
    vanTeamId: string | null,
    naarGeslacht: "V" | "M"
  ) => void;
  onHeaderMouseDown: (e: React.MouseEvent, teamId: string) => void;
}

export function TeamKaart({
  team,
  partnerTeam = null,
  zoomLevel,
  showScores,
  isDragging,
  onOpenTeamDrawer,
  onDropSpeler,
  onDropSpelerOpPartner,
  onHeaderMouseDown,
}: TeamKaartProps) {
  const breedte = KAART_BREEDTE[team.formaat];
  const isCompact = zoomLevel === "compact";
  const isDetail = zoomLevel === "detail";
  const kaartHoogte = isDetail ? KAART_HOOGTE_DETAIL : KAART_HOOGTE_NORMAAL;
  const isSelectie = team.formaat === "selectie" && partnerTeam !== null;
  const selectieLabel = isSelectie
    ? team.selectieNaam || `${team.naam} ↔ ${partnerTeam!.naam}`
    : team.naam;

  const [dropOverGeslacht, setDropOverGeslacht] = useState<"V" | "M" | null>(null);
  const [dropOverGeslachtPartner, setDropOverGeslachtPartner] = useState<"V" | "M" | null>(null);
  const [gebundeld, setGebundeld] = useState(false);

  function handleDragOver(e: React.DragEvent, geslacht: "V" | "M") {
    if (!e.dataTransfer.types.includes("speler")) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDropOverGeslacht(geslacht);
  }

  function handleDrop(e: React.DragEvent, _zoneGeslacht: "V" | "M") {
    e.preventDefault();
    e.stopPropagation();
    setDropOverGeslacht(null);
    const raw = e.dataTransfer.getData("speler");
    if (!raw) return;
    const data = JSON.parse(raw) as { speler: WerkbordSpeler; vanTeamId: string | null };
    if (data.vanTeamId === team.id) return;
    onDropSpeler(data.speler, data.vanTeamId, data.speler.geslacht);
  }

  function handleDragOverPartner(e: React.DragEvent, geslacht: "V" | "M") {
    if (!e.dataTransfer.types.includes("speler") || !partnerTeam) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDropOverGeslachtPartner(geslacht);
  }

  function handleDropPartner(e: React.DragEvent, _zoneGeslacht: "V" | "M") {
    e.preventDefault();
    e.stopPropagation();
    setDropOverGeslachtPartner(null);
    const raw = e.dataTransfer.getData("speler");
    if (!raw) return;
    const data = JSON.parse(raw) as { speler: WerkbordSpeler; vanTeamId: string | null };
    if (data.vanTeamId === partnerTeam!.id) return;
    onDropSpelerOpPartner?.(data.speler, data.vanTeamId, data.speler.geslacht);
  }

  return (
    <div
      onMouseDown={(e) => {
        // In compact mode is de gehele kaart drag-handle
        if (isCompact) {
          if ((e.target as HTMLElement).closest("button")) return;
          onHeaderMouseDown(e, team.id);
          return;
        }
        e.stopPropagation(); // blokkeer canvas-pan bij klik op kaart
      }}
      style={{
        position: "absolute",
        left: team.canvasX,
        top: team.canvasY,
        pointerEvents: "auto", // canvas heeft pointer-events: none; kaart zet het terug
        width: breedte,
        height: kaartHoogte,
        background: "var(--bg-1)",
        border: "1px solid var(--border-0)",
        borderRadius: "var(--card-radius)",
        boxShadow: "var(--sh-card)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        cursor: isCompact ? "grab" : "default",
        animation: "fadeUp 250ms ease both",
      }}
    >
      {/* Kleurband links — 4px */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: KNKV_KLEUR[team.kleur] ?? "var(--cat-senior)",
        }}
      />

      {/* ── COMPACT MODE ── */}
      {isCompact && (
        <div
          style={{
            padding: "0 8px 0 14px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Validatie-stip — rechtsbovenin */}
          <div
            style={{
              position: "absolute",
              top: (COMPACT_HEADER_HOOGTE[team.formaat] - COMPACT_STIP[team.formaat]) / 2,
              right: 8,
              width: COMPACT_STIP[team.formaat],
              height: COMPACT_STIP[team.formaat],
              borderRadius: "50%",
              background: VAL_KLEUR[team.validatieStatus],
              boxShadow: `0 0 4px 1px ${VAL_KLEUR[team.validatieStatus]}`,
            }}
          />

          {/* Header */}
          <div
            style={{
              height: COMPACT_HEADER_HOOGTE[team.formaat],
              display: "flex",
              alignItems: "center",
              borderBottom: "1px solid var(--border-0)",
              flexShrink: 0,
              paddingRight: COMPACT_STIP[team.formaat] + 12,
            }}
          >
            <div
              style={{
                fontSize: COMPACT_HEADER_FONT[team.formaat],
                fontWeight: 700,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {selectieLabel}
            </div>
          </div>

          {/* Midden — Venus/Mars tellers (selectie: twee teams naast elkaar) */}
          {isSelectie ? (
            <div style={{ flex: 1, display: "flex", alignItems: "stretch" }}>
              {[
                { t: team, label: team.naam },
                { t: partnerTeam!, label: partnerTeam!.naam },
              ].map(({ t, label }, idx) => (
                <div
                  key={t.id}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    borderLeft: idx === 1 ? "1px solid var(--border-0)" : undefined,
                    padding: "4px 0",
                  }}
                >
                  <span style={{ fontSize: 9, color: "var(--text-3)", fontWeight: 600 }}>
                    {label}
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: "var(--pink)" }}>
                      ♀{t.dames.length}
                    </span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: "var(--blue)" }}>
                      ♂{t.heren.length}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: COMPACT_GAP[team.formaat],
              }}
            >
              {/* Dames */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <svg
                  width={COMPACT_ICON[team.formaat]}
                  height={COMPACT_ICON[team.formaat]}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--pink)"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="8" r="6" />
                  <line x1="12" y1="14" x2="12" y2="22" />
                  <line x1="9" y1="19" x2="15" y2="19" />
                </svg>
                <span
                  style={{
                    fontSize: COMPACT_TELLER[team.formaat],
                    fontWeight: 900,
                    color: "var(--pink)",
                    lineHeight: 1,
                  }}
                >
                  {team.dames.length}
                </span>
              </div>

              {/* Verticale scheiding */}
              <div
                style={{
                  width: 1,
                  alignSelf: "stretch",
                  background: "var(--border-0)",
                  margin: "8px 0",
                }}
              />

              {/* Heren */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <svg
                  width={COMPACT_ICON[team.formaat]}
                  height={COMPACT_ICON[team.formaat]}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--blue)"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="10" cy="14" r="6" />
                  <line x1="21" y1="3" x2="15" y2="9" />
                  <polyline points="16 3 21 3 21 8" />
                </svg>
                <span
                  style={{
                    fontSize: COMPACT_TELLER[team.formaat],
                    fontWeight: 900,
                    color: "var(--blue)",
                    lineHeight: 1,
                  }}
                >
                  {team.heren.length}
                </span>
              </div>
            </div>
          )}

          {/* Footer — 56px */}
          <div
            style={{
              height: 56,
              display: "flex",
              alignItems: "center",
              borderTop: "1px solid var(--border-0)",
              flexShrink: 0,
              padding: "0 4px",
            }}
          >
            {showScores && team.ussScore !== null && (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: ".5px",
                    color: "var(--text-3)",
                  }}
                >
                  Score
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>
                  {team.ussScore.toFixed(2)}
                </span>
              </div>
            )}
            <div style={{ flex: 1 }} />
            {team.gemiddeldeLeeftijd !== null && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: ".5px",
                    color: "var(--text-3)",
                  }}
                >
                  Gem. leeftijd
                </span>
                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>
                  {team.gemiddeldeLeeftijd.toFixed(1)}j
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── NORMAAL / DETAIL MODE — SELECTIE (twee panels) ── */}
      {!isCompact && isSelectie && (
        <div
          style={{
            padding: "0 0 0 14px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {/* Gecombineerde header */}
          <div
            onMouseDown={(e) => {
              if ((e.target as HTMLElement).closest("button")) return;
              onHeaderMouseDown(e, team.id);
            }}
            style={{
              height: 36,
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderBottom: "1px solid var(--border-0)",
              flexShrink: 0,
              cursor: "grab",
              paddingRight: 8,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                flex: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {selectieLabel}
            </div>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "var(--accent)",
                background: "var(--accent-dim)",
                borderRadius: 4,
                padding: "1px 5px",
                flexShrink: 0,
              }}
            >
              SEL
            </span>
            {/* Bundeling toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setGebundeld((v) => !v);
              }}
              title={gebundeld ? "Per team weergeven" : "Bundelen op geslacht"}
              style={{
                width: 22,
                height: 22,
                borderRadius: 5,
                background: gebundeld ? "var(--accent-dim)" : "none",
                border: gebundeld ? "1px solid rgba(255,107,0,.3)" : "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: gebundeld ? "var(--accent)" : "var(--text-3)",
                flexShrink: 0,
              }}
            >
              {gebundeld ? (
                <svg width="13" height="11" viewBox="0 0 13 11" fill="none">
                  <rect
                    x="0.5"
                    y="0.5"
                    width="5"
                    height="10"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                  <rect
                    x="7.5"
                    y="0.5"
                    width="5"
                    height="10"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                </svg>
              ) : (
                <svg width="13" height="11" viewBox="0 0 13 11" fill="none">
                  <rect
                    x="0.5"
                    y="0.5"
                    width="5"
                    height="4.5"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                  <rect
                    x="7.5"
                    y="0.5"
                    width="5"
                    height="4.5"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                  <rect
                    x="0.5"
                    y="6"
                    width="5"
                    height="4.5"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                  <rect
                    x="7.5"
                    y="6"
                    width="5"
                    height="4.5"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                </svg>
              )}
            </button>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                flexShrink: 0,
                background: VAL_KLEUR[team.validatieStatus],
              }}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenTeamDrawer(team.id);
              }}
              style={{
                width: 22,
                height: 22,
                borderRadius: 5,
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-3)",
                fontSize: 11,
                flexShrink: 0,
              }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>

          {/* Body — per team of gebundeld op geslacht */}
          <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>
            {gebundeld ? (
              /* ── GEBUNDELD: links alle dames, rechts alle heren ── */
              <>
                {/* Dames kolom (team1 + partner) */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    borderRight: "2px solid var(--border-0)",
                    minHeight: 0,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: ".6px",
                      color: "rgba(236,72,153,.7)",
                      padding: "2px 6px",
                      borderBottom: "1px solid rgba(255,255,255,.04)",
                      flexShrink: 0,
                    }}
                  >
                    Dames
                  </div>
                  {/* Team1 dames */}
                  <div
                    onDragOver={(e) => handleDragOver(e, "V")}
                    onDragLeave={() => setDropOverGeslacht(null)}
                    onDrop={(e) => handleDrop(e, "V")}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      background: dropOverGeslacht === "V" ? "rgba(236,72,153,.07)" : "transparent",
                      transition: "background 120ms ease",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 8,
                        fontWeight: 600,
                        color: "var(--accent)",
                        padding: "1px 6px",
                        opacity: 0.7,
                        flexShrink: 0,
                      }}
                    >
                      {team.naam}
                    </div>
                    {team.dames.map((sp) => (
                      <TeamKaartSpelerRij
                        key={sp.id}
                        spelerInTeam={sp}
                        teamId={team.id}
                        isDetail={isDetail}
                      />
                    ))}
                  </div>
                  {/* Scheidingslijn */}
                  <div style={{ height: 1, background: "var(--border-0)", flexShrink: 0 }} />
                  {/* Partner dames */}
                  <div
                    onDragOver={(e) => handleDragOverPartner(e, "V")}
                    onDragLeave={() => setDropOverGeslachtPartner(null)}
                    onDrop={(e) => handleDropPartner(e, "V")}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      background:
                        dropOverGeslachtPartner === "V" ? "rgba(236,72,153,.07)" : "transparent",
                      transition: "background 120ms ease",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 8,
                        fontWeight: 600,
                        color: "var(--accent)",
                        padding: "1px 6px",
                        opacity: 0.7,
                        flexShrink: 0,
                      }}
                    >
                      {partnerTeam!.naam}
                    </div>
                    {partnerTeam!.dames.map((sp) => (
                      <TeamKaartSpelerRij
                        key={sp.id}
                        spelerInTeam={sp}
                        teamId={partnerTeam!.id}
                        isDetail={isDetail}
                      />
                    ))}
                  </div>
                </div>

                {/* Heren kolom (team1 + partner) */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: ".6px",
                      color: "rgba(96,165,250,.7)",
                      padding: "2px 6px",
                      borderBottom: "1px solid rgba(255,255,255,.04)",
                      flexShrink: 0,
                    }}
                  >
                    Heren
                  </div>
                  {/* Team1 heren */}
                  <div
                    onDragOver={(e) => handleDragOver(e, "M")}
                    onDragLeave={() => setDropOverGeslacht(null)}
                    onDrop={(e) => handleDrop(e, "M")}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      background: dropOverGeslacht === "M" ? "rgba(96,165,250,.07)" : "transparent",
                      transition: "background 120ms ease",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 8,
                        fontWeight: 600,
                        color: "var(--accent)",
                        padding: "1px 6px",
                        opacity: 0.7,
                        flexShrink: 0,
                      }}
                    >
                      {team.naam}
                    </div>
                    {team.heren.map((sp) => (
                      <TeamKaartSpelerRij
                        key={sp.id}
                        spelerInTeam={sp}
                        teamId={team.id}
                        isDetail={isDetail}
                      />
                    ))}
                  </div>
                  {/* Scheidingslijn */}
                  <div style={{ height: 1, background: "var(--border-0)", flexShrink: 0 }} />
                  {/* Partner heren */}
                  <div
                    onDragOver={(e) => handleDragOverPartner(e, "M")}
                    onDragLeave={() => setDropOverGeslachtPartner(null)}
                    onDrop={(e) => handleDropPartner(e, "M")}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      background:
                        dropOverGeslachtPartner === "M" ? "rgba(96,165,250,.07)" : "transparent",
                      transition: "background 120ms ease",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 8,
                        fontWeight: 600,
                        color: "var(--accent)",
                        padding: "1px 6px",
                        opacity: 0.7,
                        flexShrink: 0,
                      }}
                    >
                      {partnerTeam!.naam}
                    </div>
                    {partnerTeam!.heren.map((sp) => (
                      <TeamKaartSpelerRij
                        key={sp.id}
                        spelerInTeam={sp}
                        teamId={partnerTeam!.id}
                        isDetail={isDetail}
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* ── PER TEAM: team1 panel | partner panel ── */
              <>
                {/* Team1 panel */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    borderRight: "2px solid var(--accent-dim)",
                    minHeight: 0,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: ".4px",
                      color: "var(--accent)",
                      padding: "3px 6px",
                      flexShrink: 0,
                      background: "var(--accent-dim)",
                    }}
                  >
                    {team.naam}
                  </div>
                  <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>
                    <div
                      onDragOver={(e) => handleDragOver(e, "V")}
                      onDragLeave={() => setDropOverGeslacht(null)}
                      onDrop={(e) => handleDrop(e, "V")}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        minHeight: 0,
                        overflow: "hidden",
                        borderRight: "1px solid var(--border-0)",
                        background:
                          dropOverGeslacht === "V" ? "rgba(236,72,153,.07)" : "transparent",
                        transition: "background 120ms ease",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: ".5px",
                          color: "var(--text-3)",
                          padding: "2px 6px 0",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          flexShrink: 0,
                        }}
                      >
                        <svg width="8" height="8" viewBox="0 0 8 8">
                          <circle cx="4" cy="4" r="4" fill="var(--pink)" />
                        </svg>
                        Dames
                      </div>
                      {team.dames.map((sp) => (
                        <TeamKaartSpelerRij
                          key={sp.id}
                          spelerInTeam={sp}
                          teamId={team.id}
                          isDetail={isDetail}
                        />
                      ))}
                    </div>
                    <div
                      onDragOver={(e) => handleDragOver(e, "M")}
                      onDragLeave={() => setDropOverGeslacht(null)}
                      onDrop={(e) => handleDrop(e, "M")}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        minHeight: 0,
                        overflow: "hidden",
                        background:
                          dropOverGeslacht === "M" ? "rgba(96,165,250,.07)" : "transparent",
                        transition: "background 120ms ease",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: ".5px",
                          color: "var(--text-3)",
                          padding: "2px 6px 0",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          flexShrink: 0,
                        }}
                      >
                        <svg width="8" height="8" viewBox="0 0 8 8">
                          <circle cx="4" cy="4" r="4" fill="var(--blue)" />
                        </svg>
                        Heren
                      </div>
                      {team.heren.map((sp) => (
                        <TeamKaartSpelerRij
                          key={sp.id}
                          spelerInTeam={sp}
                          teamId={team.id}
                          isDetail={isDetail}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Partner panel */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: ".4px",
                      color: "var(--accent)",
                      padding: "3px 6px",
                      flexShrink: 0,
                      background: "var(--accent-dim)",
                    }}
                  >
                    {partnerTeam!.naam}
                  </div>
                  <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>
                    <div
                      onDragOver={(e) => handleDragOverPartner(e, "V")}
                      onDragLeave={() => setDropOverGeslachtPartner(null)}
                      onDrop={(e) => handleDropPartner(e, "V")}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        minHeight: 0,
                        overflow: "hidden",
                        borderRight: "1px solid var(--border-0)",
                        background:
                          dropOverGeslachtPartner === "V" ? "rgba(236,72,153,.07)" : "transparent",
                        transition: "background 120ms ease",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: ".5px",
                          color: "var(--text-3)",
                          padding: "2px 6px 0",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          flexShrink: 0,
                        }}
                      >
                        <svg width="8" height="8" viewBox="0 0 8 8">
                          <circle cx="4" cy="4" r="4" fill="var(--pink)" />
                        </svg>
                        Dames
                      </div>
                      {partnerTeam!.dames.map((sp) => (
                        <TeamKaartSpelerRij
                          key={sp.id}
                          spelerInTeam={sp}
                          teamId={partnerTeam!.id}
                          isDetail={isDetail}
                        />
                      ))}
                    </div>
                    <div
                      onDragOver={(e) => handleDragOverPartner(e, "M")}
                      onDragLeave={() => setDropOverGeslachtPartner(null)}
                      onDrop={(e) => handleDropPartner(e, "M")}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        minHeight: 0,
                        overflow: "hidden",
                        background:
                          dropOverGeslachtPartner === "M" ? "rgba(96,165,250,.07)" : "transparent",
                        transition: "background 120ms ease",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: ".5px",
                          color: "var(--text-3)",
                          padding: "2px 6px 0",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          flexShrink: 0,
                        }}
                      >
                        <svg width="8" height="8" viewBox="0 0 8 8">
                          <circle cx="4" cy="4" r="4" fill="var(--blue)" />
                        </svg>
                        Heren
                      </div>
                      {partnerTeam!.heren.map((sp) => (
                        <TeamKaartSpelerRij
                          key={sp.id}
                          spelerInTeam={sp}
                          teamId={partnerTeam!.id}
                          isDetail={isDetail}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              height: 28,
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "0 8px 0 0",
              borderTop: "1px solid var(--border-0)",
              flexShrink: 0,
            }}
          >
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 10, color: "var(--text-3)" }}>
              ♀ {team.dames.length + partnerTeam!.dames.length} · ♂{" "}
              {team.heren.length + partnerTeam!.heren.length}
            </span>
          </div>
        </div>
      )}

      {/* ── NORMAAL / DETAIL MODE ── */}
      {!isCompact && !isSelectie && (
        <div
          style={{
            padding: "0 8px 0 14px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {/* Header — 36px, drag handle voor kaart verplaatsen */}
          <div
            onMouseDown={(e) => {
              if ((e.target as HTMLElement).closest("button")) return;
              onHeaderMouseDown(e, team.id);
            }}
            style={{
              height: 36,
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderBottom: "1px solid var(--border-0)",
              flexShrink: 0,
              cursor: "grab",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                flex: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {team.naam}
            </div>
            <div style={{ display: "flex", gap: 3 }}>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "2px 5px",
                  borderRadius: 4,
                  background: "rgba(236,72,153,.12)",
                  color: "var(--pink)",
                }}
              >
                ♀ {team.dames.length}
              </span>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "2px 5px",
                  borderRadius: 4,
                  background: "rgba(96,165,250,.12)",
                  color: "var(--blue)",
                }}
              >
                ♂ {team.heren.length}
              </span>
            </div>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                flexShrink: 0,
                background: VAL_KLEUR[team.validatieStatus],
              }}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenTeamDrawer(team.id);
              }}
              style={{
                width: 22,
                height: 22,
                borderRadius: 5,
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-3)",
                fontSize: 11,
                flexShrink: 0,
              }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>

          {/* Spelers kolommen — body flex:1 */}
          <div
            style={{
              display: "flex",
              flexDirection: team.formaat === "viertal" ? "column" : "row",
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            {/* Dames kolom */}
            <div
              onDragOver={(e) => handleDragOver(e, "V")}
              onDragLeave={() => setDropOverGeslacht(null)}
              onDrop={(e) => handleDrop(e, "V")}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                overflow: "hidden",
                borderRight: team.formaat === "viertal" ? "none" : "1px solid var(--border-0)",
                borderBottom: team.formaat === "viertal" ? "1px solid var(--border-0)" : "none",
                background: dropOverGeslacht === "V" ? "rgba(236,72,153,.07)" : "transparent",
                transition: "background 120ms ease",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: ".5px",
                  color: "var(--text-3)",
                  padding: "2px 6px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  flexShrink: 0,
                }}
              >
                <svg width="8" height="8" viewBox="0 0 8 8">
                  <circle cx="4" cy="4" r="4" fill="var(--pink)" />
                </svg>
                Dames
              </div>
              {team.dames.map((sp) => (
                <TeamKaartSpelerRij
                  key={sp.id}
                  spelerInTeam={sp}
                  teamId={team.id}
                  isDetail={isDetail}
                />
              ))}
            </div>

            {/* Heren kolom */}
            <div
              onDragOver={(e) => handleDragOver(e, "M")}
              onDragLeave={() => setDropOverGeslacht(null)}
              onDrop={(e) => handleDrop(e, "M")}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                overflow: "hidden",
                background: dropOverGeslacht === "M" ? "rgba(96,165,250,.07)" : "transparent",
                transition: "background 120ms ease",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: ".5px",
                  color: "var(--text-3)",
                  padding: "2px 6px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  flexShrink: 0,
                }}
              >
                <svg width="8" height="8" viewBox="0 0 8 8">
                  <circle cx="4" cy="4" r="4" fill="var(--blue)" />
                </svg>
                Heren
              </div>
              {team.heren.map((sp) => (
                <TeamKaartSpelerRij
                  key={sp.id}
                  spelerInTeam={sp}
                  teamId={team.id}
                  isDetail={isDetail}
                />
              ))}
            </div>
          </div>

          {/* Footer — 28px */}
          <div
            style={{
              height: 28,
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "0 8px",
              borderTop: "1px solid var(--border-0)",
              flexShrink: 0,
            }}
          >
            {team.gemiddeldeLeeftijd && (
              <div style={{ fontSize: 10, color: "var(--text-3)" }}>
                Gem.{" "}
                <span style={{ color: "var(--text-2)", fontWeight: 600 }}>
                  {team.gemiddeldeLeeftijd.toFixed(1)}j
                </span>
              </div>
            )}
            {team.validatieCount > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: 10,
                  color: "var(--warn)",
                  background: "rgba(234,179,8,.08)",
                  padding: "2px 6px",
                  borderRadius: 4,
                }}
              >
                ⚠ {team.validatieCount}
              </div>
            )}
            <div style={{ flex: 1 }} />
            {showScores && team.ussScore && (
              <div style={{ fontSize: 10, color: "var(--text-3)" }}>
                USS{" "}
                <span style={{ color: "var(--text-2)", fontWeight: 600 }}>
                  {team.ussScore.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fade-up animatie */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
