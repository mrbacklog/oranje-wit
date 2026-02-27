import { getBlauwdruk, getSpelersUitgebreid, getLedenStatistieken, getTeamgrootteTargets } from "./actions";
import KadersOverzicht from "@/components/blauwdruk/KadersEditor";
import SpeerpuntenEditor from "@/components/blauwdruk/SpeerpuntenEditor";
import ToelichtingEditor from "@/components/blauwdruk/ToelichtingEditor";
import LedenDashboard from "@/components/blauwdruk/LedenDashboard";
import CategorieOverzicht from "@/components/blauwdruk/CategorieOverzicht";
import TeamgrootteInstellingen from "@/components/blauwdruk/TeamgrootteInstellingen";

const SEIZOEN = "2026-2027";

export const dynamic = "force-dynamic";

export default async function BlauwdrukPage() {
  const [blauwdruk, spelers, statistieken] = await Promise.all([
    getBlauwdruk(SEIZOEN),
    getSpelersUitgebreid(),
    getLedenStatistieken(),
  ]);

  const teamgrootte = getTeamgrootteTargets(blauwdruk);

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Blauwdruk</h2>
        <p className="mt-1 text-sm text-gray-500">
          Strategische kaders en speerpunten voor seizoen {SEIZOEN}
        </p>
      </div>

      {/* 1. Categorieoverzicht — hoeveel spelers per kleur/categorie */}
      <section>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          Categorieoverzicht
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Beschikbare spelers per leeftijdscategorie en mogelijke teamstructuur.
        </p>
        <CategorieOverzicht statistieken={statistieken} />
      </section>

      {/* 2. Teamgrootte-instellingen */}
      <section>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          Teamgrootte
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Min/ideaal/max spelers per teamtype. Deze targets worden gebruikt bij de validatie van scenario&apos;s.
        </p>
        <TeamgrootteInstellingen
          blauwdrukId={blauwdruk.id}
          initieel={teamgrootte}
        />
      </section>

      {/* 3. Speerpunten */}
      <section>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          Speerpunten
        </h3>
        <SpeerpuntenEditor
          blauwdrukId={blauwdruk.id}
          initieel={blauwdruk.speerpunten}
        />
      </section>

      {/* 4. Toelichting */}
      <section>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          Toelichting
        </h3>
        <ToelichtingEditor
          blauwdrukId={blauwdruk.id}
          initieel={blauwdruk.toelichting ?? ""}
        />
      </section>

      {/* 5. Leden — volledige tabel met rijke data */}
      <section>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          Leden
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Geef per speler aan of ze beschikbaar zijn, twijfelen, gaan stoppen of
          nieuw zijn. Klik op een kolomkop om te sorteren.
        </p>
        <LedenDashboard spelers={spelers} />
      </section>

      {/* 6. Kaders — KNKV Competitie 2.0 regels + OW-voorkeuren */}
      <section>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Kaders</h3>
        <p className="text-sm text-gray-500 mb-4">
          KNKV Competitie 2.0 regels en OW-voorkeuren per categorie.
        </p>
        <KadersOverzicht />
      </section>
    </div>
  );
}
