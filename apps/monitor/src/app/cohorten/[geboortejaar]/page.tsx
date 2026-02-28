import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@oranje-wit/ui";
import { getCohortDetail } from "@/lib/queries/cohorten";
import { CohortDetailTabel } from "@/components/charts/cohort-detail-tabel";

export default async function CohortDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ geboortejaar: string }>;
  searchParams: Promise<{ seizoen?: string }>;
}) {
  const { geboortejaar: geboortejaarStr } = await params;
  const sp = await searchParams;
  const qs = sp.seizoen ? `?seizoen=${sp.seizoen}` : "";

  const geboortejaar = parseInt(geboortejaarStr);
  if (isNaN(geboortejaar)) notFound();

  const data = await getCohortDetail(geboortejaar);
  if (data.leden.length === 0) notFound();

  const aantalJongens = data.leden.filter((l) => l.geslacht === "M").length;
  const aantalMeisjes = data.leden.filter((l) => l.geslacht === "V").length;

  return (
    <>
      <div className="mb-6">
        <Link
          href={`/cohorten${qs}`}
          className="text-sm text-gray-500 hover:text-ow-oranje"
        >
          &larr; Terug naar cohorten
        </Link>
      </div>

      <PageHeader
        title={`Cohort ${geboortejaar}`}
        subtitle={`${data.leden.length} leden (\u2642 ${aantalJongens} / \u2640 ${aantalMeisjes})`}
      />

      <div className="mt-6">
        <CohortDetailTabel
          leden={data.leden}
          seizoenen={data.seizoenen}
          samenvatting={data.samenvatting}
        />
      </div>
    </>
  );
}
