/* eslint-disable max-lines */
import { Suspense } from "react";
import { InfoPageHeader } from "@/components/info/InfoPageHeader";
import { SeizoenKiezer } from "@/components/layout/seizoen-kiezer";
import { getPijplijn, getProjectie, getVerwachteInstroom } from "@/lib/queries/samenstelling";
import { getSeizoen } from "@/lib/utils/seizoen";
import { ProjectiePiramide } from "./projectie-piramide";
import { RetentieCurve } from "./retentie-curve";

function signaalKleur(pct: number): string {
  if (pct >= 90) return "bg-green-50 text-green-800";
  if (pct >= 70) return "bg-yellow-50 text-yellow-800";
  return "bg-red-50 text-red-800";
}

// Benchmarks uit jeugdmodel.yaml — statisch, wijzigt zelden
const BENCHMARK_M: Record<number, number> = {
  6: 0.75,
  7: 0.78,
  8: 0.95,
  9: 0.93,
  10: 0.97,
  11: 0.92,
  12: 0.92,
  13: 0.94,
  14: 0.97,
  15: 0.9,
  16: 0.89,
  17: 0.79,
};
const BENCHMARK_V: Record<number, number> = {
  6: 0.87,
  7: 0.88,
  8: 0.96,
  9: 0.94,
  10: 0.91,
  11: 0.92,
  12: 0.9,
  13: 0.94,
  14: 0.93,
  15: 0.93,
  16: 0.85,
  17: 0.85,
};

type Knelpunt = {
  titel: string;
  beschrijving: string;
  factor: string;
  benchmark: string;
  kleur: "rood" | "geel" | "groen";
  impact: number;
};

function berekenKnelpunten(factoren: {
  M: Record<number, number>;
  V: Record<number, number>;
}): Knelpunt[] {
  const items: Knelpunt[] = [];

  // Analyseer elke leeftijd/geslacht op alle leeftijden 7-17
  for (let leeftijd = 7; leeftijd <= 17; leeftijd++) {
    for (const geslacht of ["M", "V"] as const) {
      const factor = factoren[geslacht][leeftijd];
      const benchmark = geslacht === "M" ? BENCHMARK_M[leeftijd] : BENCHMARK_V[leeftijd];
      if (factor === undefined) continue;

      const label = geslacht === "M" ? "jongens" : "meisjes";
      const bandNaam =
        leeftijd <= 7
          ? "Blauw"
          : leeftijd <= 9
            ? "Groen"
            : leeftijd <= 12
              ? "Geel"
              : leeftijd <= 15
                ? "Oranje"
                : "Rood";
      const verliesPct = Math.round((1 - Math.min(factor, 1.0)) * 100);
      const benchmarkPct = benchmark ? Math.round((1 - benchmark) * 100) : null;

      let beschrijving: string;
      let kleur: "rood" | "geel" | "groen";

      if (factor >= 1.05) {
        // Sterke instroom — kans, geen probleem
        beschrijving = `Netto instroom: cohort groeit met ${Math.round((factor - 1) * 100)}%. Dit is de motor van de pijplijn.`;
        kleur = "groen";
      } else if (benchmark && factor < benchmark - 0.03) {
        // Significant slechter dan benchmark
        beschrijving = `${verliesPct}% verlies — slechter dan benchmark (${benchmarkPct}%). Actie nodig.`;
        kleur = "rood";
      } else if (factor < 0.88) {
        // Hoog absoluut verlies
        beschrijving = `${verliesPct}% verlies per jaar. ${leeftijd >= 16 ? "Senior cliff: binding en doorstroompad cruciaal." : leeftijd <= 7 ? "Instap-uitval: focus op onboarding en plezier." : "Transitieleeftijd: extra aandacht nodig."}`;
        kleur = "geel";
      } else {
        // Goed
        beschrijving = `${verliesPct}% verlies — stabiel${benchmark ? `, rond benchmark (${benchmarkPct}%)` : ""}.`;
        kleur = "groen";
      }

      // Impact = hoe groot is het verlies in absolute zin? Hoger = meer urgentie.
      const impact = Math.max(0, (1 - Math.min(factor, 1.0)) * 100);

      items.push({
        titel: `${bandNaam} ${label} (${leeftijd} jr)`,
        beschrijving,
        factor:
          factor >= 1.0 ? `+${Math.round((factor - 1) * 100)}%` : `${Math.round(factor * 100)}%`,
        benchmark: benchmark ? `${Math.round(benchmark * 100)}%` : "-",
        kleur,
        impact,
      });
    }
  }

  // Sorteer: rood eerst, dan geel, dan groen. Binnen kleur op impact.
  const kleurVolgorde = { rood: 0, geel: 1, groen: 2 };
  items.sort((a, b) => kleurVolgorde[a.kleur] - kleurVolgorde[b.kleur] || b.impact - a.impact);

  return items.slice(0, 4);
}

