import { PageHeader } from "@oranje-wit/ui";
import { getStreefmodel, CATEGORIE_MAPPING } from "@/lib/queries/model";
import { ProjectieBoog } from "./projectie-chart";

export default async function ProjectiesPage({
  searchParams,
}: {
  searchParams: Promise<{ seizoen?: string }>;
}) {
  const _params = await searchParams;
  const model = await getStreefmodel();

  if (!model.boog_huidig) {
    return (
      <>
        <PageHeader
          title="Projecties"
          subtitle="Waar gaan we naartoe? Streefmodel en projecties."
        />
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-gray-500">Geen streefmodel data beschikbaar.</p>
        </div>
      </>
    );
  }

  // Streefmodel boog: huidig vs eerste projectie
  const eersteProjectieKey = Object.keys(model.projecties).sort()[0];
  const eersteProjectie = eersteProjectieKey
    ? model.projecties[eersteProjectieKey]
    : null;

  const boogChartData = model.boog_huidig.per_leeftijd.map((h) => {
    const projectieEntry = eersteProjectie?.per_leeftijd.find(
      (p) => p.leeftijd === h.leeftijd
    );
    return {
      leeftijd: h.leeftijd,
      band: h.band,
      huidig: h.totaal ?? 0,
      streef: projectieEntry?.totaal ?? 0,
    };
  });

  // Voeg leeftijden toe die alleen in projectie zitten
  if (eersteProjectie) {
    for (const p of eersteProjectie.per_leeftijd) {
      if (!boogChartData.find((d) => d.leeftijd === p.leeftijd)) {
        boogChartData.push({
          leeftijd: p.leeftijd,
          band: p.band,
          huidig: 0,
          streef: p.totaal ?? 0,
        });
      }
    }
    boogChartData.sort((a, b) => a.leeftijd - b.leeftijd);
  }

  // Vulgraad tabel
  const vulgraadData = boogChartData.map((d) => {
    const gap = d.streef > 0 ? d.huidig - d.streef : 0;
    const pct = d.streef > 0 ? (d.huidig / d.streef) * 100 : null;
    const signaal =
      pct === null
        ? "neutraal"
        : pct >= 90
          ? "groen"
          : pct >= 70
            ? "geel"
            : "rood";
    return { ...d, gap, pct, signaal };
  });

  const signaalKleuren: Record<string, string> = {
    groen: "bg-green-50 text-signal-groen",
    geel: "bg-yellow-50 text-signal-geel",
    rood: "bg-red-50 text-signal-rood",
    neutraal: "",
  };

  // Categorie mapping data
  const catEntries = Object.entries(CATEGORIE_MAPPING) as [
    string,
    { band: string; leeftijden: readonly number[] | null; spelvorm: string | null },
  ][];

  return (
    <>
      <PageHeader
        title="Projecties"
        subtitle="Waar gaan we naartoe? Streefmodel en projecties."
      />

      {/* Streefmodel boog */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-700">
          Streefmodel-boog
        </h3>
        <p className="mb-4 text-xs text-gray-500">
          Huidig ({model.boog_huidig.beschrijving}) vs.{" "}
          {eersteProjectie?.beschrijving ?? "streef"}
        </p>
        <ProjectieBoog data={boogChartData} />
      </div>

      {/* Vulgraad tabel */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
          Vulgraad per leeftijd
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-3 py-2 font-semibold">Leeftijd</th>
                <th className="px-3 py-2 font-semibold">Band</th>
                <th className="px-3 py-2 text-right font-semibold">Huidig</th>
                <th className="px-3 py-2 text-right font-semibold">Streef</th>
                <th className="px-3 py-2 text-right font-semibold">Verschil</th>
                <th className="px-3 py-2 text-right font-semibold">Vulgraad</th>
              </tr>
            </thead>
            <tbody>
              {vulgraadData.map((row) => (
                <tr
                  key={row.leeftijd}
                  className={`border-t border-gray-100 ${signaalKleuren[row.signaal]}`}
                >
                  <td className="px-3 py-2 font-medium">{row.leeftijd}</td>
                  <td className="px-3 py-2">{row.band}</td>
                  <td className="px-3 py-2 text-right">{row.huidig}</td>
                  <td className="px-3 py-2 text-right">{row.streef}</td>
                  <td className="px-3 py-2 text-right font-medium">
                    {row.gap >= 0 ? `+${row.gap}` : row.gap}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {row.pct !== null ? `${row.pct.toFixed(0)}%` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Categorie mapping */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
          Categorie-mapping
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-3 py-2 font-semibold">Categorie</th>
                <th className="px-3 py-2 font-semibold">Band</th>
                <th className="px-3 py-2 font-semibold">Leeftijden</th>
                <th className="px-3 py-2 font-semibold">Spelvorm</th>
              </tr>
            </thead>
            <tbody>
              {catEntries.map(([cat, info]) => (
                <tr key={cat} className="border-t border-gray-100">
                  <td className="px-3 py-2 font-bold">{cat}</td>
                  <td className="px-3 py-2">{info.band}</td>
                  <td className="px-3 py-2">
                    {info.leeftijden
                      ? info.leeftijden.join(", ")
                      : "Alle"}
                  </td>
                  <td className="px-3 py-2">{info.spelvorm ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
