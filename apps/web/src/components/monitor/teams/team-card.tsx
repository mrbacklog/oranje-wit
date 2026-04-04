"use client";

import { motion } from "framer-motion";
import type { TeamSpelerTelling } from "@/lib/monitor/queries/teams";
import type { StafLid } from "@/lib/monitor/queries/staf";
import { getTeamKleurConfig } from "./team-kleuren";

type TeamCardProps = {
  owCode: string;
  naam: string;
  bondNaam?: string | null;
  kleur?: string | null;
  leeftijdsgroep?: string | null;
  spelvorm?: string | null;
  telling?: TeamSpelerTelling;
  staf?: StafLid[];
};

const springTransition = { type: "spring" as const, stiffness: 400, damping: 25 };

function formatStaf(staf: StafLid[]): string | null {
  const trainers = staf.filter((s) => s.rol === "Trainer/Coach" || s.rol === "Hoofdtrainer");
  if (trainers.length === 0) return null;

  const abbreviate = (naam: string) => {
    const parts = naam.trim().split(/\s+/);
    if (parts.length < 2) return naam;
    return `${parts[0][0]}. ${parts.slice(1).join(" ")}`;
  };

  if (trainers.length === 1) return trainers[0].naam;
  if (trainers.length === 2) {
    return `${abbreviate(trainers[0].naam)} · ${abbreviate(trainers[1].naam)}`;
  }
  const rest = trainers.length - 2;
  return `${abbreviate(trainers[0].naam)} · ${abbreviate(trainers[1].naam)} +${rest}`;
}

function SpelvormBadge({ spelvorm }: { spelvorm: string }) {
  const label = spelvorm === "8-tal" ? "8T" : spelvorm === "4-tal" ? "4T" : null;
  if (!label) return null;
  return (
    <span
      className="absolute top-2 right-2 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs"
      style={{ background: "rgba(0,0,0,0.25)" }}
    >
      {label}
    </span>
  );
}

function GenderDots({ heren, dames }: { heren: number; dames: number }) {
  const total = heren + dames;
  if (total === 0) return null;

  const maxDots = 12;
  const ratio = total > maxDots ? maxDots / total : 1;
  const herenDots = Math.round(heren * ratio);
  const damesDots = Math.round(dames * ratio);

  return (
    <span className="flex items-center gap-[3px]">
      {Array.from({ length: herenDots }).map((_, i) => (
        <span
          key={`m-${i}`}
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: "#60A5FA" }}
        />
      ))}
      {Array.from({ length: damesDots }).map((_, i) => (
        <span
          key={`v-${i}`}
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: "#F472B6" }}
        />
      ))}
    </span>
  );
}

export function TeamCard({
  owCode,
  naam,
  bondNaam,
  kleur,
  leeftijdsgroep,
  spelvorm,
  telling,
  staf,
}: TeamCardProps) {
  const config = getTeamKleurConfig({ kleur, leeftijdsgroep, ow_code: owCode });
  const stafText = staf ? formatStaf(staf) : null;

  return (
    <motion.a
      href={`/monitor/teams/${owCode}`}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={springTransition}
      className="group relative block overflow-hidden rounded-xl"
      style={{
        border: `1px solid ${config.borderColor}`,
        ...(config.topBorder ? { borderTop: `2px solid ${config.topBorder}` } : {}),
      }}
    >
      {/* Zone 1: Gradient header */}
      <div
        className="relative min-h-[80px] px-3 pt-3 pb-2 md:min-h-[88px] md:px-4 md:pt-4"
        style={{ background: config.gradient }}
      >
        <h3 className="text-2xl leading-tight font-bold" style={{ color: config.textOnGradient }}>
          {naam}
        </h3>
        {bondNaam && (
          <p
            className="mt-0.5 text-xs font-medium opacity-60"
            style={{ color: config.textOnGradient }}
          >
            {bondNaam}
          </p>
        )}
        {spelvorm && <SpelvormBadge spelvorm={spelvorm} />}

        {/* Hover glow */}
        <span
          className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* Zone 2: Data */}
      <div className="space-y-1.5 px-3 py-3 md:px-4" style={{ background: config.tintBg }}>
        {/* Spelers rij */}
        {telling && telling.totaal > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-text-secondary text-sm">{telling.totaal} spelers</span>
            <GenderDots heren={telling.heren} dames={telling.dames} />
          </div>
        )}

        {/* Staf */}
        {stafText && <p className="text-text-muted truncate text-xs">{stafText}</p>}
      </div>
    </motion.a>
  );
}
