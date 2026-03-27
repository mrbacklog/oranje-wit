import Link from "next/link";
import { KpiCard, Metric } from "@oranje-wit/ui";
import { getDashboardKPIs, getLedenTrend } from "@/lib/queries/dashboard";
import { getNettoGroei } from "@/lib/queries/retentie";

export async function DashboardKpis({ seizoen }: { seizoen: string }) {
  const [kpis, groei, ledenTrend] = await Promise.all([
    getDashboardKPIs(seizoen),
    getNettoGroei(seizoen),
    getLedenTrend(),
  ]);

  const sparkData = ledenTrend.map((s) => s.totaal);

  return (
    <div className="mb-8 space-y-4">
      {/* Hero metric: Spelende leden */}
      <Link href="/spelers">
        <Metric
          value={kpis.totaal_spelers}
          label="Spelende leden"
          gradient="oranje"
          withCard
          sparkData={sparkData}
          trend={groei.netto >= 0 ? "up" : "down"}
          trendValue={`${groei.netto >= 0 ? "+" : ""}${groei.netto} dit seizoen`}
        />
      </Link>

      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link href="/teams">
          <KpiCard
            label="Teams"
            value={kpis.totaal_teams}
            subtitle={`${kpis.teams_8tal} × 8-tal · ${kpis.teams_4tal} × 4-tal`}
          />
        </Link>
        <Link href="/retentie">
          <KpiCard
            label="Netto groei"
            value={groei.netto >= 0 ? `+${groei.netto}` : String(groei.netto)}
            detail={{ instroom: groei.instroom, uitstroom: groei.uitstroom }}
          />
        </Link>
        <Link href="/signalering">
          <KpiCard
            label="Signaleringen"
            value={kpis.signalering_kritiek}
            signal={
              kpis.signalering_kritiek > 0
                ? "rood"
                : kpis.signalering_aandacht > 0
                  ? "geel"
                  : "groen"
            }
          />
        </Link>
      </div>
    </div>
  );
}
