import { PageHeader, KpiCard, BandPill } from "@oranje-wit/ui";
import { getPerGeboortejaar, getPerKleur } from "@/lib/queries/samenstelling";
import { getSeizoen } from "@/lib/utils/seizoen";
import { Ledenboog } from "@/components/charts/ledenboog";

export default async function SamenstellingPage({
  searchParams,
}: {
  searchParams: Promise<{ seizoen?: string }>;
}) {
  const params = await searchParams;
  const seizoen = getSeizoen(params);

  const [geboortejaar, kleur] = await Promise.all([
    getPerGeboortejaar(seizoen),
    getPerKleur(seizoen),
  ]);

  // Bereid ledenboog data voor: aggregeer per geboortejaar M/V met band
  const boogMap = new Map<
    number,
    { M: number; V: number; band: string }
  >();
  for (const row of geboortejaar.data) {
    if (!row.geboortejaar) continue;
    const existing = boogMap.get(row.geboortejaar);
    const band = row.a_jaars || row.a_categorie || "Onbekend";
    if (existing) {
      if (row.geslacht === "M") existing.M += row.aantal;
      else existing.V += row.aantal;
    } else {
      boogMap.set(row.geboortejaar, {
        M: row.geslacht === "M" ? row.aantal : 0,
        V: row.geslacht === "V" ? row.aantal : 0,
        band,
      });
    }
  }
  const boogData = [...boogMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([gj, d]) => ({ geboortejaar: gj, ...d }));

  // Detail tabel: per geboortejaar geaggregeerd
  const detailMap = new Map<
    number,
    { M: number; V: number; band: string }
  >();
  for (const row of geboortejaar.data) {
    if (!row.geboortejaar) continue;
    const existing = detailMap.get(row.geboortejaar);
    const band = row.a_jaars || row.a_categorie || "Onbekend";
    if (existing) {
      if (row.geslacht === "M") existing.M += row.aantal;
      else existing.V += row.aantal;
    } else {
      detailMap.set(row.geboortejaar, {
        M: row.geslacht === "M" ? row.aantal : 0,
        V: row.geslacht === "V" ? row.aantal : 0,
        band,
      });
    }
  }
  const startJaar = parseInt(seizoen.split("-")[0]);
  const detailRows = [...detailMap.entries()]
    .sort(([a], [b]) => b - a)
    .map(([gj, d]) => ({
      geboortejaar: gj,
      M: d.M,
      V: d.V,
      totaal: d.M + d.V,
      band: d.band,
      leeftijd: startJaar - gj,
    }));

  return (
    <>
      <PageHeader
        title="Samenstelling"
        subtitle="Wie zijn er actief? Populatiestructuur, banden en teams."
      />

      {/* Genderbalans per band */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {kleur.data.map((k) => (
          <KpiCard
            key={k.kleur}
            label={k.kleur}
            value={`${k.spelers_m}M / ${k.spelers_v}V`}
            trend={{
              value: k.totaal,
              label: "totaal",
            }}
          />
        ))}
      </div>

      {/* Ledenboog */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
          Ledenboog per geboortejaar
        </h3>
        {boogData.length > 0 ? (
          <Ledenboog data={boogData} />
        ) : (
          <p className="text-sm text-gray-500">Geen data beschikbaar.</p>
        )}
      </div>

      {/* Detail tabel */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
          Detail per geboortejaar
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-3 py-2 font-semibold">Geboortejaar</th>
                <th className="px-3 py-2 font-semibold">Leeftijd</th>
                <th className="px-3 py-2 font-semibold">Band</th>
                <th className="px-3 py-2 text-right font-semibold">M</th>
                <th className="px-3 py-2 text-right font-semibold">V</th>
                <th className="px-3 py-2 text-right font-semibold">Totaal</th>
              </tr>
            </thead>
            <tbody>
              {detailRows.map((row) => (
                <tr key={row.geboortejaar} className="border-t border-gray-100">
                  <td className="px-3 py-2 font-medium">{row.geboortejaar}</td>
                  <td className="px-3 py-2">{row.leeftijd}</td>
                  <td className="px-3 py-2">
                    <BandPill band={row.band} />
                  </td>
                  <td className="px-3 py-2 text-right">{row.M}</td>
                  <td className="px-3 py-2 text-right">{row.V}</td>
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
