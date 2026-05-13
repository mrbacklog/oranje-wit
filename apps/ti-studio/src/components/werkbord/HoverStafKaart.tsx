"use client";

/**
 * HoverStafKaart — zwevende stafkaart bij hover op stafnamen
 *
 * Gedrag:
 * - 400ms vertraging bij eerste hover (koud)
 * - 80ms crossfade bij wisselen tussen stafleden (warm)
 * - Kaart verdwijnt bij mouseout (tenzij muis op kaart zelf is)
 *
 * Ontwerp: 220px breed, grayscale foto + accent tint, type-badge,
 * naam+rol, speler-badge (optioneel), koppelingen, 5 seizoenen historie.
 */

import { createContext, useCallback, useContext, useRef, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { WerkbordStaf } from "./types";

// ── Constanten ──────────────────────────────────────────────────────────────

const HOVER_DELAY = 400;
const SWAP_DELAY = 80;

const KAART_BREEDTE = 220;
const KAART_OFFSET_X = 16;
const KAART_OFFSET_Y = -20;

// ── Type-iconen (inline SVG paths) ─────────────────────────────────────────

function IcoonTechnisch({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

function IcoonMedisch({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 11v4" />
      <path d="M14 13h-4" />
      <path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <path d="M18 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Z" />
    </svg>
  );
}

function IcoonOndersteunend({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

function TypeIcoon({
  type,
  size = 16,
}: {
  type: "technisch" | "medisch" | "ondersteunend";
  size?: number;
}) {
  const kleur =
    type === "technisch"
      ? "var(--type-technisch, #6b7cf6)"
      : type === "medisch"
        ? "var(--type-medisch, #22c55e)"
        : "var(--type-ondersteunend, #f97316)";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", color: kleur, flexShrink: 0 }}>
      {type === "technisch" ? (
        <IcoonTechnisch size={size} />
      ) : type === "medisch" ? (
        <IcoonMedisch size={size} />
      ) : (
        <IcoonOndersteunend size={size} />
      )}
    </span>
  );
}

// ── Context ─────────────────────────────────────────────────────────────────

interface HoverStafState {
  staf: WerkbordStaf | null;
  x: number;
  y: number;
  isVisible: boolean;
}

interface HoverStafKaartContextValue {
  registerHover: (staf: WerkbordStaf, x: number, y: number) => void;
  cancelHover: () => void;
  updatePos: (x: number, y: number) => void;
  onKaartEnter: () => void;
  onKaartLeave: () => void;
}

const HoverStafKaartContext = createContext<HoverStafKaartContextValue | null>(null);

export function useHoverStafKaart(): HoverStafKaartContextValue {
  const ctx = useContext(HoverStafKaartContext);
  if (!ctx) throw new Error("useHoverStafKaart moet binnen HoverStafKaartProvider gebruikt worden");
  return ctx;
}

// ── Provider ────────────────────────────────────────────────────────────────

export function HoverStafKaartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HoverStafState>({
    staf: null,
    x: 0,
    y: 0,
    isVisible: false,
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const muisOpKaartRef = useRef(false);
  const isWarmRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const registerHover = useCallback(
    (staf: WerkbordStaf, x: number, y: number) => {
      clearTimer();

      setState((prev) => {
        if (prev.staf?.id === staf.id && prev.isVisible) {
          return { ...prev, x, y };
        }
        return prev;
      });

      const vertraging = isWarmRef.current ? SWAP_DELAY : HOVER_DELAY;

      timerRef.current = setTimeout(() => {
        isWarmRef.current = true;
        setState({ staf, x, y, isVisible: true });
        timerRef.current = null;
      }, vertraging);
    },
    [clearTimer]
  );

  const cancelHover = useCallback(() => {
    clearTimer();
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
    <HoverStafKaartContext.Provider
      value={{ registerHover, cancelHover, updatePos, onKaartEnter, onKaartLeave }}
    >
      {children}
      <HoverStafKaartPortal state={state} onKaartEnter={onKaartEnter} onKaartLeave={onKaartLeave} />
    </HoverStafKaartContext.Provider>
  );
}

// ── Portal/Render ────────────────────────────────────────────────────────────

function HoverStafKaartPortal({
  state,
  onKaartEnter,
  onKaartLeave,
}: {
  state: HoverStafState;
  onKaartEnter: () => void;
  onKaartLeave: () => void;
}) {
  const [opacity, setOpacity] = useState(0);
  const prevStafIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (state.isVisible && state.staf) {
      if (prevStafIdRef.current !== state.staf.id) {
        setOpacity(0);
        const t = setTimeout(() => setOpacity(1), 16);
        prevStafIdRef.current = state.staf.id;
        return () => clearTimeout(t);
      } else {
        setOpacity(1);
      }
    } else {
      setOpacity(0);
      prevStafIdRef.current = null;
    }
  }, [state.isVisible, state.staf]);

  if (!state.staf) return null;

  const staf = state.staf;

  const vensterB = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vensterH = typeof window !== "undefined" ? window.innerHeight : 800;

  // Geschatte hoogte op basis van inhoud
  const koppelingenH = (staf.koppelingen?.length ?? 0) * 20 + (staf.koppelingen?.length ? 52 : 0);
  const historieH = (staf.historie?.length ?? 0) * 22 + (staf.historie?.length ? 36 : 0);
  const kaartHoogte = 210 + koppelingenH + historieH;

  let left = state.x + KAART_OFFSET_X;
  let top = state.y + KAART_OFFSET_Y;
  if (left + KAART_BREEDTE > vensterB - 12) left = state.x - KAART_BREEDTE - KAART_OFFSET_X;
  if (top + kaartHoogte > vensterH - 12) top = vensterH - kaartHoogte - 12;
  if (top < 12) top = 12;

  return (
    <div
      onMouseEnter={onKaartEnter}
      onMouseLeave={onKaartLeave}
      style={{
        position: "fixed",
        left,
        top,
        width: KAART_BREEDTE,
        zIndex: 9999,
        pointerEvents: "auto",
        opacity,
        transition: `opacity ${SWAP_DELAY}ms ease`,
        borderRadius: 12,
        overflow: "hidden",
        background: "linear-gradient(160deg, #1a1a1e 0%, #0c0c0f 55%, #121216 100%)",
        border: "2px solid rgba(255, 140, 0, .25)",
        boxShadow: "0 8px 32px rgba(0,0,0,.6), 0 0 20px rgba(255, 140, 0, .08)",
      }}
    >
      <StafKaartInhoud staf={staf} />
    </div>
  );
}

// ── Kaart inhoud ─────────────────────────────────────────────────────────────

const KLEUR_DOT: Record<string, string> = {
  blauw: "#6b7cf6",
  groen: "#22c55e",
  geel: "#eab308",
  oranje: "#f97316",
  rood: "#ef4444",
  senior: "#94a3b8",
};

function StafKaartInhoud({ staf }: { staf: WerkbordStaf }) {
  const type = staf.type ?? "technisch";
  const initialen = staf.naam
    .split(" ")
    .filter((w) => w.length > 0)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const eersteRol = staf.rollen[0] ?? staf.teams[0]?.rol ?? "";
  const koppelingen = staf.koppelingen ?? [];
  const historie = staf.historie ?? [];

  return (
    <>
      {/* Foto */}
      <div style={{ position: "relative", width: "100%", height: 160, overflow: "hidden" }}>
        {staf.fotoUrl ? (
          <img
            src={staf.fotoUrl}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 20%",
              filter: "grayscale(1)",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              fontWeight: 900,
              color: "rgba(255, 140, 0, .2)",
              background: "var(--bg-2, #1e1e1e)",
            }}
          >
            {initialen}
          </div>
        )}

        {/* Accent tint overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255, 140, 0, 0.1)",
            mixBlendMode: "color",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />

        {/* Gradient onderaan */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "60%",
            background: "linear-gradient(transparent, #0c0c0f)",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />

        {/* Type-badge rechtsboven */}
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 5,
            width: 28,
            height: 28,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,.6)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,.1)",
          }}
        >
          <TypeIcoon type={type} size={16} />
        </div>

        {/* Memo linksboven */}
        {(staf.memoCount ?? 0) > 0 && (
          <div style={{ position: "absolute", top: 10, left: 10, zIndex: 5 }}>
            <span
              style={{
                width: 20,
                height: 20,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: staf.memoRisico ? "#ef4444" : "#eab308",
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,.5))",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 3h10l4 4v14H5z" />
                <path d="M15 3v4h4" />
                <path d="M8 12h8M8 15h8M8 18h5" />
              </svg>
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ position: "relative", zIndex: 1, padding: "12px 14px 14px" }}>
        {/* Naam */}
        <div
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: "var(--text-1, #fafafa)",
            letterSpacing: "-0.02em",
            marginBottom: 4,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {staf.naam}
        </div>

        {/* Rol met type-icoon */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: "var(--text-2, #a3a3a3)",
            marginBottom: eersteRol ? 10 : 6,
          }}
        >
          <TypeIcoon type={type} size={13} />
          {eersteRol}
        </div>

        {/* Speler-badge */}
        {staf.isSpeler && staf.spelerTeamNaam && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 7px",
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 500,
              color: "var(--text-2, #a3a3a3)",
              background: "rgba(255,255,255,.03)",
              border: "1px solid var(--border-1, rgba(255,255,255,.1))",
              marginBottom: 10,
            }}
          >
            <span
              style={{
                width: 11,
                height: 11,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
              </svg>
            </span>
            {staf.spelerTeamNaam}
          </div>
        )}

        {/* Koppelingen */}
        {koppelingen.length > 0 && (
          <>
            <div
              style={{
                fontSize: 8,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--text-muted, #666)",
                marginBottom: 5,
              }}
            >
              {koppelingen.length === 1 ? "Huidige koppeling" : "Huidige koppelingen"}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                marginBottom: 10,
                paddingBottom: 8,
                borderBottom: "1px solid var(--border-0, rgba(255,255,255,.06))",
              }}
            >
              {koppelingen.map((k) => (
                <div
                  key={k.teamId}
                  style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: KLEUR_DOT[k.teamKleur] ?? "#94a3b8",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      color: "var(--text-1, #fafafa)",
                      fontWeight: 500,
                      flex: 1,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {k.teamNaam}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      color: "var(--text-3, #555)",
                      marginLeft: "auto",
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                      flexShrink: 0,
                    }}
                  >
                    <TypeIcoon type={type} size={10} />
                    {k.rol}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Fallback: toon teams uit WerkbordStaf als koppelingen leeg is */}
        {koppelingen.length === 0 && staf.teams.length > 0 && (
          <>
            <div
              style={{
                fontSize: 8,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--text-muted, #666)",
                marginBottom: 5,
              }}
            >
              {staf.teams.length === 1 ? "Huidige koppeling" : "Huidige koppelingen"}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                marginBottom: 10,
                paddingBottom: 8,
                borderBottom: "1px solid var(--border-0, rgba(255,255,255,.06))",
              }}
            >
              {staf.teams.map((t) => (
                <div
                  key={t.teamId}
                  style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: KLEUR_DOT[t.kleur] ?? "#94a3b8",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      color: "var(--text-1, #fafafa)",
                      fontWeight: 500,
                      flex: 1,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {t.teamNaam}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      color: "var(--text-3, #555)",
                      marginLeft: "auto",
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                      flexShrink: 0,
                    }}
                  >
                    <TypeIcoon type={type} size={10} />
                    {t.rol}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Historie */}
        {historie.length > 0 && (
          <>
            <div
              style={{
                fontSize: 8,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--text-muted, #666)",
                marginBottom: 5,
              }}
            >
              {`Historie · ${historie.length} seizoen${historie.length !== 1 ? "en" : ""}`}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {historie.slice(0, 5).map((h, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 8,
                    padding: "3px 0",
                    borderBottom:
                      i < Math.min(historie.length, 5) - 1
                        ? "1px solid var(--border-0, rgba(255,255,255,.06))"
                        : "none",
                    fontSize: 10,
                  }}
                >
                  <span
                    style={{
                      color: "var(--text-3, #555)",
                      fontVariantNumeric: "tabular-nums",
                      minWidth: 52,
                      flexShrink: 0,
                      fontWeight: 600,
                    }}
                  >
                    {h.seizoen}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
                    <span
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: KLEUR_DOT[h.teamKleur] ?? "#94a3b8",
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ color: "var(--text-2, #a3a3a3)", flex: 1 }}>{h.teamNaam}</span>
                    <span
                      style={{
                        fontSize: 8,
                        color: "var(--text-3, #555)",
                        marginLeft: "auto",
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        flexShrink: 0,
                      }}
                    >
                      <TypeIcoon type={type} size={8} />
                      {h.rol}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
