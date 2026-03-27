"use client";

import { LeeftijdsgroepBadge } from "@/components/scouting/leeftijdsgroep-badge";
import { DeadlineBadge } from "@/components/scouting/deadline-badge";

// ============================================================
// Types
// ============================================================

type VerzoekType = "GENERIEK" | "SPECIFIEK" | "VERGELIJKING";
type VerzoekDoel = "DOORSTROOM" | "SELECTIE" | "NIVEAUBEPALING" | "OVERIG";

interface TeamOptie {
  id: number;
  naam: string;
  kleur: string;
}

interface SpelerOptie {
  id: string;
  roepnaam: string;
  achternaam: string;
  team: string;
  kleur: string;
}

interface ScoutOptie {
  id: string;
  naam: string;
  email: string;
}

const TYPE_INFO: Record<VerzoekType, { label: string; beschrijving: string; icon: string }> = {
  GENERIEK: {
    label: "Team beoordeling",
    beschrijving: "Beoordeel alle spelers van een team",
    icon: "👥",
  },
  SPECIFIEK: {
    label: "Individuele beoordeling",
    beschrijving: "Beoordeel 1 speler met gerichte vraag",
    icon: "👤",
  },
  VERGELIJKING: {
    label: "Vergelijking",
    beschrijving: "Vergelijk 2 of meer spelers",
    icon: "⚖️",
  },
};

const DOEL_OPTIES: { value: VerzoekDoel; label: string }[] = [
  { value: "NIVEAUBEPALING", label: "Niveaubepaling" },
  { value: "DOORSTROOM", label: "Doorstroom" },
  { value: "SELECTIE", label: "Selectie" },
  { value: "OVERIG", label: "Overig" },
];

// ============================================================
// StapType
// ============================================================

export function StapType({
  type,
  onTypeChange,
}: {
  type: VerzoekType | null;
  onTypeChange: (t: VerzoekType) => void;
}) {
  return (
    <div>
      <h2 className="text-text-primary text-lg font-bold">Wat wil je scouten?</h2>
      <div className="mt-4 space-y-3">
        {(Object.entries(TYPE_INFO) as [VerzoekType, (typeof TYPE_INFO)[VerzoekType]][]).map(
          ([key, info]) => (
            <button
              key={key}
              type="button"
              onClick={() => onTypeChange(key)}
              className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                type === key
                  ? "border-orange-500 bg-orange-50 shadow-md"
                  : "border-border-subtle bg-surface-card hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{info.icon}</span>
                <div>
                  <p className="text-text-primary font-semibold">{info.label}</p>
                  <p className="text-text-muted text-xs">{info.beschrijving}</p>
                </div>
              </div>
            </button>
          )
        )}
      </div>
    </div>
  );
}

// ============================================================
// StapScopeTeam
// ============================================================

