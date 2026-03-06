import {
  getBlauwdruk,
  getSpelersUitgebreid,
  getLedenStatistieken,
  getPinsVoorBlauwdruk,
} from "./actions";
import type { CategorieKaders } from "./categorie-kaders";
import BlauwdrukTabs from "@/components/blauwdruk/BlauwdrukTabs";
import { getActiefSeizoen } from "@/lib/seizoen";
import { getNotities, getNotitieStats } from "@/app/notities/actions";

export const dynamic = "force-dynamic";

export default async function BlauwdrukPage() {
  const seizoen = await getActiefSeizoen();
  const blauwdruk = await getBlauwdruk(seizoen);

  const [spelers, statistieken, notities, notitieStats, pins] = await Promise.all([
    getSpelersUitgebreid(),
    getLedenStatistieken(),
    getNotities(blauwdruk.id),
    getNotitieStats(blauwdruk.id),
    getPinsVoorBlauwdruk(blauwdruk.id),
  ]);

  const blockers = notities.filter(
    (n) => n.prioriteit === "BLOCKER" && n.status !== "OPGELOST" && n.status !== "GEARCHIVEERD"
  );

  const kaders = (blauwdruk.kaders ?? {}) as CategorieKaders;

  async function refreshNotities() {
    "use server";
    const [nieuweNotities, nieuweStats] = await Promise.all([
      getNotities(blauwdruk.id),
      getNotitieStats(blauwdruk.id),
    ]);
    return { notities: nieuweNotities, stats: nieuweStats };
  }

  return (
    <div className="max-w-5xl space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Blauwdruk</h2>
        <p className="mt-1 text-sm text-gray-500">
          Strategische kaders en speerpunten voor seizoen {seizoen}
        </p>
      </div>

      <BlauwdrukTabs
        statistieken={statistieken}
        kaders={kaders}
        blauwdrukId={blauwdruk.id}
        spelers={spelers}
        toelichting={blauwdruk.toelichting ?? ""}
        blockers={blockers}
        notities={notities}
        notitieStats={notitieStats}
        refreshNotities={refreshNotities}
        pins={pins}
      />
    </div>
  );
}
