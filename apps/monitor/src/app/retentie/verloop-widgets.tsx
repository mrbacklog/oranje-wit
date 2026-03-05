import type { AankomstigeUitstroomer, IntraSeizoenFlow } from "@/lib/queries/verloop";
import type { KritiekMoment } from "@/lib/utils/retentie";

export function AankomstigeUitstroomTabel({ leden }: { leden: AankomstigeUitstroomer[] }) {
  return (
    <div className="mb-8 rounded-xl border border-orange-200 bg-orange-50 p-6 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold tracking-wide text-orange-800 uppercase">
        Opgezegd — {leden.length} {leden.length === 1 ? "lid heeft" : "leden hebben"} al een
        afmelddatum
      </h3>
      <p className="mb-4 text-xs text-orange-700">
        Deze leden zijn nog actief dit seizoen maar hebben al opgezegd. Afmelddatum staat in het
        ledenbestand.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-orange-200 text-left">
              <th className="py-2 pr-4 font-semibold text-orange-900">Naam</th>
              <th className="py-2 pr-4 font-semibold text-orange-900">Team</th>
              <th className="py-2 pr-4 font-semibold text-orange-900">Geb.jaar</th>
              <th className="py-2 font-semibold text-orange-900">Afmelddatum</th>
            </tr>
          </thead>
          <tbody>
            {leden.map((l) => {
              const naam = [l.roepnaam, l.tussenvoegsel, l.achternaam].filter(Boolean).join(" ");
              const datum = new Date(l.afmelddatum).toLocaleDateString("nl-NL", {
                day: "numeric",
                month: "long",
                year: "numeric",
              });
              return (
                <tr key={l.relCode} className="border-t border-orange-100">
                  <td className="py-1.5 pr-4 font-medium text-orange-900">
                    {naam}
                    <span className="ml-1 text-orange-500">{l.geslacht === "M" ? "♂" : "♀"}</span>
                  </td>
                  <td className="py-1.5 pr-4 text-orange-800">{l.team ?? "—"}</td>
                  <td className="py-1.5 pr-4 text-orange-700">{l.geboortejaar ?? "—"}</td>
                  <td className="py-1.5 text-orange-800">{datum}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function KritiekeMomentenTabel({ momenten }: { momenten: KritiekMoment[] }) {
  return (
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
            {momenten.map((m) => {
              const kleur =
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
                  <td className={`px-3 py-2 text-right ${kleur}`}>{m.daling.toFixed(1)}pp</td>
                  <td className="px-3 py-2 text-right">
                    {m.retentieM !== null ? `${m.retentieM.toFixed(1)}%` : "\u2013"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {m.retentieV !== null ? `${m.retentieV.toFixed(1)}%` : "\u2013"}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">{m.signaal ?? "\u2013"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function IntraSeizoenFlowCard({ flow }: { flow: IntraSeizoenFlow }) {
  const fasen: { label: string; totaal: number | null; gestopt: number | null; color: string }[] = [
    { label: "Najaar", totaal: flow.najaarTotaal, gestopt: null, color: "bg-blue-500" },
    { label: "Zaal", totaal: flow.zaalTotaal, gestopt: flow.stopteVoorZaal, color: "bg-blue-400" },
    {
      label: "Voorjaar",
      totaal: flow.voorjaarTotaal,
      gestopt: flow.stopteVoorVoorjaar,
      color: "bg-blue-300",
    },
  ];

  if (flow.najaarTotaal === 0) return null;

  return (
    <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold tracking-wide text-gray-700 uppercase">
        Seizoen flow {flow.seizoen}
      </h3>
      <p className="mb-4 text-xs text-gray-400">
        Actieve spelers per competitie. Grijs = nog niet van start.
      </p>
      <div className="flex items-center gap-4">
        {fasen.map((fase, i) => (
          <div key={fase.label} className="flex items-center gap-4">
            {i > 0 && fase.gestopt != null && (
              <div className="text-center">
                <div className="text-xs text-red-500">&#8594; {fase.gestopt} gestopt</div>
              </div>
            )}
            <div className="text-center">
              <div
                className={`flex h-16 w-24 items-center justify-center rounded-lg text-lg font-bold text-white ${fase.totaal != null ? fase.color : "bg-gray-200"}`}
              >
                {fase.totaal != null ? fase.totaal : "\u2014"}
              </div>
              <div className="mt-1 text-xs text-gray-500">{fase.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
