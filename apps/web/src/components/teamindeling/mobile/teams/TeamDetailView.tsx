"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ProgressBar } from "@oranje-wit/ui";

// ─── Types ──────────────────────────────────────────────────────

export interface SpelerItem {
  id: string;
  roepnaam: string;
  achternaam: string;
  korfbalLeeftijd: number;
  geslacht: string;
  kleur: string | null;
}

export interface StafItem {
  id: string;
  naam: string;
  rol: string;
}

export interface TeamDetailData {
  id: number;
  naam: string;
  categorie: string;
  kleur: string | null;
  leeftijdsgroep: string | null;
  spelvorm: string | null;
  spelers: SpelerItem[];
  staf: StafItem[];
  target: number;
}

// ─── Kleur helpers ──────────────────────────────────────────────

const KLEUR_DOT_CSS: Record<string, string> = {
  BLAUW: "var(--knkv-blauw-500)",
  GROEN: "var(--knkv-groen-500)",
  GEEL: "var(--knkv-geel-500)",
  ORANJE: "var(--knkv-oranje-500)",
  ROOD: "var(--knkv-rood-500)",
};

const KLEUR_GRADIENT: Record<string, { from: string; to: string }> = {
  BLAUW: { from: "var(--knkv-blauw-400)", to: "var(--knkv-blauw-600)" },
  GROEN: { from: "var(--knkv-groen-400)", to: "var(--knkv-groen-600)" },
  GEEL: { from: "var(--knkv-geel-400)", to: "var(--knkv-geel-600)" },
  ORANJE: { from: "var(--knkv-oranje-400)", to: "var(--knkv-oranje-600)" },
  ROOD: { from: "var(--knkv-rood-400)", to: "var(--knkv-rood-600)" },
};

const KLEUR_LABELS: Record<string, string> = {
  BLAUW: "Blauw (5-7)",
  GROEN: "Groen (8-9)",
  GEEL: "Geel (10-12)",
  ORANJE: "Oranje (13-15)",
  ROOD: "Rood (16-18)",
};

// ─── Stagger variants ──────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const },
  },
};

// ─── Component ─────────────────────────────────────────────────

interface TeamDetailViewProps {
  team: TeamDetailData;
}

export function TeamDetailView({ team }: TeamDetailViewProps) {
  const vulgraad = team.target > 0 ? (team.spelers.length / team.target) * 100 : 0;
  const kleurKey = team.kleur?.toUpperCase() ?? null;

  // Gradient voor avatar
  const avatarGradient = (speler: SpelerItem) => {
    const k = speler.kleur?.toUpperCase();
    if (k && KLEUR_GRADIENT[k]) {
      return `linear-gradient(135deg, ${KLEUR_GRADIENT[k].from}, ${KLEUR_GRADIENT[k].to})`;
    }
    return "linear-gradient(135deg, var(--ow-oranje-500), var(--ow-oranje-700))";
  };

  return (
    <motion.div
      className="flex flex-col gap-5 px-4 pt-4 pb-24"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Team Header */}
      <div>
        <div className="mb-1 flex items-center gap-2.5">
          {kleurKey && (
            <div
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: KLEUR_DOT_CSS[kleurKey] ?? "var(--text-tertiary)" }}
            />
          )}
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {team.naam}
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {team.spelvorm ?? "Team"}
          {kleurKey && KLEUR_LABELS[kleurKey] && <> &middot; {KLEUR_LABELS[kleurKey]}</>}
          {team.categorie === "a" && <> &middot; A-categorie</>}
        </p>
      </div>

      {/* KPI's + vulgraad */}
      <div
        className="rounded-2xl p-4"
        style={{
          backgroundColor: "var(--surface-card)",
          border: "1px solid var(--border-default)",
        }}
      >
        <div className="mb-3 flex gap-4">
          <div className="flex-1 text-center">
            <div
              className="text-3xl font-bold tabular-nums"
              style={{ color: "var(--text-primary)" }}
            >
              {team.spelers.length}
            </div>
            <div className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
              spelers
            </div>
          </div>
          <div className="flex-1 text-center">
            <div
              className="text-3xl font-bold tabular-nums"
              style={{ color: "var(--text-primary)" }}
            >
              {team.target}
            </div>
            <div className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
              target
            </div>
          </div>
        </div>
        <ProgressBar
          value={team.spelers.length}
          max={team.target}
          showValue
          valueFormat="absolute"
          size="md"
        />
      </div>

      {/* Staf sectie */}
      {team.staf.length > 0 && (
        <div>
          <h2
            className="mb-2 text-[13px] font-semibold tracking-wider uppercase"
            style={{ color: "var(--text-tertiary)" }}
          >
            Staf
          </h2>
          <div
            className="overflow-hidden rounded-2xl"
            style={{
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--border-default)",
            }}
          >
            {team.staf.map((s, idx) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-4 py-3"
                style={{
                  borderBottom:
                    idx < team.staf.length - 1 ? "1px solid var(--border-default)" : undefined,
                }}
              >
                <span className="text-base font-medium" style={{ color: "var(--text-primary)" }}>
                  {s.naam}
                </span>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {s.rol}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spelers sectie */}
      <div>
        <h2
          className="mb-2 text-[13px] font-semibold tracking-wider uppercase"
          style={{ color: "var(--text-tertiary)" }}
        >
          Spelers ({team.spelers.length})
        </h2>
        <motion.div
          className="overflow-hidden rounded-2xl"
          style={{
            backgroundColor: "var(--surface-card)",
            border: "1px solid var(--border-default)",
          }}
          variants={container}
          initial="hidden"
          animate="show"
        >
          {team.spelers.length === 0 ? (
            <div className="p-6 text-center">
              <p style={{ color: "var(--text-tertiary)" }}>
                Nog geen spelers ingedeeld bij dit team.
              </p>
            </div>
          ) : (
            team.spelers.map((speler, idx) => (
              <motion.div key={speler.id} variants={item}>
                <Link href={`/teamindeling/spelers/${speler.id}`} className="block">
                  <div
                    className="flex items-center gap-3 px-4"
                    style={{
                      minHeight: 56,
                      borderBottom:
                        idx < team.spelers.length - 1
                          ? "1px solid var(--border-default)"
                          : undefined,
                    }}
                  >
                    {/* Avatar */}
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: avatarGradient(speler) }}
                    >
                      {`${speler.roepnaam.charAt(0)}${speler.achternaam.charAt(0)}`.toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1 py-2.5">
                      <div
                        className="truncate text-sm leading-tight font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {speler.roepnaam} {speler.achternaam}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-xs tabular-nums"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {speler.korfbalLeeftijd.toFixed(1)}
                        </span>
                        <span
                          className="text-xs font-medium"
                          style={{
                            color:
                              speler.geslacht === "M"
                                ? "var(--color-info-400, #60a5fa)"
                                : "var(--color-error-400, #f87171)",
                          }}
                        >
                          {speler.geslacht === "M" ? "H" : "D"}
                        </span>
                      </div>
                    </div>

                    {/* Chevron */}
                    <svg
                      width={16}
                      height={16}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ color: "var(--text-tertiary)" }}
                      className="shrink-0"
                      aria-hidden="true"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>

      {/* Opmerkingen placeholder */}
      <div>
        <h2
          className="mb-2 text-[13px] font-semibold tracking-wider uppercase"
          style={{ color: "var(--text-tertiary)" }}
        >
          Opmerkingen
        </h2>
        <div
          className="rounded-2xl p-4"
          style={{
            backgroundColor: "var(--surface-card)",
            border: "1px solid var(--border-default)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Komt in een latere fase.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
