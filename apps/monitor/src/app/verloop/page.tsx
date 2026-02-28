import { PageHeader } from "@oranje-wit/ui";
import { getInstroomUitstroom } from "@/lib/queries/verloop";
import { getCohorten } from "@/lib/queries/cohorten";
import { RetentieCurve } from "@/components/charts/retentie-curve";
import { DropoutHeatmap } from "@/components/charts/dropout-heatmap";
import { VerloopBarCharts } from "./verloop-charts";

export default async function VerloopPage({
  searchParams,
}: {
  searchParams: Promise<{ seizoen?: string }>;
}) {
  const _params = await searchParams;

  const [verloop, cohorten] = await Promise.all([getInstroomUitstroom(), getCohorten()]);

  // Retentiecurve data
  const retentieData = verloop.retentie_alle_seizoenen
    .filter((r) => r.retentie_totaal !== null)
    .map((r) => ({
      leeftijd: r.leeftijd,
      retentie: r.retentie_totaal! * 100,
      retentie_m: r.retentie_M ? r.retentie_M * 100 : undefined,
      retentie_v: r.retentie_V ? r.retentie_V * 100 : undefined,
    }));

  // Dropout heatmap: per leeftijd per seizoen uitstroom percentage
  // We berekenen dit uit de cohorten data
  const seizoenen = cohorten.seizoenen.slice(-8);
  const leeftijdRange = Array.from({ length: 20 }, (_, i) => i + 5); // 5-24
  const _dropoutData = leeftijdRange.map((leeftijd) => {
    const seizoenenMap: Record<string, { uitstroom_pct: number }> = {};
    for (const cohort of cohorten.per_cohort) {
      for (const sz of seizoenen) {
        const d = cohort.seizoenen[sz];
        if (!d || d.leeftijd !== leeftijd) continue;
        if (!seizoenenMap[sz]) seizoenenMap[sz] = { uitstroom_pct: 0 };
        // We accumuleren totaal actief en uitgestroomd
      }
    }
    return { leeftijd, seizoenen: seizoenenMap };
  });

  // Beter: bereken dropout percentages per leeftijd per seizoen uit cohort_seizoenen
  const dropoutMap = new Map<number, Map<string, { actief: number; uitgestroomd: number }>>();
  for (const cohort of cohorten.per_cohort) {
    for (const [sz, d] of Object.entries(cohort.seizoenen)) {
      if (d.leeftijd === null || !seizoenen.includes(sz)) continue;
      if (!dropoutMap.has(d.leeftijd)) dropoutMap.set(d.leeftijd, new Map());
      const szMap = dropoutMap.get(d.leeftijd)!;
      if (!szMap.has(sz)) szMap.set(sz, { actief: 0, uitgestroomd: 0 });
      const cur = szMap.get(sz)!;
      cur.actief += d.actief;
      cur.uitgestroomd += d.uitgestroomd;
    }
  }

  const dropoutHeatmapData = leeftijdRange
    .filter((l) => dropoutMap.has(l))
    .map((leeftijd) => {
      const szMap = dropoutMap.get(leeftijd)!;
      const seizoenenObj: Record<string, { uitstroom_pct: number }> = {};
      for (const sz of seizoenen) {
        const d = szMap.get(sz);
        if (d && d.actief > 0) {
          seizoenenObj[sz] = {
            uitstroom_pct: parseFloat(
              ((d.uitgestroomd / (d.actief + d.uitgestroomd)) * 100).toFixed(1)
            ),
          };
        }
      }
      return { leeftijd, seizoenen: seizoenenObj };
    });

  // Instroom/uitstroom bar chart data
  const instroomData = verloop.instroom_per_leeftijd
    .filter((r) => r.leeftijd >= 4 && r.leeftijd <= 30)
    .map((r) => ({
      leeftijd: r.leeftijd,
      M: r.M,
      V: r.V,
    }));

  const uitstroomData = verloop.uitstroom_per_leeftijd
    .filter((r) => r.leeftijd >= 4 && r.leeftijd <= 30)
    .map((r) => ({
      leeftijd: r.leeftijd,
      M: r.M,
      V: r.V,
    }));

  // Kritieke overgangsmomenten
  const kritiekeMomenten = [
    { overgang: "5 -> 6", leeftijd: 6, beschrijving: "Start competitie (F-jeugd)" },
    { overgang: "12 -> 13", leeftijd: 13, beschrijving: "Overgang naar C-jeugd" },
    { overgang: "14 -> 15", leeftijd: 15, beschrijving: "Puberleeftijd" },
    { overgang: "18 -> 19", leeftijd: 19, beschrijving: "Overgang naar senioren" },
    { overgang: "21 -> 23", leeftijd: 22, beschrijving: "Studie/werk/verhuizing" },
  ];

  const retentieLookup = new Map(verloop.retentie_alle_seizoenen.map((r) => [r.leeftijd, r]));

  return (
    <>
      <PageHeader title="Verloop" subtitle="Waar winnen/verliezen we leden?" />

      {/* Instroom & Uitstroom bar charts */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold tracking-wide text-gray-700 uppercase">
            Instroom per leeftijd (all-time)
          </h3>
          <VerloopBarCharts data={instroomData} type="instroom" />
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold tracking-wide text-gray-700 uppercase">
            Uitstroom per leeftijd (all-time)
          </h3>
          <VerloopBarCharts data={uitstroomData} type="uitstroom" />
        </div>
      </div>

      {/* Retentiecurve */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold tracking-wide text-gray-700 uppercase">
          Retentiecurve per leeftijd
        </h3>
        <RetentieCurve data={retentieData} toonMV={true} />
      </div>

      {/* Drop-out heatmap */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold tracking-wide text-gray-700 uppercase">
          Dropout-heatmap (uitstroom% per leeftijd per seizoen)
        </h3>
        <DropoutHeatmap data={dropoutHeatmapData} seizoenen={seizoenen} />
      </div>

      {/* Kritieke overgangsmomenten */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold tracking-wide text-gray-700 uppercase">
          Kritieke overgangsmomenten
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-3 py-2 font-semibold">Overgang</th>
                <th className="px-3 py-2 font-semibold">Beschrijving</th>
                <th className="px-3 py-2 text-right font-semibold">Retentie totaal</th>
                <th className="px-3 py-2 text-right font-semibold">Retentie M</th>
                <th className="px-3 py-2 text-right font-semibold">Retentie V</th>
                <th className="px-3 py-2 text-right font-semibold">Risico</th>
              </tr>
            </thead>
            <tbody>
              {kritiekeMomenten.map((m) => {
                const r = retentieLookup.get(m.leeftijd);
                const retentie = r?.retentie_totaal ? (r.retentie_totaal * 100).toFixed(1) : null;
                const retentieM = r?.retentie_M ? (r.retentie_M * 100).toFixed(1) : null;
                const retentieV = r?.retentie_V ? (r.retentie_V * 100).toFixed(1) : null;
                const retentieNum = r?.retentie_totaal ? r.retentie_totaal * 100 : null;
                const risico =
                  retentieNum === null
                    ? "-"
                    : retentieNum < 60
                      ? "Hoog"
                      : retentieNum < 80
                        ? "Matig"
                        : "Laag";
                const risicoColor =
                  risico === "Hoog"
                    ? "text-signal-rood font-semibold"
                    : risico === "Matig"
                      ? "text-signal-geel font-semibold"
                      : "text-signal-groen";

                return (
                  <tr key={m.overgang} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-medium">{m.overgang}</td>
                    <td className="px-3 py-2 text-gray-600">{m.beschrijving}</td>
                    <td className="px-3 py-2 text-right">{retentie ? `${retentie}%` : "-"}</td>
                    <td className="px-3 py-2 text-right">{retentieM ? `${retentieM}%` : "-"}</td>
                    <td className="px-3 py-2 text-right">{retentieV ? `${retentieV}%` : "-"}</td>
                    <td className={`px-3 py-2 text-right ${risicoColor}`}>{risico}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
