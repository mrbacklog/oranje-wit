import {
  getInstroomUitstroom,
  getInstroomPerSeizoenMV,
  getUitstroomPerSeizoenMV,
} from "@/lib/queries/verloop";
import { RetentieCurve } from "@/components/charts/retentie-curve";
import { RetentieTabs } from "./retentie-tabs";
import { GroupedBarChart } from "./grouped-bar-chart";
import { SeizoenBarChart } from "./seizoen-bar-chart";
import { KpiCards } from "./kpi-cards";
import { detecteerKritiekeMomenten, detecteerPatronen } from "@/lib/utils/retentie";

export async function RetentieContent() {
  const [verloop, instroomPerSeizoen, uitstroomPerSeizoen] = await Promise.all([
    getInstroomUitstroom(),
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

  // 3 leeftijdsgroepen
  const retentieJeugd = retentieData.filter((r) => r.leeftijd >= 5 && r.leeftijd <= 12);
  const retentieTieners = retentieData.filter((r) => r.leeftijd >= 12 && r.leeftijd <= 22);
  const retentieSenioren = retentieData.filter((r) => r.leeftijd >= 22 && r.leeftijd <= 40);

  // Kritieke momenten (data-driven)
  const kritiekeMomenten = detecteerKritiekeMomenten(retentieData);

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
  const instroomPatronen = detecteerPatronen(instroomData, "instroom");

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
  const uitstroomPatronen = detecteerPatronen(uitstroomData, "uitstroom");

  const leeftijdsGroepen = [
    { titel: "Jongste jeugd (5–12)", subtitel: "F/E/D-jeugd", data: retentieJeugd },
    {
      titel: "Tieners & jeugd (12–22)",
      subtitel: "C/B/A-jeugd + jong-senioren",
      data: retentieTieners,
    },
    { titel: "Senioren (22–40)", subtitel: "Volwassen leden", data: retentieSenioren },
  ];

  return (
    <RetentieTabs
      retentieContent={
        <>
          {/* 3 leeftijdsgrafieken */}
          <div className="mb-8 grid gap-6 lg:grid-cols-3">
            {leeftijdsGroepen.map((groep) => (
              <div key={groep.titel} className="rounded-xl bg-white p-5 shadow-sm">
                <h3 className="mb-1 text-sm font-semibold tracking-wide text-gray-700 uppercase">
                  {groep.titel}
                </h3>
                <p className="mb-3 text-xs text-gray-400">{groep.subtitel}</p>
                <RetentieCurve data={groep.data} toonMV={true} />
              </div>
            ))}
          </div>

          {/* Kritieke overgangsmomenten (data-driven) */}
          {kritiekeMomenten.length > 0 && (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold tracking-wide text-gray-700 uppercase">
                Kritieke overgangsmomenten
              </h3>
              <p className="mb-4 text-xs text-gray-400">
                Automatisch gedetecteerd: leeftijden waar de retentie het sterkst daalt.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-3 py-2 font-semibold">Leeftijd</th>
                      <th className="px-3 py-2 font-semibold">Groep</th>
                      <th className="px-3 py-2 text-right font-semibold">Retentie</th>
                      <th className="px-3 py-2 text-right font-semibold">Daling</th>
                      <th className="px-3 py-2 text-right font-semibold">Jongens</th>
                      <th className="px-3 py-2 text-right font-semibold">Meisjes</th>
                      <th className="px-3 py-2 font-semibold">Signaal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kritiekeMomenten.map((m) => {
                      const risicoColor =
                        m.daling < -10
                          ? "text-signal-rood font-semibold"
                          : m.daling < -5
                            ? "text-signal-geel font-semibold"
                            : "text-gray-600";

                      return (
                        <tr key={m.leeftijd} className="border-t border-gray-100">
                          <td className="px-3 py-2 font-medium">{m.leeftijd} jaar</td>
                          <td className="px-3 py-2 text-gray-600">{m.groep}</td>
                          <td className="px-3 py-2 text-right">{m.retentie.toFixed(1)}%</td>
                          <td className={`px-3 py-2 text-right ${risicoColor}`}>
                            {m.daling.toFixed(1)}pp
                          </td>
                          <td className="px-3 py-2 text-right">
                            {m.retentieM !== null ? `${m.retentieM.toFixed(1)}%` : "-"}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {m.retentieV !== null ? `${m.retentieV.toFixed(1)}%` : "-"}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-500">{m.signaal ?? "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
              Gemiddelde instroom per leeftijd (laatste 5 seizoenen)
            </h3>
            <GroupedBarChart data={instroomData} kleurM="#3B82F6" kleurV="#EC4899" />

            {instroomPatronen.length > 0 && (
              <div className="mt-4 rounded-lg bg-blue-50 px-4 py-3">
                <h4 className="mb-2 text-xs font-semibold tracking-wide text-blue-700 uppercase">
                  Patronen
                </h4>
                <ul className="space-y-1 text-sm text-blue-900">
                  {instroomPatronen.map((p, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0 text-xs">&#128161;</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
            ]}
          />

          <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold tracking-wide text-gray-700 uppercase">
              Gemiddelde uitstroom per leeftijd (laatste 5 seizoenen)
            </h3>
            <GroupedBarChart data={uitstroomData} kleurM="#3B82F6" kleurV="#EC4899" />

            {uitstroomPatronen.length > 0 && (
              <div className="mt-4 rounded-lg bg-red-50 px-4 py-3">
                <h4 className="mb-2 text-xs font-semibold tracking-wide text-red-700 uppercase">
                  Patronen
                </h4>
                <ul className="space-y-1 text-sm text-red-900">
                  {uitstroomPatronen.map((p, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0 text-xs">&#128161;</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
