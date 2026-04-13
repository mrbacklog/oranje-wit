// apps/web/src/components/ti-studio/werkbord/HoverSpelersKaart.tsx
"use client";

/**
 * HoverSpelersKaart — zwevende spelerskaart bij hover op SpelerRij
 *
 * Gedrag:
 * - 400ms vertraging bij eerste hover (koud)
 * - 80ms crossfade bij wisselen tussen spelers (warm)
 * - Kaart flipt bij mouse scroll (wheel omlaag = achterkant, omhoog = voorkant)
 * - Kaart verdwijnt bij mouseout van rij (tenzij muis op kaart zelf is)
 *
 * Ontwerp (TI Studio dark):
 * - 180×260px, fixed positie, z-index 9999
 * - Basis: #141414 + leeftijdstint overlay
 * - Tier-rand: brons/zilver/goud op basis van USS-score
 * - Shield fotovlak (polygon clip-path)
 * - Roepnaam GROOT, achternaam klein
 */

import { createContext, useCallback, useContext, useRef, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { WerkbordSpeler } from "./types";
import { PEILJAAR } from "@oranje-wit/types";
import { leeftijdsGradient, leeftijdsKleur } from "./leeftijds-kleuren";

// ── Constanten ──────────────────────────────────────────────────────────────

const HOVER_DELAY = 400; // ms — vertraging bij koud hover
const SWAP_DELAY = 80; // ms — crossfade bij wisselen

const KAART_BREEDTE = 180;
const KAART_HOOGTE = 260;
const KAART_OFFSET_X = 16; // afstand van cursor naar kaart links
const KAART_OFFSET_Y = -20; // afstand van cursor naar kaart boven

// ── Tier-systeem op basis van USS ──────────────────────────────────────────

type Tier = "geen" | "brons" | "zilver" | "goud";

function bepaalTier(ussScore: number | null): Tier {
  if (ussScore === null) return "geen";
  if (ussScore >= 8.5) return "goud";
  if (ussScore >= 7.5) return "zilver";
  if (ussScore >= 6.5) return "brons";
  return "geen";
}

const TIER_RAND: Record<Tier, string> = {
  geen: "1.5px solid rgba(255,255,255,.08)",
  brons: "1.5px solid transparent",
  zilver: "1.5px solid transparent",
  goud: "1.5px solid transparent",
};

const TIER_RAND_GRADIENT: Record<Tier, string | null> = {
  geen: null,
  brons: "linear-gradient(135deg, #cd7f32, #8b4513, #cd7f32)",
  zilver: "linear-gradient(135deg, #c0c0c0, #888, #c0c0c0)",
  goud: "linear-gradient(135deg, #ffd700, #b8860b, #ffd700)",
};

function berekenLeeftijdKaart(
  geboortedatum: string | null,
  geboortejaar: number,
  seizoenEindjaar: number
): number {
  if (geboortedatum) {
    const peildatum = new Date(seizoenEindjaar, 11, 31);
    const geboorte = new Date(geboortedatum);
    return (
      Math.floor(((peildatum.getTime() - geboorte.getTime()) / (365.25 * 24 * 3600 * 1000)) * 10) /
      10
    );
  }
  return seizoenEindjaar - geboortejaar;
}

// ── Context ─────────────────────────────────────────────────────────────────

interface HoverKaartState {
  speler: WerkbordSpeler | null;
  x: number;
  y: number;
  isVisible: boolean;
}

interface HoverKaartContextValue {
  registerHover: (speler: WerkbordSpeler, x: number, y: number) => void;
  cancelHover: () => void;
  updatePos: (x: number, y: number) => void;
  onKaartEnter: () => void;
  onKaartLeave: () => void;
}

const HoverKaartContext = createContext<HoverKaartContextValue | null>(null);

export function useHoverKaart(): HoverKaartContextValue {
  const ctx = useContext(HoverKaartContext);
  if (!ctx) throw new Error("useHoverKaart moet binnen HoverKaartProvider gebruikt worden");
  return ctx;
}

// ── Provider ────────────────────────────────────────────────────────────────

export function HoverKaartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HoverKaartState>({
    speler: null,
    x: 0,
    y: 0,
    isVisible: false,
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const muisOpKaartRef = useRef(false);
  const isWarmRef = useRef(false); // true als kaart al zichtbaar was

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const registerHover = useCallback(
    (speler: WerkbordSpeler, x: number, y: number) => {
      clearTimer();

      setState((prev) => {
        // Positie altijd updaten
        if (prev.speler?.id === speler.id && prev.isVisible) {
          return { ...prev, x, y };
        }
        return prev;
      });

      const vertraging = isWarmRef.current ? SWAP_DELAY : HOVER_DELAY;

      timerRef.current = setTimeout(() => {
        isWarmRef.current = true;
        setState({ speler, x, y, isVisible: true });
        timerRef.current = null;
      }, vertraging);
    },
    [clearTimer]
  );

  const cancelHover = useCallback(() => {
    clearTimer();
    // Geef muis kans om naar kaart te bewegen
    timerRef.current = setTimeout(() => {
      if (!muisOpKaartRef.current) {
        isWarmRef.current = false;
        setState((prev) => ({ ...prev, isVisible: false }));
      }
      timerRef.current = null;
    }, 120);
  }, [clearTimer]);

  const updatePos = useCallback((x: number, y: number) => {
    setState((prev) => (prev.isVisible ? { ...prev, x, y } : prev));
  }, []);

  const onKaartEnter = useCallback(() => {
    muisOpKaartRef.current = true;
    clearTimer();
  }, [clearTimer]);

  const onKaartLeave = useCallback(() => {
    muisOpKaartRef.current = false;
    isWarmRef.current = false;
    setState((prev) => ({ ...prev, isVisible: false }));
  }, []);

  return (
    <HoverKaartContext.Provider
      value={{ registerHover, cancelHover, updatePos, onKaartEnter, onKaartLeave }}
    >
      {children}
      <HoverSpelersKaartPortal
        state={state}
        onKaartEnter={onKaartEnter}
        onKaartLeave={onKaartLeave}
      />
    </HoverKaartContext.Provider>
  );
}

// ── Portal/Render ────────────────────────────────────────────────────────────

function HoverSpelersKaartPortal({
  state,
  onKaartEnter,
  onKaartLeave,
}: {
  state: HoverKaartState;
  onKaartEnter: () => void;
  onKaartLeave: () => void;
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const prevSpelerIdRef = useRef<string | null>(null);

  // Crossfade bij speler-wissel of zichtbaarheid
  useEffect(() => {
    if (state.isVisible && state.speler) {
      if (prevSpelerIdRef.current !== state.speler.id) {
        // Nieuwe speler — reset flip, crossfade
        setIsFlipped(false);
        setOpacity(0);
        const t = setTimeout(() => setOpacity(1), 16);
        prevSpelerIdRef.current = state.speler.id;
        return () => clearTimeout(t);
      } else {
        setOpacity(1);
      }
    } else {
      setOpacity(0);
      prevSpelerIdRef.current = null;
    }
  }, [state.isVisible, state.speler]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setIsFlipped((prev) => (e.deltaY > 0 ? true : false));
  }, []);

  if (!state.speler) return null;

  const speler = state.speler;
  const leeftijd = berekenLeeftijdKaart(speler.geboortedatum, speler.geboortejaar, PEILJAAR);
  const gradient = leeftijdsGradient(leeftijd);
  const kleur = leeftijdsKleur(leeftijd);
  const tier = bepaalTier(speler.ussScore);
  const tierGradient = TIER_RAND_GRADIENT[tier];

  // Positie berekenen — kaart blijft in viewport
  const vensterB = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vensterH = typeof window !== "undefined" ? window.innerHeight : 800;
  let left = state.x + KAART_OFFSET_X;
  let top = state.y + KAART_OFFSET_Y;
  if (left + KAART_BREEDTE > vensterB - 12) left = state.x - KAART_BREEDTE - KAART_OFFSET_X;
  if (top + KAART_HOOGTE > vensterH - 12) top = vensterH - KAART_HOOGTE - 12;
  if (top < 12) top = 12;

  const achternaamDisplay = [speler.tussenvoegsel, speler.achternaam].filter(Boolean).join(" ");

  return (
    <>
      <style>{KAART_STYLES}</style>
      <div
        onMouseEnter={onKaartEnter}
        onMouseLeave={onKaartLeave}
        onWheel={handleWheel}
        style={{
          position: "fixed",
          left,
          top,
          width: KAART_BREEDTE,
          height: KAART_HOOGTE,
          zIndex: 9999,
          pointerEvents: "auto",
          opacity,
          transition: `opacity ${SWAP_DELAY}ms ease`,
          perspective: 600,
        }}
      >
        {/* Tier-gradient rand (als wrapper) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 10,
            padding: tierGradient ? 1.5 : 0,
            background: tierGradient ?? "transparent",
            boxSizing: "border-box",
          }}
        >
          {/* Kaart flip container */}
          <div
            className={`hover-kaart-flip${isFlipped ? "flipped" : ""}`}
            style={{ width: "100%", height: "100%", borderRadius: 9 }}
          >
            {/* VOORKANT */}
            <div className="hover-kaart-face hover-kaart-voor" style={{ borderRadius: 9 }}>
              <KaartVoorkant
                speler={speler}
                leeftijd={leeftijd}
                gradient={gradient}
                kleur={kleur}
                tier={tier}
              />
            </div>

            {/* ACHTERKANT */}
            <div className="hover-kaart-face hover-kaart-achter" style={{ borderRadius: 9 }}>
              <KaartAchterkant speler={speler} leeftijd={leeftijd} kleur={kleur} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Voorkant ─────────────────────────────────────────────────────────────────

function KaartVoorkant({
  speler,
  leeftijd,
  gradient,
  kleur,
  tier,
}: {
  speler: WerkbordSpeler;
  leeftijd: number;
  gradient: string;
  kleur: string;
  tier: Tier;
}) {
  const geslacht = speler.geslacht.toLowerCase() as "v" | "m";
  const geslachtKleur = geslacht === "v" ? "#ec4899" : "#60a5fa";
  const achternaamDisplay = [speler.tussenvoegsel, speler.achternaam].filter(Boolean).join(" ");

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 9,
        overflow: "hidden",
        background: "#141414",
        position: "relative",
      }}
    >
      {/* Volledige KNKV gradient als achtergrond */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: gradient,
          borderRadius: 9,
          opacity: 0.85,
        }}
      />
      {/* Donkere overlay voor leesbaarheid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.55) 100%)",
          borderRadius: 9,
        }}
      />

      {/* Noise textuur */}
      <div className="hover-kaart-noise" />
      {/* Statisch glim-effect — geen animatie */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 9,
          background:
            tier === "goud"
              ? "linear-gradient(135deg, transparent 10%, rgba(255,215,0,0.06) 28%, rgba(255,255,255,0.18) 42%, rgba(255,215,0,0.10) 55%, transparent 70%)"
              : tier === "zilver"
                ? "linear-gradient(135deg, transparent 15%, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.16) 45%, rgba(255,255,255,0.06) 60%, transparent 75%)"
                : "linear-gradient(135deg, transparent 20%, rgba(255,255,255,0.04) 35%, rgba(255,255,255,0.10) 45%, rgba(255,255,255,0.04) 55%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Inhoud */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header: leeftijd links, USS rechts */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            padding: "10px 10px 0",
          }}
        >
          {/* Leeftijd */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: "var(--text-1)", lineHeight: 1 }}>
              {Math.floor(leeftijd)}
            </span>
            <span style={{ fontSize: 8, color: "rgba(255,255,255,.35)", marginTop: 1 }}>
              leeftijd
            </span>
          </div>

          {/* USS Octagon */}
          {speler.ussScore !== null && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  clipPath:
                    "polygon(29% 0%, 71% 0%, 100% 29%, 100% 71%, 71% 100%, 29% 100%, 0% 71%, 0% 29%)",
                  background:
                    tier === "goud"
                      ? "rgba(255,215,0,.25)"
                      : tier === "zilver"
                        ? "rgba(192,192,192,.22)"
                        : tier === "brons"
                          ? "rgba(205,127,50,.22)"
                          : "rgba(255,107,0,.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 800,
                  color:
                    tier === "goud"
                      ? "#ffd700"
                      : tier === "zilver"
                        ? "#c0c0c0"
                        : tier === "brons"
                          ? "#cd7f32"
                          : "var(--accent)",
                  lineHeight: 1,
                }}
              >
                {speler.ussScore.toFixed(1)}
              </div>
              <span style={{ fontSize: 7, color: "rgba(255,255,255,.3)" }}>USS</span>
            </div>
          )}
        </div>

        {/* Shield foto-gebied */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px 16px 4px",
          }}
        >
          <div
            style={{
              width: 110,
              height: 120,
              clipPath:
                "polygon(50% 0%, 100% 12%, 100% 65%, 75% 85%, 50% 100%, 25% 85%, 0% 65%, 0% 12%)",
              background: `linear-gradient(160deg, rgba(255,255,255,.06) 0%, rgba(255,255,255,.02) 100%)`,
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {speler.fotoUrl ? (
              <img
                src={speler.fotoUrl}
                alt=""
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center 5%",
                }}
              />
            ) : (
              /* Initialen als placeholder */
              <span
                style={{
                  fontSize: 34,
                  fontWeight: 800,
                  color: geslachtKleur,
                  opacity: 0.4,
                  lineHeight: 1,
                  userSelect: "none",
                }}
              >
                {speler.roepnaam.charAt(0)}
                {speler.achternaam.charAt(0)}
              </span>
            )}

            {/* Subtiele gender-kleur tint onderaan */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "40%",
                background: `linear-gradient(to top, ${geslachtKleur}18 0%, transparent 100%)`,
              }}
            />
          </div>
        </div>

        {/* Naamblok onderaan */}
        <div
          style={{
            background: "rgba(0,0,0,.55)",
            backdropFilter: "blur(8px)",
            borderTop: "1px solid rgba(255,255,255,.06)",
            padding: "8px 10px",
          }}
        >
          {/* Roepnaam — GROOT */}
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "var(--text-1)",
              lineHeight: 1.1,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {speler.roepnaam}
          </div>

          {/* Achternaam — klein */}
          <div
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,.38)",
              marginTop: 2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {achternaamDisplay}
          </div>

          {/* Status + scroll hint */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 6,
            }}
          >
            <SpelerStatusBadge status={speler.status} />
            <span style={{ fontSize: 7, color: "rgba(255,255,255,.2)", letterSpacing: "0.05em" }}>
              scroll ↕
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Achterkant ────────────────────────────────────────────────────────────────

