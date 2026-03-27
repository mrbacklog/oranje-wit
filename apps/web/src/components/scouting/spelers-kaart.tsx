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
  getPijlersVoorKaart,
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

  // Bepaal of we v3 dynamische pijlers of legacy stats tonen
  const heeftDynamischePijlers = pijlerScores && Object.keys(pijlerScores).length > 0;

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
                      <div className="mt-1 flex items-center justify-end gap-1">
                        <span
                          className="inline-block rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase backdrop-blur-sm"
                          style={{ background: "rgba(255,255,255,0.2)" }}
                        >
                          {groepLabel}
                        </span>
                        {/* Groei-indicator */}
                        {groeiIndicator && groeiIndicator !== "normaal" && (
                          <GroeiPijl groei={groeiIndicator} />
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-2 border-b border-white/15 pb-1.5">
                  <div
                    className={`truncate font-bold text-white uppercase ${
                      size === "large"
                        ? "text-[15px]"
                        : size === "medium"
                          ? "text-[13px]"
                          : "text-[11px]"
                    }`}
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
                    {heeftDynamischePijlers ? (
                      <DynamischeStats pijlerScores={pijlerScores!} groep={groep} />
                    ) : (
                      <div className="grid grid-cols-1 gap-[3px]">
                        {STAT_LABELS.map(({ key, label }) => (
                          <StatBar key={key} label={label} value={stats[key]} />
                        ))}
                      </div>
                    )}
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

// ─── Dynamische stats (v3) ───

function DynamischeStats({
  pijlerScores,
  groep,
}: {
  pijlerScores: Record<string, number>;
  groep: string;
}) {
  const { blokken, allePijlers } = getPijlersVoorKaart(groep);
  const heeftBlokken = allePijlers.some((p) => p.blok);

  if (!heeftBlokken) {
    // Blauw/Groen: eenvoudige lijst
    return (
      <div className="grid grid-cols-1 gap-[3px]">
        {allePijlers.map((pijler) => (
          <StatBar
            key={pijler.code}
            label={pijler.code.substring(0, 3)}
            value={pijlerScores[pijler.code] ?? 0}
          />
        ))}
      </div>
    );
  }

  // Geel+: met blokken
  return (
    <div className="flex flex-col gap-1">
      {blokken.map((blok) => (
        <div key={blok.naam}>
          <div className="text-[7px] font-bold tracking-wider text-white/30 uppercase">
            {blok.naam}
          </div>
          {blok.pijlers.map((pijler) => (
            <StatBar
              key={pijler.code}
              label={pijler.code.substring(0, 3)}
              value={pijlerScores[pijler.code] ?? 0}
            />
          ))}
        </div>
      ))}
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
