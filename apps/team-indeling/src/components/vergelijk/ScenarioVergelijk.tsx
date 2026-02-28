"use client";

import TeamDiff from "./TeamDiff";

interface SpelerInfo {
  id: string;
  spelerId: string;
  speler: {
    id: string;
    roepnaam: string;
    achternaam: string;
    geboortejaar: number;
    geslacht: string;
  };
}

interface TeamInfo {
  id: string;
  naam: string;
  categorie: string;
  kleur: string | null;
  volgorde: number;
  spelers: SpelerInfo[];
}

interface VersieInfo {
  id: string;
  nummer: number;
  teams: TeamInfo[];
}

interface ScenarioInfo {
  id: string;
  naam: string;
  toelichting: string | null;
  status: string;
  versies: VersieInfo[];
}

interface ScenarioVergelijkProps {
  scenarioA: ScenarioInfo;
  scenarioB: ScenarioInfo;
}

function telIngedeeld(teams: TeamInfo[]): number {
  return teams.reduce((sum, t) => sum + t.spelers.length, 0);
}

function gemTeamGrootte(teams: TeamInfo[]): number {
  if (teams.length === 0) return 0;
  return telIngedeeld(teams) / teams.length;
}

export default function ScenarioVergelijk({ scenarioA, scenarioB }: ScenarioVergelijkProps) {
  const teamsA = scenarioA.versies[0]?.teams ?? [];
  const teamsB = scenarioB.versies[0]?.teams ?? [];

  // Verzamel alle teamnamen en match op naam
  const namenA = new Map(teamsA.map((t) => [t.naam, t]));
  const namenB = new Map(teamsB.map((t) => [t.naam, t]));

  const alleNamen = new Set([...namenA.keys(), ...namenB.keys()]);
  // Sorteer op volgorde van A, dan B, dan ongematchte
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
      {/* Header met scenario namen */}
      <div className="flex gap-3">
        <div className="flex-1 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <h3 className="font-semibold text-blue-900">{scenarioA.naam}</h3>
          {scenarioA.toelichting && (
            <p className="mt-1 text-xs text-blue-600">{scenarioA.toelichting}</p>
          )}
        </div>
        <div className="flex-1 rounded-lg border border-purple-200 bg-purple-50 p-3">
          <h3 className="font-semibold text-purple-900">{scenarioB.naam}</h3>
          {scenarioB.toelichting && (
            <p className="mt-1 text-xs text-purple-600">{scenarioB.toelichting}</p>
          )}
        </div>
      </div>

      {/* Samenvatting */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Samenvatting</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Statistiek</span>
          </div>
          <div className="text-center">
            <span className="font-medium text-blue-700">Scenario A</span>
          </div>
          <div className="text-center">
            <span className="font-medium text-purple-700">Scenario B</span>
          </div>

          <div className="text-gray-600">Aantal teams</div>
          <div className="text-center font-medium">{teamsA.length}</div>
          <div className="text-center font-medium">{teamsB.length}</div>

          <div className="text-gray-600">Spelers ingedeeld</div>
          <div className="text-center font-medium">{ingedeeldA}</div>
          <div className="text-center font-medium">{ingedeeldB}</div>

          <div className="text-gray-600">Gem. teamgrootte</div>
          <div className="text-center font-medium">{gemA.toFixed(1)}</div>
          <div className="text-center font-medium">{gemB.toFixed(1)}</div>
        </div>
      </div>

      {/* Kolom headers */}
      <div className="flex gap-3">
        <div className="flex-1 text-center text-xs font-medium tracking-wide text-blue-600 uppercase">
          Scenario A
        </div>
        <div className="flex-1 text-center text-xs font-medium tracking-wide text-purple-600 uppercase">
          Scenario B
        </div>
      </div>

      {/* Per team vergelijking */}
      <div className="space-y-6">
        {gesorteerdeNamen.map((naam) => {
          const tA = namenA.get(naam) ?? null;
          const tB = namenB.get(naam) ?? null;

          const alleenInA = tA && !tB;
          const alleenInB = !tA && tB;

          return (
            <div
              key={naam}
              className={`rounded-lg p-4 ${
                alleenInA
                  ? "border border-blue-200 bg-blue-50/50"
                  : alleenInB
                    ? "border border-purple-200 bg-purple-50/50"
                    : "border border-gray-200 bg-gray-50"
              }`}
            >
              {(alleenInA || alleenInB) && (
                <span className="mb-2 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
                  Alleen in scenario {alleenInA ? "A" : "B"}
                </span>
              )}
              <TeamDiff teamA={tA} teamB={tB} teamNaam={naam} />
            </div>
          );
        })}
      </div>

      {gesorteerdeNamen.length === 0 && (
        <div className="py-8 text-center text-sm text-gray-400">Geen teams om te vergelijken.</div>
      )}
    </div>
  );
}
