"use client";

import { DeadlineBadge } from "./deadline-badge";

/**
 * VerzoekKaart — Toont een scouting-verzoek in de verzoeken-lijst.
 *
 * Gebruikt door zowel scouts (eigen verzoeken) als TC (alle verzoeken).
 */

interface VerzoekKaartProps {
  id: string;
  type: "GENERIEK" | "SPECIFIEK" | "VERGELIJKING";
  doel: "DOORSTROOM" | "SELECTIE" | "NIVEAUBEPALING" | "OVERIG";
  status: "OPEN" | "ACTIEF" | "AFGEROND" | "GEANNULEERD";
  toelichting?: string | null;
  deadline?: string | null;
  teamNaam?: string | null;
  aantalSpelers: number;
  voortgang?: { afgerond: number; totaal: number };
  toewijzingStatus?: string; // Voor scout: eigen toewijzing-status
  heeftDraft?: boolean;
  onClick?: () => void;
}

const TYPE_STIJL: Record<string, { bg: string; text: string; label: string }> = {
  GENERIEK: { bg: "bg-blue-100", text: "text-blue-700", label: "Team" },
  SPECIFIEK: { bg: "bg-orange-100", text: "text-orange-700", label: "Speler" },
  VERGELIJKING: { bg: "bg-purple-100", text: "text-purple-700", label: "Vergelijk" },
};

const DOEL_LABELS: Record<string, string> = {
  DOORSTROOM: "Doorstroom",
  SELECTIE: "Selectie",
  NIVEAUBEPALING: "Niveau",
  OVERIG: "Overig",
};

const STATUS_STIJL: Record<string, { bg: string; text: string }> = {
  OPEN: { bg: "bg-orange-50", text: "text-orange-600" },
  ACTIEF: { bg: "bg-blue-50", text: "text-blue-600" },
  AFGEROND: { bg: "bg-green-50", text: "text-green-600" },
  GEANNULEERD: { bg: "bg-surface-dark", text: "text-text-muted" },
};

export function VerzoekKaart({
  type,
  doel,
  status,
  toelichting,
  deadline,
  teamNaam,
  aantalSpelers,
  voortgang,
  toewijzingStatus,
  heeftDraft,
  onClick,
}: VerzoekKaartProps) {
  const typeStijl = TYPE_STIJL[type] ?? TYPE_STIJL.GENERIEK;
  const statusStijl = STATUS_STIJL[status] ?? STATUS_STIJL.OPEN;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-border-subtle bg-surface-card p-4 text-left transition-shadow hover:shadow-md active:scale-[0.98]"
    >
      {/* Bovenste rij: badges */}
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${typeStijl.bg} ${typeStijl.text}`}
        >
          {typeStijl.label}
        </span>
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-text-secondary">
          {DOEL_LABELS[doel] ?? doel}
        </span>
        <div className="flex-1" />
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStijl.bg} ${statusStijl.text}`}
        >
          {status.toLowerCase()}
        </span>
        {heeftDraft && (
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange-500" />
          </span>
        )}
      </div>

      {/* Inhoud */}
      <div className="mt-2">
        <p className="text-sm font-semibold text-text-primary">
          {teamNaam ?? `${aantalSpelers} speler${aantalSpelers !== 1 ? "s" : ""}`}
        </p>
        {toelichting && <p className="mt-0.5 line-clamp-2 text-xs text-text-muted">{toelichting}</p>}
      </div>

      {/* Onderste rij: deadline + voortgang */}
      <div className="mt-3 flex items-center justify-between">
        <DeadlineBadge deadline={deadline ?? null} compact />
        {voortgang && voortgang.totaal > 0 && (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-green-400 transition-all"
                style={{
                  width: `${(voortgang.afgerond / voortgang.totaal) * 100}%`,
                }}
              />
            </div>
            <span className="text-[10px] font-medium text-text-muted">
              {voortgang.afgerond}/{voortgang.totaal}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
