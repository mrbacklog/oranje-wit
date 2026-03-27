import { CohortRetentieMatrix } from "./cohort-retentie-matrix";
import { CohortRetentieCurven } from "./cohort-retentie-curven";
import { KpiCards } from "./kpi-cards";
import type { CohortRetentieRij } from "@/lib/queries/retentie";
import type { EersteSeizoenRetentieRij } from "@/lib/queries/retentie";

interface CohortenContentProps {
  cohortData: CohortRetentieRij[];
  eersteSeizoen: EersteSeizoenRetentieRij[];
}

export function CohortenContent({ cohortData, eersteSeizoen }: CohortenContentProps) {
  const laatste = eersteSeizoen.at(-1);
  const vorige = eersteSeizoen.at(-2);

  const trendPp =
    laatste && vorige ? Math.round((laatste.retentiePct - vorige.retentiePct) * 10) / 10 : 0;

  return (
    <>
      <KpiCards
        items={[
          {
            label: "Eerste-seizoensretentie",
            waarde: laatste ? `${laatste.retentiePct.toFixed(0)}%` : "-",
            detail: laatste
              ? `${laatste.retentiePctM?.toFixed(0) ?? "-"}% ♂ / ${laatste.retentiePctV?.toFixed(0) ?? "-"}% ♀`
              : undefined,
            trend: trendPp,
            trendLabel: `${trendPp >= 0 ? "+" : ""}${trendPp}pp t.o.v. vorig`,
          },
          {
            label: "Na 3 seizoenen",
            waarde: (() => {
              const derde = eersteSeizoen.at(-4);
              if (!derde || !cohortData.length) return "-";
              const cohort = cohortData.find((c) => c.instroomSeizoen === derde.instroomSeizoen);
              const ret3 = cohort?.retentie.find((r) => r.jarenNaInstroom === 3);
              return ret3 ? `${ret3.percentage.toFixed(0)}%` : "-";
            })(),
            detail: "% nog actief na 3 seizoenen",
          },
        ]}
      />

      <div className="bg-surface-card mb-8 rounded-xl p-6 shadow-sm">
        <h3 className="text-text-secondary mb-2 text-sm font-semibold tracking-wide uppercase">
          Cohort-retentiematrix
        </h3>
        <p className="text-text-muted mb-4 text-xs">
          Per instroom-seizoen: welk % is na 1, 2, 3... jaar nog actief. Diagonaal lezen = zelfde
          cohort volgen.
        </p>
        <CohortRetentieMatrix data={cohortData} />
      </div>

      <div className="bg-surface-card rounded-xl p-6 shadow-sm">
        <h3 className="text-text-secondary mb-2 text-sm font-semibold tracking-wide uppercase">
          Retentiecurven per cohort
        </h3>
        <p className="text-text-muted mb-4 text-xs">
          Elke lijn volgt één instroom-jaargang. X-as = jaren na instroom, Y-as = % nog actief.
        </p>
        <CohortRetentieCurven data={cohortData} />
      </div>
    </>
  );
}
