"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { BesluitStatus } from "@oranje-wit/database";
import { updateBesluit } from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/besluit-actions";

// ─── Types ──────────────────────────────────────────────────────

type Besluit = {
  id: string;
  vraag: string;
  isStandaard: boolean;
  standaardCode: string | null;
  groep: string | null;
  antwoord: string | null;
  toelichting: string | null;
  status: BesluitStatus;
  niveau: string;
  doelgroep: string | null;
  auteur: { naam: string };
  actiepunten: Array<{
    id: string;
    beschrijving: string;
    status: string;
    deadline: string | null;
    toegewezenAan: { naam: string };
  }>;
};

interface Props {
  kadersId: string;
  seizoen: string;
  besluiten: Besluit[];
}

// ─── Constants ──────────────────────────────────────────────────

const STATUS_CONFIG: Record<BesluitStatus, { label: string; color: string; bg: string }> = {
  ONDUIDELIJK: { label: "Open", color: "#ef4444", bg: "rgba(239, 68, 68, 0.12)" },
  VOORLOPIG: { label: "Voorlopig", color: "#eab308", bg: "rgba(234, 179, 8, 0.12)" },
  DEFINITIEF: { label: "Definitief", color: "#22c55e", bg: "rgba(34, 197, 94, 0.12)" },
};

const GROEP_LABELS: Record<string, string> = {
  TEAMAANTALLEN: "Teamaantallen",
  SELECTIESTRUCTUUR: "Selectiestructuur",
  BEZETTINGSGRAAD: "Bezetting",
};

type FilterKey = "ALLE" | BesluitStatus;

// ─── Animation ──────────────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

// ─── Component ──────────────────────────────────────────────────

