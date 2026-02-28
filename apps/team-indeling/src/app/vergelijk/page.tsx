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
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="text-sm font-semibold text-gray-700">
        Kies twee scenario&apos;s om te vergelijken
      </h3>
      <form className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
        <div className="w-full flex-1">
          <label htmlFor="scenario-a" className="mb-1 block text-xs font-medium text-gray-500">
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

        <div className="w-full flex-1">
          <label htmlFor="scenario-b" className="mb-1 block text-xs font-medium text-gray-500">
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
          className="shrink-0 rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
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
      [scenarioA, scenarioB] = await Promise.all([getScenario(idA), getScenario(idB)]);
      if (!scenarioA) fout = "Scenario A niet gevonden.";
      else if (!scenarioB) fout = "Scenario B niet gevonden.";
    }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Scenario vergelijking</h2>
          <p className="mt-1 text-sm text-gray-500">Vergelijk twee scenario&apos;s side-by-side</p>
        </div>
        <Link href="/scenarios" className="text-sm text-gray-500 underline hover:text-gray-700">
          Terug naar scenario&apos;s
        </Link>
      </div>

      <ScenarioSelector scenarios={scenarioLijst} selectedA={idA} selectedB={idB} />

      {fout && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {fout}
        </div>
      )}

      {scenarioA && scenarioB && <ScenarioVergelijk scenarioA={scenarioA} scenarioB={scenarioB} />}
    </div>
  );
}
