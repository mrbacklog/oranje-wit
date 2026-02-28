import { InfoPageHeader } from "@/components/info/InfoPageHeader";
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
      <InfoPageHeader title="Spelers" subtitle="Alle competitiespelers" infoTitle="Over Spelers">
        <div className="space-y-4">
          <section>
            <h4 className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Wat zie je?
            </h4>
            <p>Alle spelers die ooit bij Oranje Wit in een competitieteam hebben gespeeld.</p>
          </section>
          <section>
            <h4 className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Zoeken &amp; filteren
            </h4>
            <p>
              Typ een naam om direct te filteren. Gebruik de dropdowns voor geslacht en status
              (actief/uitgeschreven).
            </p>
          </section>
          <section>
            <h4 className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Doorklikken
            </h4>
            <p>
              <strong>Klik op een speler</strong> voor het volledige profiel met seizoensoverzicht
              en teamhistorie.
            </p>
          </section>
        </div>
      </InfoPageHeader>

      {/* KPI-kaarten */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
            Actieve spelers
          </p>
          <p className="text-ow-oranje mt-1 text-3xl font-bold">{actief.length}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">Heren / Dames</p>
          <p className="mt-1 text-3xl font-bold">
            <span className="text-blue-500">&#9794; {mannen}</span>{" "}
            <span className="text-gray-300">/</span>{" "}
            <span className="text-pink-500">&#9792; {vrouwen}</span>
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
            Totaal ooit gespeeld
          </p>
          <p className="text-ow-oranje mt-1 text-3xl font-bold">{spelers.length}</p>
        </div>
      </div>

      <SpelersZoeken spelers={spelers} />
    </>
  );
}
