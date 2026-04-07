"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { KaartAchterkant, getDarkGradient, type AchterkantData } from "./kaart-achterkant";
import { SilverSheen, GoldShimmer, CentralShield, Sterren } from "./kaart-effecten";
import {
  type KaartSize,
  SIZE_CONFIG,
  TIER_STYLES,
  TIER_BORDER_GRADIENTS,
  GROEP_LABELS,
  leeftijdNaarGroep,
  getAgeGradient,
} from "./kaart-constanten";

// ─── Types ───

export interface SpelersKaartProps {
  spelerId: string;
  roepnaam: string;
  achternaam: string;
  leeftijd: number;
  team?: string;
  overall: number;
  /** Legacy 6-pijler stats (backward compatible) */
  stats: {
    schot: number;
    aanval: number;
    passing: number;
    verdediging: number;
    fysiek: number;
    mentaal: number;
  };
  /** V3: dynamische pijlerscores als JSON */
  pijlerScores?: Record<string, number>;
  /** V3: leeftijdsgroep naam */
  leeftijdsgroep?: string;
  tier: "brons" | "zilver" | "goud";
  sterren: number;
  fotoUrl?: string;
  size?: "mini" | "small" | "medium" | "large";
  flipbaar?: boolean;
  achterkantData?: AchterkantData;
  onClick?: () => void;
  state?: "default" | "loading" | "selected" | "disabled";
  /** V3: groei-indicator */
  groeiIndicator?: "geen" | "weinig" | "normaal" | "veel";
}

function SpelersKaartSkeleton({ size }: { size: KaartSize }) {
  const { cls } = SIZE_CONFIG[size];
  return (
    <div className={`${cls} bg-surface-card animate-pulse overflow-hidden rounded-2xl`}>
      {size === "mini" ? (
        <div className="flex h-full flex-col items-center justify-center gap-1">
          <div className="bg-surface-card/10 h-6 w-6 rounded-full" />
          <div className="bg-surface-card/10 h-2 w-8 rounded" />
        </div>
      ) : (
        <div className="flex h-full flex-col items-center gap-2 pt-4">
          <div className="bg-surface-card/10 h-10 w-10 rounded-full" />
          <div className="bg-surface-card/10 h-3 w-16 rounded" />
          <div className="bg-surface-card/10 h-2 w-12 rounded" />
        </div>
      )}
    </div>
  );
}

