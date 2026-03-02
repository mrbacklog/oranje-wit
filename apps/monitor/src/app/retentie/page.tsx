import { Suspense } from "react";
import { InfoPageHeader } from "@/components/info/InfoPageHeader";
import { ChartsSkeleton, HeatmapSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { RetentieContent } from "./retentie-content";

export default async function RetentiePage({
  searchParams,
}: {
  searchParams: Promise<{ seizoen?: string }>;
}) {
  const _params = await searchParams;

  return (
    <>
      <InfoPageHeader
        title="Retentie"
        subtitle="Hoe goed houden we onze leden vast?"
        infoTitle="Over Retentie"
      >
        <div className="space-y-4">
          <section>
            <h4 className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Wat zie je?
            </h4>
            <p>
              Drie perspectieven op ledenbehoud: retentie (wie blijft), instroom (wie komt erbij) en
              uitstroom (wie stopt). Alle data is uitgesplitst naar jongens en meisjes.
            </p>
          </section>
          <section>
            <h4 className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Tabs
            </h4>
            <p>
              <strong>Retentie</strong> toont het percentage dat terugkeert per leeftijd, de
              dropout-heatmap en kritieke overgangsmomenten.
            </p>
            <p className="mt-1">
              <strong>Instroom</strong> en <strong>Uitstroom</strong> tonen aantallen per leeftijd
              en per seizoen, steeds apart voor jongens en meisjes.
            </p>
          </section>
          <section>
            <h4 className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
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
    </>
  );
}
