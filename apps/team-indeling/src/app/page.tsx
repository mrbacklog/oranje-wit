import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold">
            c.k.v. Oranje Wit — Team-Indeling
          </h1>
          <p className="text-orange-100 mt-1">
            Van blauwdruk via concepten naar definitieve teamindeling
          </p>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Seizoenskiezer */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Seizoen 2026-2027
          </h2>
        </section>

        {/* Procesflow */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <ProcessCard
            nummer="1"
            titel="Blauwdruk"
            beschrijving="Kaders, speerpunten en gepinde feiten"
            href="/blauwdruk"
            kleur="blue"
            actief
          />
          <ProcessCard
            nummer="2"
            titel="Concepten"
            beschrijving="Strategische richtingen met uitgangsprincipes"
            href="/concepten"
            kleur="purple"
          />
          <ProcessCard
            nummer="3"
            titel="Scenario's"
            beschrijving="Concrete teamindelingen uitwerken"
            href="/scenarios"
            kleur="amber"
          />
          <ProcessCard
            nummer="4"
            titel="Definitief"
            beschrijving="Gekozen indeling en communicatie"
            href="/definitief"
            kleur="green"
          />
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard titel="Spelers" waarde="—" sub="Nog geen data geladen" />
          <StatCard titel="Concepten" waarde="0" sub="Geen concepten" />
          <StatCard titel="Scenario's" waarde="0" sub="Geen scenario's" />
        </div>
      </main>
    </div>
  );
}

function ProcessCard({
  nummer,
  titel,
  beschrijving,
  href,
  kleur,
  actief,
}: {
  nummer: string;
  titel: string;
  beschrijving: string;
  href: string;
  kleur: string;
  actief?: boolean;
}) {
  const kleuren: Record<string, string> = {
    blue: "border-blue-500 bg-blue-50",
    purple: "border-purple-500 bg-purple-50",
    amber: "border-amber-500 bg-amber-50",
    green: "border-green-500 bg-green-50",
  };

  const nummerKleuren: Record<string, string> = {
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    amber: "bg-amber-500",
    green: "bg-green-500",
  };

  return (
    <Link
      href={href}
      className={`block border-2 rounded-lg p-4 hover:shadow-md transition-shadow ${
        actief ? kleuren[kleur] : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <span
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${nummerKleuren[kleur]}`}
        >
          {nummer}
        </span>
        <h3 className="font-semibold text-gray-900">{titel}</h3>
      </div>
      <p className="text-sm text-gray-600">{beschrijving}</p>
    </Link>
  );
}

function StatCard({
  titel,
  waarde,
  sub,
}: {
  titel: string;
  waarde: string;
  sub: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-sm text-gray-500">{titel}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{waarde}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}
