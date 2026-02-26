import { getBlauwdruk } from "@/app/blauwdruk/actions";
import { getScenarios } from "./actions";
import type { Keuze } from "@/app/blauwdruk/actions";
import NieuwScenarioDialog from "@/components/scenarios/NieuwScenarioDialog";
import Link from "next/link";

const SEIZOEN = "2026-2027";

export const dynamic = "force-dynamic";

const KLEUR_LABELS: Record<string, string> = {
  BLAUW: "Blauw",
  GROEN: "Groen",
  GEEL: "Geel",
  ORANJE: "Oranje",
  ROOD: "Rood",
};

const CATEGORIE_LABELS: Record<string, string> = {
  B_CATEGORIE: "B",
  A_CATEGORIE: "A",
  SENIOREN: "Sen",
};

export default async function ScenariosPage() {
  const blauwdruk = await getBlauwdruk(SEIZOEN);
  const keuzes = (blauwdruk.keuzes as Keuze[] | null) ?? [];
  const scenarios = await getScenarios(blauwdruk.id);

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Scenario&apos;s</h2>
          <p className="mt-1 text-sm text-gray-500">
            Teamindelingsscenario&apos;s voor seizoen {SEIZOEN}
          </p>
        </div>
        <NieuwScenarioDialog
          blauwdrukId={blauwdruk.id}
          keuzes={keuzes}
        />
      </div>

      {scenarios.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500 text-sm">
            Nog geen scenario&apos;s. Maak een nieuw scenario aan om te beginnen.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {scenarios.map((scenario) => {
            const laatsteVersie = scenario.versies[0];
            const keuzeWaardes = (scenario.keuzeWaardes ?? {}) as Record<string, string>;

            return (
              <Link
                key={scenario.id}
                href={`/scenarios/${scenario.id}`}
                className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {scenario.naam}
                    </h3>
                    {scenario.toelichting && (
                      <p className="text-sm text-gray-500 mt-1">
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

                {/* Keuze-waardes */}
                {Object.keys(keuzeWaardes).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {keuzes.map((keuze) => {
                      const waarde = keuzeWaardes[keuze.id];
                      if (!waarde) return null;
                      return (
                        <span
                          key={keuze.id}
                          className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5"
                        >
                          {keuze.vraag}: <span className="font-medium">{waarde}</span>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Teams samenvatting */}
                {laatsteVersie && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                    <span>{laatsteVersie.teams.length} teams</span>
                    <span>&middot;</span>
                    <span>
                      {laatsteVersie.teams
                        .map((t) =>
                          t.kleur
                            ? KLEUR_LABELS[t.kleur] ?? t.kleur
                            : CATEGORIE_LABELS[t.categorie] ?? t.categorie
                        )
                        .filter((v, i, a) => a.indexOf(v) === i)
                        .join(", ")}
                    </span>
                  </div>
                )}

                <div className="mt-2 text-xs text-gray-400">
                  Aangemaakt op{" "}
                  {new Date(scenario.createdAt).toLocaleDateString("nl-NL", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
