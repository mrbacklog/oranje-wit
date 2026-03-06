import { getBlauwdruk } from "@/app/blauwdruk/actions";
import { getScenarios } from "./actions";
import type { Keuze } from "@/app/blauwdruk/actions";
import NieuwScenarioDialog from "@/components/scenarios/NieuwScenarioDialog";
import VerwijderScenarioKnop from "@/components/scenarios/VerwijderScenarioKnop";
import HernoemScenarioKnop from "@/components/scenarios/HernoemScenarioKnop";
import Link from "next/link";
import { getActiefSeizoen } from "@/lib/seizoen";

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
  const seizoen = await getActiefSeizoen();
  const blauwdruk = await getBlauwdruk(seizoen);
  const keuzes = (blauwdruk.keuzes as Keuze[] | null) ?? [];
  const scenarios = await getScenarios(blauwdruk.id);

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Scenario&apos;s</h2>
          <p className="mt-1 text-sm text-gray-500">
            Teamindelingsscenario&apos;s voor seizoen {seizoen}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {scenarios.length >= 2 && (
            <Link
              href="/vergelijk"
              className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
            >
              Vergelijk
            </Link>
          )}
          <NieuwScenarioDialog blauwdrukId={blauwdruk.id} keuzes={keuzes} />
        </div>
      </div>

      {scenarios.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">
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
                className="block rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-orange-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1">
                      <h3 className="font-semibold text-gray-900">{scenario.naam}</h3>
                      {scenario.status !== "DEFINITIEF" && (
                        <HernoemScenarioKnop scenarioId={scenario.id} huidigNaam={scenario.naam} />
                      )}
                    </div>
                    {scenario.toelichting && (
                      <p className="mt-1 text-sm text-gray-500">{scenario.toelichting}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
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
                    {scenario.status !== "DEFINITIEF" && (
                      <VerwijderScenarioKnop
                        scenarioId={scenario.id}
                        scenarioNaam={scenario.naam}
                      />
                    )}
                  </div>
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
                          className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
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
                        .map((t: any) =>
                          t.kleur
                            ? (KLEUR_LABELS[t.kleur] ?? t.kleur)
                            : (CATEGORIE_LABELS[t.categorie] ?? t.categorie)
                        )
                        .filter((v: any, i: any, a: any) => a.indexOf(v) === i)
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
