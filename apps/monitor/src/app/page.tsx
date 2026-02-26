import { PageHeader, KpiCard, SignalBadge } from "@oranje-wit/ui";
import { getDashboardKPIs } from "@/lib/queries/dashboard";
import { getSignaleringen, type SignaleringRow } from "@/lib/queries/signalering";
import { getCohorten } from "@/lib/queries/cohorten";
import { getSeizoen } from "@/lib/utils/seizoen";
import { LedenTrend } from "@/components/charts/leden-trend";
import { InstroomUitstroom } from "@/components/charts/instroom-uitstroom";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ seizoen?: string }>;
}) {
  const params = await searchParams;
  const seizoen = getSeizoen(params);

  const [kpis, signaleringen, cohorten] = await Promise.all([
    getDashboardKPIs(seizoen),
    getSignaleringen(seizoen),
    getCohorten(),
  ]);

  // Leden trend: totaal per seizoen
  const ledenTrendData = cohorten.totalen.per_seizoen.map((s) => ({
    seizoen: s.seizoen.slice(2, 4) + "/" + s.seizoen.slice(7, 9),
    totaal: s.totaal_nieuw,
  }));

  // Instroom/uitstroom per seizoen
  const instroomUitstroomData = cohorten.totalen.per_seizoen.map((s) => ({
    seizoen: s.seizoen.slice(2, 4) + "/" + s.seizoen.slice(7, 9),
    instroom: s.nieuw + s.herinschrijver,
    uitstroom: s.uitgestroomd,
  }));

  // Top 3 signaleringen (kritiek eerst)
  const topSignaleringen = signaleringen.slice(0, 3);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Seizoen ${seizoen} — c.k.v. Oranje Wit`}
      />

      {/* KPI cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Actieve leden" value={kpis.totaal_leden} />
        <KpiCard label="Spelende leden" value={kpis.totaal_spelers} />
        <KpiCard label="Teams" value={kpis.totaal_teams} />
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
      </div>

      {/* Charts */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Ledenaantal per seizoen
          </h3>
          <LedenTrend data={ledenTrendData} />
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Instroom vs. Uitstroom
          </h3>
          <InstroomUitstroom data={instroomUitstroomData} />
        </div>
      </div>

      {/* Top signaleringen */}
      {topSignaleringen.length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">
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

function SignaleringCard({ signalering }: { signalering: SignaleringRow }) {
  const ernst = signalering.ernst as "kritiek" | "aandacht" | "opkoers";
  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
      <SignalBadge ernst={ernst}>{ernst}</SignalBadge>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">{signalering.type}</p>
        {signalering.beschrijving && (
          <p className="mt-0.5 text-sm text-gray-500">
            {signalering.beschrijving}
          </p>
        )}
        <div className="mt-1 flex gap-3 text-xs text-gray-400">
          {signalering.leeftijdsgroep && (
            <span>Groep: {signalering.leeftijdsgroep}</span>
          )}
          {signalering.geslacht && (
            <span>{signalering.geslacht === "M" ? "Jongens" : "Meisjes"}</span>
          )}
          {signalering.waarde !== null && (
            <span>Waarde: {signalering.waarde}</span>
          )}
        </div>
      </div>
    </div>
  );
}
