"use client";

import Link from "next/link";
import { motion } from "framer-motion";
// ─── Icons (inline SVG, no external dependency) ────────────────

function IconGrid({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function IconUsers({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconClipboard({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </svg>
  );
}

function IconUserCheck({ size = 20, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  );
}

// ─── Types ──────────────────────────────────────────────────────

export interface WerkindelingData {
  naam: string;
  status: string;
  updatedAt: string;
  teamCount: number;
  spelerCount: number;
}

export interface MijnTeamItem {
  id: number;
  naam: string;
  kleur: string | null;
  spelersCount: number;
  target: number;
}

interface MobileDashboardProps {
  seizoen: string;
  werkindeling: WerkindelingData | null;
  mijnTeams: MijnTeamItem[];
}

// ─── Constants ──────────────────────────────────────────────────

const KLEUR_DOT_CSS: Record<string, string> = {
  BLAUW: "var(--knkv-blauw-500)",
  GROEN: "var(--knkv-groen-500)",
  GEEL: "var(--knkv-geel-500)",
  ORANJE: "var(--knkv-oranje-500)",
  ROOD: "var(--knkv-rood-500)",
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  CONCEPT: { bg: "rgba(107, 114, 128, 0.15)", text: "#9ca3af" },
  VOORLOPIG: { bg: "rgba(234, 179, 8, 0.15)", text: "#eab308" },
  DEFINITIEF: { bg: "rgba(34, 197, 94, 0.15)", text: "#22c55e" },
};

const SNELKOPPELINGEN = [
  {
    label: "Teams",
    sub: "overzicht",
    href: "/teamindeling/teams",
    Icon: IconGrid,
  },
  {
    label: "Spelers",
    sub: "zoeken",
    href: "/teamindeling/spelers",
    Icon: IconUsers,
  },
  {
    label: "Indeling",
    sub: "bekijken",
    href: "/teamindeling/scenarios",
    Icon: IconClipboard,
  },
  {
    label: "Staf",
    sub: "overzicht",
    href: "/teamindeling/staf",
    Icon: IconUserCheck,
  },
] as const;

// ─── Stagger variants ──────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const },
  },
};

// ─── Helpers ───────────────────────────────────────────────────

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "zojuist";
  if (mins < 60) return `${mins} min geleden`;
  const uur = Math.floor(mins / 60);
  if (uur < 24) return `${uur} uur geleden`;
  const dagen = Math.floor(uur / 24);
  if (dagen === 1) return "gisteren";
  return `${dagen} dagen geleden`;
}

// ─── Component ─────────────────────────────────────────────────

export function MobileDashboard({ seizoen, werkindeling, mijnTeams }: MobileDashboardProps) {
  const statusStyle =
    werkindeling && STATUS_STYLES[werkindeling.status]
      ? STATUS_STYLES[werkindeling.status]
      : STATUS_STYLES.CONCEPT;

  return (
    <motion.div
      className="flex flex-col gap-5 px-4 pt-4 pb-24"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Welkom header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Team-Indeling
        </h1>
        <p className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
          {seizoen}
        </p>
      </motion.div>

      {/* Werkindeling hero-kaart */}
      {werkindeling ? (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl p-4"
          style={{
            backgroundColor: "var(--surface-card)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              {werkindeling.naam}
            </h2>
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: statusStyle.bg,
                color: statusStyle.text,
              }}
            >
              {werkindeling.status.charAt(0) + werkindeling.status.slice(1).toLowerCase()}
            </span>
          </div>

          {/* KPI's */}
          <div className="mb-3 flex gap-4">
            <div className="flex-1 text-center">
              <div
                className="text-5xl font-bold tabular-nums"
                style={{ color: "var(--text-primary)" }}
              >
                {werkindeling.teamCount}
              </div>
              <div className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
                teams
              </div>
            </div>
            <div className="flex-1 text-center">
              <div
                className="text-5xl font-bold tabular-nums"
                style={{ color: "var(--text-primary)" }}
              >
                {werkindeling.spelerCount}
              </div>
              <div className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
                spelers
              </div>
            </div>
          </div>

          {/* Laatst bijgewerkt */}
          <p className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
            Laatst bijgewerkt: {formatRelativeTime(werkindeling.updatedAt)}
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl p-6 text-center"
          style={{
            backgroundColor: "var(--surface-card)",
            border: "1px solid var(--border-default)",
          }}
        >
          <p style={{ color: "var(--text-tertiary)" }}>Nog geen werkindeling voor dit seizoen.</p>
        </motion.div>
      )}

      {/* Snelkoppelingen */}
      <motion.div variants={fadeUp}>
        <h2
          className="mb-2 text-[13px] font-semibold tracking-wider uppercase"
          style={{ color: "var(--text-tertiary)" }}
        >
          Snelkoppelingen
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {SNELKOPPELINGEN.map((item) => (
            <Link key={item.href} href={item.href} className="block">
              <motion.div
                className="flex flex-col gap-2 rounded-2xl p-4"
                style={{
                  backgroundColor: "var(--surface-raised)",
                  border: "1px solid var(--border-default)",
                  minHeight: 88,
                }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15 }}
              >
                <item.Icon size={20} style={{ color: "var(--text-secondary)" }} />
                <div>
                  <div className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                    {item.label}
                  </div>
                  <div className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
                    {item.sub}
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Mijn teams */}
      {mijnTeams.length > 0 && (
        <motion.div variants={fadeUp}>
          <h2
            className="mb-2 text-[13px] font-semibold tracking-wider uppercase"
            style={{ color: "var(--text-tertiary)" }}
          >
            Mijn teams
          </h2>
          <div
            className="overflow-hidden rounded-2xl"
            style={{
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--border-default)",
            }}
          >
            {mijnTeams.map((team, idx) => (
              <Link key={team.id} href={`/teamindeling/teams/${team.id}`} className="block">
                <motion.div
                  className="flex items-center gap-3 px-4"
                  style={{
                    minHeight: 56,
                    borderBottom:
                      idx < mijnTeams.length - 1 ? "1px solid var(--border-default)" : undefined,
                  }}
                  whileTap={{
                    scale: 0.98,
                    backgroundColor: "var(--state-pressed)",
                  }}
                  transition={{ duration: 0.15 }}
                >
                  {/* Kleur-dot */}
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        team.kleur && KLEUR_DOT_CSS[team.kleur]
                          ? KLEUR_DOT_CSS[team.kleur]
                          : "var(--text-tertiary)",
                    }}
                  />

                  {/* Info */}
                  <div className="min-w-0 flex-1 py-3">
                    <div
                      className="truncate text-base font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {team.naam}
                    </div>
                    <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {team.spelersCount}/{team.target} spelers
                    </div>
                  </div>

                  {/* Mini vulgraad */}
                  <div className="flex w-16 flex-col items-end gap-0.5">
                    <div
                      className="h-1.5 w-full overflow-hidden rounded-full"
                      style={{ backgroundColor: "var(--surface-raised)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, team.target > 0 ? (team.spelersCount / team.target) * 100 : 0)}%`,
                          background:
                            team.spelersCount >= team.target * 0.8
                              ? "linear-gradient(90deg, #16a34a, #22c55e)"
                              : team.spelersCount >= team.target * 0.5
                                ? "linear-gradient(90deg, #d97706, #f59e0b)"
                                : "linear-gradient(90deg, #dc2626, #ef4444)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Chevron */}
                  <svg
                    width={18}
                    height={18}
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
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
