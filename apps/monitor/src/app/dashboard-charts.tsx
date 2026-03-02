import { getLedenTrend, getInstroomUitstroom } from "@/lib/queries/dashboard";
import { LedenTrend } from "@/components/charts/leden-trend";
import { InstroomUitstroom } from "@/components/charts/instroom-uitstroom";

export async function DashboardCharts() {
  const [ledenTrend, instroomUitstroom] = await Promise.all([
    getLedenTrend(),
    getInstroomUitstroom(),
  ]);

  const ledenTrendData = ledenTrend.map((s) => ({
    seizoen: s.seizoen.slice(2, 4) + "/" + s.seizoen.slice(7, 9),
    seizoenVol: s.seizoen,
    totaal: s.totaal,
  }));

  const instroomUitstroomData = instroomUitstroom.map((s) => ({
    seizoen: s.seizoen.slice(2, 4) + "/" + s.seizoen.slice(7, 9),
    seizoenVol: s.seizoen,
    instroom: s.instroom,
    uitstroom: s.uitstroom,
  }));

  return (
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
  );
}
