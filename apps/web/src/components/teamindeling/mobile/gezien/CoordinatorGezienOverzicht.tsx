"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GezienStatus } from "@oranje-wit/database";
import { PEILJAAR } from "@oranje-wit/types";
import { GezienStatusSheet } from "./GezienStatusSheet";

// ─── Types ──────────────────────────────────────────────────────

type SpelerRecord = {
  id: string;
  spelerId: string;
  blauwdrukId: string;
  gezienStatus: GezienStatus;
  gezienStatusVoorgesteld: GezienStatus | null;
  gezienVoorgesteldDoor: string | null;
  notitie: string | null;
  signalering: string | null;
  gezienDoor: { naam: string } | null;
  speler: {
    id: string;
    roepnaam: string;
    achternaam: string;
    geboortejaar: number;
    geslacht: string;
    huidig: { team?: string; kleur?: string; a_categorie?: string } | null;
  };
};

type TeamData = {
  id: string;
  naam: string;
  kleur: string | null | undefined;
  spelers: SpelerRecord[];
};

interface Props {
  coordinator: { id: string; naam: string } | null;
  teams: TeamData[];
  seizoen: string;
}

// ─── Status kleuren ──────────────────────────────────────────────

const STATUS_COLORS: Record<GezienStatus, string> = {
  ONGEZIEN: "#6b7280",
  GROEN: "#22c55e",
  GEEL: "#eab308",
  ORANJE: "#f97316",
  ROOD: "#ef4444",
};

const STATUS_LABELS: Record<GezienStatus, string> = {
  ONGEZIEN: "Ongezien",
  GROEN: "Beschikbaar",
  GEEL: "Onzeker",
  ORANJE: "Stop-signaal",
  ROOD: "Stopt",
};

// ─── Speler rij ─────────────────────────────────────────────────

function SpelerRij({
  record,
  onTik,
}: {
  record: SpelerRecord;
  onTik: (record: SpelerRecord) => void;
}) {
  const leeftijd = PEILJAAR - record.speler.geboortejaar;
  const kleur = STATUS_COLORS[record.gezienStatus];
  const heeftVoorstel = !!record.gezienStatusVoorgesteld;

  return (
    <motion.button
      className="flex w-full items-center gap-3 rounded-xl p-3 text-left"
      style={{
        backgroundColor: "var(--surface-card)",
        border: "1px solid var(--border-default)",
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
      onClick={() => onTik(record)}
    >
      {/* Status indicator */}
      <div className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: kleur }} />

      {/* Speler info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {record.speler.roepnaam} {record.speler.achternaam}
        </p>
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {leeftijd} jaar &middot; {record.speler.geslacht === "M" ? "Jongen" : "Meisje"}
        </p>
      </div>

      {/* Status + voorstel badge */}
      <div className="flex flex-col items-end gap-1">
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{
            backgroundColor: `${kleur}1a`,
            color: kleur,
          }}
        >
          {STATUS_LABELS[record.gezienStatus]}
        </span>
        {heeftVoorstel && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{
              backgroundColor: "rgba(245, 158, 11, 0.12)",
              color: "#f59e0b",
            }}
          >
            Voorstel ingediend
          </span>
        )}
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
        style={{ color: "var(--text-tertiary)", flexShrink: 0 }}
        aria-hidden="true"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </motion.button>
  );
}

// ─── Team sectie ─────────────────────────────────────────────────

function TeamSectie({
  team,
  onSpelerTik,
}: {
  team: TeamData;
  onSpelerTik: (record: SpelerRecord) => void;
}) {
  const [open, setOpen] = useState(true);
  const gezien = team.spelers.filter((s) => s.gezienStatus !== "ONGEZIEN").length;
  const totaal = team.spelers.length;

  return (
    <div className="mb-4">
      <button
        className="mb-2 flex w-full items-center justify-between"
        onClick={() => setOpen((o) => !o)}
      >
        <div>
          <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            {team.naam}
          </h3>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {gezien}/{totaal} gezien
          </p>
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
          style={{
            color: "var(--text-tertiary)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div className="flex flex-col gap-2">
              {team.spelers.length === 0 ? (
                <p
                  className="rounded-xl p-3 text-sm"
                  style={{
                    color: "var(--text-tertiary)",
                    backgroundColor: "var(--surface-card)",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  Geen spelers gekoppeld aan dit team
                </p>
              ) : (
                team.spelers.map((s) => <SpelerRij key={s.id} record={s} onTik={onSpelerTik} />)
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Hoofdcomponent ──────────────────────────────────────────────

export function CoordinatorGezienOverzicht({ coordinator, teams, seizoen }: Props) {
  const [actieveRecord, setActieveRecord] = useState<SpelerRecord | null>(null);
  const [localTeams, setLocalTeams] = useState(teams);

  function handleVoorstelVerzonden() {
    // Optimistische update: markeer voorstel als ingediend in lokale state
    if (!actieveRecord) return;
    setLocalTeams((prev) =>
      prev.map((t) => ({
        ...t,
        spelers: t.spelers.map((s) =>
          s.id === actieveRecord.id ? { ...s, gezienStatusVoorgesteld: s.gezienStatus } : s
        ),
      }))
    );
  }

  if (!coordinator) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          Geen coördinator-koppeling
        </p>
        <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          Jouw e-mailadres is niet gekoppeld als coördinator. Neem contact op met de TC.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Speler gezien-status
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            {seizoen} &middot; {coordinator.naam}
          </p>
          <div
            className="mt-3 rounded-xl px-3 py-2"
            style={{
              backgroundColor: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
            }}
          >
            <p className="text-xs" style={{ color: "#f59e0b" }}>
              Jouw voorstellen worden zichtbaar voor de TC. De definitieve status wordt door de TC
              bevestigd.
            </p>
          </div>
        </div>

        {/* Teams */}
        {localTeams.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Je bent nog niet gekoppeld aan teams voor dit seizoen.
          </p>
        ) : (
          localTeams.map((team) => (
            <TeamSectie key={team.id} team={team} onSpelerTik={setActieveRecord} />
          ))
        )}
      </div>

      {/* Sheet */}
      <AnimatePresence>
        {actieveRecord && (
          <GezienStatusSheet
            record={actieveRecord}
            onVoorstelVerzonden={handleVoorstelVerzonden}
            onClose={() => setActieveRecord(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
