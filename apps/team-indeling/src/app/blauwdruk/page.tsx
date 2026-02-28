import { getBlauwdruk, getSpelersUitgebreid, getLedenStatistieken } from "./actions";
import type { CategorieKaders } from "./categorie-kaders";
import BlauwdrukTabs from "@/components/blauwdruk/BlauwdrukTabs";

const SEIZOEN = "2026-2027";

export const dynamic = "force-dynamic";

export default async function BlauwdrukPage() {
  const [blauwdruk, spelers, statistieken] = await Promise.all([
    getBlauwdruk(SEIZOEN),
    getSpelersUitgebreid(),
    getLedenStatistieken(),
  ]);

  const kaders = (blauwdruk.kaders ?? {}) as CategorieKaders;

  return (
    <div className="max-w-5xl space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Blauwdruk</h2>
        <p className="mt-1 text-sm text-gray-500">
          Strategische kaders en speerpunten voor seizoen {SEIZOEN}
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
