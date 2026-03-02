import { getBlauwdruk, getSpelersUitgebreid, getLedenStatistieken } from "./actions";
import type { CategorieKaders } from "./categorie-kaders";
import BlauwdrukTabs from "@/components/blauwdruk/BlauwdrukTabs";
import { getActiefSeizoen } from "@/lib/seizoen";

export const dynamic = "force-dynamic";

export default async function BlauwdrukPage() {
  const seizoen = await getActiefSeizoen();

  const [blauwdruk, spelers, statistieken] = await Promise.all([
    getBlauwdruk(seizoen),
    getSpelersUitgebreid(),
    getLedenStatistieken(),
  ]);

  const kaders = (blauwdruk.kaders ?? {}) as CategorieKaders;

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
      />
    </div>
  );
}
