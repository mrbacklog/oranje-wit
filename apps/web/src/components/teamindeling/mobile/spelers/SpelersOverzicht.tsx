"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SearchInput, Chip } from "@oranje-wit/ui";

// ─── Types ──────────────────────────────────────────────────────

export interface SpelerListItem {
  id: string;
  roepnaam: string;
  achternaam: string;
  korfbalLeeftijd: number;
  geslacht: string;
  kleur: string | null;
  teamNaam: string | null;
  status: string;
}

interface SpelersOverzichtProps {
  spelers: SpelerListItem[];
}

// ─── Constants ──────────────────────────────────────────────────

const GESLACHT_OPTIES = [
  { key: "ALLE", label: "Alle" },
  { key: "M", label: "H" },
  { key: "V", label: "D" },
] as const;

const CATEGORIE_FILTERS = [
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

const KLEUR_GRADIENT: Record<string, string> = {
  BLAUW: "linear-gradient(135deg, var(--knkv-blauw-400), var(--knkv-blauw-600))",
  GROEN: "linear-gradient(135deg, var(--knkv-groen-400), var(--knkv-groen-600))",
  GEEL: "linear-gradient(135deg, var(--knkv-geel-400), var(--knkv-geel-600))",
  ORANJE: "linear-gradient(135deg, var(--knkv-oranje-400), var(--knkv-oranje-600))",
  ROOD: "linear-gradient(135deg, var(--knkv-rood-400), var(--knkv-rood-600))",
};

// ─── Component ─────────────────────────────────────────────────

export function SpelersOverzicht({ spelers }: SpelersOverzichtProps) {
  const [zoekterm, setZoekterm] = useState("");
  const [geslachtFilter, setGeslachtFilter] = useState("ALLE");
  const [categorieFilter, setCategorieFilter] = useState("ALLE");

  const gefilterd = useMemo(() => {
    let resultaat = spelers;

    // Zoekterm
    if (zoekterm.trim()) {
      const term = zoekterm.toLowerCase();
      resultaat = resultaat.filter(
        (s) =>
          s.roepnaam.toLowerCase().includes(term) ||
          s.achternaam.toLowerCase().includes(term) ||
          `${s.roepnaam} ${s.achternaam}`.toLowerCase().includes(term)
      );
    }

    // Geslacht
    if (geslachtFilter !== "ALLE") {
      resultaat = resultaat.filter((s) => s.geslacht === geslachtFilter);
    }

    // Categorie
    if (categorieFilter !== "ALLE") {
      if (categorieFilter === "SENIOREN") {
        resultaat = resultaat.filter((s) => s.kleur === null);
      } else {
        resultaat = resultaat.filter((s) => s.kleur === categorieFilter);
      }
    }

    return resultaat;
  }, [spelers, zoekterm, geslachtFilter, categorieFilter]);

  return (
    <motion.div
      className="flex flex-col gap-4 px-4 pt-4 pb-24"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] as const }}
    >
      {/* Titel */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Spelers
        </h1>
        <p className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
          {spelers.length} spelers in pool
        </p>
      </div>

      {/* Zoekbalk */}
      <SearchInput value={zoekterm} onChange={setZoekterm} placeholder="Zoek speler..." />

      {/* Filters */}
      <div className="flex flex-col gap-2">
        {/* Geslacht-toggle */}
        <div className="flex gap-1.5">
          {GESLACHT_OPTIES.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setGeslachtFilter(geslachtFilter === opt.key ? "ALLE" : opt.key)}
              className="rounded-xl px-4 text-sm font-medium transition-all"
              style={{
                minHeight: 36,
                backgroundColor:
                  geslachtFilter === opt.key ? "rgba(59, 130, 246, 0.2)" : "var(--surface-raised)",
                color: geslachtFilter === opt.key ? "#3b82f6" : "var(--text-secondary)",
                border:
                  geslachtFilter === opt.key
                    ? "1px solid rgba(59, 130, 246, 0.4)"
                    : "1px solid var(--border-default)",
              }}
              aria-pressed={geslachtFilter === opt.key}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Categorie chips */}
        <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
          {CATEGORIE_FILTERS.map((cat) => (
            <Chip
              key={cat.key}
              label={cat.label}
              selected={categorieFilter === cat.key}
              color={cat.color}
              onSelect={() => setCategorieFilter(categorieFilter === cat.key ? "ALLE" : cat.key)}
            />
          ))}
        </div>
      </div>

      {/* Resultaatcount */}
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {gefilterd.length} speler{gefilterd.length !== 1 ? "s" : ""}
      </p>

      {/* Spelerslijst */}
      {gefilterd.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            backgroundColor: "var(--surface-card)",
            border: "1px solid var(--border-default)",
          }}
        >
          <p style={{ color: "var(--text-tertiary)" }}>
            Geen spelers gevonden
            {zoekterm ? ` voor "${zoekterm}"` : ""}.
          </p>
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            backgroundColor: "var(--surface-card)",
            border: "1px solid var(--border-default)",
          }}
        >
          {gefilterd.map((speler, idx) => (
            <Link key={speler.id} href={`/teamindeling/spelers/${speler.id}`} className="block">
              <div
                className="flex items-center gap-3 px-4"
                style={{
                  minHeight: 60,
                  borderBottom:
                    idx < gefilterd.length - 1 ? "1px solid var(--border-default)" : undefined,
                }}
              >
                {/* Avatar */}
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{
                    background:
                      speler.kleur && KLEUR_GRADIENT[speler.kleur]
                        ? KLEUR_GRADIENT[speler.kleur]
                        : "linear-gradient(135deg, var(--ow-oranje-500), var(--ow-oranje-700))",
                  }}
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
                    {/* Kleur dot */}
                    {speler.kleur && KLEUR_DOT_CSS[speler.kleur] && (
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: KLEUR_DOT_CSS[speler.kleur],
                        }}
                      />
                    )}
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
                    {speler.teamNaam && (
                      <>
                        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                          &middot;
                        </span>
                        <span
                          className="truncate text-xs"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {speler.teamNaam}
                        </span>
                      </>
                    )}
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
          ))}
        </div>
      )}
    </motion.div>
  );
}
