"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  dienVoorstelIn,
  type VoorstelType,
} from "@/app/(teamindeling)/teamindeling/voorstel/actions";

// ─── Types ──────────────────────────────────────────────────────

const VOORSTEL_TYPEN: Array<{ type: VoorstelType; label: string; sub: string }> = [
  {
    type: "SPELERWIJZIGING",
    label: "Spelerwijziging",
    sub: "Status, indeling of bijzonderheden over een speler",
  },
  {
    type: "TEAMSTRUCTUUR",
    label: "Teamstructuur",
    sub: "Samenstelling, teamgrootte of niveau-indeling",
  },
  {
    type: "OVERIG",
    label: "Overig",
    sub: "Alles wat niet in bovenstaande past",
  },
];

// ─── Component ──────────────────────────────────────────────────

export function VoorstelFormulier() {
  const [type, setType] = useState<VoorstelType>("SPELERWIJZIGING");
  const [omschrijving, setOmschrijving] = useState("");
  const [teamNaam, setTeamNaam] = useState("");
  const [fout, setFout] = useState<string | null>(null);
  const [verzonden, setVerzonden] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleVerzend() {
    if (!omschrijving.trim()) {
      setFout("Vul een omschrijving in.");
      return;
    }
    setFout(null);

    startTransition(async () => {
      const result = await dienVoorstelIn({
        type,
        omschrijving,
        teamNaam: teamNaam.trim() || undefined,
      });

      if (result.ok) {
        setVerzonden(true);
      } else {
        setFout(result.error ?? "Er is iets misgegaan.");
      }
    });
  }

  function handleNieuw() {
    setType("SPELERWIJZIGING");
    setOmschrijving("");
    setTeamNaam("");
    setFout(null);
    setVerzonden(false);
  }

  // ─── Bevestigingsscherm ───────────────────────────────────────

  if (verzonden) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
        >
          <div
            className="mb-5 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(34, 197, 94, 0.12)" }}
          >
            <svg
              width={32}
              height={32}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#22c55e"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Voorstel ingediend
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            De TC heeft jouw voorstel ontvangen en neemt het mee in de volgende bespreking.
          </p>

          <button
            onClick={handleNieuw}
            className="mt-8 w-full rounded-xl py-3.5 text-sm font-semibold"
            style={{
              backgroundColor: "var(--surface-card)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-default)",
            }}
          >
            Nieuw voorstel indienen
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── Formulier ───────────────────────────────────────────────

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Wijzigingsvoorstel
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Geef een voorstel door aan de TC
        </p>
      </div>

      {/* Type */}
      <div className="mb-5">
        <p
          className="mb-2 text-[13px] font-semibold tracking-wider uppercase"
          style={{ color: "var(--text-tertiary)" }}
        >
          Type voorstel
        </p>
        <div className="flex flex-col gap-2">
          {VOORSTEL_TYPEN.map((opt) => {
            const isActive = type === opt.type;
            return (
              <motion.button
                key={opt.type}
                className="rounded-xl p-3 text-left"
                style={{
                  backgroundColor: isActive ? "rgba(99, 102, 241, 0.1)" : "var(--surface-card)",
                  border: isActive
                    ? "2px solid var(--accent-primary)"
                    : "1px solid var(--border-default)",
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.1 }}
                onClick={() => setType(opt.type)}
              >
                <p
                  className="text-sm font-semibold"
                  style={{ color: isActive ? "var(--accent-primary)" : "var(--text-primary)" }}
                >
                  {opt.label}
                </p>
                <p className="mt-0.5 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                  {opt.sub}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Optioneel: team */}
      <div className="mb-5">
        <p
          className="mb-2 text-[13px] font-semibold tracking-wider uppercase"
          style={{ color: "var(--text-tertiary)" }}
        >
          Team (optioneel)
        </p>
        <input
          type="text"
          value={teamNaam}
          onChange={(e) => setTeamNaam(e.target.value)}
          placeholder="Bijv. OW 3 of U15-1"
          className="w-full rounded-xl p-3 text-sm"
          style={{
            backgroundColor: "var(--surface-sunken)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-default)",
          }}
        />
      </div>

      {/* Omschrijving */}
      <div className="mb-5">
        <p
          className="mb-2 text-[13px] font-semibold tracking-wider uppercase"
          style={{ color: "var(--text-tertiary)" }}
        >
          Omschrijving *
        </p>
        <textarea
          value={omschrijving}
          onChange={(e) => setOmschrijving(e.target.value)}
          placeholder="Beschrijf je voorstel zo concreet mogelijk..."
          rows={5}
          className="w-full resize-none rounded-xl p-3 text-sm"
          style={{
            backgroundColor: "var(--surface-sunken)",
            color: "var(--text-primary)",
            border:
              fout && !omschrijving.trim()
                ? "1px solid #ef4444"
                : "1px solid var(--border-default)",
          }}
        />
      </div>

      {/* Foutmelding */}
      {fout && (
        <div
          className="mb-4 rounded-xl px-3 py-2.5"
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
          }}
        >
          <p className="text-xs" style={{ color: "#ef4444" }}>
            {fout}
          </p>
        </div>
      )}

      {/* Verzend-knop */}
      <button
        onClick={handleVerzend}
        disabled={isPending}
        className="w-full rounded-xl py-3.5 text-center text-sm font-semibold"
        style={{
          backgroundColor: "var(--accent-primary)",
          color: "#fff",
          opacity: isPending ? 0.7 : 1,
        }}
      >
        {isPending ? "Verzenden..." : "Voorstel indienen"}
      </button>
    </div>
  );
}
