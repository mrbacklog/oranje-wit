import { getBlauwdruk } from "@/app/blauwdruk/actions";
import { getScenario, getScenarios } from "@/app/scenarios/actions";
import ScenarioVergelijk from "@/components/vergelijk/ScenarioVergelijk";
import Link from "next/link";

export const dynamic = "force-dynamic";

const SEIZOEN = "2026-2027";

function ScenarioSelector({
  scenarios,
  selectedA,
  selectedB,
}: {
  scenarios: { id: string; naam: string }[];
  selectedA?: string;
  selectedB?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">
        Kies twee scenario&apos;s om te vergelijken
      </h3>
      <form className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
        <div className="flex-1 w-full">
          <label
            htmlFor="scenario-a"
            className="block text-xs font-medium text-gray-500 mb-1"
          >
            Scenario A
          </label>
          <select
            id="scenario-a"
            name="a"
            defaultValue={selectedA ?? ""}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
          >
            <option value="" disabled>
              Selecteer scenario...
            </option>
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.naam}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 w-full">
          <label
            htmlFor="scenario-b"
            className="block text-xs font-medium text-gray-500 mb-1"
          >
            Scenario B
          </label>
          <select
            id="scenario-b"
            name="b"
            defaultValue={selectedB ?? ""}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
          >
            <option value="" disabled>
              Selecteer scenario...
            </option>
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.naam}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-md hover:bg-orange-600 transition-colors shrink-0"
        >
          Vergelijk
        </button>
      </form>
    </div>
  );
}

export default async function VergelijkPage(props: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const searchParams = await props.searchParams;
  const idA = searchParams.a;
  const idB = searchParams.b;

  // Haal blauwdruk en scenarios op voor de selector
  const blauwdruk = await getBlauwdruk(SEIZOEN);
  const scenarios = await getScenarios(blauwdruk.id);

  const scenarioLijst = scenarios.map((s) => ({ id: s.id, naam: s.naam }));

  // Als beide scenario's geselecteerd, laad ze volledig
  let scenarioA = null;
  let scenarioB = null;
  let fout: string | null = null;

  if (idA && idB) {
    if (idA === idB) {
      fout = "Kies twee verschillende scenario's om te vergelijken.";
    } else {
      [scenarioA, scenarioB] = await Promise.all([
        getScenario(idA),
        getScenario(idB),
      ]);
      if (!scenarioA) fout = "Scenario A niet gevonden.";
      else if (!scenarioB) fout = "Scenario B niet gevonden.";
    }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Scenario vergelijking
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Vergelijk twee scenario&apos;s side-by-side
          </p>
        </div>
        <Link
          href="/scenarios"
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Terug naar scenario&apos;s
        </Link>
      </div>

      <ScenarioSelector
        scenarios={scenarioLijst}
        selectedA={idA}
        selectedB={idB}
      />

      {fout && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {fout}
        </div>
      )}

      {scenarioA && scenarioB && (
        <ScenarioVergelijk scenarioA={scenarioA} scenarioB={scenarioB} />
      )}
    </div>
  );
}
