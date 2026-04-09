// apps/web/src/components/ti-studio/werkbord/TeamKaart.tsx
"use client";
import "./tokens.css";
import { TeamKaartSpelerRij } from "./TeamKaartSpelerRij";
import type { WerkbordTeam, KaartFormaat, ZoomLevel } from "./types";

const KAART_BREEDTE: Record<KaartFormaat, number> = {
  viertal: 140,
  achtal: 280,
  selectie: 560,
};
const KAART_HOOGTE = 210;

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
  onDragMove: (e: React.MouseEvent, teamId: string) => void;
}

export function TeamKaart({
  team,
  zoomLevel,
  showScores,
  huidigeJaar,
  onBewerken,
  onDragMove,
}: TeamKaartProps) {
  const breedte = KAART_BREEDTE[team.formaat];
  const isCompact = zoomLevel === "compact";
  const isDetail = zoomLevel === "detail";

  const showLeeftijd = isDetail;
  const showRating = isDetail;
  const showIcons = isDetail;
  const showKolommen = !isCompact;
  const showFooter = !isCompact;

  return (
    <div
      onMouseDown={(e) => onDragMove(e, team.id)}
      style={{
        position: "absolute",
        left: team.canvasX,
        top: team.canvasY,
        width: breedte,
        height: KAART_HOOGTE,
        background: "var(--bg-1)",
        border: "1px solid var(--border-0)",
        borderRadius: "var(--card-radius)",
        boxShadow: "var(--sh-card)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        cursor: "default",
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
        {/* Header — 36px */}
        <div
          style={{
            height: 36,
            display: "flex",
            alignItems: "center",
            gap: 6,
            borderBottom: isCompact ? "none" : "1px solid var(--border-0)",
            flexShrink: 0,
            cursor: "grab",
          }}
        >
          <div
            style={{
              fontSize: isCompact ? 18 : 13,
              fontWeight: isCompact ? 900 : 700,
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
                fontSize: isCompact ? 14 : 10,
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
                fontSize: isCompact ? 14 : 10,
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
          {!isCompact && (
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                flexShrink: 0,
                background: VAL_KLEUR[team.validatieStatus],
              }}
            />
          )}
          {!isCompact && (
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
          )}
        </div>

        {/* Compact stats — alleen zichtbaar in compact mode */}
        {isCompact && (
          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
            }}
          >
            {team.gemiddeldeLeeftijd && (
              <div style={{ fontSize: 13, color: "var(--text-3)" }}>
                Gem.{" "}
                <span style={{ color: "var(--text-2)", fontWeight: 600 }}>
                  {team.gemiddeldeLeeftijd.toFixed(1)}j
                </span>
              </div>
            )}
            {team.ussScore && (
              <div style={{ fontSize: 13, color: "var(--text-3)" }}>
                USS{" "}
                <span style={{ color: "var(--text-2)", fontWeight: 600 }}>
                  {team.ussScore.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Spelers kolommen — body flex:1 */}
        {showKolommen && (
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
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                overflow: "hidden",
                borderRight: team.formaat === "viertal" ? "none" : "1px solid var(--border-0)",
                borderBottom: team.formaat === "viertal" ? "1px solid var(--border-0)" : "none",
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
                  showRating={showRating}
                  showLeeftijd={showLeeftijd}
                  showIcons={showIcons}
                  showScore={showScores && isDetail}
                  huidigeJaar={huidigeJaar}
                />
              ))}
            </div>

            {/* Heren kolom */}
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
                  showRating={showRating}
                  showLeeftijd={showLeeftijd}
                  showIcons={showIcons}
                  showScore={showScores && isDetail}
                  huidigeJaar={huidigeJaar}
                />
              ))}
            </div>
          </div>
        )}

        {/* Footer — 28px */}
        {showFooter && (
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
        )}
      </div>

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
