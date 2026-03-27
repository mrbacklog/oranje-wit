"use client";

/**
 * DeadlineBadge — Toont een countdown naar de deadline van een scouting-verzoek.
 *
 * Kleur verandert op basis van urgentie:
 * - Groen: > 7 dagen
 * - Oranje: 3-7 dagen
 * - Rood: < 3 dagen
 * - Grijs: geen deadline
 */

interface DeadlineBadgeProps {
  deadline: string | null;
  compact?: boolean;
}

function berekenDagen(deadline: string): number {
  const nu = new Date();
  const dl = new Date(deadline);
  return Math.ceil((dl.getTime() - nu.getTime()) / (1000 * 60 * 60 * 24));
}

export function DeadlineBadge({ deadline, compact = false }: DeadlineBadgeProps) {
  if (!deadline) {
    if (compact) return null;
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
        Geen deadline
      </span>
    );
  }

  const dagen = berekenDagen(deadline);
  const verlopen = dagen < 0;

  const kleur = verlopen
    ? "bg-red-100 text-red-700"
    : dagen <= 3
      ? "bg-red-100 text-red-700"
      : dagen <= 7
        ? "bg-orange-100 text-orange-700"
        : "bg-green-100 text-green-700";

  const tekst = verlopen
    ? `${Math.abs(dagen)}d over deadline`
    : dagen === 0
      ? "Vandaag"
      : dagen === 1
        ? "Morgen"
        : `${dagen} dagen`;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${kleur} ${compact ? "text-[10px]" : "text-xs"}`}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 3.5V6L7.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {tekst}
    </span>
  );
}
