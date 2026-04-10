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
const KAART_HOOGTE = 210;

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
  zoomLevel: ZoomLevel;
  showScores: boolean;
  huidigeJaar: number;
  onBewerken: (teamId: string) => void;
  onDropSpeler: (
    spelerData: WerkbordSpeler,
    vanTeamId: string | null,
    naarGeslacht: "V" | "M"
  ) => void;
  onHeaderMouseDown: (e: React.MouseEvent, teamId: string) => void;
}

export function TeamKaart({
  team,
  zoomLevel,
  showScores,
  huidigeJaar,
  onBewerken,
  onDropSpeler,
  onHeaderMouseDown,
}: TeamKaartProps) {
  const breedte = KAART_BREEDTE[team.formaat];
  const isCompact = zoomLevel === "compact";
  const isDetail = zoomLevel === "detail";

  const [dropOverGeslacht, setDropOverGeslacht] = useState<"V" | "M" | null>(null);

  function handleDragOver(e: React.DragEvent, geslacht: "V" | "M") {
    if (!e.dataTransfer.types.includes("speler")) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDropOverGeslacht(geslacht);
  }

  function handleDrop(e: React.DragEvent, geslacht: "V" | "M") {
    e.preventDefault();
    e.stopPropagation();
    setDropOverGeslacht(null);
    const raw = e.dataTransfer.getData("speler");
    if (!raw) return;
    const data = JSON.parse(raw) as { speler: WerkbordSpeler; vanTeamId: string | null };
    // Laat niet op hetzelfde team droppen als het al die geslachtsgroep is
    if (data.vanTeamId === team.id) return;
    onDropSpeler(data.speler, data.vanTeamId, geslacht);
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
        height: KAART_HOOGTE,
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
              {team.naam}
            </div>
          </div>

          {/* Midden — Venus/Mars tellers */}
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
            {team.ussScore !== null && (
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

      {/* ── NORMAAL / DETAIL MODE ── */}
      {!isCompact && (
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
                onBewerken(team.id);
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
                  showRating={isDetail}
                  showLeeftijd={isDetail}
                  showIcons={isDetail}
                  showScore={showScores && isDetail}
                  huidigeJaar={huidigeJaar}
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
                  showRating={isDetail}
                  showLeeftijd={isDetail}
                  showIcons={isDetail}
                  showScore={showScores && isDetail}
                  huidigeJaar={huidigeJaar}
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
            {team.ussScore && (
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
