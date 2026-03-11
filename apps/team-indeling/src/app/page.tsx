import { getMijlpalen, getScenarioOverzicht } from "@/app/dashboard/actions";
import { MijlpalenTimeline } from "@/components/dashboard/MijlpalenTimeline";
import { ScenarioStatus } from "@/components/dashboard/ScenarioStatus";
import { getActiefSeizoen } from "@/lib/seizoen";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const seizoen = await getActiefSeizoen();
  const [mijlpalen, scenarios] = await Promise.all([getMijlpalen(), getScenarioOverzicht()]);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900">Dashboard &mdash; {seizoen}</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Links: Mijlpalen + Actiepunten */}
        <div className="space-y-6">
          <MijlpalenTimeline mijlpalen={mijlpalen} />
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-400">
            Actiepunten &mdash; beschikbaar na Werkbord-implementatie
          </div>
        </div>

        {/* Rechts: Werkbord KPI&apos;s + Scenario status */}
        <div className="space-y-6">
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-400">
            Werkbord KPI&apos;s &mdash; beschikbaar na Werkbord-implementatie
          </div>
          <ScenarioStatus scenarios={scenarios} />
        </div>
      </div>
    </div>
  );
}
