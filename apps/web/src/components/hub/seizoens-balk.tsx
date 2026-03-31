/**
 * SeizoensBalk — compacte seizoensindicator met progress bar.
 * Server component. Berekent voortgang op basis van 1 sep - 30 jun.
 */

import { HUIDIG_SEIZOEN } from "@oranje-wit/types";

// ── Seizoensberekening ──────────────────────────────────────────

function berekenSeizoensVoortgang(): {
  percentage: number;
  periode: string;
} {
  const nu = new Date();
  // Seizoen loopt van 1 september tot 30 juni
  const startJaar = parseInt(HUIDIG_SEIZOEN.split("-")[0], 10);
  const start = new Date(startJaar, 8, 1); // 1 september
  const eind = new Date(startJaar + 1, 5, 30); // 30 juni

  const totaal = eind.getTime() - start.getTime();
  const verlopen = Math.max(0, nu.getTime() - start.getTime());
  const percentage = Math.min(100, Math.round((verlopen / totaal) * 100));

  // Bepaal seizoensperiode
  const maand = nu.getMonth(); // 0-indexed
  let periode: string;
  if (maand >= 8 && maand <= 10) {
    periode = "Oogsten & Zaaien";
  } else if (maand >= 11 || maand === 0) {
    periode = "Groeien";
  } else if (maand >= 1 && maand <= 3) {
    periode = "Bloeien";
  } else {
    periode = "Oogsten";
  }

  return { percentage, periode };
}

// ── Component ───────────────────────────────────────────────────

export function SeizoensBalk() {
  const { percentage, periode } = berekenSeizoensVoortgang();

  return (
    <div
      className="animate-fade-in animate-fade-in-delay-4 mx-5 rounded-2xl p-4"
      style={{
        backgroundColor: "var(--surface-card)",
        border: "1px solid var(--border-default)",
      }}
    >
      {/* Header rij */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Seizoen {HUIDIG_SEIZOEN}
        </span>
        <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
          {percentage}%
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="mt-2.5 h-1.5 overflow-hidden rounded-full"
        style={{ backgroundColor: "var(--surface-sunken)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${percentage}%`,
            background: "linear-gradient(90deg, #f97316, #fb923c)",
            boxShadow: "0 0 8px rgba(249,115,22,0.4)",
          }}
        />
      </div>

      {/* Periode */}
      <p className="mt-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
        {periode}
      </p>
    </div>
  );
}
