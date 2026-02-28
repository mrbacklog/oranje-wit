import { PageHeader } from "@oranje-wit/ui";
import { getSpelersOverzicht } from "@/lib/queries/spelers";
import { getSeizoen } from "@/lib/utils/seizoen";
import { SpelersZoeken } from "@/components/spelers/SpelersZoeken";

export default async function SpelersPage({
  searchParams,
}: {
  searchParams: Promise<{ seizoen?: string }>;
}) {
  const params = await searchParams;
  const seizoen = getSeizoen(params);

  const spelers = await getSpelersOverzicht(seizoen);

  const actief = spelers.filter((s) => !s.afmelddatum);
  const mannen = actief.filter((s) => s.geslacht === "M").length;
  const vrouwen = actief.filter((s) => s.geslacht === "V").length;

  return (
    <>
      <PageHeader title="Spelers" subtitle="Alle competitiespelers" />

      {/* KPI-kaarten */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Actieve spelers
          </p>
          <p className="mt-1 text-3xl font-bold text-ow-oranje">
            {actief.length}
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Heren / Dames
          </p>
          <p className="mt-1 text-3xl font-bold">
            <span className="text-blue-500">&#9794; {mannen}</span>{" "}
            <span className="text-gray-300">/</span>{" "}
            <span className="text-pink-500">&#9792; {vrouwen}</span>
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Totaal ooit gespeeld
          </p>
          <p className="mt-1 text-3xl font-bold text-ow-oranje">
            {spelers.length}
          </p>
        </div>
      </div>

      <SpelersZoeken spelers={spelers} />
    </>
  );
}
