"use client";

import type { BTeamVoorstel } from "@/lib/teamindeling/teamstructuur";

// ---------------------------------------------------------------------------
// Kleur-kleuren voor badges
// ---------------------------------------------------------------------------

const KLEUR_CSS: Record<string, string> = {
  BLAUW: "bg-blue-100 text-blue-700",
  GROEN: "bg-green-100 text-green-700",
  GEEL: "bg-yellow-100 text-yellow-700",
  ORANJE: "bg-orange-100 text-orange-700",
  ROOD: "bg-red-100 text-red-700",
};

// ---------------------------------------------------------------------------
// Gedeelde sub-componenten
// ---------------------------------------------------------------------------

export function WizardHeader({
  stap,
  totaal,
  titel,
}: {
  stap: number;
  totaal: number;
  titel: string;
}) {
  return (
    <div className="dialog-header">
      <div className="mb-2 flex items-center gap-2">
        {Array.from({ length: totaal }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < stap ? "bg-orange-400" : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <h3 className="text-lg font-bold text-gray-900">
        Stap {stap} van {totaal}: {titel}
      </h3>
    </div>
  );
}

export function WizardFooter({
  onVorige,
  onVolgende,
  vorigeLabel = "Vorige",
  volgendeLabel = "Volgende",
  volgendeDisabled = false,
}: {
  onVorige: () => void;
  onVolgende: () => void;
  vorigeLabel?: string;
  volgendeLabel?: string;
  volgendeDisabled?: boolean;
}) {
  return (
    <div className="dialog-footer">
      <button onClick={onVorige} className="btn-ghost">
        {vorigeLabel}
      </button>
      <button onClick={onVolgende} disabled={volgendeDisabled} className="btn-primary">
        {volgendeLabel}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stap: Senioren
// ---------------------------------------------------------------------------

export function StapSenioren({
  seniorenAantal,
  seniorenVoorstel,
  aantalSenioren,
  seniorenOverride,
  onOverrideChange,
  onOverrideReset,
  onVorige,
  onVolgende,
}: {
  seniorenAantal: number;
  seniorenVoorstel: number;
  aantalSenioren: number;
  seniorenOverride: number | null;
  onOverrideChange: (val: number) => void;
  onOverrideReset: () => void;
  onVorige: () => void;
  onVolgende: () => void;
}) {
  return (
    <>
      <WizardHeader stap={2} totaal={5} titel="Senioren" />
      <div className="dialog-body">
        <p className="text-sm text-gray-500">
          Er zijn <strong>{seniorenAantal}</strong> spelers van 19+ beschikbaar
          <span className="text-gray-400"> (excl. stoppers en algemeen reserves)</span>.
        </p>
        <div>
          <label htmlFor="wiz-senioren" className="mb-1 block text-sm font-medium text-gray-700">
            Hoeveel seniorenteams?
          </label>
          <div className="flex items-center gap-3">
            <input
              id="wiz-senioren"
              type="number"
              min={0}
              max={15}
              value={aantalSenioren}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onOverrideChange(Math.max(0, parseInt(e.target.value) || 0))
              }
              className="input w-24"
            />
            {seniorenOverride !== null && seniorenOverride !== seniorenVoorstel && (
              <button onClick={onOverrideReset} className="text-xs text-orange-600 hover:underline">
                Reset naar voorstel ({seniorenVoorstel})
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Voorstel: <strong>{seniorenVoorstel}</strong> teams ({seniorenAantal} spelers ÷ ~10 per
            team)
            {aantalSenioren > 0 && (
              <> &mdash; ~{Math.ceil(seniorenAantal / aantalSenioren)} spelers per team</>
            )}
          </p>
        </div>
      </div>
      <WizardFooter onVorige={onVorige} onVolgende={onVolgende} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Stap: A-categorie
// ---------------------------------------------------------------------------

export function StapACat({
  aCat,
  leeftijdVerdeling,
  onACatChange,
  onVorige,
  onVolgende,
}: {
  aCat: Record<string, number>;
  leeftijdVerdeling: { kleur: string; aantalSpelers: number; aantalM: number; aantalV: number }[];
  onACatChange: (niveau: string, aantal: number) => void;
  onVorige: () => void;
  onVolgende: () => void;
}) {
  return (
    <>
      <WizardHeader stap={3} totaal={5} titel="Jeugd A-categorie" />
      <div className="dialog-body">
        <p className="text-sm text-gray-500">
          Selectieteams voor de A-categorie. Per niveau kun je 0-3 teams instellen.
        </p>
        <div className="space-y-3">
          {(["U15", "U17", "U19"] as const).map((niveau) => {
            const verdeling = leeftijdVerdeling.find((v) => {
              if (niveau === "U15") return v.kleur === "ORANJE";
              if (niveau === "U17") return v.kleur === "ROOD";
              return false;
            });
            return (
              <div
                key={niveau}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
              >
                <div>
                  <div className="font-medium text-gray-900">{niveau}</div>
                  {verdeling && (
                    <p className="text-xs text-gray-400">
                      {verdeling.aantalSpelers} spelers in leeftijdsband ({verdeling.aantalM}J /{" "}
                      {verdeling.aantalV}M)
                    </p>
                  )}
                </div>
                <input
                  type="number"
                  min={0}
                  max={3}
                  value={aCat[niveau] ?? 0}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onACatChange(niveau, Math.max(0, Math.min(3, parseInt(e.target.value) || 0)))
                  }
                  className="input w-20 text-center"
                />
              </div>
            );
          })}
        </div>
      </div>
      <WizardFooter onVorige={onVorige} onVolgende={onVolgende} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Stap: B-teams
// ---------------------------------------------------------------------------

export function StapBTeams({
  bVoorstel,
  bTeamAantallen,
  onBOverride,
  onVorige,
  onVolgende,
}: {
  bVoorstel: BTeamVoorstel[];
  bTeamAantallen: Record<string, number>;
  onBOverride: (kleur: string, aantal: number) => void;
  onVorige: () => void;
  onVolgende: () => void;
}) {
  return (
    <>
      <WizardHeader stap={4} totaal={5} titel="B-categorie teams" />
      <div className="dialog-body">
        <p className="text-sm text-gray-500">
          Op basis van de beschikbare spelers (minus senioren en A-cat) is dit het voorstel. Je kunt
          de aantallen aanpassen.
        </p>
        <div className="space-y-2">
          {bVoorstel.map((v) => (
            <div
              key={v.kleur}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${KLEUR_CSS[v.kleur] ?? "bg-gray-100 text-gray-700"}`}
                >
                  {v.label}
                </span>
                <div>
                  <span className="text-sm text-gray-700">{v.aantalSpelers} spelers</span>
                  <span className="ml-1 text-xs text-gray-400">
                    ({v.aantalM}J / {v.aantalV}M) &middot; {v.format}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">teams:</span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={bTeamAantallen[v.kleur] ?? 0}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onBOverride(v.kleur, Math.max(0, parseInt(e.target.value) || 0))
                  }
                  className="input w-16 text-center"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <WizardFooter onVorige={onVorige} onVolgende={onVolgende} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Stap: Bevestigen
// ---------------------------------------------------------------------------

export function StapBevestig({
  naam,
  totaalTeams,
  aantalSenioren,
  aCat,
  bVoorstel,
  bTeamAantallen,
  bezig,
  onVorige,
  onSubmit,
}: {
  naam: string;
  totaalTeams: number;
  aantalSenioren: number;
  aCat: Record<string, number>;
  bVoorstel: BTeamVoorstel[];
  bTeamAantallen: Record<string, number>;
  bezig: boolean;
  onVorige: () => void;
  onSubmit: () => void;
}) {
  return (
    <>
      <WizardHeader stap={5} totaal={5} titel="Overzicht" />
      <div className="dialog-body">
        <div className="rounded-lg bg-gray-50 p-4">
          <h4 className="mb-3 font-semibold text-gray-900">
            &ldquo;{naam}&rdquo; &mdash; {totaalTeams} teams
          </h4>
          <div className="space-y-2 text-sm">
            {aantalSenioren > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Senioren</span>
                <span className="font-medium">{aantalSenioren} teams</span>
              </div>
            )}
            {(["U15", "U17", "U19"] as const).map(
              (niveau) =>
                (aCat[niveau] ?? 0) > 0 && (
                  <div key={niveau} className="flex justify-between">
                    <span className="text-gray-600">{niveau} (A-cat)</span>
                    <span className="font-medium">{aCat[niveau]} teams</span>
                  </div>
                )
            )}
            {bVoorstel.map((v) => {
              const aantal = bTeamAantallen[v.kleur] ?? 0;
              if (aantal === 0) return null;
              return (
                <div key={v.kleur} className="flex justify-between">
                  <span className="flex items-center gap-2 text-gray-600">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${KLEUR_CSS[v.kleur] ?? ""}`}
                    >
                      {v.label}
                    </span>
                    <span className="text-xs text-gray-400">({v.aantalSpelers} spelers)</span>
                  </span>
                  <span className="font-medium">{aantal} teams</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="dialog-footer">
        <button onClick={onVorige} disabled={bezig} className="btn-ghost">
          Terug
        </button>
        <button onClick={onSubmit} disabled={bezig} className="btn-primary">
          {bezig ? "Aanmaken..." : "Scenario aanmaken"}
        </button>
      </div>
    </>
  );
}
