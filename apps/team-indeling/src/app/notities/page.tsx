import { getActiefSeizoen } from "@/lib/seizoen";
import { getBlauwdruk } from "@/app/blauwdruk/actions";
import { getNotities, getNotitieStats } from "./actions";
import NotitieOverzicht from "@/components/notities/NotitieOverzicht";

export default async function NotitiesPage() {
  const seizoen = await getActiefSeizoen();
  const blauwdruk = await getBlauwdruk(seizoen);
  const [notities, stats] = await Promise.all([
    getNotities(blauwdruk.id),
    getNotitieStats(blauwdruk.id),
  ]);

  async function refresh() {
    "use server";
    const [notities, stats] = await Promise.all([
      getNotities(blauwdruk.id),
      getNotitieStats(blauwdruk.id),
    ]);
    return { notities, stats };
  }

  return (
    <NotitieOverzicht
      blauwdrukId={blauwdruk.id}
      initialNotities={notities}
      initialStats={stats}
      refreshAction={refresh}
    />
  );
}
