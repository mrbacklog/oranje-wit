"use client";

import { SpelerAvatar } from "./speler-avatar";
import { LeeftijdsgroepBadge } from "./leeftijdsgroep-badge";

/**
 * SpelerContext — Toont speler-informatie voor een scout (clearance 0).
 *
 * Geeft de scout genoeg context om te weten wie hij beoordeelt,
 * ZONDER scores of spelerskaart te tonen (anti-anchoring).
 */

interface SpelerContextProps {
  relCode: string;
  roepnaam: string;
  achternaam: string;
  tussenvoegsel?: string | null;
  geboortejaar: number;
  korfbalLeeftijd: number;
  geslacht: "M" | "V";
  team?: string;
  kleur?: string;
  seizoenenActief?: number | null;
  heeftFoto?: boolean;
  fotoUrl?: string;
  compact?: boolean;
}

export function SpelerContext({
  roepnaam,
  achternaam,
  tussenvoegsel,
  korfbalLeeftijd,
  geslacht,
  team,
  kleur,
  seizoenenActief,
  heeftFoto,
  fotoUrl,
  compact = false,
}: SpelerContextProps) {
  const volledigeNaam = tussenvoegsel
    ? `${roepnaam} ${tussenvoegsel} ${achternaam}`
    : `${roepnaam} ${achternaam}`;

  const leeftijdTekst = `${korfbalLeeftijd.toFixed(1)} jr`;
  const jarenActief =
    seizoenenActief != null
      ? `${seizoenenActief} seizoen${seizoenenActief !== 1 ? "en" : ""} actief`
      : null;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <SpelerAvatar
          naam={roepnaam}
          achternaam={achternaam}
          kleur={kleur}
          fotoUrl={heeftFoto ? fotoUrl : undefined}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-primary">{volledigeNaam}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">{leeftijdTekst}</span>
            {kleur && <LeeftijdsgroepBadge kleur={kleur} />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-card p-4">
      <div className="flex items-start gap-4">
        {/* Foto of avatar */}
        <SpelerAvatar
          naam={roepnaam}
          achternaam={achternaam}
          kleur={kleur}
          fotoUrl={heeftFoto ? fotoUrl : undefined}
          size="lg"
        />

        {/* Info */}
        <div className="flex-1">
          <p className="text-base font-bold text-text-primary">{volledigeNaam}</p>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {/* Korfballeeftijd */}
            <div className="flex items-center gap-1 text-xs text-text-secondary">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-text-muted">
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
                <path
                  d="M7 4v3l2 1.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
              <span className="font-medium">{leeftijdTekst}</span>
            </div>

            {/* Geslacht */}
            <span className="text-xs text-text-muted">{geslacht === "M" ? "Jongen" : "Meisje"}</span>

            {/* Team + kleur */}
            {team && (
              <div className="flex items-center gap-1">
                {kleur && <LeeftijdsgroepBadge kleur={kleur} />}
                <span className="text-xs font-medium text-text-secondary">{team}</span>
              </div>
            )}
          </div>

          {/* Ervaring */}
          {jarenActief && <p className="mt-1.5 text-xs text-text-muted">{jarenActief}</p>}
        </div>
      </div>
    </div>
  );
}
