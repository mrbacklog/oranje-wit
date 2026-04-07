"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import type { GezienStatus } from "@oranje-wit/database";
import { PEILJAAR } from "@oranje-wit/types";
import {
  updateGezienStatus,
  initialiseerKadersSpelers,
} from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/gezien-actions";
import { CategorieDetailView, type BlauwdrukRecord } from "./CategorieDetailView";

// ─── Types ──────────────────────────────────────────────────────

type CategorieStats = {
  sleutel: string;
  totaal: number;
  gezien: number;
  signaleringen: number;
};

interface Props {
  kadersId: string;
  seizoen: string;
  voortgang: { totaal: number; gezien: number; perStatus: Record<string, number> };
  categorieStats: CategorieStats[];
  besluitStats: { totaal: number; onduidelijk: number; voorlopig: number; definitief: number };
  records: BlauwdrukRecord[];
  users: Array<{ id: string; naam: string }>;
}

// ─── Constants ──────────────────────────────────────────────────

const STATUS_COLORS: Record<GezienStatus, string> = {
  ONGEZIEN: "#6b7280",
  GROEN: "#22c55e",
  GEEL: "#eab308",
  ORANJE: "#f97316",
  ROOD: "#ef4444",
};

const CATEGORIE_KLEUREN: Record<string, string> = {
  SENIOREN_A: "var(--text-secondary)",
  SENIOREN_B: "var(--text-tertiary)",
  U19: "#a78bfa",
  U17: "#818cf8",
  U15: "#60a5fa",
  ROOD: "#ef4444",
  ORANJE: "#f97316",
  GEEL: "#eab308",
  GROEN: "#22c55e",
  BLAUW: "#3b82f6",
  KANGOEROES: "#a855f7",
  ONBEKEND: "#6b7280",
};

const CATEGORIE_LABELS: Record<string, string> = {
  SENIOREN_A: "Senioren A",
  SENIOREN_B: "Senioren B",
  U19: "U19",
  U17: "U17",
  U15: "U15",
  ROOD: "Rood",
  ORANJE: "Oranje",
  GEEL: "Geel",
  GROEN: "Groen",
  BLAUW: "Blauw",
  KANGOEROES: "Kangoeroes",
  ONBEKEND: "Onbekend",
};

const CATEGORIE_VOLGORDE = [
  "SENIOREN_A",
  "SENIOREN_B",
  "U19",
  "U17",
  "U15",
  "ROOD",
  "ORANJE",
  "GEEL",
  "GROEN",
  "BLAUW",
  "KANGOEROES",
  "ONBEKEND",
];

// ─── Animation ──────────────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const } },
};

// ─── Helpers ────────────────────────────────────────────────────

function bepaalCategorie(
  huidig: { team?: string; kleur?: string; a_categorie?: string } | null,
  geboortejaar: number
): string {
  if (!huidig) return "ONBEKEND";
  if (huidig.a_categorie) return huidig.a_categorie.toUpperCase();
  if (huidig.kleur) return huidig.kleur.toUpperCase();
  const leeftijd = PEILJAAR - geboortejaar;
  if (leeftijd >= 19) return "SENIOREN_A";
  return "ONBEKEND";
}

// ─── Component ──────────────────────────────────────────────────

