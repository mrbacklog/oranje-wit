import { getBlauwdruk } from "./actions";
import { prisma } from "@/lib/db/prisma";
import KadersEditor from "@/components/blauwdruk/KadersEditor";
import SpeerpuntenEditor from "@/components/blauwdruk/SpeerpuntenEditor";
import ToelichtingEditor from "@/components/blauwdruk/ToelichtingEditor";
import SpelerStatusOverzicht from "@/components/blauwdruk/SpelerStatusOverzicht";
import TwijfelpuntenEditor from "@/components/blauwdruk/TwijfelpuntenEditor";

const SEIZOEN = "2026-2027";

export const dynamic = "force-dynamic";

export default async function BlauwdrukPage() {
  const blauwdruk = await getBlauwdruk(SEIZOEN);

  const kaders = (blauwdruk.kaders ?? {}) as Record<string, unknown>;

  const spelers = await prisma.speler.findMany({
    select: {
      id: true,
      roepnaam: true,
      achternaam: true,
      geboortejaar: true,
      geslacht: true,
      status: true,
      huidig: true,
    },
    orderBy: [{ achternaam: "asc" }, { roepnaam: "asc" }],
  });

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Blauwdruk</h2>
        <p className="mt-1 text-sm text-gray-500">
          Strategische kaders en speerpunten voor seizoen {SEIZOEN}
        </p>
      </div>

      {/* Toelichting */}
      <section>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          Toelichting
        </h3>
        <ToelichtingEditor
          blauwdrukId={blauwdruk.id}
          initieel={blauwdruk.toelichting ?? ""}
        />
      </section>

      {/* Speerpunten */}
      <section>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          Speerpunten
        </h3>
        <SpeerpuntenEditor
          blauwdrukId={blauwdruk.id}
          initieel={blauwdruk.speerpunten}
        />
      </section>

      {/* Twijfelpunten */}
      <section>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          Twijfelpunten
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Vragen die nog open staan en in scenario&apos;s worden uitgespeeld.
        </p>
        <TwijfelpuntenEditor
          blauwdrukId={blauwdruk.id}
          initieel={
            (blauwdruk.twijfelpunten as { id: string; vraag: string; opties: string[] }[] | null) ?? []
          }
        />
      </section>

      {/* Kaders */}
      <section>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Kaders</h3>
        <p className="text-sm text-gray-500 mb-4">
          KNKV-regels en OW-voorkeuren uit de import. Deze zijn niet bewerkbaar.
        </p>
        <KadersEditor kaders={kaders} />
      </section>

      {/* Spelerstatus */}
      <section>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          Spelerstatus
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Geef per speler aan of ze beschikbaar zijn, twijfelen, gaan stoppen of
          nieuw zijn.
        </p>
        <SpelerStatusOverzicht
          spelers={spelers.map((s) => ({
            ...s,
            huidig: s.huidig as {
              team?: string | null;
              categorie?: string | null;
              kleur?: string | null;
            } | null,
          }))}
        />
      </section>
    </div>
  );
}