export function BesluitenMobileOverzicht({
  kadersId,
  seizoen,
  besluiten: initialBesluiten,
}: Props) {
  const [besluiten, setBesluiten] = useState(initialBesluiten);
  const [filter, setFilter] = useState<FilterKey>("ALLE");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = filter === "ALLE" ? besluiten : besluiten.filter((b) => b.status === filter);

  // Group by groep
  const groepen = new Map<string, Besluit[]>();
  for (const b of filtered) {
    const key = b.groep ?? "OVERIG";
    const list = groepen.get(key) ?? [];
    list.push(b);
    groepen.set(key, list);
  }

  const counts = {
    ALLE: besluiten.length,
    ONDUIDELIJK: besluiten.filter((b) => b.status === "ONDUIDELIJK").length,
    VOORLOPIG: besluiten.filter((b) => b.status === "VOORLOPIG").length,
    DEFINITIEF: besluiten.filter((b) => b.status === "DEFINITIEF").length,
  };

  function handleStatusUpdate(besluitId: string, newStatus: BesluitStatus) {
    setBesluiten((prev) => prev.map((b) => (b.id === besluitId ? { ...b, status: newStatus } : b)));

    startTransition(async () => {
      await updateBesluit(besluitId, { status: newStatus });
    });
  }

  function handleAntwoordUpdate(besluitId: string, antwoord: string) {
    setBesluiten((prev) => prev.map((b) => (b.id === besluitId ? { ...b, antwoord } : b)));

    startTransition(async () => {
      await updateBesluit(besluitId, { antwoord });
    });
  }

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
          Besluiten
        </h1>
        <p className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
          Seizoen {seizoen}
        </p>
      </motion.div>

      {/* Filter pills */}
      <motion.div variants={fadeUp} className="flex gap-1.5 overflow-x-auto">
        {(
          [
            { key: "ALLE" as const, label: "Alle" },
            { key: "ONDUIDELIJK" as const, label: "Open" },
            { key: "VOORLOPIG" as const, label: "Voorlopig" },
            { key: "DEFINITIEF" as const, label: "Definitief" },
          ] as const
        ).map((item) => {
          const config = item.key !== "ALLE" ? STATUS_CONFIG[item.key] : null;
          return (
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
              {config && (
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
              )}
              {item.label}
              <span style={{ color: "var(--text-tertiary)" }}>{counts[item.key]}</span>
            </button>
          );
        })}
      </motion.div>

      {/* Besluit-kaarten gegroepeerd */}
      {Array.from(groepen.entries()).map(([groep, items]) => (
        <motion.div key={groep} variants={fadeUp}>
          <h2
            className="mb-2 text-[13px] font-semibold tracking-wider uppercase"
            style={{ color: "var(--text-tertiary)" }}
          >
            {GROEP_LABELS[groep] ?? groep}
          </h2>

          <div className="flex flex-col gap-2">
            {items.map((besluit) => {
              const config = STATUS_CONFIG[besluit.status];
              const isExpanded = expandedId === besluit.id;

              return (
                <motion.div
                  key={besluit.id}
                  layout
                  className="overflow-hidden rounded-xl"
                  style={{
                    backgroundColor: "var(--surface-card)",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  {/* Header — always visible */}
                  <button
                    className="flex w-full items-start gap-3 p-4 text-left"
                    onClick={() => setExpandedId(isExpanded ? null : besluit.id)}
                  >
                    <span
                      className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-sm leading-snug font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {besluit.vraag}
                      </p>
                      {besluit.antwoord && !isExpanded && (
                        <p
                          className="mt-1 line-clamp-1 text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {besluit.antwoord}
                        </p>
                      )}
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={{ backgroundColor: config.bg, color: config.color }}
                    >
                      {config.label}
                    </span>
                  </button>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div
                          className="space-y-3 px-4 pb-4"
                          style={{ borderTop: "1px solid var(--border-default)" }}
                        >
                          {/* Antwoord-invoer */}
                          <div className="pt-3">
                            <textarea
                              value={besluit.antwoord ?? ""}
                              onChange={(e) => handleAntwoordUpdate(besluit.id, e.target.value)}
                              placeholder="Antwoord / toelichting..."
                              rows={3}
                              className="w-full resize-none rounded-lg p-2.5 text-sm"
                              style={{
                                backgroundColor: "var(--surface-sunken)",
                                color: "var(--text-primary)",
                                border: "1px solid var(--border-default)",
                              }}
                            />
                          </div>

                          {/* Status-knoppen */}
                          <div className="flex gap-2">
                            {(["ONDUIDELIJK", "VOORLOPIG", "DEFINITIEF"] as BesluitStatus[]).map(
                              (s) => {
                                const c = STATUS_CONFIG[s];
                                const isActive = besluit.status === s;
                                return (
                                  <button
                                    key={s}
                                    onClick={() => handleStatusUpdate(besluit.id, s)}
                                    disabled={isPending}
                                    className="flex-1 rounded-lg py-2 text-xs font-semibold transition-colors disabled:opacity-50"
                                    style={{
                                      backgroundColor: isActive ? c.bg : "var(--surface-sunken)",
                                      color: isActive ? c.color : "var(--text-tertiary)",
                                      border: isActive
                                        ? `1px solid ${c.color}`
                                        : "1px solid var(--border-default)",
                                    }}
                                  >
                                    {c.label}
                                  </button>
                                );
                              }
                            )}
                          </div>

                          {/* Actiepunten */}
                          {besluit.actiepunten.length > 0 && (
                            <div>
                              <p
                                className="mb-1 text-[11px] font-semibold tracking-wider uppercase"
                                style={{ color: "var(--text-tertiary)" }}
                              >
                                Actiepunten
                              </p>
                              {besluit.actiepunten.map((a) => (
                                <div
                                  key={a.id}
                                  className="flex items-center gap-2 text-xs"
                                  style={{ color: "var(--text-secondary)" }}
                                >
                                  <span
                                    className="inline-block h-1.5 w-1.5 rounded-full"
                                    style={{
                                      backgroundColor:
                                        a.status === "AFGEROND" ? "#22c55e" : "#6b7280",
                                    }}
                                  />
                                  <span className="flex-1">{a.beschrijving}</span>
                                  <span style={{ color: "var(--text-tertiary)" }}>
                                    {a.toegewezenAan.naam}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Meta */}
                          <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                            {besluit.auteur.naam}
                            {besluit.isStandaard && " · standaardvraag"}
                            {besluit.niveau === "BESTUURLIJK" && " · bestuurlijk"}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      ))}

      {filtered.length === 0 && (
        <div className="py-8 text-center" style={{ color: "var(--text-tertiary)" }}>
          Geen besluiten met deze status
        </div>
      )}
    </motion.div>
  );
}
