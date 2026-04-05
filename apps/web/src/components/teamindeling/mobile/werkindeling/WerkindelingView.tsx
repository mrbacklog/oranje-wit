"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Chip } from "@oranje-wit/ui";

// ─── Types ──────────────────────────────────────────────────────

export interface WerkTeamItem {
  id: string;
  naam: string;
  categorie: string;
  kleur: string | null;
  spelersCount: number;
  target: number;
}

interface WerkindelingViewProps {
  naam: string;
  status: string;
  seizoen: string;
  teams: WerkTeamItem[];
}

// ─── Constants ──────────────────────────────────────────────────

const CATEGORIEEN = [
  { key: "ALLE", label: "Alle", color: undefined },
  { key: "BLAUW", label: "Blauw", color: "var(--knkv-blauw-500)" },
  { key: "GROEN", label: "Groen", color: "var(--knkv-groen-500)" },
  { key: "GEEL", label: "Geel", color: "var(--knkv-geel-500)" },
  { key: "ORANJE", label: "Oranje", color: "var(--knkv-oranje-500)" },
  { key: "ROOD", label: "Rood", color: "var(--knkv-rood-500)" },
  { key: "SENIOREN", label: "Senioren", color: "var(--text-tertiary)" },
] as const;

const KLEUR_DOT_CSS: Record<string, string> = {
  BLAUW: "var(--knkv-blauw-500)",
  GROEN: "var(--knkv-groen-500)",
  GEEL: "var(--knkv-geel-500)",
  ORANJE: "var(--knkv-oranje-500)",
  ROOD: "var(--knkv-rood-500)",
};

const KLEUR_VOLGORDE = ["BLAUW", "GROEN", "GEEL", "ORANJE", "ROOD", "SENIOREN"];

const KLEUR_SECTIE_LABELS: Record<string, string> = {
  BLAUW: "Blauw (5-7)",
  GROEN: "Groen (8-9)",
  GEEL: "Geel (10-12)",
  ORANJE: "Oranje (13-15)",
  ROOD: "Rood (16-18)",
  SENIOREN: "Senioren",
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  CONCEPT: { bg: "rgba(107, 114, 128, 0.15)", text: "#9ca3af" },
  VOORLOPIG: { bg: "rgba(234, 179, 8, 0.15)", text: "#eab308" },
  DEFINITIEF: { bg: "rgba(34, 197, 94, 0.15)", text: "#22c55e" },
};

// ─── Helpers ───────────────────────────────────────────────────

function getKleurGroep(team: WerkTeamItem): string {
  if (team.kleur) return team.kleur.toUpperCase();
  return "SENIOREN";
}

function vulgraadGradient(pct: number): string {
  if (pct >= 80) return "linear-gradient(90deg, #16a34a, #22c55e)";
  if (pct >= 50) return "linear-gradient(90deg, #d97706, #f59e0b)";
  return "linear-gradient(90deg, #dc2626, #ef4444)";
}

// ─── Component ─────────────────────────────────────────────────

export function WerkindelingView({ naam, status, seizoen, teams }: WerkindelingViewProps) {
  const [actieveFilter, setActieveFilter] = useState("ALLE");

  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.CONCEPT;

  const gefilterd = useMemo(() => {
    if (actieveFilter === "ALLE") return teams;
    return teams.filter((t) => getKleurGroep(t) === actieveFilter);
  }, [teams, actieveFilter]);

  // Groepeer teams per kleur
  const gegroepeerd = useMemo(() => {
    const groepen = new Map<string, WerkTeamItem[]>();
    for (const team of gefilterd) {
      const kleur = getKleurGroep(team);
      if (!groepen.has(kleur)) groepen.set(kleur, []);
      groepen.get(kleur)!.push(team);
    }
    return KLEUR_VOLGORDE.filter((k) => groepen.has(k)).map((k) => ({
      kleur: k,
      label: KLEUR_SECTIE_LABELS[k] ?? k,
      teams: groepen.get(k)!,
    }));
  }, [gefilterd]);

  return (
    <motion.div
      className="flex flex-col gap-4 px-4 pt-4 pb-24"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Werkindeling
          </h1>
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: statusStyle.bg,
              color: statusStyle.text,
            }}
          >
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </span>
        </div>
        <p className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
          {seizoen} &middot; {naam} &middot; {teams.length} teams
        </p>
      </div>

      {/* Categorie-filter chips */}
      <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
        {CATEGORIEEN.map((cat) => (
          <Chip
            key={cat.key}
            label={cat.label}
            selected={actieveFilter === cat.key}
            color={cat.color}
            onSelect={() => setActieveFilter(actieveFilter === cat.key ? "ALLE" : cat.key)}
          />
        ))}
      </div>

      {/* Teams */}
      {gefilterd.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            backgroundColor: "var(--surface-card)",
            border: "1px solid var(--border-default)",
          }}
        >
          <p style={{ color: "var(--text-tertiary)" }}>Geen teams in deze categorie.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {gegroepeerd.map((groep) => (
            <div key={groep.kleur}>
              {/* Sectie-header */}
              <h2
                className="mb-2 text-[13px] font-semibold tracking-wider uppercase"
                style={{ color: "var(--text-tertiary)" }}
              >
                {groep.label}
              </h2>

              {/* Team-kaarten */}
              <div
                className="overflow-hidden rounded-2xl"
                style={{
                  backgroundColor: "var(--surface-card)",
                  border: "1px solid var(--border-default)",
                }}
              >
                {groep.teams.map((team, idx) => {
                  const pct = team.target > 0 ? (team.spelersCount / team.target) * 100 : 0;
                  const clampedPct = Math.min(100, pct);

                  return (
                    <div key={team.id} className="block">
                      <div
                        className="px-4 py-3"
                        style={{
                          borderBottom:
                            idx < groep.teams.length - 1
                              ? "1px solid var(--border-default)"
                              : undefined,
                        }}
                      >
                        {/* Top row: kleur-dot, naam, count */}
                        <div className="mb-2 flex items-center gap-3">
                          <div
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                KLEUR_DOT_CSS[getKleurGroep(team)] ?? "var(--text-tertiary)",
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <span
                              className="text-base font-semibold"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {team.naam}
                            </span>
                          </div>
                          <span
                            className="text-sm tabular-nums"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {team.spelersCount}/{team.target}
                          </span>
                        </div>

                        {/* Vulgraad-balk */}
                        <div
                          className="h-1.5 w-full overflow-hidden rounded-full"
                          style={{ backgroundColor: "var(--surface-raised)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${clampedPct}%`,
                              background: vulgraadGradient(pct),
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
