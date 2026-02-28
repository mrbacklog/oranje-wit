import { KpiCard } from "@oranje-wit/ui";
import { InfoPageHeader } from "@/components/info/InfoPageHeader";
import { getDashboardKPIs, getLedenTrend, getInstroomUitstroom } from "@/lib/queries/dashboard";
import { getSignaleringen } from "@/lib/queries/signalering";
import { getSeizoen } from "@/lib/utils/seizoen";
import { LedenTrend } from "@/components/charts/leden-trend";
import { InstroomUitstroom } from "@/components/charts/instroom-uitstroom";
import { SignaleringCard } from "@/components/signalering/SignaleringCard";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ seizoen?: string }>;
}) {
  const params = await searchParams;
  const seizoen = getSeizoen(params);

  const [kpis, signaleringen, ledenTrend, instroomUitstroom] = await Promise.all([
    getDashboardKPIs(seizoen),
    getSignaleringen(seizoen),
    getLedenTrend(),
    getInstroomUitstroom(),
  ]);

  // Leden trend: uit speler_seizoenen
  const ledenTrendData = ledenTrend.map((s) => ({
    seizoen: s.seizoen.slice(2, 4) + "/" + s.seizoen.slice(7, 9),
    seizoenVol: s.seizoen,
    totaal: s.totaal,
  }));

  // Instroom/uitstroom: rel_codes vergelijken tussen seizoenen
  const instroomUitstroomData = instroomUitstroom.map((s) => ({
    seizoen: s.seizoen.slice(2, 4) + "/" + s.seizoen.slice(7, 9),
    seizoenVol: s.seizoen,
    instroom: s.instroom,
    uitstroom: s.uitstroom,
  }));

  // Top 3 signaleringen (kritiek eerst)
  const topSignaleringen = signaleringen.slice(0, 3);

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
              Tip
            </h4>
            <p>
              Klik op &quot;Signalering&quot; in het menu voor het volledige overzicht van alle
              signaleringen.
            </p>
          </section>
        </div>
      </InfoPageHeader>

      {/* KPI cards */}
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

      {/* Charts */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold tracking-wide text-gray-700 uppercase">
            Spelende leden per seizoen
          </h3>
          <LedenTrend data={ledenTrendData} />
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold tracking-wide text-gray-700 uppercase">
            Instroom vs. Uitstroom
          </h3>
          <InstroomUitstroom data={instroomUitstroomData} />
        </div>
      </div>

      {/* Top signaleringen */}
      {topSignaleringen.length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold tracking-wide text-gray-700 uppercase">
            Signaleringen
          </h3>
          <div className="space-y-3">
            {topSignaleringen.map((s) => (
              <SignaleringCard key={s.id} signalering={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
