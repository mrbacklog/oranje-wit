import { getWerkitems, getWerkitemStats } from "@/app/(teamindeling)/teamindeling/werkbord/actions";
import WerkbordOverzicht from "@/components/teamindeling/werkbord/WerkbordOverzicht";
import { prisma } from "@/lib/teamindeling/db/prisma";

export const dynamic = "force-dynamic";

async function getWerkBlauwdruk() {
  return prisma.blauwdruk.findFirst({
    where: { isWerkseizoen: true },
    select: { id: true, seizoen: true },
  });
}

async function refreshWerkbord(blauwdrukId: string) {
  "use server";
  const [werkitems, stats] = await Promise.all([
    getWerkitems(blauwdrukId),
    getWerkitemStats(blauwdrukId),
  ]);
  return { werkitems, stats };
}

export default async function WerkbordPage() {
  const blauwdruk = await getWerkBlauwdruk();

  if (!blauwdruk) {
    return (
      <div>
        <h1 className="mb-4 text-xl font-bold text-gray-900">Werkbord</h1>
        <p className="text-sm text-gray-500">
          Maak eerst een blauwdruk aan om het werkbord te gebruiken.
        </p>
      </div>
    );
  }

  const [werkitems, stats] = await Promise.all([
    getWerkitems(blauwdruk.id),
    getWerkitemStats(blauwdruk.id),
  ]);

  const boundRefresh = refreshWerkbord.bind(null, blauwdruk.id);

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-900">Werkbord</h1>
      <WerkbordOverzicht
        blauwdrukId={blauwdruk.id}
        initialWerkitems={werkitems}
        initialStats={stats}
        refreshAction={boundRefresh}
      />
    </div>
  );
}
