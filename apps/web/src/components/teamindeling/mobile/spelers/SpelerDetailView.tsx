"use client";

import Link from "next/link";
import { motion } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────

export interface SpelerDetailData {
  id: string;
  roepnaam: string;
  achternaam: string;
  tussenvoegsel: string | null;
  korfbalLeeftijd: number;
  geboortejaar: number;
  geslacht: string;
  kleur: string | null;
  status: string;
  teamNaam: string | null;
  teamId: number | null;
  lidSinds: string | null;
  seizoenenActief: number | null;
  seizoensHistorie: SeizoenEntry[];
}

export interface SeizoenEntry {
  seizoen: string;
  team: string;
  kleur: string | null;
}

// ─── Constants ──────────────────────────────────────────────────

const KLEUR_GRADIENT: Record<string, string> = {
  BLAUW: "linear-gradient(135deg, var(--knkv-blauw-400), var(--knkv-blauw-600))",
  GROEN: "linear-gradient(135deg, var(--knkv-groen-400), var(--knkv-groen-600))",
  GEEL: "linear-gradient(135deg, var(--knkv-geel-400), var(--knkv-geel-600))",
  ORANJE: "linear-gradient(135deg, var(--knkv-oranje-400), var(--knkv-oranje-600))",
  ROOD: "linear-gradient(135deg, var(--knkv-rood-400), var(--knkv-rood-600))",
  PAARS: "linear-gradient(135deg, var(--knkv-paars-400), var(--knkv-paars-600))",
};

const KLEUR_DOT_CSS: Record<string, string> = {
  BLAUW: "var(--knkv-blauw-500)",
  GROEN: "var(--knkv-groen-500)",
  GEEL: "var(--knkv-geel-500)",
  ORANJE: "var(--knkv-oranje-500)",
  ROOD: "var(--knkv-rood-500)",
  PAARS: "var(--knkv-paars-500)",
};

const KLEUR_LABELS: Record<string, string> = {
  PAARS: "Paars",
  BLAUW: "Blauw",
  GROEN: "Groen",
  GEEL: "Geel",
  ORANJE: "Oranje",
  ROOD: "Rood",
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  BESCHIKBAAR: { bg: "rgba(34, 197, 94, 0.15)", text: "#22c55e" },
  TWIJFELT: { bg: "rgba(245, 158, 11, 0.15)", text: "#f59e0b" },
  GAAT_STOPPEN: { bg: "rgba(239, 68, 68, 0.15)", text: "#ef4444" },
  NIEUW_POTENTIEEL: { bg: "rgba(59, 130, 246, 0.15)", text: "#60a5fa" },
  NIEUW_DEFINITIEF: { bg: "rgba(59, 130, 246, 0.2)", text: "#3b82f6" },
  ALGEMEEN_RESERVE: { bg: "rgba(107, 114, 128, 0.15)", text: "#9ca3af" },
};

// ─── Component ─────────────────────────────────────────────────

interface SpelerDetailViewProps {
  speler: SpelerDetailData;
}

