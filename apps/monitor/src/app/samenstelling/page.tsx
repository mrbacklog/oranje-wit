import Link from "next/link";
import { InfoPageHeader } from "@/components/info/InfoPageHeader";
import { getPerGeboortejaar } from "@/lib/queries/samenstelling";
import { getSeizoen } from "@/lib/utils/seizoen";
import { Ledenboog } from "@/components/charts/ledenboog";
import { SamenstellingTabs } from "@/components/samenstelling-tabs";

const BAND_STIJL: Record<string, { bg: string; text: string; label: string }> = {
  Kangoeroes: { bg: "bg-band-blauw/30", text: "text-blue-800", label: "" },
  "F-jeugd": { bg: "bg-band-blauw", text: "text-white", label: "" },
  "E-jeugd": { bg: "bg-band-groen", text: "text-white", label: "" },
  "D-jeugd": { bg: "bg-band-geel", text: "text-gray-800", label: "" },
  "C-jeugd": { bg: "bg-band-oranje", text: "text-white", label: "" },
  "U15-1": { bg: "bg-band-oranje", text: "text-white", label: "U15" },
  U15: { bg: "bg-band-rood", text: "text-white", label: "U15" },
  U17: { bg: "bg-band-rood/70", text: "text-white", label: "U17" },
  U19: { bg: "bg-band-rood/50", text: "text-white", label: "U19" },
  Senioren: { bg: "bg-gray-200", text: "text-gray-600", label: "Sen" },
};

export default async function SamenstellingPage({
  searchParams,
}: {
  searchParams: Promise<{ seizoen?: string }>;
}) {
  const params = await searchParams;
  const seizoen = getSeizoen(params);

  const geboortejaar = await getPerGeboortejaar(seizoen);

  // Bereid ledenboog data voor
  const boogMap = new Map<number, { M: number; V: number; band: string }>();
  for (const row of geboortejaar.data) {
    if (!row.geboortejaar) continue;
    const existing = boogMap.get(row.geboortejaar);
    const band = row.a_categorie || "Overig";
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

  // Detail tabel
  const detailMap = new Map<number, { M: number; V: number; band: string }>();
  for (const row of geboortejaar.data) {
    if (!row.geboortejaar) continue;
    const existing = detailMap.get(row.geboortejaar);
    const band = row.a_categorie || "Overig";
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
      <InfoPageHeader
        title="Samenstelling"
        subtitle="Wie zijn er actief? Populatiestructuur en detail per geboortejaar."
        infoTitle="Over Samenstelling"
      >
        <div className="space-y-4">
          <section>
            <h4 className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Wat zie je?
            </h4>
            <p>De ledenboog: hoeveel leden per geboortejaar, verdeeld over jongens en meisjes.</p>
          </section>
          <section>
            <h4 className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Tabbladen
            </h4>
            <p>
              <strong>Piramide:</strong> visuele weergave van de leeftijdsopbouw. Een gezonde
              piramide is breed aan de onderkant.
            </p>
            <p className="mt-1">
              <strong>Detail:</strong> tabel met exacte aantallen per geboortejaar en leeftijdsband.
            </p>
          </section>
          <section>
            <h4 className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Doorklikken
            </h4>
            <p>
              <strong>Klik op een geboortejaar</strong> voor een overzicht van actieve en gestopte
              leden uit dat jaar.
            </p>
          </section>
        </div>
      </InfoPageHeader>

      <SamenstellingTabs
        piramideContent={
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold tracking-wide text-gray-700 uppercase">
              Populatiepiramide per geboortejaar
            </h3>
            {boogData.length > 0 ? (
              <Ledenboog data={boogData} seizoen={seizoen} />
            ) : (
              <p className="text-sm text-gray-500">Geen data beschikbaar.</p>
            )}
          </div>
        }
        detailContent={
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold tracking-wide text-gray-700 uppercase">
              Detail per geboortejaar
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-3 py-2 font-semibold">Geboortejaar</th>
                    <th className="px-3 py-2 font-semibold">Leeftijd</th>
                    <th className="w-16 px-3 py-2 font-semibold"></th>
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
                  {detailRows.map((row) => {
                    const stijl = BAND_STIJL[row.band] || {
                      bg: "bg-gray-100",
                      text: "text-gray-600",
                      label: "",
                    };
                    return (
                      <tr key={row.geboortejaar} className="border-t border-gray-100">
                        <td className="px-3 py-1.5 font-medium">
                          <Link
                            href={`/samenstelling/${row.geboortejaar}?seizoen=${seizoen}`}
                            className="hover:text-ow-oranje text-gray-900 hover:underline"
                          >
                            {row.geboortejaar}
                          </Link>
                        </td>
                        <td className="px-3 py-1.5">{row.leeftijd}</td>
                        <td
                          className={`px-3 py-1.5 text-center text-xs font-medium ${stijl.bg} ${stijl.text}`}
                        >
                          {stijl.label}
                        </td>
                        <td className="px-3 py-1.5 text-right">{row.M}</td>
                        <td className="px-3 py-1.5 text-right">{row.V}</td>
                        <td className="px-3 py-1.5 text-right font-semibold">{row.totaal}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        }
      />
    </>
  );
}
