import { getScenario } from "../actions";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

const KLEUR_LABELS: Record<string, string> = {
  BLAUW: "Blauw",
  GROEN: "Groen",
  GEEL: "Geel",
  ORANJE: "Oranje",
  ROOD: "Rood",
};

const CATEGORIE_LABELS: Record<string, string> = {
  B_CATEGORIE: "B-categorie",
  A_CATEGORIE: "A-categorie",
  SENIOREN: "Senioren",
};

interface ScenarioEditorPageProps {
  params: Promise<{ id: string }>;
}

export default async function ScenarioEditorPage({
  params,
}: ScenarioEditorPageProps) {
  const { id } = await params;
  const scenario = await getScenario(id);

  if (!scenario) {
    notFound();
  }

  const keuzeWaardes = (scenario.keuzeWaardes ?? {}) as Record<string, string>;
  const laatsteVersie = scenario.versies[0];
  const teams = laatsteVersie?.teams ?? [];

  // Groepeer teams per categorie
  const teamsByCategorie = teams.reduce<
    Record<string, typeof teams>
  >((acc, team) => {
    const cat = team.categorie;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(team);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/scenarios"
          className="text-sm text-orange-600 hover:text-orange-700 mb-2 inline-block"
        >
          &larr; Terug naar scenario&apos;s
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {scenario.naam}
            </h2>
            {scenario.toelichting && (
              <p className="mt-1 text-sm text-gray-500">
                {scenario.toelichting}
              </p>
            )}
          </div>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              scenario.status === "DEFINITIEF"
                ? "bg-green-100 text-green-700"
                : scenario.status === "GEARCHIVEERD"
                ? "bg-gray-100 text-gray-500"
                : "bg-orange-100 text-orange-700"
            }`}
          >
            {scenario.status === "DEFINITIEF"
              ? "Definitief"
              : scenario.status === "GEARCHIVEERD"
              ? "Gearchiveerd"
              : "Actief"}
          </span>
        </div>
      </div>

      {/* Keuze-waardes */}
      {Object.keys(keuzeWaardes).length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Gekozen waardes
          </h3>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="space-y-2">
              {Object.entries(keuzeWaardes).map(([keuzeId, waarde]) => (
                <div key={keuzeId} className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{keuzeId}:</span>
                  <span className="text-sm font-medium text-gray-800 bg-orange-50 px-2 py-0.5 rounded">
                    {waarde}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Teamstructuur */}
      <section>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          Teamstructuur
          {laatsteVersie && (
            <span className="text-sm font-normal text-gray-400 ml-2">
              (versie {laatsteVersie.nummer})
            </span>
          )}
        </h3>

        {teams.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-500">
              Nog geen teams in dit scenario.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(teamsByCategorie).map(([categorie, catTeams]) => (
              <div key={categorie}>
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  {CATEGORIE_LABELS[categorie] ?? categorie}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {catTeams.map((team) => (
                    <div
                      key={team.id}
                      className="bg-white border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-gray-900">
                          {team.naam}
                        </span>
                        {team.kleur && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            {KLEUR_LABELS[team.kleur] ?? team.kleur}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        {team.spelers.length} spelers toegewezen
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Placeholder voor drieluik */}
      <section className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <p className="text-gray-400 text-sm">
          Hier komt het drieluik: navigator, werkgebied en spelerspool.
        </p>
        <p className="text-gray-400 text-xs mt-1">
          (Wordt gebouwd in taken 6-8)
        </p>
      </section>
    </div>
  );
}