export function SpelerDetailView({ speler }: SpelerDetailViewProps) {
  const initialen = `${speler.roepnaam.charAt(0)}${speler.achternaam.charAt(0)}`.toUpperCase();
  const kleurKey = speler.kleur?.toUpperCase() ?? null;
  const statusStyle = STATUS_COLORS[speler.status] ?? STATUS_COLORS.BESCHIKBAAR;

  const volleNaam = speler.tussenvoegsel
    ? `${speler.roepnaam} ${speler.tussenvoegsel} ${speler.achternaam}`
    : `${speler.roepnaam} ${speler.achternaam}`;

  const statusLabel = speler.status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c: string) => c.toUpperCase());

  return (
    <motion.div
      className="flex flex-col gap-5 px-4 pt-4 pb-24"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] as const }}
    >
      {/* Hero */}
      <div className="flex flex-col items-center gap-3 pt-2 pb-2">
        {/* Avatar groot */}
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white"
          style={{
            background:
              kleurKey && KLEUR_GRADIENT[kleurKey]
                ? KLEUR_GRADIENT[kleurKey]
                : "linear-gradient(135deg, var(--ow-oranje-500), var(--ow-oranje-700))",
          }}
        >
          {initialen}
        </div>

        {/* Naam */}
        <div className="text-center">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {volleNaam}
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>
            {speler.korfbalLeeftijd.toFixed(1)} jaar
            {" \u00B7 "}
            {speler.geslacht === "M" ? "Heren" : "Dames"}
            {kleurKey && KLEUR_LABELS[kleurKey] && (
              <>
                {" \u00B7 "}
                {KLEUR_LABELS[kleurKey]}
              </>
            )}
          </p>
        </div>
      </div>

      {/* Info-grid */}
      <div
        className="overflow-hidden rounded-2xl"
        style={{
          backgroundColor: "var(--surface-card)",
          border: "1px solid var(--border-default)",
        }}
      >
        {/* Status */}
        <InfoRow
          label="Status"
          value={
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: statusStyle.bg,
                color: statusStyle.text,
              }}
            >
              {statusLabel}
            </span>
          }
          last={false}
        />

        {/* Huidig team */}
        <InfoRow
          label="Huidig team"
          value={
            speler.teamNaam ? (
              speler.teamId ? (
                <Link
                  href={`/teamindeling/teams/${speler.teamId}`}
                  className="text-base font-semibold"
                  style={{ color: "var(--text-link)" }}
                >
                  {speler.teamNaam}
                </Link>
              ) : (
                <span className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                  {speler.teamNaam}
                </span>
              )
            ) : (
              <span style={{ color: "var(--text-tertiary)" }}>Niet ingedeeld</span>
            )
          }
          last={false}
        />

        {/* Lid sinds */}
        {speler.lidSinds && (
          <InfoRow
            label="Lid sinds"
            value={
              <span className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                {speler.lidSinds.slice(0, 4)}
              </span>
            }
            last={!speler.seizoenenActief}
          />
        )}

        {/* Seizoenen actief */}
        {speler.seizoenenActief != null && (
          <InfoRow
            label="Seizoenen"
            value={
              <span className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                {speler.seizoenenActief}
              </span>
            }
            last
          />
        )}
      </div>

      {/* Evaluatie samenvatting placeholder */}
      <div>
        <h2
          className="mb-2 text-[13px] font-semibold tracking-wider uppercase"
          style={{ color: "var(--text-tertiary)" }}
        >
          Evaluatie-samenvatting
        </h2>
        <div
          className="rounded-2xl p-4"
          style={{
            backgroundColor: "var(--surface-card)",
            border: "1px solid var(--border-default)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Evaluatiegegevens worden in een latere fase gekoppeld.
          </p>
        </div>
      </div>

      {/* Seizoenshistorie */}
      {speler.seizoensHistorie.length > 0 && (
        <div>
          <h2
            className="mb-2 text-[13px] font-semibold tracking-wider uppercase"
            style={{ color: "var(--text-tertiary)" }}
          >
            Seizoenshistorie
          </h2>
          <div
            className="overflow-hidden rounded-2xl"
            style={{
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--border-default)",
            }}
          >
            {speler.seizoensHistorie.map((entry, idx) => (
              <div
                key={entry.seizoen}
                className="flex items-center gap-3 px-4 py-3"
                style={{
                  borderBottom:
                    idx < speler.seizoensHistorie.length - 1
                      ? "1px solid var(--border-default)"
                      : undefined,
                }}
              >
                {/* Timeline dot */}
                <div className="flex flex-col items-center">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        entry.kleur && KLEUR_DOT_CSS[entry.kleur.toUpperCase()]
                          ? KLEUR_DOT_CSS[entry.kleur.toUpperCase()]
                          : "var(--text-tertiary)",
                    }}
                  />
                </div>

                {/* Seizoen */}
                <span className="w-24 shrink-0 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {entry.seizoen}
                </span>

                {/* Teamnaam */}
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {entry.team}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notities placeholder */}
      <div>
        <h2
          className="mb-2 text-[13px] font-semibold tracking-wider uppercase"
          style={{ color: "var(--text-tertiary)" }}
        >
          Notities
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

// ─── Sub-components ─────────────────────────────────────────────

function InfoRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3"
      style={{
        borderBottom: last ? undefined : "1px solid var(--border-default)",
      }}
    >
      <span
        className="text-[13px] font-semibold tracking-wider uppercase"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
      </span>
      <div>{value}</div>
    </div>
  );
}
