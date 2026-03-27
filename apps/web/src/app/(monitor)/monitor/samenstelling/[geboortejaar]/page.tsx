export const dynamic = "force-dynamic";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageContainer, PageHeader } from "@oranje-wit/ui";
import { getCohortOverzicht } from "@/lib/monitor/queries/samenstelling";
import { getCohortDetail } from "@/lib/monitor/queries/cohorten";
import { HUIDIG_SEIZOEN } from "@/lib/monitor/utils/seizoen";
import { formatNaam } from "@/lib/monitor/utils/format";
import { CohortDetailTabel } from "@/components/monitor/charts/cohort-detail-tabel";
import { DetailTabs } from "./detail-tabs";

export default async function CohortOverzichtPage({
  params,
  searchParams,
}: {
  params: Promise<{ geboortejaar: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { geboortejaar: gjStr } = await params;
  const sp = await searchParams;
  const seizoen = HUIDIG_SEIZOEN;
  const geboortejaar = parseInt(gjStr);
  if (isNaN(geboortejaar)) notFound();

  const [overzicht, cohortDetail] = await Promise.all([
    getCohortOverzicht(geboortejaar, seizoen),
    getCohortDetail(geboortejaar),
  ]);

  if (overzicht.stats.totaalOoit === 0 && cohortDetail.leden.length === 0) notFound();

  const { stats } = overzicht;

  return (
    <PageContainer animated>
      <div className="mb-6">
        <Link
          href="/monitor/samenstelling"
          className="hover:text-ow-oranje text-text-muted text-sm"
        >
          &larr; Terug naar samenstelling
        </Link>
      </div>

      <PageHeader
        title={`Geboortejaar ${geboortejaar}`}
        subtitle={`${overzicht.actief.length} actief, ${overzicht.gestopt.length} gestopt — ${stats.pctActief}% retentie`}
      />

      <Suspense>
        <DetailTabs
          defaultTab={sp.tab}
          actiefGestoptContent={
            <>
              {/* KPI strip */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div
                  className="rounded-lg px-4 py-3"
                  style={{ backgroundColor: "var(--color-success-50)" }}
                >
                  <p className="text-text-muted text-xs">
                    <span style={{ color: "var(--color-info-500)" }}>♂</span> actief
                  </p>
                  <p className="text-signal-groen text-lg font-bold">
                    {stats.actiefM}{" "}
                    <span className="text-signal-groen text-sm font-normal">
                      ({stats.pctActiefM}%)
                    </span>
                  </p>
                </div>
                <div
                  className="rounded-lg px-4 py-3"
                  style={{ backgroundColor: "var(--color-success-50)" }}
                >
                  <p className="text-text-muted text-xs">
                    <span style={{ color: "var(--knkv-rood-400)" }}>♀</span> actief
                  </p>
                  <p className="text-signal-groen text-lg font-bold">
                    {stats.actiefV}{" "}
                    <span className="text-signal-groen text-sm font-normal">
                      ({stats.pctActiefV}%)
                    </span>
                  </p>
                </div>
                <div
                  className="rounded-lg px-4 py-3"
                  style={{ backgroundColor: "var(--color-error-50)" }}
                >
                  <p className="text-text-muted text-xs">
                    <span style={{ color: "var(--color-info-500)" }}>♂</span> gestopt
                  </p>
                  <p className="text-signal-rood text-lg font-bold">{stats.gestoptM}</p>
                </div>
                <div
                  className="rounded-lg px-4 py-3"
                  style={{ backgroundColor: "var(--color-error-50)" }}
                >
                  <p className="text-text-muted text-xs">
                    <span style={{ color: "var(--knkv-rood-400)" }}>♀</span> gestopt
                  </p>
                  <p className="text-signal-rood text-lg font-bold">{stats.gestoptV}</p>
                </div>
              </div>

              {/* Twee secties */}
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {/* Actieve leden */}
                <div className="bg-surface-card rounded-xl p-5 shadow-sm">
                  <h3 className="text-signal-groen mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
                    <span className="bg-signal-groen inline-block h-2.5 w-2.5 rounded-full" />
                    Actief ({overzicht.actief.length})
                  </h3>
                  {overzicht.actief.length > 0 ? (
                    <ul className="divide-border-light divide-y">
                      {overzicht.actief.map((lid) => (
                        <li key={lid.relCode} className="flex items-center justify-between py-1.5">
                          <div>
                            <Link
                              href={`/spelers/${lid.relCode}`}
                              className="hover:text-ow-oranje text-text-primary text-sm font-medium hover:underline"
                            >
                              {formatNaam(lid)}
                            </Link>
                            <span
                              style={{
                                color:
                                  lid.geslacht === "M"
                                    ? "var(--color-info-500)"
                                    : "var(--knkv-rood-400)",
                              }}
                              className="ml-1.5"
                            >
                              {lid.geslacht === "M" ? "♂" : "♀"}
                            </span>
                          </div>
                          <span className="text-text-muted text-xs">{lid.laatsteTeam}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-text-muted text-sm">Geen actieve leden</p>
                  )}
                </div>

                {/* Gestopte leden */}
                <div className="bg-surface-card rounded-xl p-5 shadow-sm">
                  <h3 className="text-signal-rood mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
                    <span className="bg-signal-rood inline-block h-2.5 w-2.5 rounded-full" />
                    Gestopt ({overzicht.gestopt.length})
                  </h3>
                  {overzicht.gestopt.length > 0 ? (
                    <ul className="divide-border-light divide-y">
                      {overzicht.gestopt.map((lid) => (
                        <li key={lid.relCode} className="flex items-center justify-between py-1.5">
                          <div>
                            <Link
                              href={`/spelers/${lid.relCode}`}
                              className="hover:text-ow-oranje text-text-primary text-sm font-medium hover:underline"
                            >
                              {formatNaam(lid)}
                            </Link>
                            <span
                              style={{
                                color:
                                  lid.geslacht === "M"
                                    ? "var(--color-info-500)"
                                    : "var(--knkv-rood-400)",
                              }}
                              className="ml-1.5"
                            >
                              {lid.geslacht === "M" ? "♂" : "♀"}
                            </span>
                          </div>
                          <span className="text-text-muted text-xs">
                            {lid.laatsteTeam}{" "}
                            <span className="text-border-default">
                              ({lid.laatsteSeizoen.slice(2, 4)}/{lid.laatsteSeizoen.slice(7, 9)})
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-text-muted text-sm">Geen gestopte leden</p>
                  )}
                </div>
              </div>
            </>
          }
          tijdlijnContent={
            <CohortDetailTabel
              leden={cohortDetail.leden}
              seizoenen={cohortDetail.seizoenen}
              samenvatting={cohortDetail.samenvatting}
            />
          }
        />
      </Suspense>
    </PageContainer>
  );
}
