import {
  getInstroomUitstroom,
  getInstroomPerSeizoenMV,
  getUitstroomPerSeizoenMV,
} from "@/lib/queries/verloop";
import { getCohorten } from "@/lib/queries/cohorten";
import { RetentieCurve } from "@/components/charts/retentie-curve";
import { DropoutHeatmap } from "@/components/charts/dropout-heatmap";
import { RetentieTabs } from "./retentie-tabs";
import { GroupedBarChart } from "./grouped-bar-chart";
import { SeizoenBarChart } from "./seizoen-bar-chart";
import { KpiCards } from "./kpi-cards";

export async function RetentieContent() {
  const [verloop, cohorten, instroomPerSeizoen, uitstroomPerSeizoen] = await Promise.all([
    getInstroomUitstroom(),
    getCohorten(),
    getInstroomPerSeizoenMV(),
    getUitstroomPerSeizoenMV(),
  ]);

  // --- Retentie tab data ---
  const retentieData = verloop.retentie_alle_seizoenen
    .filter((r) => r.retentie_totaal !== null)
    .map((r) => ({
      leeftijd: r.leeftijd,
      retentie: r.retentie_totaal! * 100,
      retentie_m: r.retentie_M ? r.retentie_M * 100 : undefined,
      retentie_v: r.retentie_V ? r.retentie_V * 100 : undefined,
    }));

  // Dropout heatmap
  const seizoenen = cohorten.seizoenen.slice(-8);
  const leeftijdRange = Array.from({ length: 20 }, (_, i) => i + 5);

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

  // Kritieke overgangsmomenten
  const kritiekeMomenten = [
    { overgang: "5 → 6", leeftijd: 6, beschrijving: "Start competitie (F-jeugd)" },
    { overgang: "12 → 13", leeftijd: 13, beschrijving: "Overgang naar C-jeugd" },
    { overgang: "14 → 15", leeftijd: 15, beschrijving: "Puberleeftijd" },
    { overgang: "18 → 19", leeftijd: 19, beschrijving: "Overgang naar senioren" },
    { overgang: "21 → 23", leeftijd: 22, beschrijving: "Studie/werk/verhuizing" },
  ];

  const retentieLookup = new Map(verloop.retentie_alle_seizoenen.map((r) => [r.leeftijd, r]));

  // --- Instroom tab data ---
  const instroomData = verloop.instroom_per_leeftijd
    .filter((r) => r.leeftijd >= 4 && r.leeftijd <= 30)
    .map((r) => ({ leeftijd: r.leeftijd, M: r.M, V: r.V }));

  const instroomSeizoenData = instroomPerSeizoen.map((r) => ({
    seizoen: r.seizoen,
    seizoenKort: `${r.seizoen.slice(2, 4)}/${r.seizoen.slice(7, 9)}`,
    M: r.M,
    V: r.V,
  }));

  const laatsteInstroom = instroomPerSeizoen.at(-1);
  const voorigeInstroom = instroomPerSeizoen.at(-2);

  // --- Uitstroom tab data ---
  const uitstroomData = verloop.uitstroom_per_leeftijd
    .filter((r) => r.leeftijd >= 4 && r.leeftijd <= 30)
    .map((r) => ({ leeftijd: r.leeftijd, M: r.M, V: r.V }));

  const uitstroomSeizoenData = uitstroomPerSeizoen.map((r) => ({
    seizoen: r.seizoen,
    seizoenKort: `${r.seizoen.slice(2, 4)}/${r.seizoen.slice(7, 9)}`,
    M: r.M,
    V: r.V,
  }));

  const laatsteUitstroom = uitstroomPerSeizoen.at(-1);
  const voorigeUitstroom = uitstroomPerSeizoen.at(-2);

  const topUitstroomLeeftijd = uitstroomData.reduce(
    (max, r) => (r.M + r.V > max.M + max.V ? r : max),
    uitstroomData[0] ?? { leeftijd: 0, M: 0, V: 0 }
  );

  return (
    <RetentieTabs
      retentieContent={
        <>
          <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold tracking-wide text-gray-700 uppercase">
              Retentiecurve per leeftijd
            </h3>
            <RetentieCurve data={retentieData} toonMV={true} />
          </div>

          <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold tracking-wide text-gray-700 uppercase">
              Dropout-heatmap (uitstroom% per leeftijd per seizoen)
            </h3>
            <DropoutHeatmap data={dropoutHeatmapData} seizoenen={seizoenen} />
          </div>

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
                    <th className="px-3 py-2 text-right font-semibold">Jongens</th>
                    <th className="px-3 py-2 text-right font-semibold">Meisjes</th>
                    <th className="px-3 py-2 text-right font-semibold">Risico</th>
                  </tr>
                </thead>
                <tbody>
                  {kritiekeMomenten.map((m) => {
                    const r = retentieLookup.get(m.leeftijd);
                    const retentie = r?.retentie_totaal
                      ? (r.retentie_totaal * 100).toFixed(1)
                      : null;
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
                        <td className="px-3 py-2 text-right">
                          {retentieM ? `${retentieM}%` : "-"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {retentieV ? `${retentieV}%` : "-"}
                        </td>
                        <td className={`px-3 py-2 text-right ${risicoColor}`}>{risico}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      }
      instroomContent={
        <>
          <KpiCards
            items={[
              {
                label: "Instroom huidig seizoen",
                waarde: laatsteInstroom ? String(laatsteInstroom.totaal) : "-",
                detail: laatsteInstroom
                  ? `${laatsteInstroom.M} jongens, ${laatsteInstroom.V} meisjes`
                  : undefined,
              },
              {
                label: "Verschil t.o.v. vorig seizoen",
                waarde:
                  laatsteInstroom && voorigeInstroom
                    ? `${laatsteInstroom.totaal - voorigeInstroom.totaal >= 0 ? "+" : ""}${laatsteInstroom.totaal - voorigeInstroom.totaal}`
                    : "-",
                detail: voorigeInstroom ? `Vorig: ${voorigeInstroom.totaal}` : undefined,
              },
            ]}
          />

          <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold tracking-wide text-gray-700 uppercase">
              Instroom per leeftijd (all-time)
            </h3>
            <GroupedBarChart data={instroomData} kleurM="#3B82F6" kleurV="#EC4899" />
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold tracking-wide text-gray-700 uppercase">
              Instroom per seizoen
            </h3>
            <p className="mb-4 text-xs text-gray-400">Klik op een seizoen voor de namenlijst</p>
            <SeizoenBarChart data={instroomSeizoenData} kleurM="#3B82F6" kleurV="#EC4899" />
          </div>
        </>
      }
      uitstroomContent={
        <>
          <KpiCards
            items={[
              {
                label: "Uitstroom huidig seizoen",
                waarde: laatsteUitstroom ? String(laatsteUitstroom.totaal) : "-",
                detail: laatsteUitstroom
                  ? `${laatsteUitstroom.M} jongens, ${laatsteUitstroom.V} meisjes`
                  : undefined,
              },
              {
                label: "Verschil t.o.v. vorig seizoen",
                waarde:
                  laatsteUitstroom && voorigeUitstroom
                    ? `${laatsteUitstroom.totaal - voorigeUitstroom.totaal >= 0 ? "+" : ""}${laatsteUitstroom.totaal - voorigeUitstroom.totaal}`
                    : "-",
                detail: voorigeUitstroom ? `Vorig: ${voorigeUitstroom.totaal}` : undefined,
              },
              {
                label: "Piekleeftijd uitstroom",
                waarde: topUitstroomLeeftijd ? `${topUitstroomLeeftijd.leeftijd} jaar` : "-",
                detail: topUitstroomLeeftijd
                  ? `${topUitstroomLeeftijd.M + topUitstroomLeeftijd.V} totaal (all-time)`
                  : undefined,
              },
            ]}
          />

          <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold tracking-wide text-gray-700 uppercase">
              Uitstroom per leeftijd (all-time)
            </h3>
            <GroupedBarChart data={uitstroomData} kleurM="#3B82F6" kleurV="#EC4899" />
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold tracking-wide text-gray-700 uppercase">
              Uitstroom per seizoen
            </h3>
            <p className="mb-4 text-xs text-gray-400">Klik op een seizoen voor de namenlijst</p>
            <SeizoenBarChart data={uitstroomSeizoenData} kleurM="#3B82F6" kleurV="#EC4899" />
          </div>
        </>
      }
    />
  );
}