export function BlauwdrukMobileOverzicht({
  kadersId,
  seizoen,
  voortgang: initialVoortgang,
  categorieStats: initialCategorieStats,
  besluitStats,
  records: initialRecords,
  users,
}: Props) {
  const [records, setRecords] = useState(initialRecords);
  const [voortgang, setVoortgang] = useState(initialVoortgang);
  const [activeCategorie, setActiveCategorie] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const percentage =
    voortgang.totaal > 0 ? Math.round((voortgang.gezien / voortgang.totaal) * 100) : 0;

  const sortedCategories = initialCategorieStats.sort(
    (a, b) => CATEGORIE_VOLGORDE.indexOf(a.sleutel) - CATEGORIE_VOLGORDE.indexOf(b.sleutel)
  );

  const categorieRecords = activeCategorie
    ? records.filter(
        (r) => bepaalCategorie(r.speler.huidig, r.speler.geboortejaar) === activeCategorie
      )
    : [];

  function handleStatusChange(record: BlauwdrukRecord, newStatus: GezienStatus, notitie?: string) {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === record.id ? { ...r, gezienStatus: newStatus, notitie: notitie ?? r.notitie } : r
      )
    );
    setVoortgang((prev) => {
      const wasGezien = record.gezienStatus !== "ONGEZIEN";
      const isGezien = newStatus !== "ONGEZIEN";
      return {
        ...prev,
        gezien: prev.gezien + (isGezien && !wasGezien ? 1 : !isGezien && wasGezien ? -1 : 0),
        perStatus: {
          ...prev.perStatus,
          [record.gezienStatus]: (prev.perStatus[record.gezienStatus] ?? 1) - 1,
          [newStatus]: (prev.perStatus[newStatus] ?? 0) + 1,
        },
      };
    });

    startTransition(async () => {
      await updateGezienStatus(kadersId, record.spelerId, newStatus, notitie);
    });
  }

  function handleInitialiseer() {
    startTransition(async () => {
      await initialiseerKadersSpelers(kadersId);
      window.location.reload();
    });
  }

  // ─── Categorie-detail ─────────────────────────────────────────

  if (activeCategorie) {
    return (
      <CategorieDetailView
        categorie={activeCategorie}
        categorieLabel={CATEGORIE_LABELS[activeCategorie] ?? activeCategorie}
        categorieColor={CATEGORIE_KLEUREN[activeCategorie] ?? "var(--text-tertiary)"}
        records={categorieRecords}
        users={users}
        onStatusChange={handleStatusChange}
        onBack={() => setActiveCategorie(null)}
      />
    );
  }

  // ─── Overzicht ────────────────────────────────────────────────

  return (
    <motion.div
      className="flex flex-col gap-5 px-4 pt-4 pb-24"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Blauwdruk
        </h1>
        <p className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
          Seizoen {seizoen}
        </p>
      </motion.div>

      {/* Voortgangskaart */}
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
            Spelers gezien
          </h2>
          <span
            className="text-2xl font-bold tabular-nums"
            style={{ color: "var(--text-primary)" }}
          >
            {percentage}%
          </span>
        </div>
        <div
          className="mb-3 h-3 overflow-hidden rounded-full"
          style={{ backgroundColor: "var(--surface-sunken)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #3b82f6, #60a5fa)" }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <div className="flex flex-wrap gap-3 text-xs" style={{ color: "var(--text-secondary)" }}>
          {(["ONGEZIEN", "GROEN", "GEEL", "ORANJE", "ROOD"] as GezienStatus[]).map(
            (s) =>
              (voortgang.perStatus[s] ?? 0) > 0 && (
                <span key={s} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[s] }}
                  />
                  {voortgang.perStatus[s]}{" "}
                  {s === "ONGEZIEN"
                    ? "ongezien"
                    : s === "GROEN"
                      ? "beschikbaar"
                      : s === "GEEL"
                        ? "onzeker"
                        : s === "ORANJE"
                          ? "signaal"
                          : "stopt"}
                </span>
              )
          )}
        </div>
      </motion.div>

      {/* Besluiten-kaart */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl p-4"
        style={{
          backgroundColor: "var(--surface-card)",
          border: "1px solid var(--border-default)",
        }}
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Besluiten
          </h2>
          <a
            href="/teamindeling/blauwdruk/besluiten"
            className="text-[13px] font-medium"
            style={{ color: "var(--ow-oranje-500)" }}
          >
            Bekijk alle
          </a>
        </div>
        <div className="flex gap-4">
          {[
            { label: "open", value: besluitStats.onduidelijk, color: "#ef4444" },
            { label: "voorlopig", value: besluitStats.voorlopig, color: "#eab308" },
            { label: "definitief", value: besluitStats.definitief, color: "#22c55e" },
          ].map((item) => (
            <div key={item.label} className="flex-1 text-center">
              <div className="text-3xl font-bold tabular-nums" style={{ color: item.color }}>
                {item.value}
              </div>
              <div className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Initialiseer-knop */}
      {records.length === 0 && (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl p-6 text-center"
          style={{
            backgroundColor: "var(--surface-card)",
            border: "1px dashed var(--border-default)",
          }}
        >
          <p className="mb-4" style={{ color: "var(--text-tertiary)" }}>
            Nog geen spelers geladen voor deze blauwdruk.
          </p>
          <button
            onClick={handleInitialiseer}
            disabled={isPending}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: "var(--ow-oranje-500)" }}
          >
            {isPending ? "Laden..." : "Spelers initialiseren"}
          </button>
        </motion.div>
      )}

      {/* Categorie-kaarten */}
      {records.length > 0 && (
        <motion.div variants={fadeUp}>
          <h2
            className="mb-2 text-[13px] font-semibold tracking-wider uppercase"
            style={{ color: "var(--text-tertiary)" }}
          >
            Per categorie
          </h2>
          <div className="flex flex-col gap-2">
            {sortedCategories.map((cat) => {
              const pct = cat.totaal > 0 ? Math.round((cat.gezien / cat.totaal) * 100) : 0;
              return (
                <motion.button
                  key={cat.sleutel}
                  className="flex items-center gap-3 rounded-2xl p-4 text-left"
                  style={{
                    backgroundColor: "var(--surface-card)",
                    border: "1px solid var(--border-default)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => setActiveCategorie(cat.sleutel)}
                >
                  <div
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{
                      backgroundColor: CATEGORIE_KLEUREN[cat.sleutel] ?? "var(--text-tertiary)",
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-base font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {CATEGORIE_LABELS[cat.sleutel] ?? cat.sleutel}
                      </span>
                      <span
                        className="text-sm tabular-nums"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {cat.gezien}/{cat.totaal}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div
                        className="h-1.5 flex-1 overflow-hidden rounded-full"
                        style={{ backgroundColor: "var(--surface-sunken)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor:
                              pct === 100
                                ? "#22c55e"
                                : pct > 50
                                  ? "#3b82f6"
                                  : "var(--text-tertiary)",
                          }}
                        />
                      </div>
                      {cat.signaleringen > 0 && (
                        <span
                          className="shrink-0 text-[11px] font-medium"
                          style={{ color: "#f59e0b" }}
                        >
                          {cat.signaleringen} signaal
                        </span>
                      )}
                    </div>
                  </div>
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
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