function KaartAchterkant({
  speler,
  leeftijd,
  kleur,
}: {
  speler: WerkbordSpeler;
  leeftijd: number;
  kleur: string;
}) {
  const teamLabel = speler.huidigTeam ?? speler.ingedeeldTeamNaam ?? "—";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 9,
        overflow: "hidden",
        background: "#141414",
        position: "relative",
      }}
    >
      {/* Tint achtergrond */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(215deg, #141414 0%, ${kleur}20 100%)`,
          borderRadius: 9,
        }}
      />
      <div className="hover-kaart-noise" />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: "14px 12px",
          height: "100%",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {/* Header */}
        <div style={{ borderBottom: "1px solid rgba(255,255,255,.07)", paddingBottom: 8 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-1)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {speler.roepnaam}
          </div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,.35)", marginTop: 1 }}>
            {[speler.tussenvoegsel, speler.achternaam].filter(Boolean).join(" ")}
          </div>
        </div>

        {/* Kerndata */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <AchterkantRij label="Leeftijd" waarde={`${leeftijd.toFixed(1)} jr`} />
          <AchterkantRij label="Geslacht" waarde={speler.geslacht === "V" ? "Dames" : "Heren"} />
          <AchterkantRij label="Ingedeeld in" waarde={teamLabel} />
          {speler.ussScore !== null && (
            <AchterkantRij label="USS score" waarde={speler.ussScore.toFixed(2)} accent />
          )}
        </div>

        {/* Huidige team */}
        {speler.huidigTeam && (
          <div
            style={{
              marginTop: "auto",
              padding: "6px 8px",
              background: "rgba(255,255,255,.04)",
              borderRadius: 5,
              border: "1px solid rgba(255,255,255,.07)",
            }}
          >
            <div
              style={{
                fontSize: 7,
                color: "rgba(255,255,255,.3)",
                marginBottom: 3,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Huidig team
            </div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,.55)", lineHeight: 1.4 }}>
              {speler.huidigTeam}
            </div>
          </div>
        )}

        {/* Scroll hint */}
        <div style={{ textAlign: "center", paddingTop: 4 }}>
          <span style={{ fontSize: 7, color: "rgba(255,255,255,.2)", letterSpacing: "0.05em" }}>
            scroll ↕ terug
          </span>
        </div>
      </div>
    </div>
  );
}

