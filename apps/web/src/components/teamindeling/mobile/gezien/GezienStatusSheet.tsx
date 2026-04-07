"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import type { GezienStatus } from "@oranje-wit/database";
import { PEILJAAR } from "@oranje-wit/types";
import { stelGezienStatusVoor } from "@/app/(teamindeling)/teamindeling/gezien/actions";

// ─── Types ──────────────────────────────────────────────────────

type SpelerData = {
  id: string;
  roepnaam: string;
  achternaam: string;
  geboortejaar: number;
  geslacht: string;
  huidig: { team?: string; kleur?: string; a_categorie?: string } | null;
};

type BlauwdrukRecord = {
  id: string;
  spelerId: string;
  kadersId: string;
  gezienStatus: GezienStatus;
  gezienStatusVoorgesteld: GezienStatus | null;
  gezienVoorgesteldDoor: string | null;
  notitie: string | null;
  signalering: string | null;
  speler: SpelerData;
  gezienDoor: { naam: string } | null;
};

interface Props {
  record: BlauwdrukRecord;
  onVoorstelVerzonden: () => void;
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

const GEZIEN_STATUS_LABELS: Record<GezienStatus, string> = {
  ONGEZIEN: "Ongezien",
  GROEN: "Beschikbaar",
  GEEL: "Onzeker",
  ORANJE: "Stop-signaal",
  ROOD: "Stopt",
};

// ─── Component ──────────────────────────────────────────────────

export function GezienStatusSheet({ record, onVoorstelVerzonden, onClose }: Props) {
  const [gekozenStatus, setGekozenStatus] = useState<GezienStatus | null>(null);
  const [notitie, setNotitie] = useState("");
  const [bevestigd, setBevestigd] = useState(false);
  const [isPending, startTransition] = useTransition();
  const leeftijd = PEILJAAR - record.speler.geboortejaar;

  function handleVerzend() {
    if (!gekozenStatus) return;
    startTransition(async () => {
      const result = await stelGezienStatusVoor(
        record.spelerId,
        record.kadersId,
        gekozenStatus,
        notitie || undefined
      );
      if (result.ok) {
        setBevestigd(true);
        setTimeout(() => {
          onVoorstelVerzonden();
          onClose();
        }, 1500);
      }
    });
  }

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

            {/* Huidige definitieve status (door TC) */}
            <div
              className="mt-3 rounded-xl p-3"
              style={{
                backgroundColor: "var(--surface-card)",
                border: "1px solid var(--border-default)",
              }}
            >
              <p
                className="mb-1 text-[11px] font-semibold tracking-wider uppercase"
                style={{ color: "var(--text-tertiary)" }}
              >
                Definitieve status (TC)
              </p>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {GEZIEN_STATUS_LABELS[record.gezienStatus]}
                {record.gezienDoor && (
                  <span
                    className="ml-2 text-xs font-normal"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    door {record.gezienDoor.naam}
                  </span>
                )}
              </p>
              {record.gezienStatusVoorgesteld && (
                <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                  Voorstel: {GEZIEN_STATUS_LABELS[record.gezienStatusVoorgesteld]}
                  {record.gezienVoorgesteldDoor && ` (${record.gezienVoorgesteldDoor})`}
                </p>
              )}
            </div>
          </div>

          {/* Bevestigd-staat */}
          {bevestigd ? (
            <div
              className="mb-5 rounded-xl p-4 text-center"
              style={{ backgroundColor: "rgba(34, 197, 94, 0.12)", border: "1px solid #22c55e" }}
            >
              <p className="font-semibold" style={{ color: "#22c55e" }}>
                Voorstel verzonden
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                TC ontvangt jouw voorstel
              </p>
            </div>
          ) : (
            <>
              {/* Status knoppen */}
              <div className="mb-4">
                <p
                  className="mb-2 text-[13px] font-semibold tracking-wider uppercase"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Jouw voorstel
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIES.map((opt) => {
                    const isActive = gekozenStatus === opt.status;
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
                        onClick={() => setGekozenStatus(opt.status)}
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
              <div className="mb-4">
                <p
                  className="mb-2 text-[13px] font-semibold tracking-wider uppercase"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Toelichting (optioneel)
                </p>
                <textarea
                  value={notitie}
                  onChange={(e) => setNotitie(e.target.value)}
                  placeholder="Bijv. 'Heeft aangegeven te stoppen na dit seizoen'"
                  rows={3}
                  className="w-full resize-none rounded-xl p-3 text-sm"
                  style={{
                    backgroundColor: "var(--surface-sunken)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-default)",
                  }}
                />
              </div>

              {/* Disclaimer */}
              <div
                className="mb-4 rounded-xl px-3 py-2.5"
                style={{
                  backgroundColor: "rgba(245, 158, 11, 0.08)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                }}
              >
                <p className="text-xs" style={{ color: "#f59e0b" }}>
                  Dit is een voorstel — de TC bevestigt de definitieve status.
                </p>
              </div>

              {/* Verzend-knop */}
              <button
                onClick={handleVerzend}
                disabled={!gekozenStatus || isPending}
                className="mb-3 w-full rounded-xl py-3.5 text-center text-sm font-semibold"
                style={{
                  backgroundColor: gekozenStatus ? "var(--accent-primary)" : "var(--surface-card)",
                  color: gekozenStatus ? "#fff" : "var(--text-tertiary)",
                  opacity: isPending ? 0.7 : 1,
                }}
              >
                {isPending ? "Verzenden..." : "Voorstel verzenden"}
              </button>
            </>
          )}

          {/* Sluiten */}
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
