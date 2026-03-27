"use client";

import type { LedenDiff } from "@/lib/teamindeling/leden-diff";

interface LedenSyncPreviewProps {
  diff: LedenDiff;
  geselecteerdNieuw: Set<string>;
  geselecteerdVertrokken: Set<string>;
  onToggleNieuw: (relCode: string) => void;
  onToggleVertrokken: (id: string) => void;
  sectieOpen: { nieuw: boolean; vertrokken: boolean; gewijzigd: boolean };
  onToggleSectie: (key: "nieuw" | "vertrokken" | "gewijzigd") => void;
}

export default function LedenSyncPreview({
  diff,
  geselecteerdNieuw,
  geselecteerdVertrokken,
  onToggleNieuw,
  onToggleVertrokken,
  sectieOpen,
  onToggleSectie,
}: LedenSyncPreviewProps) {
  return (
    <div className="space-y-4">
      {/* Samenvatting */}
      <div className="flex gap-4 rounded-lg bg-gray-50 px-4 py-3 text-sm">
        <span className="text-gray-600">
          CSV: <strong>{diff.csvBondsleden}</strong> bondsleden
        </span>
        <span className="text-gray-400">|</span>
        <span className="text-gray-600">
          Database: <strong>{diff.dbSpelers}</strong> spelers
        </span>
      </div>

      {/* Nieuw */}
      <SectieHeader
        label="Nieuw"
        aantal={diff.nieuweLeden.length}
        kleur="text-blue-600"
        open={sectieOpen.nieuw}
        onToggle={() => onToggleSectie("nieuw")}
      />
      {sectieOpen.nieuw && diff.nieuweLeden.length > 0 && (
        <div className="space-y-1 pl-2">
          {diff.nieuweLeden.map((lid) => (
            <label
              key={lid.relCode}
              className="flex items-center gap-2 rounded px-2 py-1 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={geselecteerdNieuw.has(lid.relCode)}
                onChange={() => onToggleNieuw(lid.relCode)}
                className="rounded border-gray-300 text-orange-500 focus:ring-orange-300"
              />
              <span className="text-sm text-gray-800">
                {lid.roepnaam} {lid.tussenvoegsel ? `${lid.tussenvoegsel} ` : ""}
                {lid.achternaam}
              </span>
              <span className="text-xs text-gray-400">
                ({lid.relCode}) — {lid.geboortejaar}, {lid.geslacht}
              </span>
            </label>
          ))}
        </div>
      )}
      {diff.nieuweLeden.length === 0 && (
        <p className="pl-2 text-xs text-gray-400 italic">Geen nieuwe leden gevonden</p>
      )}

      {/* Vertrokken */}
      <SectieHeader
        label="Vertrokken"
        aantal={diff.vertrokkenSpelers.length}
        kleur="text-red-600"
        open={sectieOpen.vertrokken}
        onToggle={() => onToggleSectie("vertrokken")}
      />
      {sectieOpen.vertrokken && diff.vertrokkenSpelers.length > 0 && (
        <div className="space-y-1 pl-2">
          {diff.vertrokkenSpelers.map((s) => (
            <label
              key={s.id}
              className="flex items-center gap-2 rounded px-2 py-1 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={geselecteerdVertrokken.has(s.id)}
                onChange={() => onToggleVertrokken(s.id)}
                className="rounded border-gray-300 text-orange-500 focus:ring-orange-300"
              />
              <span className="text-sm text-gray-800">
                {s.roepnaam} {s.achternaam}
              </span>
              <span className="text-xs text-gray-400">
                ({s.id}) — was {s.huidigeStatus}
              </span>
            </label>
          ))}
        </div>
      )}
      {diff.vertrokkenSpelers.length === 0 && (
        <p className="pl-2 text-xs text-gray-400 italic">Geen vertrokken spelers gevonden</p>
      )}

      {/* Gewijzigd */}
      <SectieHeader
        label="Gewijzigd"
        aantal={diff.gewijzigdeLeden.length}
        kleur="text-orange-600"
        open={sectieOpen.gewijzigd}
        onToggle={() => onToggleSectie("gewijzigd")}
      />
      {sectieOpen.gewijzigd && diff.gewijzigdeLeden.length > 0 && (
        <div className="space-y-1 pl-2">
          {diff.gewijzigdeLeden.map((g) => (
            <div key={g.relCode} className="rounded px-2 py-1 text-sm">
              <span className="font-medium text-gray-800">{g.naam}</span>
              <span className="ml-2 text-xs text-gray-400">
                {g.wijzigingen
                  .map((w) => `${w.veld}: ${w.oud ?? "—"} → ${w.nieuw ?? "—"}`)
                  .join(", ")}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Ongewijzigd */}
      <p className="text-xs text-gray-400">Ongewijzigd: {diff.ongewijzigd} leden</p>
    </div>
  );
}

function SectieHeader({
  label,
  aantal,
  kleur,
  open,
  onToggle,
}: {
  label: string;
  aantal: number;
  kleur: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button onClick={onToggle} className="flex w-full items-center gap-2 text-left">
      <svg
        className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? "rotate-90" : ""}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
      <span className={`text-sm font-medium ${kleur}`}>
        {label} ({aantal})
      </span>
    </button>
  );
}
