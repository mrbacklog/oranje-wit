export const dynamic = "force-dynamic";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageHeader } from "@oranje-wit/ui";
import { getCohortOverzicht } from "@/lib/queries/samenstelling";
import { getCohortDetail } from "@/lib/queries/cohorten";
import { getSeizoen } from "@/lib/utils/seizoen";
import { formatNaam } from "@/lib/utils/format";
import { CohortDetailTabel } from "@/components/charts/cohort-detail-tabel";
import { SeizoenKiezer } from "@/components/layout/seizoen-kiezer";
import { DetailTabs } from "./detail-tabs";

export default async function CohortOverzichtPage({
  params,
  searchParams,
}: {
  params: Promise<{ geboortejaar: string }>;
  searchParams: Promise<{ seizoen?: string; tab?: string }>;
}) {
  const { geboortejaar: gjStr } = await params;
  const sp = await searchParams;
  const seizoen = getSeizoen(sp);
  const geboortejaar = parseInt(gjStr);
  if (isNaN(geboortejaar)) notFound();

  const [overzicht, cohortDetail] = await Promise.all([
    getCohortOverzicht(geboortejaar, seizoen),
    getCohortDetail(geboortejaar),
  ]);

  if (overzicht.stats.totaalOoit === 0 && cohortDetail.leden.length === 0) notFound();

  const { stats } = overzicht;

  return (
    <>
      <div className="mb-6">
        <Link
          href={`/samenstelling?seizoen=${seizoen}`}
          className="hover:text-ow-oranje text-sm text-gray-500"
        >
          &larr; Terug naar samenstelling
        </Link>
      </div>

      <PageHeader
        title={`Geboortejaar ${geboortejaar}`}
        subtitle={`${overzicht.actief.length} actief, ${overzicht.gestopt.length} gestopt — ${stats.pctActief}% retentie`}
        actions={
          <Suspense>
            <SeizoenKiezer />
          </Suspense>
        }
      />

      <Suspense>
        <DetailTabs
          defaultTab={sp.tab}
          actiefGestoptContent={
            <>
              {/* KPI strip */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-green-50 px-4 py-3">
                  <p className="text-xs text-gray-500">
                    <span className="text-blue-500">♂</span> actief
                  </p>
                  <p className="text-lg font-bold text-green-700">
                    {stats.actiefM}{" "}
                    <span className="text-sm font-normal text-green-600">
                      ({stats.pctActiefM}%)
                    </span>
                  </p>
                </div>
                <div className="rounded-lg bg-green-50 px-4 py-3">
                  <p className="text-xs text-gray-500">
                    <span className="text-pink-500">♀</span> actief
                  </p>
                  <p className="text-lg font-bold text-green-700">
                    {stats.actiefV}{" "}
                    <span className="text-sm font-normal text-green-600">
                      ({stats.pctActiefV}%)
                    </span>
                  </p>
                </div>
                <div className="rounded-lg bg-red-50 px-4 py-3">
                  <p className="text-xs text-gray-500">
                    <span className="text-blue-500">♂</span> gestopt
                  </p>
                  <p className="text-lg font-bold text-red-700">{stats.gestoptM}</p>
                </div>
                <div className="rounded-lg bg-red-50 px-4 py-3">
                  <p className="text-xs text-gray-500">
                    <span className="text-pink-500">♀</span> gestopt
                  </p>
                  <p className="text-lg font-bold text-red-700">{stats.gestoptV}</p>
                </div>
              </div>

              {/* Twee secties */}
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {/* Actieve leden */}
                <div className="rounded-xl bg-white p-5 shadow-sm">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-green-700 uppercase">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
                    Actief ({overzicht.actief.length})
                  </h3>
                  {overzicht.actief.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {overzicht.actief.map((lid) => (
                        <li key={lid.relCode} className="flex items-center justify-between py-1.5">
                          <div>
                            <Link
                              href={`/spelers/${lid.relCode}`}
                              className="hover:text-ow-oranje text-sm font-medium text-gray-900 hover:underline"
                            >
                              {formatNaam(lid)}
                            </Link>
                            <span
                              className={`ml-1.5 ${lid.geslacht === "M" ? "text-blue-500" : "text-pink-500"}`}
                            >
                              {lid.geslacht === "M" ? "♂" : "♀"}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">{lid.laatsteTeam}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400">Geen actieve leden</p>
                  )}
                </div>

                {/* Gestopte leden */}
                <div className="rounded-xl bg-white p-5 shadow-sm">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-red-700 uppercase">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
                    Gestopt ({overzicht.gestopt.length})
                  </h3>
                  {overzicht.gestopt.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {overzicht.gestopt.map((lid) => (
                        <li key={lid.relCode} className="flex items-center justify-between py-1.5">
                          <div>
                            <Link
                              href={`/spelers/${lid.relCode}`}
                              className="hover:text-ow-oranje text-sm font-medium text-gray-900 hover:underline"
                            >
                              {formatNaam(lid)}
                            </Link>
                            <span
                              className={`ml-1.5 ${lid.geslacht === "M" ? "text-blue-500" : "text-pink-500"}`}
                            >
                              {lid.geslacht === "M" ? "♂" : "♀"}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {lid.laatsteTeam}{" "}
                            <span className="text-gray-300">
                              ({lid.laatsteSeizoen.slice(2, 4)}/{lid.laatsteSeizoen.slice(7, 9)})
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400">Geen gestopte leden</p>
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
    </>
  );
}
