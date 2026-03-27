export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { PageContainer } from "@oranje-wit/ui";
import { InfoPageHeader } from "@/components/monitor/info/InfoPageHeader";
import { ChartsSkeleton, HeatmapSkeleton, TableSkeleton } from "@/components/monitor/ui/skeleton";
import { RetentieContent } from "./retentie-content";

export default async function RetentiePage() {
  return (
    <PageContainer animated>
      <InfoPageHeader
        title="Ledendynamiek"
        subtitle="Instroom, uitstroom en behoud van leden — alle bewegingen in beeld."
        infoTitle="Over Ledendynamiek"
      >
        <div className="space-y-4">
          <section>
            <h4 className="text-text-muted mb-1 text-xs font-semibold tracking-wide uppercase">
              Wat zie je?
            </h4>
            <p>
              Vier perspectieven op ledenbewegingen: behoud (wie blijft), instroom (wie komt erbij),
              uitstroom (wie stopt) en cohorten (hoe presteren jaargangen). Alle data is
              uitgesplitst naar jongens en meisjes.
            </p>
          </section>
          <section>
            <h4 className="text-text-muted mb-1 text-xs font-semibold tracking-wide uppercase">
              Tabs
            </h4>
            <p>
              <strong>Behoud</strong> toont het retentiepercentage per leeftijd, een waterfall van
              het ledenverloop en kritieke overgangsmomenten.
            </p>
            <p className="mt-1">
              <strong>Instroom</strong> en <strong>Uitstroom</strong> tonen aantallen per leeftijd
              en per seizoen, gesplitst in jeugd en senioren.
            </p>
            <p className="mt-1">
              <strong>Cohorten</strong> volgt instroom-jaargangen over de jaren met een
              retentiematrix en -curves.
            </p>
          </section>
          <section>
            <h4 className="text-text-muted mb-1 text-xs font-semibold tracking-wide uppercase">
              Doorklikken
            </h4>
            <p>Klik op een seizoen in de instroom- of uitstroomgrafiek voor een lijst met namen.</p>
          </section>
        </div>
      </InfoPageHeader>

      <Suspense
        fallback={
          <>
            <ChartsSkeleton />
            <HeatmapSkeleton />
            <TableSkeleton rows={5} />
          </>
        }
      >
        <RetentieContent />
      </Suspense>
    </PageContainer>
  );
}