export function SpelersKaart({
  roepnaam,
  achternaam,
  leeftijd,
  team,
  overall,
  stats,
  pijlerScores,
  leeftijdsgroep: groepNaam,
  tier,
  sterren,
  fotoUrl,
  size = "medium",
  flipbaar = false,
  achterkantData,
  onClick,
  state = "default",
  groeiIndicator,
}: SpelersKaartProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const { cls } = SIZE_CONFIG[size];
  const gradient = getAgeGradient(leeftijd);
  const tierStyle = TIER_STYLES[tier];
  const groep = groepNaam ?? leeftijdNaarGroep(leeftijd);
  const groepLabel = GROEP_LABELS[groep] ?? "";

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (size === "mini" || size === "small") return;
      const card = cardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setTilt({ x: y * -8, y: x * 8 });
    },
    [size]
  );

  const handleMouseLeave = useCallback(() => setTilt({ x: 0, y: 0 }), []);

  const handleClick = useCallback(() => {
    if (state === "disabled") return;
    if (flipbaar && achterkantData) setIsFlipped((p) => !p);
    onClick?.();
  }, [flipbaar, achterkantData, onClick, state]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  if (state === "loading") return <SpelersKaartSkeleton size={size} />;

  const radarSize = size === "large" ? 180 : 120;
  const heeftDynamischePijlers = pijlerScores && Object.keys(pijlerScores).length > 0;

  // v4 schild-afmetingen (74% breed, 58% hoog van kaartbreedte)
  const schildW = size === "large" ? 222 : size === "medium" ? 148 : size === "small" ? 90 : 0;
  const schildH = size === "large" ? 261 : size === "medium" ? 174 : size === "small" ? 106 : 0;

  const tierBorderGradient = TIER_BORDER_GRADIENTS[tier];

  return (
    <div
      ref={cardRef}
      className={`${cls} relative cursor-pointer select-none`}
      style={{ perspective: "800px" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="article"
      aria-label={`${roepnaam} ${achternaam}, overall ${overall}${team ? `, ${team}` : ""}`}
      aria-disabled={state === "disabled" || undefined}
      aria-selected={state === "selected" || undefined}
      tabIndex={0}
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateX: isFlipped ? 0 : tilt.x, rotateY: isFlipped ? 180 : tilt.y }}
        transition={{
          type: "spring",
          stiffness: isFlipped ? 200 : 400,
          damping: isFlipped ? 25 : 30,
          mass: 0.5,
        }}
      >
        {/* ── VOORKANT ── */}
        <div
          className={`absolute inset-0 rounded-2xl ${state === "disabled" ? "opacity-50 grayscale" : ""} ${state === "selected" ? "ring-ow-oranje ring-offset-surface-dark ring-2 ring-offset-2" : ""}`}
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Tier gradient rand */}
          <div
            className="absolute inset-0 z-1 rounded-2xl"
            style={{ background: tierBorderGradient }}
          />

          {/* Inner kaart */}
          <div className="absolute inset-[2px] z-2 overflow-hidden rounded-[10px]">
            {/* Gradient achtergrond */}
            <div
              className="absolute inset-0 z-0"
              style={{
                background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
                opacity: 0.92,
              }}
            />
            <NoiseOverlay />
            {tier === "zilver" && <SilverSheen />}
            {tier === "goud" && <GoldShimmer />}

            {/* ── MINI ── */}
            {size === "mini" && (
              <div className="relative z-2 flex h-full flex-col items-center justify-center gap-0.5">
                <span
                  className="text-lg leading-none font-black text-white drop-shadow-md"
                  style={{ letterSpacing: "-1px" }}
                >
                  {overall}
                </span>
                <span className="text-[8px] font-bold text-white/60 uppercase">
                  {roepnaam.charAt(0)}
                  {achternaam.charAt(0)}
                </span>
              </div>
            )}

            {/* ── SMALL ── compact versie */}
            {size === "small" && (
              <div className="relative z-2 flex h-full flex-col">
                {/* Top: tier + USS */}
                <div className="flex shrink-0 items-start justify-between px-2 pt-2">
                  <TierPill tier={tier} small />
                  <div className="text-right">
                    <div
                      className="text-[18px] leading-none font-black text-white"
                      style={{ letterSpacing: "-1px" }}
                    >
                      {overall}
                    </div>
                    <Sterren count={sterren} size={8} />
                  </div>
                </div>
                {/* Schild */}
                <div className="flex flex-1 items-center justify-center pt-1">
                  <CentralShield
                    fotoUrl={fotoUrl}
                    roepnaam={roepnaam}
                    achternaam={achternaam}
                    tier={tier}
                    width={schildW}
                    height={schildH}
                  />
                </div>
                {/* Bottom */}
                <div
                  className="shrink-0 px-2 py-1.5"
                  style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}
                >
                  <div
                    className="truncate text-[10px] font-bold text-white uppercase"
                    style={{ letterSpacing: "0.3px" }}
                  >
                    {roepnaam} {achternaam}
                  </div>
                  {team && <div className="mt-0.5 truncate text-[9px] text-white/50">{team}</div>}
                </div>
              </div>
            )}

            {/* ── MEDIUM + LARGE: v4 lay-out ── */}
            {(size === "medium" || size === "large") && (
              <div className="relative z-2 flex h-full flex-col">
                {/* Kaart-top: hoeken L + R */}
                <div
                  className="flex shrink-0 items-start justify-between"
                  style={{
                    height: size === "large" ? 80 : 58,
                    padding: size === "large" ? "14px 15px 0" : "10px 11px 0",
                  }}
                >
                  {/* Links: tier + doelgroep */}
                  <div className="flex flex-col gap-[3px]">
                    <TierPill tier={tier} />
                    <InfoPill dim>{groepLabel}</InfoPill>
                    {groeiIndicator && groeiIndicator !== "normaal" && (
                      <GroeiPijl groei={groeiIndicator} />
                    )}
                  </div>
                  {/* Rechts: USS score */}
                  <div className="text-right">
                    <div className="text-[8px] font-bold tracking-[1.5px] text-white/42 uppercase">
                      USS
                    </div>
                    <div
                      className="leading-none font-black text-white drop-shadow-md"
                      style={{
                        fontSize: size === "large" ? 62 : 46,
                        letterSpacing: "-2px",
                        textShadow: "0 2px 12px rgba(0,0,0,.4)",
                      }}
                    >
                      {overall}
                    </div>
                    <Sterren count={sterren} size={size === "large" ? 14 : 11} />
                  </div>
                </div>

                {/* Kaart-mid: groot centraal schild */}
                <div className="flex flex-1 items-center justify-center pt-1">
                  <CentralShield
                    fotoUrl={fotoUrl}
                    roepnaam={roepnaam}
                    achternaam={achternaam}
                    tier={tier}
                    width={schildW}
                    height={schildH}
                  />
                </div>

                {/* Kaart-bot: frosted panel */}
                <div
                  className="shrink-0"
                  style={{
                    padding: size === "large" ? "10px 18px 14px" : "8px 13px 11px",
                    background: "rgba(0,0,0,0.35)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div
                    className="truncate font-extrabold text-white uppercase"
                    style={{
                      fontSize: size === "large" ? 16 : 14,
                      letterSpacing: "0.3px",
                    }}
                  >
                    {roepnaam} {achternaam}
                  </div>
                  <div
                    className="mt-0.5 truncate text-white/50"
                    style={{ fontSize: size === "large" ? 13 : 11 }}
                  >
                    {leeftijd} jaar · {groepLabel}
                  </div>
                  {/* Mini stats onderaan */}
                  <div
                    className="mt-1.5 grid gap-[3px]"
                    style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
                  >
                    {(heeftDynamischePijlers
                      ? Object.entries(pijlerScores!).slice(0, 3)
                      : ([
                          ["SCH", stats.schot],
                          ["AAN", stats.aanval],
                          ["FYS", stats.fysiek],
                        ] as [string, number][])
                    ).map(([lbl, val]) => (
                      <MiniStat key={lbl} label={String(lbl).substring(0, 3)} value={Number(val)} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Watermark */}
            {size !== "mini" && (
              <div className="absolute right-2 bottom-1 z-5 text-[7px] font-semibold tracking-wider text-white/15 uppercase">
                OW Scout
              </div>
            )}

            {/* Geselecteerd vinkje */}
            {state === "selected" && (
              <div className="bg-ow-oranje absolute right-2 bottom-2 z-10 flex h-6 w-6 items-center justify-center rounded-full text-white">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* ── ACHTERKANT ── */}
        {flipbaar && achterkantData && (
          <KaartAchterkant
            roepnaam={roepnaam}
            achternaam={achternaam}
            data={achterkantData}
            leeftijd={leeftijd}
            gradientStyle={getDarkGradient(leeftijd)}
            tierBorderColor={tierStyle.border}
            radarSize={radarSize}
          />
        )}
      </motion.div>
    </div>
  );
}

// ─── Tier pill (linksboven op kaart) ───

function TierPill({ tier, small }: { tier: string; small?: boolean }) {
  const bg: Record<string, string> = {
    brons: "#cd7f32",
    zilver: "#c0c0c0",
    goud: "#ffd700",
  };
  const color: Record<string, string> = {
    brons: "#3d2200",
    zilver: "#2a2a2a",
    goud: "#5c4a00",
  };
  return (
    <span
      className="rounded font-extrabold uppercase"
      style={{
        background: bg[tier] ?? "rgba(255,255,255,0.2)",
        color: color[tier] ?? "white",
        fontSize: small ? 8 : 9,
        padding: small ? "2px 6px" : "3px 8px",
        letterSpacing: "1px",
      }}
    >
      {tier}
    </span>
  );
}

// ─── Info pill (kleine badge) ───

function InfoPill({ children, dim }: { children: React.ReactNode; dim?: boolean }) {
  return (
    <span
      className="rounded uppercase"
      style={{
        padding: "3px 8px",
        fontSize: dim ? 8.5 : 9,
        fontWeight: dim ? 600 : 800,
        letterSpacing: "0.7px",
        background: "rgba(0,0,0,0.32)",
        color: "rgba(255,255,255,0.82)",
        backdropFilter: "blur(6px)",
        opacity: dim ? 0.7 : 1,
        whiteSpace: "nowrap" as const,
      }}
    >
      {children}
    </span>
  );
}

// ─── Mini stat box (3 vakjes in kaart-bot) ───

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="rounded text-center"
      style={{ background: "rgba(0,0,0,0.28)", padding: "4px 2px" }}
    >
      <div
        className="text-[8px] font-bold text-white/42 uppercase"
        style={{ letterSpacing: "0.5px" }}
      >
        {label}
      </div>
      <div className="text-[14px] leading-tight font-black text-white">{value}</div>
    </div>
  );
}

// ─── Groei-indicator pijl ───

function GroeiPijl({ groei }: { groei: string }) {
  if (groei === "veel") {
    return (
      <span className="text-[10px] text-green-400" title="Veel groei">
        ▲▲
      </span>
    );
  }
  if (groei === "weinig") {
    return (
      <span className="text-[10px] text-yellow-400" title="Weinig groei">
        ▼
      </span>
    );
  }
  if (groei === "geen") {
    return (
      <span className="text-[10px] text-red-400" title="Geen groei">
        ▼▼
      </span>
    );
  }
  return null;
}

function NoiseOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
        zIndex: 1,
      }}
    />
  );
}

export type { AchterkantData } from "./kaart-achterkant";
