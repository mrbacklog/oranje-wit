export const dynamic = "force-dynamic";
import { Suspense } from "react";
import Link from "next/link";
import { InfoPageHeader } from "@/components/info/InfoPageHeader";
import { HUIDIG_SEIZOEN } from "@/lib/utils/seizoen";
import { KpiCardsSkeleton, ChartsSkeleton, AlertCardsSkeleton } from "@/components/ui/skeleton";
import { DashboardKpis } from "./dashboard-kpis";
import { DashboardCharts } from "./dashboard-charts";
import { DashboardSignaleringen } from "./dashboard-signaleringen";

export default async function DashboardPage() {
  const seizoen = HUIDIG_SEIZOEN;

  return (
    <div>
      <InfoPageHeader
        title="Dashboard"
        subtitle={`Seizoen ${seizoen} — c.k.v. Oranje Wit`}
        infoTitle="Over het Dashboard"
      >
        <div className="space-y-4">
          <section>
            <h4 className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Wat zie je?
            </h4>
            <p>
              Overzicht van de belangrijkste cijfers: spelende leden, aantal teams, en signaleringen
              die aandacht vragen.
            </p>
          </section>
          <section>
            <h4 className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Grafieken
            </h4>
            <p>
              De <strong>ledentrend</strong> toont het totaal spelende leden over alle seizoenen.{" "}
              <strong>Instroom vs. uitstroom</strong> laat zien hoeveel leden erbij kwamen en
              hoeveel er vertrokken.
            </p>
          </section>
          <section>
            <h4 className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Navigatie
            </h4>
            <p>
              Klik op de KPI-kaarten om naar de detailpagina te gaan, of bekijk de{" "}
              <Link href="/signalering" className="text-ow-oranje hover:underline">
                signaleringen
              </Link>{" "}
              voor het volledige overzicht.
            </p>
          </section>
        </div>
      </InfoPageHeader>

      <Suspense fallback={<KpiCardsSkeleton />}>
        <DashboardKpis seizoen={seizoen} />
      </Suspense>

      <Suspense fallback={<ChartsSkeleton />}>
        <DashboardCharts />
      </Suspense>

      <Suspense fallback={<AlertCardsSkeleton />}>
        <DashboardSignaleringen seizoen={seizoen} />
      </Suspense>
    </div>
  );
}
