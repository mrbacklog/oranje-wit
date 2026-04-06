export const dynamic = "force-dynamic";

import { getWerkitems, getWerkitemStats } from "./actions";
import { prisma } from "@/lib/teamindeling/db/prisma";
import WerkbordOverzicht from "@/components/teamindeling/werkbord/WerkbordOverzicht";

async function getWerkBlauwdruk() {
  return prisma.blauwdruk.findFirst({
    where: { isWerkseizoen: true },
    select: { id: true, seizoen: true },
  });
}

export default async function WerkbordPage() {
  const blauwdruk = await getWerkBlauwdruk();

  if (!blauwdruk) {
    return (
      <div className="max-w-4xl space-y-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Werkbord
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Maak eerst een blauwdruk aan om het werkbord te gebruiken.
          </p>
        </div>
      </div>
    );
  }

  const [werkitems, stats] = await Promise.all([
    getWerkitems(blauwdruk.id),
    getWerkitemStats(blauwdruk.id),
  ]);

  async function refreshWerkbord() {
    "use server";
    const [nieuweWerkitems, nieuweStats] = await Promise.all([
      getWerkitems(blauwdruk!.id),
      getWerkitemStats(blauwdruk!.id),
    ]);
    return { werkitems: nieuweWerkitems, stats: nieuweStats };
  }

  return (
    <div className="max-w-6xl">
      <WerkbordOverzicht
        blauwdrukId={blauwdruk.id}
        initialWerkitems={werkitems}
        initialStats={stats}
        refreshAction={refreshWerkbord}
      />
    </div>
  );
}
