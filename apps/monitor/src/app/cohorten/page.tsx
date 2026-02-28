import { PageHeader } from "@oranje-wit/ui";
import { getCohorten } from "@/lib/queries/cohorten";
import { CohortHeatmap } from "@/components/charts/cohort-heatmap";

export default async function CohortenPage({
  searchParams,
}: {
  searchParams: Promise<{ seizoen?: string }>;
}) {
  const _params = await searchParams;
  const cohorten = await getCohorten();

  const { seizoenen, per_cohort, totalen } = cohorten;
  const seizoenenDesc = [...seizoenen].reverse();
  const recenteSeizoenen = seizoenen.slice(-8).reverse();

  return (
    <>
      <PageHeader
        title="Cohorten"
        subtitle="Hoe ontwikkelen jaargangen zich over de seizoenen?"
      />

      {/* Cohort heatmap */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
          Cohort-heatmap (actieve leden per geboortejaar per seizoen)
        </h3>
        <CohortHeatmap data={per_cohort} seizoenen={seizoenenDesc} />
      </div>

      {/* Retentie per leeftijdsgroep */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
          Retentie per leeftijdsgroep
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-3 py-2 font-semibold">Groep</th>
                {recenteSeizoenen.map((sz) => (
                  <th key={sz} className="px-3 py-2 text-center font-semibold whitespace-nowrap">
                    {sz.slice(2, 4)}/{sz.slice(7, 9)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {totalen.per_leeftijdsgroep.map((groep) => (
                <tr key={groep.groep} className="border-t border-gray-100">
                  <td className="px-3 py-2 font-medium">{groep.groep}</td>
                  {recenteSeizoenen.map((sz) => {
                    const d = groep.per_seizoen[sz];
                    const retentie = d?.retentie_pct;
                    const color =
                      retentie === null || retentie === undefined
                        ? ""
                        : retentie >= 80
                          ? "text-signal-groen"
                          : retentie >= 60
                            ? "text-signal-geel"
                            : "text-signal-rood";
                    return (
                      <td key={sz} className={`px-3 py-2 text-center font-medium ${color}`}>
                        {retentie !== null && retentie !== undefined
                          ? `${retentie}%`
                          : "-"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seizoens-samenvatting */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
          Seizoens-samenvatting
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-3 py-2 font-semibold">Seizoen</th>
                <th className="px-3 py-2 text-right font-semibold">Totaal</th>
                <th className="px-3 py-2 text-right font-semibold">Behouden</th>
                <th className="px-3 py-2 text-right font-semibold">Nieuw</th>
                <th className="px-3 py-2 text-right font-semibold">Uitgestroomd</th>
                <th className="px-3 py-2 text-right font-semibold">Retentie</th>
                <th className="px-3 py-2 text-right font-semibold">Groei</th>
              </tr>
            </thead>
            <tbody>
              {[...totalen.per_seizoen].reverse().map((sz) => (
                <tr key={sz.seizoen} className="border-t border-gray-100">
                  <td className="px-3 py-2 font-medium whitespace-nowrap">
                    {sz.seizoen}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {sz.totaal_nieuw}
                  </td>
                  <td className="px-3 py-2 text-right">{sz.behouden}</td>
                  <td className="px-3 py-2 text-right text-signal-groen">
                    +{sz.nieuw + sz.herinschrijver}
                  </td>
                  <td className="px-3 py-2 text-right text-signal-rood">
                    -{sz.uitgestroomd}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {sz.retentie_pct !== null ? `${sz.retentie_pct}%` : "-"}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-medium ${
                      sz.netto_groei !== null && sz.netto_groei >= 0
                        ? "text-signal-groen"
                        : "text-signal-rood"
                    }`}
                  >
                    {sz.netto_groei !== null
                      ? `${sz.netto_groei >= 0 ? "+" : ""}${sz.netto_groei}`
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
