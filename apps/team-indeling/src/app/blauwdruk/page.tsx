import Link from "next/link";

/**
 * Blauwdruk pagina — kaders, speerpunten, pins en spelerstatus.
 *
 * TODO: Koppelen aan database (Prisma) zodra Railway DB beschikbaar is.
 * Nu: statische structuur als basis voor verdere ontwikkeling.
 */
export default function BlauwdrukPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-blue-200 text-sm mb-1">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span>/</span>
            <span className="text-white">Blauwdruk</span>
          </div>
          <h1 className="text-xl font-bold">Blauwdruk 2026-2027</h1>
          <p className="text-blue-100 text-sm mt-1">
            Kaders, speerpunten en gepinde feiten voor het seizoen
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Toelichting */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Toelichting
            </h2>
            <button className="text-sm text-blue-600 hover:text-blue-800">
              Bewerken
            </button>
          </div>
          <div className="prose prose-sm text-gray-600 max-w-none">
            <p className="italic text-gray-400">
              Nog geen toelichting. Klik op &quot;Bewerken&quot; om de visie en context
              voor dit seizoen vast te leggen.
            </p>
          </div>
        </section>

        {/* Speerpunten */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Speerpunten
            </h2>
            <button className="text-sm text-blue-600 hover:text-blue-800">
              Toevoegen
            </button>
          </div>
          <p className="text-sm text-gray-400 italic">
            Nog geen speerpunten gedefinieerd.
          </p>
        </section>

        {/* Gepinde feiten */}
        <section className="bg-white rounded-lg border border-blue-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">
              <span className="mr-2">📌</span>Gepinde feiten
            </h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Gepinde feiten gelden voor alle concepten en scenario&apos;s.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Spelers */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Spelers
              </h3>
              <div className="space-y-1">
                <p className="text-sm text-gray-400 italic">
                  Nog geen gepinde spelers.
                </p>
              </div>
            </div>

            {/* Staf */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Staf
              </h3>
              <div className="space-y-1">
                <p className="text-sm text-gray-400 italic">
                  Nog geen gepinde staf.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Levende status */}
        <section className="bg-white rounded-lg border border-orange-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">
              <span className="mr-2">🔄</span>Levende status
            </h2>
            <button className="text-sm text-blue-600 hover:text-blue-800">
              Status bijwerken
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Niet-gepinde statussen die doorwerken in alle scenario&apos;s. Pin
            een status om het als feit vast te leggen.
          </p>

          <div className="space-y-2">
            {/* Voorbeeld statussen - worden dynamisch uit DB */}
            <StatusRij status="twijfelt" naam="—" toelichting="Nog geen twijfelaars geregistreerd" />
          </div>
        </section>

        {/* Kaders (collapsed by default) */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Kaders</h2>
          <p className="text-sm text-gray-500">
            KNKV-competitieregels en OW-voorkeuren zijn automatisch geladen.
            Zie{" "}
            <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">
              rules/
            </span>{" "}
            voor de volledige regelset.
          </p>
        </section>

        {/* Navigatie */}
        <div className="flex justify-between">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Terug naar overzicht
          </Link>
          <Link
            href="/concepten"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700"
          >
            Naar concepten →
          </Link>
        </div>
      </main>
    </div>
  );
}

function StatusRij({
  status,
  naam,
  toelichting,
}: {
  status: "beschikbaar" | "twijfelt" | "gaat_stoppen" | "nieuw";
  naam: string;
  toelichting?: string;
}) {
  const config = {
    beschikbaar: { icoon: "✓", kleur: "text-green-600", bg: "bg-green-50" },
    twijfelt: { icoon: "?", kleur: "text-orange-600", bg: "bg-orange-50" },
    gaat_stoppen: { icoon: "✕", kleur: "text-red-600", bg: "bg-red-50" },
    nieuw: { icoon: "+", kleur: "text-blue-600", bg: "bg-blue-50" },
  };

  const { icoon, kleur, bg } = config[status];

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded ${bg}`}>
      <span className={`font-bold ${kleur}`}>{icoon}</span>
      <span className="text-sm font-medium text-gray-900">{naam}</span>
      {toelichting && (
        <span className="text-sm text-gray-500">— {toelichting}</span>
      )}
      <button
        className="ml-auto text-xs text-gray-400 hover:text-blue-600"
        title="Pinnen naar blauwdruk"
      >
        📌
      </button>
    </div>
  );
}
