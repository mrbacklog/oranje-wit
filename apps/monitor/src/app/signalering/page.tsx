import { KpiCard } from "@oranje-wit/ui";
import { InfoPageHeader } from "@/components/info/InfoPageHeader";
import { getSignaleringen, getSignaleringSamenvatting } from "@/lib/queries/signalering";
import { getSeizoen } from "@/lib/utils/seizoen";
import { SignaleringCard } from "@/components/signalering/SignaleringCard";

export default async function SignaleringPage({
  searchParams,
}: {
  searchParams: Promise<{ seizoen?: string }>;
}) {
  const params = await searchParams;
  const seizoen = getSeizoen(params);

  const [signaleringen, samenvatting] = await Promise.all([
    getSignaleringen(seizoen),
    getSignaleringSamenvatting(seizoen),
  ]);

  const opKoers = samenvatting.totaal - samenvatting.kritiek - samenvatting.aandacht;

  // Sorteer: kritiek eerst, dan aandacht, dan rest
  const ernstVolgorde: Record<string, number> = {
    kritiek: 0,
    aandacht: 1,
    opkoers: 2,
  };
  const gesorteerd = [...signaleringen].sort(
    (a, b) => (ernstVolgorde[a.ernst] ?? 3) - (ernstVolgorde[b.ernst] ?? 3)
  );

  return (
    <>
      <InfoPageHeader
        title="Signalering"
        subtitle="Waar moeten we op letten? Acties en aandachtspunten."
        infoTitle="Over Signalering"
      >
        <div className="space-y-4">
          <section>
            <h4 className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Wat zie je?
            </h4>
            <p>Alle automatische signaleringen voor het geselecteerde seizoen.</p>
          </section>
          <section>
            <h4 className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Ernst
            </h4>
            <p>
              <strong>Kritiek</strong> (rood) vraagt directe actie. <strong>Aandacht</strong> (geel)
              is een waarschuwing. <strong>Op koers</strong> (groen) bevestigt dat het goed gaat.
            </p>
          </section>
          <section>
            <h4 className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Per signalering
            </h4>
            <p>
              Je ziet de leeftijdsgroep, het geslacht, de huidige waarde en de drempel waarop
              gesignaleerd wordt.
            </p>
          </section>
        </div>
      </InfoPageHeader>

      {/* KPI cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Kritiek" value={samenvatting.kritiek} signal="rood" />
        <KpiCard label="Aandacht" value={samenvatting.aandacht} signal="geel" />
        <KpiCard label="Op koers" value={opKoers} signal="groen" />
      </div>

      {/* Alert list */}
      {gesorteerd.length === 0 ? (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-gray-500">Geen signaleringen voor seizoen {seizoen}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {gesorteerd.map((s) => (
            <SignaleringCard key={s.id} signalering={s} />
          ))}
        </div>
      )}
    </>
  );
}
