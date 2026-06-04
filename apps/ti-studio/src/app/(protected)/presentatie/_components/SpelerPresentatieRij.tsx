"use client";
/**
 * Read-only speler-chip voor de presentatielaag.
 * Bewust gedupliceerd uit werkbord/SpelerKaart.tsx — geen drag-handlers,
 * peildatum als prop (geen usePeildatum-context).
 * Zie IMPLEMENTATIEPLAN.md Deel B voor de motivatie.
 */
import { berekenKorfbalLeeftijd, formatKorfbalLeeftijd } from "@oranje-wit/types";
import { leeftijdsKleur } from "@/components/werkbord/leeftijds-kleuren";
import type { PresentatieSpeler } from "../presentatie-types";

interface SpelerPresentatieRijProps {
  speler: PresentatieSpeler;
  peildatum: Date;
  /** "center" = volledig (30px avatar, volledige naam, leeftijd rechts, badges) */
  fidelity: "center" | "side";
}

export function SpelerPresentatieRij({ speler, peildatum, fidelity }: SpelerPresentatieRijProps) {
  const geslacht = speler.geslacht.toLowerCase() as "v" | "m";
  const geslachtKleur = geslacht === "v" ? "var(--pink)" : "var(--blue)";
  const geslachtBg = geslacht === "v" ? "rgba(236,72,153,.18)" : "rgba(96,165,250,.18)";

  const initialen = `${speler.roepnaam.charAt(0)}${speler.achternaam.charAt(0)}`.toUpperCase();

  const leeftijd = berekenKorfbalLeeftijd(speler.geboortedatum, speler.geboortejaar, peildatum);
  const leeftKleur = leeftijdsKleur(leeftijd);

  const stopGezet = speler.status === "GAAT_STOPPEN";
  const isAR = speler.status === "ALGEMEEN_RESERVE";
  const isStopt = speler.status === "GAAT_STOPPEN" || speler.status === "GESTOPT";

  // N-badge afgeleid uit status (isNieuw staat fase 1 op false)
  const isNieuw =
    speler.isNieuw || speler.status === "NIEUW_POTENTIEEL" || speler.status === "NIEUW_DEFINITIEF";

  const waasAchtergrond = isNieuw
    ? "rgba(34,197,94,.07)"
    : speler.status === "TWIJFELT"
      ? "rgba(249,115,22,.08)"
      : speler.status === "GEBLESSEERD"
        ? "rgba(249,115,22,.10)"
        : isStopt
          ? "rgba(239,68,68,.07)"
          : "transparent";

  const avatarGrootte = fidelity === "center" ? 30 : 22;
  const naamFontsize = fidelity === "center" ? 13 : 11;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: fidelity === "center" ? 9 : 7,
        background: waasAchtergrond,
        border: "1px solid var(--border-0)",
        borderRadius: 6,
        padding: fidelity === "center" ? "5px 8px" : "3px 6px",
        marginBottom: 5,
        position: "relative",
        opacity: isStopt ? 0.55 : 1,
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: avatarGrootte,
          height: avatarGrootte,
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: fidelity === "center" ? 10 : 8,
          fontWeight: 700,
          background: geslachtBg,
          color: geslachtKleur,
          border: `2px solid ${leeftKleur}`,
          boxShadow: `0 0 6px ${leeftKleur}40`,
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {speler.fotoUrl ? (
          <img
            src={speler.fotoUrl}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center top",
              borderRadius: "50%",
            }}
          />
        ) : (
          initialen
        )}
      </div>

      {/* Naam + leeftijd */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: naamFontsize,
            fontWeight: 600,
            color: "var(--text-1)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textDecoration: stopGezet ? "line-through" : "none",
            lineHeight: 1.2,
          }}
        >
          {speler.roepnaam} {speler.tussenvoegsel ? `${speler.tussenvoegsel} ` : ""}
          {speler.achternaam}
        </span>
      </div>

      {/* Leeftijd */}
      <span
        style={{
          fontSize: 10,
          color: "var(--text-3)",
          flexShrink: 0,
          marginLeft: 4,
        }}
      >
        {formatKorfbalLeeftijd(leeftijd)}
      </span>

      {/* Badges */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 3,
          flexShrink: 0,
        }}
      >
        {isNieuw && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "var(--ok)",
              background: "rgba(34,197,94,.14)",
              borderRadius: 3,
              padding: "1px 4px",
            }}
          >
            N
          </span>
        )}
        {speler.status === "TWIJFELT" && (
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--warn)" }}>?</span>
        )}
        {isAR && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "var(--text-2)",
              background: "var(--bg-2)",
              border: "1px solid var(--border-1)",
              borderRadius: 3,
              padding: "1px 4px",
            }}
          >
            AR
          </span>
        )}
        {speler.status === "GEBLESSEERD" && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 12,
              height: 12,
              border: "1.5px solid rgba(255,255,255,0.8)",
              borderRadius: 2,
              flexShrink: 0,
            }}
          >
            <svg width="7" height="7" viewBox="0 0 6 6" fill="none">
              <rect x="2.5" y="0" width="1" height="6" fill="#ff2d2d" />
              <rect x="0" y="2.5" width="6" height="1" fill="#ff2d2d" />
            </svg>
          </span>
        )}
        {speler.status === "GESTOPT" && (
          <span style={{ fontSize: 10, color: "var(--err)" }}>⚠</span>
        )}
      </div>
    </div>
  );
}
