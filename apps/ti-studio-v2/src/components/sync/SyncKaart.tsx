"use client";

import type { SyncKaartData } from "./types";

interface SyncKaartProps {
  data: SyncKaartData;
  onSynchroniseer: (id: SyncKaartData["id"]) => void;
  disabled?: boolean;
}

function FresheidDot({ fresheid }: { fresheid: SyncKaartData["fresheid"] }) {
  const kleur =
    fresheid === "ok" ? "#22c55e" : fresheid === "stale" ? "#fbbf24" : "var(--text-tertiary)";
  return (
    <span
      style={{
        display: "inline-block",
        width: 5,
        height: 5,
        borderRadius: "50%",
        background: kleur,
        flexShrink: 0,
      }}
    />
  );
}

function formatDatum(datum: Date | null): string {
  if (!datum) return "Nooit gesynchroniseerd";
  return datum.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function KaartIcon({ id }: { id: SyncKaartData["id"] }) {
  if (id === "leden") {
    return (
      <svg
        viewBox="0 0 24 24"
        width={20}
        height={20}
        fill="none"
        stroke="var(--text-secondary)"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  if (id === "competitie") {
    return (
      <svg
        viewBox="0 0 24 24"
        width={20}
        height={20}
        fill="none"
        stroke="var(--text-secondary)"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    );
  }
  // historie
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="var(--text-secondary)"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v4" />
      <path d="m16.2 7.8 2.9-2.9" />
      <path d="M18 12h4" />
      <path d="m16.2 16.2 2.9 2.9" />
      <path d="M12 18v4" />
      <path d="m4.9 19.1 2.9-2.9" />
      <path d="M2 12h4" />
      <path d="m4.9 4.9 2.9 2.9" />
    </svg>
  );
}

function MetaLabel({
  fresheid,
  datum,
  aantalRecords,
  isPlaceholder,
}: {
  fresheid: SyncKaartData["fresheid"];
  datum: Date | null;
  aantalRecords: number | null;
  isPlaceholder?: boolean;
}) {
  if (isPlaceholder) {
    return (
      <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontStyle: "italic" }}>
        Binnenkort beschikbaar
      </span>
    );
  }
  const datumTekst = formatDatum(datum);
  const extra =
    fresheid === "stale"
      ? " — verouderd"
      : aantalRecords !== null
        ? ` · ${aantalRecords} records`
        : "";
  return (
    <>
      <FresheidDot fresheid={fresheid} />
      <span>{datum ? `Laatste sync: ${datumTekst}${extra}` : datumTekst}</span>
    </>
  );
}

export function SyncKaart({ data, onSynchroniseer, disabled = true }: SyncKaartProps) {
  const isPlaceholder = data.id === "competitie";
  const tooltipTekst = "Synchronisatie beschikbaar in volgende release";

  return (
    <div
      style={{
        padding: "16px 20px",
        borderRadius: 12,
        border: "1px solid var(--border-light)",
        background: "var(--surface-card)",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: "rgba(255,255,255,.03)",
          border: "1px solid rgba(255,255,255,.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <KaartIcon id={data.id} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: 2,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {data.titel}
          {isPlaceholder && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: "1px 6px",
                borderRadius: 4,
                background: "rgba(255,255,255,.06)",
                color: "var(--text-tertiary)",
                letterSpacing: "0.04em",
              }}
            >
              Binnenkort
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--text-tertiary)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <MetaLabel
            fresheid={data.fresheid}
            datum={data.laatstGesyncOp}
            aantalRecords={data.aantalRecords}
            isPlaceholder={isPlaceholder}
          />
        </div>
      </div>

      {/* Knop */}
      <button
        disabled={disabled || isPlaceholder}
        title={disabled || isPlaceholder ? tooltipTekst : undefined}
        onClick={() => onSynchroniseer(data.id)}
        style={{
          padding: "7px 14px",
          borderRadius: 7,
          border: "none",
          background: disabled || isPlaceholder ? "rgba(255,255,255,.04)" : "rgba(255,255,255,.06)",
          color: disabled || isPlaceholder ? "var(--text-tertiary)" : "var(--text-primary)",
          fontSize: 12,
          fontWeight: 600,
          cursor: disabled || isPlaceholder ? "not-allowed" : "pointer",
          flexShrink: 0,
          opacity: disabled || isPlaceholder ? 0.6 : 1,
          fontFamily: "inherit",
        }}
      >
        Synchroniseer
      </button>
    </div>
  );
}
