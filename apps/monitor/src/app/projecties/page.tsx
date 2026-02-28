import { PageHeader } from "@oranje-wit/ui";
import { getStreefmodel } from "@/lib/queries/model";
import { getPerGeboortejaar, getProjectie } from "@/lib/queries/samenstelling";
import { getSeizoen } from "@/lib/utils/seizoen";
import { ProjectiePiramide } from "./projectie-piramide";

function signaalKleur(pct: number): string {
  if (pct >= 80) return "bg-green-50 text-green-800";
  if (pct >= 60) return "bg-yellow-50 text-yellow-800";
  return "bg-red-50 text-red-800";
}

export default async function ProjectiesPage({
  searchParams,
}: {
  searchParams: Promise<{ seizoen?: string }>;
}) {
  const params = await searchParams;
  const seizoen = getSeizoen(params);
  const startJaar = parseInt(seizoen.split("-")[0]);

  const [model, geboortejaarData, projectie] = await Promise.all([
    getStreefmodel(),
    getPerGeboortejaar(seizoen),
    getProjectie(seizoen),
  ]);

  // Bouw huidig per leeftijd (M/V apart)
  const huidigPerLeeftijd = new Map<number, { M: number; V: number }>();
  for (const row of geboortejaarData.data) {
    if (!row.geboortejaar) continue;
    const leeftijd = startJaar - row.geboortejaar;
    const existing = huidigPerLeeftijd.get(leeftijd) || { M: 0, V: 0 };
    if (row.geslacht === "M") existing.M += row.aantal;
    else existing.V += row.aantal;
    huidigPerLeeftijd.set(leeftijd, existing);
  }

  // Streefmodel per leeftijd (M/V)
  const eersteProjectieKey = Object.keys(model.projecties).sort()[0];
  const eersteProjectie = eersteProjectieKey ? model.projecties[eersteProjectieKey] : null;
  const streefBron = eersteProjectie || model.boog_huidig;

  // Combineer tot piramide-data
  const alleLeeftijden = new Set<number>();
  for (const l of huidigPerLeeftijd.keys()) alleLeeftijden.add(l);
  if (streefBron) {
    for (const e of streefBron.per_leeftijd) alleLeeftijden.add(e.leeftijd);
  }

  const piramideData = [...alleLeeftijden]
    .filter((l) => l >= 5 && l <= 20)
    .sort((a, b) => a - b)
    .map((leeftijd) => {
      const huidig = huidigPerLeeftijd.get(leeftijd) || { M: 0, V: 0 };
      const streefEntry = streefBron?.per_leeftijd.find((e) => e.leeftijd === leeftijd);
      return {
        leeftijd,
        band: streefEntry?.band || "",
        huidige_m: huidig.M,
        huidige_v: huidig.V,
        streef_m: streefEntry?.m ?? 0,
        streef_v: streefEntry?.v ?? 0,
      };
    });

  // Vulgraad-tabel met M/V split
  const vulgraadData = piramideData.map((d) => {
    const totaalHuidig = d.huidige_m + d.huidige_v;
    const totaalStreef = d.streef_m + d.streef_v;
    const gap = totaalStreef > 0 ? totaalHuidig - totaalStreef : 0;
    const pct = totaalStreef > 0 ? (totaalHuidig / totaalStreef) * 100 : null;
    const gapM = d.streef_m > 0 ? d.huidige_m - d.streef_m : 0;
    const gapV = d.streef_v > 0 ? d.huidige_v - d.streef_v : 0;
    return { ...d, totaalHuidig, totaalStreef, gap, gapM, gapV, pct };
  });

  const signaalKleuren: Record<string, string> = {
    groen: "bg-green-50 text-signal-groen",
    geel: "bg-yellow-50 text-signal-geel",
    rood: "bg-red-50 text-signal-rood",
    neutraal: "",
  };

  return (
    <>
      <PageHeader
        title="Projecties"
        subtitle="Waar gaan we naartoe? Gebaseerd op historische groeipatronen per leeftijd."
      />

      {/* Projectie-piramide: huidig vs streef */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold tracking-wide text-gray-700 uppercase">
          Populatie vs. Streefmodel
        </h3>
        <p className="mb-4 text-xs text-gray-500">
          Huidig (solid) vs. streef (transparant) — per leeftijd en geslacht
        </p>
        {piramideData.length > 0 ? (
          <ProjectiePiramide data={piramideData} />
        ) : (
          <p className="text-sm text-gray-500">Geen data beschikbaar.</p>
        )}
      </div>

      {/* Vulgraad tabel met M/V */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold tracking-wide text-gray-700 uppercase">
          Vulgraad per leeftijd
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-3 py-2 font-semibold">Leeftijd</th>
                <th className="px-3 py-2 font-semibold">Band</th>
                <th className="px-3 py-2 text-right font-semibold">
                  <span className="text-blue-500">♂</span> huidig
                </th>
                <th className="px-3 py-2 text-right font-semibold">
                  <span className="text-blue-500">♂</span> streef
                </th>
                <th className="px-3 py-2 text-right font-semibold">
                  <span className="text-pink-500">♀</span> huidig
                </th>
                <th className="px-3 py-2 text-right font-semibold">
                  <span className="text-pink-500">♀</span> streef
                </th>
                <th className="px-3 py-2 text-right font-semibold">Verschil</th>
                <th className="px-3 py-2 text-right font-semibold">Vulgraad</th>
              </tr>
            </thead>
            <tbody>
              {vulgraadData.map((row) => {
                const signaal =
                  row.pct === null
                    ? "neutraal"
                    : row.pct >= 90
                      ? "groen"
                      : row.pct >= 70
                        ? "geel"
                        : "rood";
                return (
                  <tr
                    key={row.leeftijd}
                    className={`border-t border-gray-100 ${signaalKleuren[signaal]}`}
                  >
                    <td className="px-3 py-2 font-medium">{row.leeftijd}</td>
                    <td className="px-3 py-2">{row.band}</td>
                    <td className="px-3 py-2 text-right">
                      {row.huidige_m}
                      {row.gapM < 0 && (
                        <span className="ml-1 text-xs text-red-600">({row.gapM})</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-400">{row.streef_m}</td>
                    <td className="px-3 py-2 text-right">
                      {row.huidige_v}
                      {row.gapV < 0 && (
                        <span className="ml-1 text-xs text-red-600">({row.gapV})</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-400">{row.streef_v}</td>
                    <td className="px-3 py-2 text-right font-medium">
                      {row.gap >= 0 ? `+${row.gap}` : row.gap}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">
                      {row.pct !== null ? `${row.pct.toFixed(0)}%` : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* U17-projectie */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold tracking-wide text-gray-700 uppercase">
          U17-projectie — Doel: 50 spelers (25♂ + 25♀) voor 5 teams
        </h3>
        <p className="mb-4 text-xs text-gray-500">
          Gebaseerd op huidige cohortgroottes × historische groei per leeftijd/geslacht
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

      {/* Senioren-doorstroom */}
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
