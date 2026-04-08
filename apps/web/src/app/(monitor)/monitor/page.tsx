export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { PageContainer } from "@oranje-wit/ui";
import { InfoPageHeader } from "@/components/monitor/info/InfoPageHeader";
import { HUIDIG_SEIZOEN } from "@/lib/monitor/utils/seizoen";
import { KpiCardsSkeleton, ChartsSkeleton } from "@/components/monitor/ui/skeleton";
import { DashboardKpis } from "./dashboard-kpis";
import { DashboardCharts } from "./dashboard-charts";

export default async function DashboardPage() {
  const seizoen = HUIDIG_SEIZOEN;

  return (
    <PageContainer animated>
      <InfoPageHeader
        title="Dashboard"
        subtitle={`Seizoen ${seizoen} — c.k.v. Oranje Wit`}
        infoTitle="Over het Dashboard"
      >
        <div className="space-y-4">
          <section>
            <h4 className="text-text-muted mb-1 text-xs font-semibold tracking-wide uppercase">
              Wat zie je?
            </h4>
            <p>
              Overzicht van de belangrijkste cijfers: spelende leden, aantal teams, en ledentrend.
            </p>
          </section>
          <section>
            <h4 className="text-text-muted mb-1 text-xs font-semibold tracking-wide uppercase">
              Grafieken
            </h4>
            <p>
              De <strong>ledentrend</strong> toont het totaal spelende leden over alle seizoenen.{" "}
              <strong>Instroom vs. uitstroom</strong> laat zien hoeveel leden erbij kwamen en
              hoeveel er vertrokken.
            </p>
          </section>
          <section>
            <h4 className="text-text-muted mb-1 text-xs font-semibold tracking-wide uppercase">
              Navigatie
            </h4>
            <p>Klik op de KPI-kaarten om naar de detailpagina te gaan.</p>
          </section>
        </div>
      </InfoPageHeader>

      <Suspense fallback={<KpiCardsSkeleton />}>
        <DashboardKpis seizoen={seizoen} />
      </Suspense>

      <Suspense fallback={<ChartsSkeleton />}>
        <DashboardCharts />
      </Suspense>
    </PageContainer>
  );
}
