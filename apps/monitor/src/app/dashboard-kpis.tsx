import Link from "next/link";
import { KpiCard } from "@oranje-wit/ui";
import { getDashboardKPIs } from "@/lib/queries/dashboard";
import { getNettoGroei } from "@/lib/queries/retentie";

export async function DashboardKpis({ seizoen }: { seizoen: string }) {
  const [kpis, groei] = await Promise.all([getDashboardKPIs(seizoen), getNettoGroei(seizoen)]);

  return (
    <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Link href="/spelers">
        <KpiCard label="Spelende leden" value={kpis.totaal_spelers} />
      </Link>
      <Link href="/teams">
        <KpiCard label="Teams" value={kpis.totaal_teams} />
      </Link>
      <Link href="/retentie">
        <KpiCard
          label="Netto groei"
          value={groei.netto >= 0 ? `+${groei.netto}` : String(groei.netto)}
          trend={{ value: groei.netto, label: `${groei.instroom} in / ${groei.uitstroom} uit` }}
        />
      </Link>
      <Link href="/signalering">
        <KpiCard
          label="Signaleringen"
          value={kpis.signalering_kritiek}
          signal={
            kpis.signalering_kritiek > 0 ? "rood" : kpis.signalering_aandacht > 0 ? "geel" : "groen"
          }
        />
      </Link>
    </div>
  );
}