const knelpuntKleuren: Record<string, string> = {
  rood: "border-l-4 border-red-400 bg-red-50",
  geel: "border-l-4 border-yellow-400 bg-yellow-50",
  groen: "border-l-4 border-green-400 bg-green-50",
};

export default async function JeugdpijplijnPage({
  searchParams,
}: {
  searchParams: Promise<{ seizoen?: string }>;
}) {
  const params = await searchParams;
  const seizoen = getSeizoen(params);

  const startJaar = parseInt(seizoen.split("-")[0]);
  const [pijplijn, projectie, verwachteInstroom] = await Promise.all([
    getPijplijn(seizoen),
    getProjectie(seizoen),
    getVerwachteInstroom(seizoen),
  ]);

  const doel = pijplijn.doelPerCategorie;
  const categorieen = [
    { label: "U15", leeftijden: "13-14", ...pijplijn.huidig.U15 },
    { label: "U17", leeftijden: "15-16", ...pijplijn.huidig.U17 },
    { label: "U19", leeftijden: "17-18", ...pijplijn.huidig.U19 },
  ] as const;
  const vulgraadPct = (totaal: number) => (doel > 0 ? Math.round((totaal / doel) * 100) : 0);

  // Piramide-data: huidig vs benodigd per leeftijd
  const piramideData = pijplijn.perLeeftijd.map((row) => ({
    leeftijd: row.leeftijd,
    band: row.band,
    huidige_m: row.huidig_m,
    huidige_v: row.huidig_v,
    streef_m: row.benodigd_m,
    streef_v: row.benodigd_v,
  }));

  const knelpunten = berekenKnelpunten(pijplijn.groeiFactoren);

  return (
    <>
      <InfoPageHeader
        title="Jeugdpijplijn"
        subtitle="Van instroom tot senioren — streef 12♂ + 13♀ per geboortejaar."
        infoTitle="Over Jeugdpijplijn"
        actions={
          <Suspense>
            <SeizoenKiezer />
          </Suspense>
        }
      >
        <div className="space-y-4">
          <section>
            <h4 className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Wat zie je?
            </h4>
            <p>
              De complete jeugdpijplijn van instroom (6 jaar) tot senioren (22 jaar). Streef is 12
              jongens + 13 meiden per geboortejaar. Jongere leeftijden (&lt;12) worden teruggerekend
              met groei-factoren op basis van de laatste 5 seizoenen.
            </p>
          </section>
          <section>
            <h4 className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Kleuren
            </h4>
            <p>
              <span className="text-green-600">●</span> ≥90% op koers,{" "}
              <span className="text-yellow-500">●</span> 70-89% aandacht,{" "}
              <span className="text-red-500">●</span> &lt;70% tekort.
            </p>
          </section>
        </div>
      </InfoPageHeader>

      {/* Sectie 1: Doelkaart */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold tracking-wide text-gray-700 uppercase">
          Stip op de horizon
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Met 50 spelers per selectiecategorie in een evenwichtige verhouding jongens en meiden
          verzekeren we ons van selectieteams op hoofdklasseniveau.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {categorieen.map((cat) => {
            const pct = vulgraadPct(cat.totaal);
            return (
              <div key={cat.label} className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-gray-800">
                    {cat.label}{" "}
                    <span className="font-normal text-gray-400">({cat.leeftijden})</span>
                  </span>
                  <span className="text-sm font-semibold">{pct}%</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500">
                  <span>
                    {cat.totaal}/{doel}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span>
                    {cat.m}
                    <span className="text-blue-500">♂</span> {cat.v}
                    <span className="text-pink-500">♀</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pct >= 90 ? "bg-green-500" : pct >= 70 ? "bg-yellow-500" : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sectie 2: Pijplijn-tabel */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold tracking-wide text-gray-700 uppercase">
          Pijplijn per leeftijd
        </h3>
        <p className="mb-4 text-xs text-gray-500">
          Streef 12♂ + 13♀ per geboortejaar — groei-factoren op basis van laatste 5 seizoenen
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-3 py-2 font-semibold">Leeftijd</th>
                <th className="px-3 py-2 font-semibold">Geb.jaar</th>
                <th className="px-3 py-2 text-right font-semibold">
                  <span className="text-blue-500">♂</span> huidig
                </th>
                <th className="px-3 py-2 text-right font-semibold">
                  <span className="text-blue-500">♂</span> nodig
                </th>
                <th className="px-3 py-2 text-right font-semibold">
                  <span className="text-pink-500">♀</span> huidig
                </th>
                <th className="px-3 py-2 text-right font-semibold">
                  <span className="text-pink-500">♀</span> nodig
                </th>
                <th className="px-3 py-2 text-right font-semibold">
                  <span className="text-blue-500">♂</span> %
                </th>
                <th className="px-3 py-2 text-right font-semibold">
                  <span className="text-pink-500">♀</span> %
                </th>
              </tr>
            </thead>
            <tbody>
              {pijplijn.perLeeftijd.map((row) => {
                const stipKleur = (v: number) =>
                  v >= 90 ? "text-green-500" : v >= 70 ? "text-yellow-500" : "text-red-500";
                const extra = verwachteInstroom[row.leeftijd] || 0;
                return (
                  <tr key={row.leeftijd} className="border-t border-gray-100">
                    <td className="px-3 py-2">{row.leeftijd}</td>
                    <td className="px-3 py-2 text-gray-500">{startJaar - row.leeftijd}</td>
                    <td className="px-3 py-2 text-right">
                      {row.huidig_m}
                      {extra > 0 && <span className="ml-1 text-xs text-gray-400">(+{extra})</span>}
                      {row.gap_m < 0 && !extra && (
                        <span className="ml-1 text-xs text-red-600">({row.gap_m})</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-400">{row.benodigd_m}</td>
                    <td className="px-3 py-2 text-right">
                      {row.huidig_v}
                      {row.gap_v < 0 && !extra && (
                        <span className="ml-1 text-xs text-red-600">({row.gap_v})</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-400">{row.benodigd_v}</td>
                    <td className="px-3 py-2 text-right text-sm">
                      <span className={stipKleur(row.vulgraad_m)}>●</span>{" "}
                      <span className="font-semibold">{row.vulgraad_m}%</span>
                    </td>
                    <td className="px-3 py-2 text-right text-sm">
                      <span className={stipKleur(row.vulgraad_v)}>●</span>{" "}
                      <span className="font-semibold">{row.vulgraad_v}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sectie 3: Retentiecurve */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold tracking-wide text-gray-700 uppercase">
          Waar lekken we?
        </h3>
        <p className="mb-4 text-xs text-gray-500">
          Netto groei per leeftijdsovergang. Boven 100% = instroom &gt; uitstroom. Onder 100% =
          nettoverlies.
        </p>
        <RetentieCurve factoren={pijplijn.groeiFactoren} />
      </div>

      {/* Sectie 4: Knelpunten */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold tracking-wide text-gray-700 uppercase">
          Waar investeren?
        </h3>
        <p className="mb-4 text-xs text-gray-500">
          Top knelpunten en kansen, gesorteerd op impact. Factor = historisch behoud, benchmark =
          jeugdmodel.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {knelpunten.map((kp) => (
            <div key={kp.titel} className={`rounded-lg p-4 ${knelpuntKleuren[kp.kleur]}`}>
              <div className="flex items-baseline justify-between">
                <h4 className="text-sm font-semibold text-gray-900">{kp.titel}</h4>
                <span className="text-xs text-gray-500">
                  {kp.factor} (benchmark {kp.benchmark})
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-700">{kp.beschrijving}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sectie 5: Doorstroomkans */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold tracking-wide text-gray-700 uppercase">
          Doorstroomkans naar U17
        </h3>
        <p className="mb-4 text-xs text-gray-500">
          Kans dat een individuele speler die instroomt bij deze leeftijd uiteindelijk U17 (leeftijd
          15) bereikt, op basis van retentiefactoren uit het jeugdmodel.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-3 py-2 font-semibold">Instap-leeftijd</th>
                <th className="px-3 py-2 font-semibold">Band</th>
                <th className="px-3 py-2 text-right font-semibold">
                  <span className="text-blue-500">♂</span> kans
                </th>
                <th className="px-3 py-2 text-right font-semibold">
                  <span className="text-pink-500">♀</span> kans
                </th>
                <th className="px-3 py-2 font-semibold">Interpretatie</th>
              </tr>
            </thead>
            <tbody>
              {[6, 7, 8, 9, 10, 11, 12].map((startLeeftijd) => {
                // Product van retentiefactoren van startLeeftijd+1 t/m 15
                let kansM = 1;
                let kansV = 1;
                for (let l = startLeeftijd + 1; l <= 15; l++) {
                  kansM *= BENCHMARK_M[l] ?? 0.9;
                  kansV *= BENCHMARK_V[l] ?? 0.9;
                }
                const pctM = Math.round(kansM * 1000) / 10;
                const pctV = Math.round(kansV * 1000) / 10;
                const band = startLeeftijd <= 7 ? "Blauw" : startLeeftijd <= 9 ? "Groen" : "Geel";
                const gemKans = (pctM + pctV) / 2;
                return (
                  <tr key={startLeeftijd} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-medium">{startLeeftijd} jaar</td>
                    <td className="px-3 py-2">{band}</td>
                    <td className="px-3 py-2 text-right">{pctM}%</td>
                    <td className="px-3 py-2 text-right">{pctV}%</td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {gemKans >= 60
                        ? "Hoge doorstroom — efficiënte instroom"
                        : gemKans >= 40
                          ? `1 op ${Math.round(100 / gemKans)} haalt U17`
                          : `Slechts 1 op ${Math.round(100 / gemKans)} haalt U17`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sectie 6: Piramide huidig vs benodigd */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold tracking-wide text-gray-700 uppercase">
          Huidig vs. benodigd
        </h3>
        <p className="mb-4 text-xs text-gray-500">
          Huidig (solid) vs. benodigd (transparant) — per leeftijd en geslacht
        </p>
        {piramideData.length > 0 ? (
          <ProjectiePiramide data={piramideData} />
        ) : (
          <p className="text-sm text-gray-500">Geen data beschikbaar.</p>
        )}
      </div>

      {/* Sectie 7: Forward U17-projectie */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold tracking-wide text-gray-700 uppercase">
          U17-projectie — 5 seizoenen vooruit
        </h3>
        <p className="mb-4 text-xs text-gray-500">
          Als we niets veranderen, waar staan we over 5 jaar? Gebaseerd op huidige cohorten x
          historische groei.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-3 py-2 font-semibold">Seizoen</th>
                <th className="px-3 py-2 font-semibold">1e-jaars</th>
                <th className="px-3 py-2 font-semibold">2e-jaars</th>
                <th className="px-3 py-2 text-right font-semibold">
                  <span className="text-blue-500">♂</span>
                </th>
                <th className="px-3 py-2 text-right font-semibold">
                  <span className="text-pink-500">♀</span>
                </th>
                <th className="px-3 py-2 text-right font-semibold">Totaal</th>
                <th className="px-3 py-2 text-right font-semibold">Teams</th>
                <th className="px-3 py-2 font-semibold">Gap</th>
              </tr>
            </thead>
            <tbody>
              {projectie.u17.map((row) => {
                const pct = Math.round((row.totaal / 50) * 100);
                return (
                  <tr key={row.seizoen} className={`border-t border-gray-100 ${signaalKleur(pct)}`}>
                    <td className="px-3 py-2 font-medium">{row.seizoen}</td>
                    <td className="px-3 py-2 text-gray-500">gj {row.geboortejaar1eJaars}</td>
                    <td className="px-3 py-2 text-gray-500">gj {row.geboortejaar2eJaars}</td>
                    <td className="px-3 py-2 text-right">
                      {row.totaalM}
                      {row.gapM < 0 && (
                        <span className="ml-1 text-xs text-red-600">({row.gapM})</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {row.totaalV}
                      {row.gapV < 0 && (
                        <span className="ml-1 text-xs text-red-600">({row.gapV})</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">{row.totaal}</td>
                    <td className="px-3 py-2 text-right font-semibold">{row.teams}</td>
                    <td className="px-3 py-2">
                      {row.totaal >= 50 ? (
                        <span className="text-xs font-medium text-green-700">Op koers</span>
                      ) : (
                        <span className="text-xs font-medium text-red-700">
                          {row.totaal - 50} spelers
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sectie 8: Senioren-doorstroom */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold tracking-wide text-gray-700 uppercase">
          Senioren-instroom — Projectie vanuit U19
        </h3>
        <p className="mb-4 text-xs text-gray-500">
          Verwacht aantal spelers dat per seizoen de seniorenleeftijd bereikt
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-3 py-2 font-semibold">Seizoen</th>
                <th className="px-3 py-2 font-semibold">Geboortejaren</th>
                <th className="px-3 py-2 text-right font-semibold">
                  <span className="text-blue-500">♂</span>
                </th>
                <th className="px-3 py-2 text-right font-semibold">
                  <span className="text-pink-500">♀</span>
                </th>
                <th className="px-3 py-2 text-right font-semibold">Totaal</th>
              </tr>
            </thead>
            <tbody>
              {projectie.senioren.map((row) => (
                <tr key={row.seizoen} className="border-t border-gray-100">
                  <td className="px-3 py-2 font-medium">{row.seizoen}</td>
                  <td className="px-3 py-2 text-gray-500">
                    {row.geboortejaar2} + {row.geboortejaar1}
                  </td>
                  <td className="px-3 py-2 text-right">{row.projM}</td>
                  <td className="px-3 py-2 text-right">{row.projV}</td>
                  <td className="px-3 py-2 text-right font-semibold">{row.totaal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
