"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { GezienStatus } from "@oranje-wit/database";
import { PEILJAAR } from "@oranje-wit/types";

// ─── Types ──────────────────────────────────────────────────────

type SpelerData = {
  id: string;
  roepnaam: string;
  achternaam: string;
  geboortejaar: number;
  geslacht: string;
  huidig: { team?: string; kleur?: string; a_categorie?: string } | null;
  status: string;
};

type BlauwdrukRecord = {
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
  record: BlauwdrukRecord;
  users: Array<{ id: string; naam: string }>;
  onStatusChange: (status: GezienStatus, notitie?: string) => void;
  onClose: () => void;
}

// ─── Constants ──────────────────────────────────────────────────

const STATUS_OPTIES: Array<{
  status: GezienStatus;
  label: string;
  sub: string;
  color: string;
  bg: string;
}> = [
  {
    status: "GROEN",
    label: "Beschikbaar",
    sub: "Komt terug, geen twijfel",
    color: "#22c55e",
    bg: "rgba(34, 197, 94, 0.12)",
  },
  {
    status: "GEEL",
    label: "Onzeker",
    sub: "Moet uitgezocht worden",
    color: "#eab308",
    bg: "rgba(234, 179, 8, 0.12)",
  },
  {
    status: "ORANJE",
    label: "Stop-signaal",
    sub: "Signalen dat het stopt",
    color: "#f97316",
    bg: "rgba(249, 115, 22, 0.12)",
  },
  {
    status: "ROOD",
    label: "Stopt",
    sub: "Definitief gestopt",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.12)",
  },
];

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

// ─── Component ──────────────────────────────────────────────────

export function SpelerGezienSheet({ record, onStatusChange, onClose }: Props) {
  const [notitie, setNotitie] = useState(record.notitie ?? "");
  const leeftijd = PEILJAAR - record.speler.geboortejaar;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        className="fixed right-0 bottom-0 left-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl"
        style={{
          backgroundColor: "var(--surface-raised)",
          paddingBottom: "env(safe-area-inset-bottom, 24px)",
        }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            className="h-1 w-10 rounded-full"
            style={{ backgroundColor: "var(--border-default)" }}
          />
        </div>

        <div className="px-5 pb-6">
          {/* Speler header */}
          <div className="mb-5">
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              {record.speler.roepnaam} {record.speler.achternaam}
            </h2>
            <div
              className="mt-1 flex flex-wrap items-center gap-2 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              <span>{leeftijd} jaar</span>
              <span style={{ color: "var(--text-tertiary)" }}>&middot;</span>
              <span>{record.speler.geslacht === "M" ? "Jongen" : "Meisje"}</span>
              {record.speler.huidig?.team && (
                <>
                  <span style={{ color: "var(--text-tertiary)" }}>&middot;</span>
                  <span>{record.speler.huidig.team}</span>
                </>
              )}
            </div>

            {/* Signalering */}
            {record.signalering && (
              <div
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium"
                style={{
                  backgroundColor: "rgba(245, 158, 11, 0.12)",
                  color: "#f59e0b",
                }}
              >
                <svg
                  width={14}
                  height={14}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                {SIGNALERING_LABELS[record.signalering] ?? record.signalering}
              </div>
            )}

            {/* Gezien door */}
            {record.gezienDoor && (
              <p className="mt-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
                Gezien door {record.gezienDoor.naam}
              </p>
            )}
          </div>

          {/* Status knoppen */}
          <div className="mb-5">
            <p
              className="mb-2 text-[13px] font-semibold tracking-wider uppercase"
              style={{ color: "var(--text-tertiary)" }}
            >
              Status instellen
            </p>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIES.map((opt) => {
                const isActive = record.gezienStatus === opt.status;
                return (
                  <motion.button
                    key={opt.status}
                    className="rounded-xl p-3 text-left"
                    style={{
                      backgroundColor: isActive ? opt.bg : "var(--surface-card)",
                      border: isActive
                        ? `2px solid ${opt.color}`
                        : "1px solid var(--border-default)",
                    }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ duration: 0.1 }}
                    onClick={() => onStatusChange(opt.status, notitie || undefined)}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: opt.color }}
                      />
                      <span
                        className="text-sm font-semibold"
                        style={{ color: isActive ? opt.color : "var(--text-primary)" }}
                      >
                        {opt.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                      {opt.sub}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Notitie */}
          <div className="mb-5">
            <p
              className="mb-2 text-[13px] font-semibold tracking-wider uppercase"
              style={{ color: "var(--text-tertiary)" }}
            >
              Notitie
            </p>
            <textarea
              value={notitie}
              onChange={(e) => setNotitie(e.target.value)}
              placeholder="Optionele toelichting..."
              rows={3}
              className="w-full resize-none rounded-xl p-3 text-sm"
              style={{
                backgroundColor: "var(--surface-sunken)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-default)",
              }}
            />
          </div>

          {/* Actiepunt (als die er is) */}
          {record.actiepunt && (
            <div
              className="mb-5 rounded-xl p-3"
              style={{
                backgroundColor: "var(--surface-card)",
                border: "1px solid var(--border-default)",
              }}
            >
              <p
                className="mb-1 text-[11px] font-semibold tracking-wider uppercase"
                style={{ color: "var(--text-tertiary)" }}
              >
                Actiepunt
              </p>
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                {record.actiepunt.beschrijving}
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                {record.actiepunt.toegewezenAan.naam} &middot;{" "}
                {record.actiepunt.status.toLowerCase()}
              </p>
            </div>
          )}

          {/* Sluiten-knop */}
          <button
            onClick={onClose}
            className="w-full rounded-xl py-3 text-center text-sm font-semibold"
            style={{
              backgroundColor: "var(--surface-card)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-default)",
            }}
          >
            Sluiten
          </button>
        </div>
      </motion.div>
    </>
  );
}