function AchterkantRij({
  label,
  waarde,
  accent = false,
}: {
  label: string;
  waarde: string;
  accent?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <span style={{ fontSize: 9, color: "rgba(255,255,255,.35)" }}>{label}</span>
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: accent ? "var(--accent)" : "rgba(255,255,255,.7)",
        }}
      >
        {waarde}
      </span>
    </div>
  );
}

function SpelerStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; kleur: string }> = {
    BESCHIKBAAR: { label: "Beschikbaar", kleur: "rgba(34,197,94,.7)" },
    TWIJFELT: { label: "Twijfelt", kleur: "rgba(249,115,22,.7)" },
    GEBLESSEERD: { label: "Geblesseerd", kleur: "rgba(249,115,22,.7)" },
    GAAT_STOPPEN: { label: "Gaat stoppen", kleur: "rgba(239,68,68,.7)" },
    GESTOPT: { label: "Gestopt", kleur: "rgba(239,68,68,.7)" },
    AFGEMELD: { label: "Afgemeld", kleur: "rgba(239,68,68,.7)" },
    ALGEMEEN_RESERVE: { label: "AR", kleur: "rgba(255,255,255,.3)" },
  };
  const c = config[status] ?? { label: status, kleur: "rgba(255,255,255,.3)" };
  return (
    <span style={{ fontSize: 8, fontWeight: 600, color: c.kleur, letterSpacing: "0.04em" }}>
      {c.label}
    </span>
  );
}

// ── CSS ───────────────────────────────────────────────────────────────────────

const KAART_STYLES = `
  .hover-kaart-flip {
    position: relative;
    transform-style: preserve-3d;
    transition: transform 0.65s cubic-bezier(0.23, 1, 0.32, 1);
    width: 100%;
    height: 100%;
  }
  .hover-kaart-flip.flipped {
    transform: rotateY(180deg);
  }
  .hover-kaart-face {
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    overflow: hidden;
  }
  .hover-kaart-achter {
    transform: rotateY(180deg);
  }
  .hover-kaart-noise {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
    pointer-events: none;
    opacity: 0.5;
    z-index: 0;
  }
`;
