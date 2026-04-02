import {
  getMijlpalen,
  getScenarioOverzicht,
} from "@/app/(teamindeling-studio)/ti-studio/dashboard/actions";
import {
  getWerkitemStats,
  getWerkitems,
} from "@/app/(teamindeling-studio)/ti-studio/werkbord/actions";
import { MijlpalenTimeline } from "@/components/teamindeling/dashboard/MijlpalenTimeline";
import { ScenarioStatus } from "@/components/teamindeling/dashboard/ScenarioStatus";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";
import { prisma } from "@/lib/teamindeling/db/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const seizoen = await getActiefSeizoen();
  const blauwdruk = await prisma.blauwdruk.findFirst({
    where: { isWerkseizoen: true },
    select: { id: true },
  });

  const [mijlpalen, scenarios, werkitemStats, topBlockers] = await Promise.all([
    getMijlpalen(),
    getScenarioOverzicht(),
    blauwdruk ? getWerkitemStats(blauwdruk.id) : Promise.resolve(null),
    blauwdruk
      ? getWerkitems(blauwdruk.id, {
          prioriteit: ["BLOCKER"],
          status: ["OPEN", "IN_BESPREKING"],
        })
      : Promise.resolve([]),
  ]);

  return (
    <div>
      <h1 style={{ color: "var(--text-primary)" }} className="mb-6 text-xl font-bold">
        Dashboard &mdash; {seizoen}
      </h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Links: Mijlpalen + Actiepunten */}
        <div className="space-y-6">
          <MijlpalenTimeline mijlpalen={mijlpalen} />

          {/* Top-3 open BLOCKERs */}
          <div
            className="rounded-xl border p-5"
            style={{
              borderColor: "var(--border-default)",
              backgroundColor: "var(--surface-card)",
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 style={{ color: "var(--text-primary)" }} className="text-sm font-semibold">
                Open blockers
              </h2>
              <Link
                href="/ti-studio/opvolging"
                className="text-xs"
                style={{ color: "var(--color-oranje)" }}
              >
                Alle opvolging
              </Link>
            </div>
            {topBlockers.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                Geen open blockers.
              </p>
            ) : (
              <ul className="space-y-2">
                {topBlockers.slice(0, 3).map((item) => (
                  <li
                    key={item.id}
                    className="rounded-lg border-l-2 py-2 pr-2 pl-3"
                    style={{
                      borderLeftColor: "var(--color-rood)",
                      backgroundColor: "var(--surface-subtle)",
                    }}
                  >
                    <p
                      className="text-sm leading-snug font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {item.titel}
                    </p>
                    {item.beschrijving && (
                      <p
                        className="mt-0.5 line-clamp-1 text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {item.beschrijving}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Rechts: Werkbord KPI&apos;s + Scenario status */}
        <div className="space-y-6">
          {/* Werkbord KPIs */}
          <div
            className="rounded-xl border p-5"
            style={{
              borderColor: "var(--border-default)",
              backgroundColor: "var(--surface-card)",
            }}
          >
            <h2 style={{ color: "var(--text-primary)" }} className="mb-4 text-sm font-semibold">
              Werkbord
            </h2>
            {werkitemStats ? (
              <div className="grid grid-cols-3 gap-3">
                <div className="stat-card">
                  <div className="stat-value">{werkitemStats.open}</div>
                  <div className="stat-label">Open</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: "var(--color-rood)" }}>
                    {werkitemStats.blockers}
                  </div>
                  <div className="stat-label">Blockers</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: "var(--color-groen)" }}>
                    {werkitemStats.afgerond}
                  </div>
                  <div className="stat-label">Afgerond</div>
                </div>
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                Geen werkseizoen actief.
              </p>
            )}
            <div className="mt-3 text-right">
              <Link
                href="/ti-studio/werkbord"
                className="text-xs"
                style={{ color: "var(--color-oranje)" }}
              >
                Naar werkbord
              </Link>
            </div>
          </div>

          <ScenarioStatus scenarios={scenarios} />
        </div>
      </div>
    </div>
  );
}
