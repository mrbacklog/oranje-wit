"use client";
/**
 * Read-only speler-rij voor de presentatielaag.
 * Bewust gedupliceerd uit werkbord/SpelerRij.tsx — geen drag-handlers,
 * peildatum als prop (geen usePeildatum-context).
 *
 * Naamhelpers (achternaamKern / naamPool / kortTussenvoegsel) zijn gekopieerd
 * uit werkbord/SpelerRij.tsx (module-private daar).
 */
import { berekenKorfbalLeeftijd, formatKorfbalLeeftijd } from "@oranje-wit/types";
import { leeftijdsKleur } from "@/components/werkbord/leeftijds-kleuren";
import type { PresentatieSpeler } from "../presentatie-types";

// ── Naamhelpers (gespiegeld uit werkbord/SpelerRij.tsx) ─────────────────────

const TVS_AFKORT: Record<string, string> = {
  "van der": "vd",
  "van de": "vd",
  van: "v",
  de: "d",
  den: "d",
  ter: "t",
  te: "t",
};

function kortTussenvoegsel(tvs: string): string {
  const lager = tvs.toLowerCase().trim();
  return TVS_AFKORT[lager] ?? tvs;
}

/**
 * Geeft het achternaam-deel zonder tussenvoegsel-prefix.
 * Sommige DB-records slaan achternaam op als "van Rooij" i.p.v. "Rooij".
 * Gebruik altijd deze helper om dubbel tussenvoegsel te voorkomen.
 */
function achternaamKern(achternaam: string, tussenvoegsel: string | null): string {
  if (!tussenvoegsel || !achternaam) return achternaam;
  const prefix = tussenvoegsel.toLowerCase().trim() + " ";
  if (achternaam.toLowerCase().startsWith(prefix)) return achternaam.slice(prefix.length);
  return achternaam;
}

/**
 * Formatteert naam voor presentatie:
 * Volledig: "roepnaam [tussenvoegsel] achternaam"
 * Als > 22 tekens: val terug op afgekort tussenvoegsel
 */
function naamPool(roepnaam: string, tussenvoegsel: string | null, achternaam: string): string {
  const kern = achternaamKern(achternaam, tussenvoegsel);
  const volledig = [roepnaam, tussenvoegsel, kern].filter(Boolean).join(" ");
  if (volledig.length <= 22) return volledig;
  const tvsKort = tussenvoegsel ? kortTussenvoegsel(tussenvoegsel) : null;
  return [roepnaam, tvsKort, kern].filter(Boolean).join(" ");
}

// ── Component ───────────────────────────────────────────────────────────────

interface SpelerPresentatieRijProps {
  speler: PresentatieSpeler;
  peildatum: Date;
}

export function SpelerPresentatieRij({ speler, peildatum }: SpelerPresentatieRijProps) {
  const geslacht = speler.geslacht.toLowerCase() as "v" | "m";
  const geslachtKleur = geslacht === "v" ? "var(--pink)" : "var(--blue)";
  const geslachtBg = geslacht === "v" ? "rgba(236,72,153,.18)" : "rgba(96,165,250,.18)";

  const kern = achternaamKern(speler.achternaam, speler.tussenvoegsel);
  const initialen = `${speler.roepnaam.charAt(0)}${kern.charAt(0)}`.toUpperCase();
  const naam = naamPool(speler.roepnaam, speler.tussenvoegsel, speler.achternaam);

  const leeftijd = berekenKorfbalLeeftijd(speler.geboortedatum, speler.geboortejaar, peildatum);
  const leeftKleur = leeftijdsKleur(leeftijd);

  const isStopt = speler.status === "GAAT_STOPPEN" || speler.status === "GESTOPT";
  const isAR = speler.status === "ALGEMEEN_RESERVE";
  const isNieuw =
    speler.isNieuw || speler.status === "NIEUW_POTENTIEEL" || speler.status === "NIEUW_DEFINITIEF";

  const waasAchtergrond = isStopt
    ? "rgba(239,68,68,.07)"
    : speler.status === "GEBLESSEERD"
      ? "rgba(249,115,22,.10)"
      : speler.status === "TWIJFELT"
        ? "rgba(249,115,22,.08)"
        : isNieuw
          ? "rgba(34,197,94,.07)"
          : speler.status === "BESCHIKBAAR"
            ? "rgba(34,197,94,.06)"
            : "transparent";

  return (
    <div
      style={{
        height: 40,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "0 8px",
        flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,.05)",
        borderLeft: `3px solid ${leeftKleur}40`,
        background: waasAchtergrond,
        opacity: isStopt ? 0.52 : 1,
        position: "relative",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 8,
          fontWeight: 700,
          background: geslachtBg,
          color: geslachtKleur,
          border: `1.5px solid ${geslachtKleur}`,
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

      {/* Naam + badges */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: 4,
          overflow: "hidden",
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-1)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            flexShrink: 1,
            minWidth: 0,
            textDecoration: isStopt ? "line-through" : "none",
          }}
        >
          {naam}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
          {isNieuw && (
            <span
              style={{ fontSize: 10, color: "var(--ok)", flexShrink: 0, lineHeight: 1 }}
              aria-label="Nieuw lid"
            >
              ✦
            </span>
          )}
          {speler.status === "GEBLESSEERD" && (
            <span
              aria-label="Geblesseerd"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 11,
                height: 11,
                background: "rgba(255,255,255,.92)",
                borderRadius: 2,
                flexShrink: 0,
              }}
            >
              <svg width="7" height="7" viewBox="0 0 6 6" fill="none">
                <rect x="2.5" y="0" width="1" height="6" fill="#e00" />
                <rect x="0" y="2.5" width="6" height="1" fill="#e00" />
              </svg>
            </span>
          )}
          {speler.status === "TWIJFELT" && (
            <span style={{ fontSize: 9, fontWeight: 700, color: "var(--warn)" }}>?</span>
          )}
          {isAR && (
            <span
              style={{
                fontSize: 8,
                fontWeight: 700,
                color: "var(--text-2)",
                background: "var(--bg-2)",
                border: "1px solid var(--border-1)",
                borderRadius: 3,
                padding: "0 3px",
              }}
            >
              AR
            </span>
          )}
        </div>
      </div>

      {/* Leeftijd */}
      <span style={{ fontSize: 9.5, color: "var(--text-3)", flexShrink: 0 }}>
        {formatKorfbalLeeftijd(leeftijd)}
      </span>
    </div>
  );
}
