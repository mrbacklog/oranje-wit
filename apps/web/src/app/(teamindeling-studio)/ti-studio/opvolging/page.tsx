import {
  getWerkitems,
  getWerkitemStats,
} from "@/app/(teamindeling-studio)/ti-studio/werkbord/actions";
import WerkbordOverzicht from "@/components/teamindeling/werkbord/WerkbordOverzicht";
import { prisma } from "@/lib/teamindeling/db/prisma";

export const dynamic = "force-dynamic";

async function getWerkBlauwdruk() {
  return prisma.blauwdruk.findFirst({
    where: { isWerkseizoen: true },
    select: { id: true, seizoen: true },
  });
}

export default async function OpvolgingPage() {
  const blauwdruk = await getWerkBlauwdruk();

  if (!blauwdruk) {
    return (
      <div className="max-w-4xl space-y-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Opvolging
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Maak eerst een blauwdruk aan om opvolging te gebruiken.
          </p>
        </div>
      </div>
    );
  }

  const [werkitems, stats] = await Promise.all([
    getWerkitems(blauwdruk.id),
    getWerkitemStats(blauwdruk.id),
  ]);

  async function refreshOpvolging() {
    "use server";
    const [nieuweWerkitems, nieuweStats] = await Promise.all([
      getWerkitems(blauwdruk!.id),
      getWerkitemStats(blauwdruk!.id),
    ]);
    return { werkitems: nieuweWerkitems, stats: nieuweStats };
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Opvolging
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Acties en besluiten voor seizoen {blauwdruk.seizoen}
        </p>
      </div>
      <WerkbordOverzicht
        blauwdrukId={blauwdruk.id}
        initialWerkitems={werkitems}
        initialStats={stats}
        refreshAction={refreshOpvolging}
      />
    </div>
  );
}
