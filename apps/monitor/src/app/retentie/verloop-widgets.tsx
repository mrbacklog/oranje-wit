import type { AankomstigeUitstroomer, IntraSeizoenFlow } from "@/lib/queries/verloop";
import type { KritiekMoment } from "@/lib/utils/retentie";

export function AankomstigeUitstroomTabel({ leden }: { leden: AankomstigeUitstroomer[] }) {
  return (
    <div
      className="mb-8 rounded-xl border p-6 shadow-sm"
      style={{
        borderColor: "color-mix(in srgb, var(--ow-oranje-500) 30%, transparent)",
        backgroundColor: "color-mix(in srgb, var(--ow-oranje-500) 10%, transparent)",
      }}
    >
      <h3 className="text-ow-oranje mb-1 text-sm font-semibold tracking-wide uppercase">
        Opgezegd — {leden.length} {leden.length === 1 ? "lid heeft" : "leden hebben"} al een
        afmelddatum
      </h3>
      <p className="text-ow-oranje mb-4 text-xs">
        Deze leden zijn nog actief dit seizoen maar hebben al opgezegd. Afmelddatum staat in het
        ledenbestand.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr
              className="border-b text-left"
              style={{ borderColor: "color-mix(in srgb, var(--ow-oranje-500) 30%, transparent)" }}
            >
              <th className="text-ow-oranje py-2 pr-4 font-semibold">Naam</th>
              <th className="text-ow-oranje py-2 pr-4 font-semibold">Team</th>
              <th className="text-ow-oranje py-2 pr-4 font-semibold">Geb.jaar</th>
              <th className="text-ow-oranje py-2 font-semibold">Afmelddatum</th>
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
                <tr key={l.relCode} className="border-border-light border-t">
                  <td className="text-text-primary py-1.5 pr-4 font-medium">
                    {naam}
                    <span className="text-ow-oranje ml-1">{l.geslacht === "M" ? "♂" : "♀"}</span>
                  </td>
                  <td className="text-text-secondary py-1.5 pr-4">{l.team ?? "—"}</td>
                  <td className="text-text-muted py-1.5 pr-4">{l.geboortejaar ?? "—"}</td>
                  <td className="text-text-secondary py-1.5">{datum}</td>
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
    <div className="bg-surface-card rounded-xl p-6 shadow-sm">
      <h3 className="text-text-secondary mb-4 text-sm font-semibold tracking-wide uppercase">
        Kritieke overgangsmomenten
      </h3>
      <p className="text-text-muted mb-4 text-xs">
        Automatisch gedetecteerd: leeftijden waar de retentie het sterkst daalt.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-sunken text-left">
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
                    : "text-text-secondary";
              return (
                <tr key={m.leeftijd} className="border-border-light border-t">
                  <td className="px-3 py-2 font-medium">{m.leeftijd} jaar</td>
                  <td className="text-text-secondary px-3 py-2">{m.groep}</td>
                  <td className="px-3 py-2 text-right">{m.retentie.toFixed(1)}%</td>
                  <td className={`px-3 py-2 text-right ${kleur}`}>{m.daling.toFixed(1)}pp</td>
                  <td className="px-3 py-2 text-right">
                    {m.retentieM !== null ? `${m.retentieM.toFixed(1)}%` : "\u2013"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {m.retentieV !== null ? `${m.retentieV.toFixed(1)}%` : "\u2013"}
                  </td>
                  <td className="text-text-muted px-3 py-2 text-xs">{m.signaal ?? "\u2013"}</td>
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
  const fasen: {
    label: string;
    totaal: number | null;
    gestopt: number | null;
    colorStyle: React.CSSProperties;
  }[] = [
    {
      label: "Najaar",
      totaal: flow.najaarTotaal,
      gestopt: null,
      colorStyle: { backgroundColor: "var(--color-info-500)" },
    },
    {
      label: "Zaal",
      totaal: flow.zaalTotaal,
      gestopt: flow.stopteVoorZaal,
      colorStyle: { backgroundColor: "var(--color-info-400)" },
    },
    {
      label: "Voorjaar",
      totaal: flow.voorjaarTotaal,
      gestopt: flow.stopteVoorVoorjaar,
      colorStyle: { backgroundColor: "var(--color-info-300)" },
    },
  ];

  if (flow.najaarTotaal === 0) return null;

  return (
    <div className="bg-surface-card mb-8 rounded-xl p-6 shadow-sm">
      <h3 className="text-text-secondary mb-1 text-sm font-semibold tracking-wide uppercase">
        Seizoen flow {flow.seizoen}
      </h3>
      <p className="text-text-muted mb-4 text-xs">
        Actieve spelers per competitie. Grijs = nog niet van start.
      </p>
      <div className="flex items-center gap-4">
        {fasen.map((fase, i) => (
          <div key={fase.label} className="flex items-center gap-4">
            {i > 0 && fase.gestopt != null && (
              <div className="text-center">
                <div className="text-signal-rood text-xs">&#8594; {fase.gestopt} gestopt</div>
              </div>
            )}
            <div className="text-center">
              <div
                className={`flex h-16 w-24 items-center justify-center rounded-lg text-lg font-bold text-white ${fase.totaal == null ? "bg-surface-raised" : ""}`}
                style={fase.totaal != null ? fase.colorStyle : undefined}
              >
                {fase.totaal != null ? fase.totaal : "\u2014"}
              </div>
              <div className="text-text-muted mt-1 text-xs">{fase.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
