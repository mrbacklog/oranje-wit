"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { KaartAchterkant, getDarkGradient, type AchterkantData } from "./kaart-achterkant";
import {
  TierLabel,
  SilverSheen,
  GoldShimmer,
  ShieldFoto,
  Sterren,
  StatBar,
} from "./kaart-effecten";
import {
  type KaartSize,
  SIZE_CONFIG,
  TIER_STYLES,
  STAT_LABELS,
  GROEP_LABELS,
  leeftijdNaarGroep,
  getAgeGradient,
} from "./kaart-constanten";

export interface SpelersKaartProps {
  spelerId: string;
  roepnaam: string;
  achternaam: string;
  leeftijd: number;
  team?: string;
  overall: number;
  stats: {
    schot: number;
    aanval: number;
    passing: number;
    verdediging: number;
    fysiek: number;
    mentaal: number;
  };
  tier: "brons" | "zilver" | "goud";
  sterren: number;
  fotoUrl?: string;
  size?: "mini" | "small" | "medium" | "large";
  flipbaar?: boolean;
  achterkantData?: AchterkantData;
  onClick?: () => void;
  state?: "default" | "loading" | "selected" | "disabled";
}

function SpelersKaartSkeleton({ size }: { size: KaartSize }) {
  const { cls } = SIZE_CONFIG[size];
  return (
    <div className={`${cls} bg-surface-card animate-pulse overflow-hidden rounded-2xl`}>
      {size === "mini" ? (
        <div className="flex h-full flex-col items-center justify-center gap-1">
          <div className="h-6 w-6 rounded-full bg-white/10" />
          <div className="h-2 w-8 rounded bg-white/10" />
        </div>
      ) : (
        <div className="flex h-full flex-col items-center gap-2 pt-4">
          <div className="h-10 w-10 rounded-full bg-white/10" />
          <div className="h-3 w-16 rounded bg-white/10" />
          <div className="h-2 w-12 rounded bg-white/10" />
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
  tier,
  sterren,
  fotoUrl,
  size = "medium",
  flipbaar = false,
  achterkantData,
  onClick,
  state = "default",
}: SpelersKaartProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const { cls } = SIZE_CONFIG[size];
  const gradient = getAgeGradient(leeftijd);
  const tierStyle = TIER_STYLES[tier];
  const groepLabel = GROEP_LABELS[leeftijdNaarGroep(leeftijd)] ?? "";

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

  const fotoSize = size === "large" ? 72 : size === "medium" ? 56 : size === "small" ? 36 : 20;
  const overallCls =
    size === "large"
      ? "text-5xl"
      : size === "medium"
        ? "text-4xl"
        : size === "small"
          ? "text-2xl"
          : "text-lg";
  const sterrenPx = size === "large" ? 14 : size === "medium" ? 12 : 10;
  const toonStats = size === "large" || size === "medium";
  const toonBadge = size === "large" || size === "medium";
  const radarSize = size === "large" ? 120 : 90;

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
        {/* VOORKANT */}
        <Voorkant
          size={size}
          cls={cls}
          gradient={gradient}
          tierStyle={tierStyle}
          tier={tier}
          state={state}
          toonBadge={toonBadge}
          toonStats={toonStats}
          fotoUrl={fotoUrl}
          roepnaam={roepnaam}
          achternaam={achternaam}
          fotoSize={fotoSize}
          overall={overall}
          overallCls={overallCls}
          sterren={sterren}
          sterrenPx={sterrenPx}
          groepLabel={groepLabel}
          team={team}
          leeftijd={leeftijd}
          stats={stats}
        />

        {/* ACHTERKANT */}
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

function Voorkant({
  size,
  gradient,
  tierStyle,
  tier,
  state,
  toonBadge,
  toonStats,
  fotoUrl,
  roepnaam,
  achternaam,
  fotoSize,
  overall,
  overallCls,
  sterren,
  sterrenPx,
  groepLabel,
  team,
  leeftijd,
  stats,
}: {
  size: KaartSize;
  cls: string;
  gradient: { from: string; to: string };
  tierStyle: { border: string; overlay: string };
  tier: string;
  state: string;
  toonBadge: boolean;
  toonStats: boolean;
  fotoUrl?: string;
  roepnaam: string;
  achternaam: string;
  fotoSize: number;
  overall: number;
  overallCls: string;
  sterren: number;
  sterrenPx: number;
  groepLabel: string;
  team?: string;
  leeftijd: number;
  stats: SpelersKaartProps["stats"];
}) {
  const nameCls =
    size === "large" ? "text-[15px]" : size === "medium" ? "text-[13px]" : "text-[11px]";

  return (
    <div
      className={`absolute inset-0 overflow-hidden rounded-2xl shadow-lg transition-shadow duration-300 hover:shadow-xl ${
        state === "disabled" ? "opacity-50 grayscale" : ""
      } ${state === "selected" ? "ring-ow-oranje ring-offset-surface-dark ring-2 ring-offset-2" : ""}`}
      style={{ border: `2px solid ${tierStyle.border}`, backfaceVisibility: "hidden" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
          opacity: 0.92,
        }}
      />
      <div className="absolute inset-0" style={{ background: tierStyle.overlay }} />
      <NoiseOverlay />
      {tier === "zilver" && <SilverSheen />}
      {tier === "goud" && <GoldShimmer />}

      <div className="relative z-[2] flex h-full flex-col p-2">
        {toonBadge && <TierLabel tier={tier} />}

        {size === "mini" ? (
          <div className="flex h-full flex-col items-center justify-center gap-0.5">
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
        ) : (
          <>
            <div className="mt-4 flex items-start gap-2">
              <ShieldFoto
                fotoUrl={fotoUrl}
                roepnaam={roepnaam}
                achternaam={achternaam}
                fotoSize={fotoSize}
              />
              <div className="flex-1 text-right">
                <div className="text-[8px] font-bold tracking-[1.5px] text-white/50 uppercase">
                  c.k.v. OW
                </div>
                <div
                  className={`${overallCls} leading-none font-black text-white drop-shadow-md`}
                  style={{ letterSpacing: "-2px" }}
                >
                  {overall}
                </div>
                <div className="mt-0.5 flex justify-end">
                  <Sterren count={sterren} size={sterrenPx} />
                </div>
                {toonBadge && (
                  <div className="mt-1 flex justify-end">
                    <span
                      className="inline-block rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase backdrop-blur-sm"
                      style={{ background: "rgba(255,255,255,0.2)" }}
                    >
                      {groepLabel}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-2 border-b border-white/15 pb-1.5">
              <div
                className={`truncate font-bold text-white uppercase ${nameCls}`}
                style={{ letterSpacing: "0.3px" }}
              >
                {roepnaam} {achternaam}
              </div>
              {toonBadge && (
                <div className="mt-0.5 text-[11px] text-white/60">
                  {team && <span>{team}</span>}
                  {team && <span> &bull; </span>}
                  <span>{leeftijd} jaar</span>
                </div>
              )}
            </div>
            {toonStats && (
              <div className="mt-auto pt-1.5">
                <div className="grid grid-cols-1 gap-[3px]">
                  {STAT_LABELS.map(({ key, label }) => (
                    <StatBar key={key} label={label} value={stats[key]} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {toonBadge && (
        <div className="absolute right-2 bottom-1 z-[5] text-[7px] font-semibold tracking-wider text-white/15 uppercase">
          OW Scout
        </div>
      )}
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
  );
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
