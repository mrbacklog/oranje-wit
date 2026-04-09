// apps/web/src/components/ti-studio/werkbord/TeamKaartSpelerRij.tsx
"use client";
import "./tokens.css";
import type { WerkbordSpelerInTeam } from "./types";

interface TeamKaartSpelerRijProps {
  spelerInTeam: WerkbordSpelerInTeam;
  showRating: boolean;
  showLeeftijd: boolean;
  showIcons: boolean;
  showScore: boolean;
  huidigeJaar: number;
}

export function TeamKaartSpelerRij({
  spelerInTeam,
  showRating,
  showLeeftijd,
  showIcons,
  showScore,
  huidigeJaar,
}: TeamKaartSpelerRijProps) {
  const { speler } = spelerInTeam;
  const leeftijd = huidigeJaar - speler.geboortejaar;
  const geslacht = speler.geslacht.toLowerCase() as "v" | "m";
  const initialen = `${speler.roepnaam.charAt(0)}${speler.achternaam.charAt(0)}`.toUpperCase();

  const ratingKleur =
    speler.rating && speler.rating >= 7.5
      ? "hi"
      : speler.rating && speler.rating >= 6.5
        ? "md"
        : "lo";

  const ratingColors = {
    hi: { bg: "rgba(34,197,94,.15)", color: "var(--ok)" },
    md: { bg: "rgba(234,179,8,.1)", color: "var(--warn)" },
    lo: { bg: "rgba(239,68,68,.1)", color: "var(--err)" },
  };

  const ussKlasse =
    speler.rating && speler.rating >= 8
      ? "score-top"
      : speler.rating && speler.rating >= 7
        ? "score-goed"
        : speler.rating && speler.rating >= 6
          ? "score-gem"
          : "score-att";

  const ussColors = {
    "score-top": { bg: "#22C55E", color: "#000" },
    "score-goed": { bg: "#3B82F6", color: "#fff" },
    "score-gem": { bg: "#EAB308", color: "#000" },
    "score-att": { bg: "#EF4444", color: "#fff" },
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "0 8px",
        borderRadius: 6,
        flex: 1,
        minHeight: 0,
        cursor: "grab",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 8,
          fontWeight: 700,
          flexShrink: 0,
          background: geslacht === "v" ? "rgba(236,72,153,.15)" : "rgba(96,165,250,.15)",
          color: geslacht === "v" ? "var(--pink)" : "var(--blue)",
        }}
      >
        {initialen}
      </div>

      {/* Naam */}
      <div
        style={{
          fontSize: 11,
          flex: 1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          fontWeight: 500,
          opacity: speler.status === "GAAT_STOPPEN" ? 0.5 : 1,
          textDecoration: speler.status === "GAAT_STOPPEN" ? "line-through" : "none",
        }}
      >
        {speler.roepnaam} {speler.achternaam.charAt(0)}.
      </div>

      {/* Leeftijd */}
      {showLeeftijd && (
        <div style={{ fontSize: 10, color: "var(--text-2)", flexShrink: 0 }}>{leeftijd}</div>
      )}

      {/* Status iconen */}
      {showIcons && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexShrink: 0,
          }}
        >
          {speler.gepind && <span style={{ fontSize: 9, color: "var(--accent)" }}>📌</span>}
          {speler.status === "AFGEMELD" && (
            <span style={{ fontSize: 9, color: "var(--err)" }}>⚠</span>
          )}
          {speler.status === "TWIJFELT" && (
            <span style={{ fontSize: 9, color: "var(--warn)" }}>?</span>
          )}
          {speler.isNieuw && (
            <span
              style={{
                fontSize: 9,
                color: "var(--ok)",
                background: "rgba(34,197,94,.1)",
                borderRadius: 3,
                padding: "1px 4px",
                fontWeight: 700,
              }}
            >
              N
            </span>
          )}
        </div>
      )}

      {/* Rating */}
      {showRating && speler.rating !== null && (
        <div
          style={{
            width: 18,
            height: 14,
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 9,
            fontWeight: 700,
            flexShrink: 0,
            background: ratingColors[ratingKleur].bg,
            color: ratingColors[ratingKleur].color,
          }}
        >
          {speler.rating.toFixed(1)}
        </div>
      )}

      {/* USS Score octagon */}
      {showScore && speler.rating !== null && (
        <div
          style={{
            clipPath:
              "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            flexShrink: 0,
            width: 24,
            height: 24,
            fontSize: 8,
            background: ussColors[ussKlasse].bg,
            color: ussColors[ussKlasse].color,
          }}
        >
          {Math.round(speler.rating)}
        </div>
      )}
    </div>
  );
}
