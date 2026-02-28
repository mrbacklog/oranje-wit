import { PageHeader, KpiCard, SignalBadge } from "@oranje-wit/ui";
import { getDashboardKPIs, getLedenTrend, getInstroomUitstroom } from "@/lib/queries/dashboard";
import { getSignaleringen, type SignaleringRow } from "@/lib/queries/signalering";
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
      <PageHeader title="Dashboard" subtitle={`Seizoen ${seizoen} — c.k.v. Oranje Wit`} />

      {/* KPI cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
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

function SignaleringCard({ signalering }: { signalering: SignaleringRow }) {
  const ernst = signalering.ernst as "kritiek" | "aandacht" | "opkoers";
  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
      <SignalBadge ernst={ernst}>{ernst}</SignalBadge>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">{signalering.type}</p>
        {signalering.beschrijving && (
          <p className="mt-0.5 text-sm text-gray-500">{signalering.beschrijving}</p>
        )}
        <div className="mt-1 flex gap-3 text-xs text-gray-400">
          {signalering.leeftijdsgroep && <span>Groep: {signalering.leeftijdsgroep}</span>}
          {signalering.geslacht && (
            <span>{signalering.geslacht === "M" ? "\u2642 Jongens" : "\u2640 Meisjes"}</span>
          )}
          {signalering.waarde !== null && <span>Waarde: {signalering.waarde}</span>}
        </div>
      </div>
    </div>
  );
}
