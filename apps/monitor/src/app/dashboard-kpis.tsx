import { KpiCard } from "@oranje-wit/ui";
import { getDashboardKPIs } from "@/lib/queries/dashboard";

export async function DashboardKpis({ seizoen }: { seizoen: string }) {
  const kpis = await getDashboardKPIs(seizoen);

  return (
    <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
      <KpiCard label="Spelende leden" value={kpis.totaal_spelers} />
      <KpiCard label="Teams" value={kpis.totaal_teams} />
      <KpiCard
        label="Signaleringen"
        value={kpis.signalering_kritiek}
        signal={
          kpis.signalering_kritiek > 0 ? "rood" : kpis.signalering_aandacht > 0 ? "geel" : "groen"
        }
      />
    </div>
  );
}
