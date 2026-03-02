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

// ---------------------------------------------------------------------------
// Helpers: korfbalgroep + patronen
// ---------------------------------------------------------------------------

const KORFBALGROEPEN: Record<number, string> = {
  6: "F-jeugd",
  7: "F-jeugd",
  8: "E-jeugd",
  9: "E-jeugd",
  10: "D-jeugd",
  11: "D-jeugd",
  12: "C-jeugd",
  13: "C-jeugd",
  14: "B-jeugd",
  15: "B-jeugd",
  16: "A-jeugd",
  17: "A-jeugd",
  18: "Senioren",
  19: "Senioren",
  20: "Senioren",
  21: "Senioren",
  22: "Senioren",
  23: "Senioren",
  24: "Senioren",
  25: "Senioren",
};

type RetentieDataPoint = {
  leeftijd: number;
  retentie: number;
  retentie_m?: number;
  retentie_v?: number;
};

type KritiekMoment = {
  leeftijd: number;
  groep: string;
  retentie: number;
  daling: number;
  retentieM: number | null;
  retentieV: number | null;
  signaal: string | null;
};

function detecteerKritiekeMomenten(data: RetentieDataPoint[]): KritiekMoment[] {
  if (data.length < 2) return [];

  const momenten: KritiekMoment[] = [];

  for (let i = 1; i < data.length; i++) {
    const vorig = data[i - 1];
    const huidig = data[i];
    const daling = huidig.retentie - vorig.retentie;

    if (daling < -3) {
      const retM = huidig.retentie_m ?? null;
      const retV = huidig.retentie_v ?? null;
      let signaal: string | null = null;

      if (retM !== null && retV !== null) {
        const verschil = Math.abs(retM - retV);
        if (verschil > 10) {
          signaal =
            retM < retV
              ? `Jongens ${verschil.toFixed(0)}pp lager`
              : `Meisjes ${verschil.toFixed(0)}pp lager`;
        }
      }

      momenten.push({
        leeftijd: huidig.leeftijd,
        groep: KORFBALGROEPEN[huidig.leeftijd] ?? "Overig",
        retentie: huidig.retentie,
        daling,
        retentieM: retM,
        retentieV: retV,
        signaal,
      });
    }
  }

  momenten.sort((a, b) => a.daling - b.daling);
  return momenten.slice(0, 7);
}

type LeeftijdRow = { leeftijd: number; M: number; V: number };

function detecteerPatronen(data: LeeftijdRow[], type: "instroom" | "uitstroom"): string[] {
  if (data.length === 0) return [];

  const patronen: string[] = [];
  const label = type === "instroom" ? "instroom" : "uitstroom";

  // Piek detecteren (totaal)
  const piek = data.reduce((max, r) => (r.M + r.V > max.M + max.V ? r : max), data[0]);
  patronen.push(
    `Piek ${label} bij leeftijd ${piek.leeftijd} (gem. ${(piek.M + piek.V).toFixed(1)} per seizoen)`
  );

  // Piek per geslacht
  const piekM = data.reduce((max, r) => (r.M > max.M ? r : max), data[0]);
  const piekV = data.reduce((max, r) => (r.V > max.V ? r : max), data[0]);

  if (Math.abs(piekM.leeftijd - piekV.leeftijd) > 1) {
    const eerder = piekM.leeftijd < piekV.leeftijd ? "jongens" : "meisjes";
    const later = piekM.leeftijd < piekV.leeftijd ? "meisjes" : "jongens";
    patronen.push(
      `${label.charAt(0).toUpperCase() + label.slice(1)} ${eerder} piekt eerder (${Math.min(piekM.leeftijd, piekV.leeftijd)} jaar) dan ${later} (${Math.max(piekM.leeftijd, piekV.leeftijd)} jaar)`
    );
  }

  // Stabilisatie detecteren: wanneer de waarden dalen tot < 30% van de piek
  const piekWaarde = piek.M + piek.V;
  const drempel = piekWaarde * 0.3;
  const stabilisatie = data.find((r) => r.leeftijd > piek.leeftijd && r.M + r.V < drempel);
  if (stabilisatie) {
    patronen.push(`Na leeftijd ${stabilisatie.leeftijd} is de ${label} minimaal`);
  }

  // M/V verhouding
  const totaalM = data.reduce((s, r) => s + r.M, 0);
  const totaalV = data.reduce((s, r) => s + r.V, 0);
  const totaal = totaalM + totaalV;
  if (totaal > 0) {
    const pctM = ((totaalM / totaal) * 100).toFixed(0);
    const pctV = ((totaalV / totaal) * 100).toFixed(0);
    if (Math.abs(totaalM - totaalV) / totaal > 0.1) {
      patronen.push(`Verhouding: ${pctM}% jongens, ${pctV}% meisjes`);
    }
  }

  return patronen;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

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