export function StapScopeTeam({
  teams,
  selectedTeamId,
  onSelectTeam,
}: {
  teams: TeamOptie[];
  selectedTeamId: number | null;
  onSelectTeam: (id: number) => void;
}) {
  return (
    <div>
      <h2 className="text-text-primary text-lg font-bold">Welk team?</h2>
      <p className="text-text-muted mt-1 text-sm">Alle spelers van dit team worden beoordeeld</p>
      <div className="mt-4 space-y-2">
        {teams.map((team) => (
          <button
            key={team.id}
            type="button"
            onClick={() => onSelectTeam(team.id)}
            className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
              selectedTeamId === team.id
                ? "border-orange-500 bg-orange-50"
                : "border-border-subtle bg-surface-card"
            }`}
          >
            <LeeftijdsgroepBadge kleur={team.kleur} />
            <span className="text-text-primary text-sm font-medium">{team.naam}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// StapScopeSpelers
// ============================================================

export function StapScopeSpelers({
  type,
  spelerZoek,
  onZoekChange,
  selectedSpelerIds,
  onToggleSpeler,
  spelers,
}: {
  type: VerzoekType;
  spelerZoek: string;
  onZoekChange: (v: string) => void;
  selectedSpelerIds: string[];
  onToggleSpeler: (id: string) => void;
  spelers: SpelerOptie[];
}) {
  return (
    <div>
      <h2 className="text-text-primary text-lg font-bold">
        {type === "SPECIFIEK" ? "Welke speler?" : "Welke spelers vergelijken?"}
      </h2>
      <p className="text-text-muted mt-1 text-sm">
        {type === "VERGELIJKING" ? "Selecteer minimaal 2 spelers" : "Zoek en selecteer een speler"}
      </p>

      <input
        type="text"
        value={spelerZoek}
        onChange={(e) => onZoekChange(e.target.value)}
        placeholder="Zoek op naam..."
        className="border-border-subtle mt-4 w-full rounded-lg border px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none"
      />

      {selectedSpelerIds.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedSpelerIds.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700"
            >
              {id}
              <button
                type="button"
                onClick={() => onToggleSpeler(id)}
                className="ml-1 text-orange-500"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 space-y-2">
        {spelers.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onToggleSpeler(s.id)}
            className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
              selectedSpelerIds.includes(s.id)
                ? "border-orange-500 bg-orange-50"
                : "border-border-subtle bg-surface-card"
            }`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              {s.roepnaam.charAt(0)}
            </div>
            <div>
              <p className="text-text-primary text-sm font-medium">
                {s.roepnaam} {s.achternaam}
              </p>
              <p className="text-text-muted text-xs">{s.team}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// StapDetails
// ============================================================

export function StapDetails({
  doel,
  onDoelChange,
  toelichting,
  onToelichtingChange,
  deadline,
  onDeadlineChange,
}: {
  doel: VerzoekDoel;
  onDoelChange: (v: VerzoekDoel) => void;
  toelichting: string;
  onToelichtingChange: (v: string) => void;
  deadline: string;
  onDeadlineChange: (v: string) => void;
}) {
  return (
    <div>
      <h2 className="text-text-primary text-lg font-bold">Details</h2>

      <div className="mt-4 space-y-4">
        <div>
          <label className="text-text-muted text-xs font-semibold tracking-wide uppercase">
            Doel
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {DOEL_OPTIES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onDoelChange(opt.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  doel === opt.value
                    ? "bg-orange-500 text-white"
                    : "border-border-subtle bg-surface-card text-text-secondary border"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-text-muted text-xs font-semibold tracking-wide uppercase">
            Toelichting voor de scout
          </label>
          <textarea
            value={toelichting}
            onChange={(e) => onToelichtingChange(e.target.value)}
            rows={3}
            placeholder="Waar moet de scout op letten? Specifieke aandachtspunten..."
            className="border-border-subtle mt-2 w-full rounded-lg border px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-text-muted text-xs font-semibold tracking-wide uppercase">
            Deadline (optioneel)
          </label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => onDeadlineChange(e.target.value)}
            className="border-border-subtle mt-2 w-full rounded-lg border px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none"
          />
          {deadline && <DeadlineBadge deadline={deadline} />}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// StapScouts
// ============================================================

export function StapScouts({
  scouts,
  selectedScoutIds,
  onToggleScout,
}: {
  scouts: ScoutOptie[];
  selectedScoutIds: string[];
  onToggleScout: (id: string) => void;
}) {
  return (
    <div>
      <h2 className="text-text-primary text-lg font-bold">Scouts toewijzen</h2>
      <p className="text-text-muted mt-1 text-sm">
        Kies welke scouts dit verzoek moeten uitvoeren (optioneel)
      </p>

      <div className="mt-4 space-y-2">
        {scouts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
            <p className="text-text-muted text-sm">Nog geen scouts beschikbaar</p>
            <p className="text-text-muted mt-1 text-xs">
              Scouts worden aangemaakt zodra ze voor het eerst inloggen
            </p>
          </div>
        ) : (
          scouts.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onToggleScout(s.id)}
              className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                selectedScoutIds.includes(s.id)
                  ? "border-orange-500 bg-orange-50"
                  : "border-border-subtle bg-surface-card"
              }`}
            >
              <div className="text-text-secondary flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold">
                {s.naam.charAt(0)}
              </div>
              <div>
                <p className="text-text-primary text-sm font-medium">{s.naam}</p>
                <p className="text-text-muted text-xs">{s.email}</p>
              </div>
              {selectedScoutIds.includes(s.id) && (
                <svg
                  className="ml-auto h-5 w-5 text-orange-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
