"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GezienStatus } from "@oranje-wit/database";
import { PEILJAAR } from "@oranje-wit/types";
import { SpelerGezienSheet } from "./SpelerGezienSheet";

// ─── Types ──────────────────────────────────────────────────────

export type SpelerData = {
  id: string;
  roepnaam: string;
  achternaam: string;
  geboortejaar: number;
  geslacht: string;
  huidig: { team?: string; kleur?: string; a_categorie?: string } | null;
  status: string;
};

export type BlauwdrukRecord = {
  id: string;
  spelerId: string;
  gezienStatus: GezienStatus;
  notitie: string | null;
  signalering: string | null;
  speler: SpelerData;
  actiepunt: {
    id: string;
    beschrijving: string;
    status: string;
    deadline: string | null;
    toegewezenAan: { naam: string };
  } | null;
  gezienDoor: { naam: string } | null;
};

interface Props {
  categorie: string;
  categorieLabel: string;
  categorieColor: string;
  records: BlauwdrukRecord[];
  users: Array<{ id: string; naam: string }>;
  onStatusChange: (record: BlauwdrukRecord, status: GezienStatus, notitie?: string) => void;
  onBack: () => void;
}

// ─── Constants ──────────────────────────────────────────────────

const STATUS_COLORS: Record<GezienStatus, string> = {
  ONGEZIEN: "#6b7280",
  GROEN: "#22c55e",
  GEEL: "#eab308",
  ORANJE: "#f97316",
  ROOD: "#ef4444",
};

const SIGNALERING_LABELS: Record<string, string> = {
  VERLAAT_U15: "Verlaat U15",
  VERLAAT_U17: "Verlaat U17",
  VERLAAT_U19: "Verlaat U19",
  NAAR_SENIOREN: "Naar senioren",
  VERLAAT_KLEUR: "Verlaat kleur",
  INSTROOMT_U15: "Instroomt U15",
  INSTROOMT_U17: "Instroomt U17",
  INSTROOMT_U19: "Instroomt U19",
};

type FilterStatus = "ALLE" | GezienStatus;

// ─── Component ──────────────────────────────────────────────────

export function CategorieDetailView({
  categorieLabel,
  categorieColor,
  records,
  users,
  onStatusChange,
  onBack,
}: Props) {
  const [filter, setFilter] = useState<FilterStatus>("ALLE");
  const [selectedSpeler, setSelectedSpeler] = useState<BlauwdrukRecord | null>(null);

  const filtered = filter === "ALLE" ? records : records.filter((r) => r.gezienStatus === filter);
  const gezien = records.filter((r) => r.gezienStatus !== "ONGEZIEN").length;
  const pct = records.length > 0 ? Math.round((gezien / records.length) * 100) : 0;

  const filterItems = [
    { key: "ALLE" as const, label: "Alle", count: records.length },
    {
      key: "ONGEZIEN" as const,
      label: "Ongezien",
      count: records.filter((r) => r.gezienStatus === "ONGEZIEN").length,
    },
    {
      key: "GROEN" as const,
      label: "Ok",
      count: records.filter((r) => r.gezienStatus === "GROEN").length,
    },
    {
      key: "GEEL" as const,
      label: "Onzeker",
      count: records.filter((r) => r.gezienStatus === "GEEL").length,
    },
    {
      key: "ORANJE" as const,
      label: "Signaal",
      count: records.filter((r) => r.gezienStatus === "ORANJE").length,
    },
    {
      key: "ROOD" as const,
      label: "Stopt",
      count: records.filter((r) => r.gezienStatus === "ROOD").length,
    },
  ] as const;

  return (
    <div className="flex flex-col pb-24">
      {/* Sticky header */}
      <div
        className="sticky top-0 z-10 px-4 pt-4 pb-3"
        style={{ backgroundColor: "var(--surface-page)" }}
      >
        <div className="mb-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--surface-card)" }}
            aria-label="Terug"
          >
            <svg
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "var(--text-primary)" }}
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: categorieColor }} />
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              {categorieLabel}
            </h1>
          </div>
          <span className="ml-auto text-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>
            {gezien}/{records.length} ({pct}%)
          </span>
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {filterItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor: filter === item.key ? "var(--surface-raised)" : "transparent",
                color: filter === item.key ? "var(--text-primary)" : "var(--text-tertiary)",
                border:
                  filter === item.key ? "1px solid var(--border-default)" : "1px solid transparent",
              }}
            >
              {item.key !== "ALLE" && (
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[item.key] }}
                />
              )}
              {item.label}
              {item.count > 0 && (
                <span style={{ color: "var(--text-tertiary)" }}>{item.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Spelerslijst */}
      <div className="flex flex-col gap-1 px-4 pt-1">
        <AnimatePresence mode="popLayout">
          {filtered.map((record) => (
            <motion.button
              key={record.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 rounded-xl p-3 text-left"
              style={{
                backgroundColor: "var(--surface-card)",
                border: "1px solid var(--border-default)",
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedSpeler(record)}
            >
              <div
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[record.gezienStatus] }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="truncate text-base font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {record.speler.roepnaam} {record.speler.achternaam}
                  </span>
                  <span className="shrink-0 text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {record.speler.geslacht}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[12px]">
                  <span style={{ color: "var(--text-secondary)" }}>
                    {PEILJAAR - record.speler.geboortejaar} jaar
                  </span>
                  {record.speler.huidig?.team && (
                    <span style={{ color: "var(--text-tertiary)" }}>
                      {record.speler.huidig.team}
                    </span>
                  )}
                  {record.signalering && (
                    <span className="font-medium" style={{ color: "#f59e0b" }}>
                      {SIGNALERING_LABELS[record.signalering] ?? record.signalering}
                    </span>
                  )}
                </div>
              </div>
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
            </motion.button>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="py-8 text-center" style={{ color: "var(--text-tertiary)" }}>
            Geen spelers met deze status
          </div>
        )}
      </div>

      {/* Speler detail sheet */}
      <AnimatePresence>
        {selectedSpeler && (
          <SpelerGezienSheet
            record={selectedSpeler}
            users={users}
            onStatusChange={(status, notitie) => onStatusChange(selectedSpeler, status, notitie)}
            onClose={() => setSelectedSpeler(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
