"use client";

import TeamDiff from "./TeamDiff";

// Speler-info zoals teruggegeven door Prisma (include speler)
interface SpelerInfo {
  id: string;
  spelerId: string;
  speler: {
    id: string;
    roepnaam: string;
    achternaam: string;
    geboortejaar: number;
    geslacht: string; // Geslacht enum: "M" | "V"
  };
}

// What-If team met spelers
interface WhatIfTeamInfo {
  id: string;
  naam: string;
  categorie: string;
  kleur: string | null;
  volgorde: number;
  spelers: SpelerInfo[];
}

// Data-shape van een WhatIf met teams
interface WhatIfData {
  id: string;
  vraag: string;
  toelichting: string | null;
  teams: WhatIfTeamInfo[];
}

interface WhatIfVergelijkProps {
  whatIfA: WhatIfData;
  whatIfB: WhatIfData;
}

function telIngedeeld(teams: WhatIfTeamInfo[]): number {
  return teams.reduce((som, t) => som + t.spelers.length, 0);
}

function gemTeamGrootte(teams: WhatIfTeamInfo[]): number {
  if (teams.length === 0) return 0;
  return telIngedeeld(teams) / teams.length;
}

export default function WhatIfVergelijk({ whatIfA, whatIfB }: WhatIfVergelijkProps) {
  const teamsA = whatIfA.teams;
  const teamsB = whatIfB.teams;

  // Verzamel alle teamnamen en match op naam
  const namenA = new Map(teamsA.map((t) => [t.naam, t]));
  const namenB = new Map(teamsB.map((t) => [t.naam, t]));

  const alleNamen = new Set([...namenA.keys(), ...namenB.keys()]);
  // Sorteer op volgorde van A, daarna B, ongematchte achteraan
  const gesorteerdeNamen = [...alleNamen].sort((a, b) => {
    const va = namenA.get(a)?.volgorde ?? namenB.get(a)?.volgorde ?? 999;
    const vb = namenA.get(b)?.volgorde ?? namenB.get(b)?.volgorde ?? 999;
    return va - vb;
  });

  const ingedeeldA = telIngedeeld(teamsA);
  const ingedeeldB = telIngedeeld(teamsB);
  const gemA = gemTeamGrootte(teamsA);
  const gemB = gemTeamGrootte(teamsB);

  return (
    <div className="space-y-6">
      {/* Header met what-if vragen */}
      <div className="flex gap-3">
        <div
          className="flex-1 rounded-lg border p-3"
          style={{
            borderColor: "var(--ow-blauw-300, #93c5fd)",
            backgroundColor: "var(--ow-blauw-50, #eff6ff)",
          }}
        >
          <h3 className="font-semibold" style={{ color: "var(--ow-blauw-900, #1e3a5f)" }}>
            What-If A
          </h3>
          <p className="mt-1 text-xs" style={{ color: "var(--ow-blauw-600, #2563eb)" }}>
            {whatIfA.vraag}
          </p>
          {whatIfA.toelichting && (
            <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
              {whatIfA.toelichting}
            </p>
          )}
        </div>
        <div
          className="flex-1 rounded-lg border p-3"
          style={{
            borderColor: "var(--ow-paars-300, #c4b5fd)",
            backgroundColor: "var(--ow-paars-50, #f5f3ff)",
          }}
        >
          <h3 className="font-semibold" style={{ color: "var(--ow-paars-900, #2e1065)" }}>
            What-If B
          </h3>
          <p className="mt-1 text-xs" style={{ color: "var(--ow-paars-600, #7c3aed)" }}>
            {whatIfB.vraag}
          </p>
          {whatIfB.toelichting && (
            <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
              {whatIfB.toelichting}
            </p>
          )}
        </div>
      </div>

      {/* Samenvatting */}
      <div
        className="rounded-lg border p-4"
        style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-card)" }}
      >
        <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          Samenvatting
        </h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span style={{ color: "var(--text-tertiary)" }}>Statistiek</span>
          </div>
          <div className="text-center">
            <span className="font-medium" style={{ color: "var(--ow-blauw-600, #2563eb)" }}>
              What-If A
            </span>
          </div>
          <div className="text-center">
            <span className="font-medium" style={{ color: "var(--ow-paars-600, #7c3aed)" }}>
              What-If B
            </span>
          </div>

          <div style={{ color: "var(--text-secondary)" }}>Aantal teams</div>
          <div className="text-center font-medium" style={{ color: "var(--text-primary)" }}>
            {teamsA.length}
          </div>
          <div className="text-center font-medium" style={{ color: "var(--text-primary)" }}>
            {teamsB.length}
          </div>

          <div style={{ color: "var(--text-secondary)" }}>Spelers ingedeeld</div>
          <div className="text-center font-medium" style={{ color: "var(--text-primary)" }}>
            {ingedeeldA}
          </div>
          <div className="text-center font-medium" style={{ color: "var(--text-primary)" }}>
            {ingedeeldB}
          </div>

          <div style={{ color: "var(--text-secondary)" }}>Gem. teamgrootte</div>
          <div className="text-center font-medium" style={{ color: "var(--text-primary)" }}>
            {gemA.toFixed(1)}
          </div>
          <div className="text-center font-medium" style={{ color: "var(--text-primary)" }}>
            {gemB.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Kolom headers */}
      <div className="flex gap-3">
        <div
          className="flex-1 text-center text-xs font-medium tracking-wide uppercase"
          style={{ color: "var(--ow-blauw-600, #2563eb)" }}
        >
          What-If A
        </div>
        <div
          className="flex-1 text-center text-xs font-medium tracking-wide uppercase"
          style={{ color: "var(--ow-paars-600, #7c3aed)" }}
        >
          What-If B
        </div>
      </div>

      {/* Per team vergelijking */}
      <div className="space-y-6">
        {gesorteerdeNamen.map((naam) => {
          const tA = namenA.get(naam) ?? null;
          const tB = namenB.get(naam) ?? null;
          const alleenInA = tA !== null && tB === null;
          const alleenInB = tA === null && tB !== null;

          return (
            <div
              key={naam}
              className="rounded-lg p-4"
              style={{
                border: "1px solid",
                borderColor: alleenInA
                  ? "var(--ow-blauw-200, #bfdbfe)"
                  : alleenInB
                    ? "var(--ow-paars-200, #ddd6fe)"
                    : "var(--border-default)",
                backgroundColor: alleenInA
                  ? "var(--ow-blauw-50, #eff6ff)"
                  : alleenInB
                    ? "var(--ow-paars-50, #f5f3ff)"
                    : "var(--surface-raised)",
              }}
            >
              {(alleenInA || alleenInB) && (
                <span
                  className="mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: "var(--ow-oranje-50, #fff7ed)",
                    color: "var(--ow-oranje-600, #ea580c)",
                  }}
                >
                  Alleen in what-if {alleenInA ? "A" : "B"}
                </span>
              )}
              <TeamDiff teamA={tA} teamB={tB} teamNaam={naam} />
            </div>
          );
        })}
      </div>

      {gesorteerdeNamen.length === 0 && (
        <div className="py-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
          Geen teams om te vergelijken.
        </div>
      )}
    </div>
  );
}
