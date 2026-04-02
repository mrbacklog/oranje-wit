import type { AankomstigeUitstroomer, IntraSeizoenFlow } from "@/lib/monitor/queries/verloop";
import type { SeizoenMVLeeftijdRow } from "@/lib/monitor/queries/retentie";
import { AankomstigeUitstroomTabel, IntraSeizoenFlowCard } from "./verloop-widgets";
import { GroupedBarChart } from "./grouped-bar-chart";
import { SeizoenBarChart } from "./seizoen-bar-chart";
import { KpiCards } from "./kpi-cards";

type SeizoenRow = {
  seizoen: string;
  seizoenKort: string;
  isLopend: boolean;
  M: number;
  V: number;
};

export function VerloopCombinedContent({
  instroomLi,
  instroomVi,
  uitstroomLi,
  uitstroomVi,
  instroomLeeftijdData,
  uitstroomLeeftijdData,
  instroomSeizoenData,
  uitstroomSeizoenData,
  instroomPatronen,
  uitstroomPatronen,
  intraSeizoenFlow,
  aankomstigeUitstroom,
}: {
  instroomLi?: SeizoenMVLeeftijdRow;
  instroomVi?: SeizoenMVLeeftijdRow;
  uitstroomLi?: SeizoenMVLeeftijdRow;
  uitstroomVi?: SeizoenMVLeeftijdRow;
  instroomLeeftijdData: { leeftijd: number; M: number; V: number }[];
  uitstroomLeeftijdData: { leeftijd: number; M: number; V: number }[];
  instroomSeizoenData: SeizoenRow[];
  uitstroomSeizoenData: SeizoenRow[];
  instroomPatronen: string[];
  uitstroomPatronen: string[];
  intraSeizoenFlow: IntraSeizoenFlow;
  aankomstigeUitstroom: AankomstigeUitstroomer[];
}) {
  const isLopend = instroomLi?.isLopend || uitstroomLi?.isLopend || false;

  function kpiItems(li?: SeizoenMVLeeftijdRow, vi?: SeizoenMVLeeftijdRow, label = "") {
    const lopend = li?.isLopend ?? false;
    const tTot = li && vi ? li.totaal - vi.totaal : 0;
    const tJeugd = li && vi ? li.jeugdTotaal - vi.jeugdTotaal : 0;
    const tSen = li && vi ? li.seniorenTotaal - vi.seniorenTotaal : 0;
    return [
      {
        label: `${label} totaal${lopend ? " (voorlopig)" : ""}`,
        waarde: li ? String(li.totaal) : "-",
        detail: li ? `${li.M} \u2642 / ${li.V} \u2640` : undefined,
        trend: tTot,
        trendLabel: `${tTot >= 0 ? "+" : ""}${tTot} vs vorig`,
      },
      {
        label: `Jeugd (6\u201318)${lopend ? " (voorlopig)" : ""}`,
        waarde: li ? String(li.jeugdTotaal) : "-",
        detail: li ? `${li.jeugdM} \u2642 / ${li.jeugdV} \u2640` : undefined,
        trend: tJeugd,
        trendLabel: `${tJeugd >= 0 ? "+" : ""}${tJeugd} vs vorig`,
      },
      {
        label: `Senioren (19+)${lopend ? " (voorlopig)" : ""}`,
        waarde: li ? String(li.seniorenTotaal) : "-",
        detail: li ? `${li.seniorenM} \u2642 / ${li.seniorenV} \u2640` : undefined,
        trend: tSen,
        trendLabel: `${tSen >= 0 ? "+" : ""}${tSen} vs vorig`,
      },
    ];
  }

  return (
    <>
      {isLopend && (
        <div
          className="mb-6 flex items-start gap-3 rounded-xl border px-4 py-3"
          style={{
            borderColor: "var(--color-warning-100)",
            backgroundColor: "var(--color-warning-50)",
          }}
        >
          <span className="text-signal-geel mt-0.5">&#9888;</span>
          <p className="text-signal-geel text-sm">
            <strong>Lopend seizoen</strong> — de cijfers hieronder zijn voorlopig. Het seizoen loopt
            nog en niet alle spelers zijn al ingeschreven. De gemiddelden zijn berekend over de
            laatste 5 afgeronde seizoenen.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-text-secondary mb-3 text-sm font-semibold tracking-wide uppercase">
            Instroom
          </h3>
          <KpiCards items={kpiItems(instroomLi, instroomVi, "Instroom")} />
        </div>
        <div>
          <h3 className="text-signal-rood mb-3 text-sm font-semibold tracking-wide uppercase">
            Uitstroom
          </h3>
          <KpiCards items={kpiItems(uitstroomLi, uitstroomVi, "Uitstroom")} />
        </div>
      </div>

      {intraSeizoenFlow && <IntraSeizoenFlowCard flow={intraSeizoenFlow} />}

      {aankomstigeUitstroom.length > 0 && (
        <AankomstigeUitstroomTabel leden={aankomstigeUitstroom} />
      )}

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="bg-surface-card rounded-xl p-6 shadow-sm">
          <h3 className="text-text-secondary mb-4 text-sm font-semibold tracking-wide uppercase">
            Gemiddelde instroom per leeftijd
          </h3>
          <GroupedBarChart
            data={instroomLeeftijdData}
            kleurM="var(--color-info-500)"
            kleurV="var(--knkv-rood-400)"
          />
          {instroomPatronen.length > 0 && (
            <div
              className="mt-4 rounded-lg px-4 py-3"
              style={{ backgroundColor: "var(--color-info-50)" }}
            >
              <h4
                className="mb-2 text-xs font-semibold tracking-wide uppercase"
                style={{ color: "var(--color-info-700)" }}
              >
                Patronen
              </h4>
              <ul className="space-y-1 text-sm" style={{ color: "var(--color-info-500)" }}>
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
        <div className="bg-surface-card rounded-xl p-6 shadow-sm">
          <h3 className="text-text-secondary mb-4 text-sm font-semibold tracking-wide uppercase">
            Gemiddelde uitstroom per leeftijd
          </h3>
          <GroupedBarChart
            data={uitstroomLeeftijdData}
            kleurM="var(--color-info-500)"
            kleurV="var(--knkv-rood-400)"
          />
          {uitstroomPatronen.length > 0 && (
            <div
              className="mt-4 rounded-lg px-4 py-3"
              style={{ backgroundColor: "var(--color-error-50)" }}
            >
              <h4 className="text-signal-rood mb-2 text-xs font-semibold tracking-wide uppercase">
                Patronen
              </h4>
              <ul className="text-signal-rood space-y-1 text-sm">
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
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-surface-card rounded-xl p-6 shadow-sm">
          <h3 className="text-text-secondary mb-2 text-sm font-semibold tracking-wide uppercase">
            Instroom per seizoen
          </h3>
          <p className="text-text-muted mb-4 text-xs">Klik op een seizoen voor de namenlijst.</p>
          <SeizoenBarChart
            data={instroomSeizoenData}
            kleurM="var(--color-info-500)"
            kleurV="var(--knkv-rood-400)"
          />
        </div>
        <div className="bg-surface-card rounded-xl p-6 shadow-sm">
          <h3 className="text-text-secondary mb-2 text-sm font-semibold tracking-wide uppercase">
            Uitstroom per seizoen
          </h3>
          <p className="text-text-muted mb-4 text-xs">
            Klik op een seizoen voor de namenlijst. Uitstroom van het lopende seizoen is
            niet-definitief: spelers die nog niet zijn ingeschreven tellen mee.
          </p>
          <SeizoenBarChart
            data={uitstroomSeizoenData}
            kleurM="var(--color-info-500)"
            kleurV="var(--knkv-rood-400)"
          />
        </div>
      </div>
    </>
  );
}
