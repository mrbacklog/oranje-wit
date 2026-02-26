import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [laatsteImport, blauwdruk, aantalScenarios] = await Promise.all([
    prisma.import.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.blauwdruk.findFirst({ where: { seizoen: "2026-2027" } }),
    prisma.scenario.count(),
  ]);

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Overzicht seizoen 2026-2027
      </h2>

      {/* Status kaarten */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatusKaart
          titel="Laatste import"
          waarde={
            laatsteImport
              ? new Date(laatsteImport.createdAt).toLocaleDateString("nl-NL")
              : "Geen"
          }
          sub={
            laatsteImport
              ? `Seizoen ${laatsteImport.seizoen}`
              : "Nog geen data geimporteerd"
          }
        />
        <StatusKaart
          titel="Blauwdruk"
          waarde={blauwdruk ? "Aanwezig" : "Ontbreekt"}
          sub={
            blauwdruk
              ? `Seizoen ${blauwdruk.seizoen}`
              : "Nog geen blauwdruk aangemaakt"
          }
        />
        <StatusKaart
          titel="Scenario's"
          waarde={String(aantalScenarios)}
          sub={
            aantalScenarios === 0
              ? "Nog geen scenario's"
              : `${aantalScenarios} scenario${aantalScenarios === 1 ? "" : "'s"} aangemaakt`
          }
        />
      </div>

      {/* Processtappen */}
      <h3 className="text-lg font-semibold text-gray-700 mb-4">
        Processtappen
      </h3>
      <div className="space-y-3">
        <ProcesLink
          nummer="1"
          titel="Blauwdruk"
          beschrijving="Kaders, speerpunten en gepinde feiten"
          href="/blauwdruk"
          kleur="bg-blue-500"
        />
        <ProcesLink
          nummer="2"
          titel="Scenario's"
          beschrijving="Concrete teamindelingen uitwerken en vergelijken"
          href="/scenarios"
          kleur="bg-amber-500"
        />
        <ProcesLink
          nummer="3"
          titel="Definitief"
          beschrijving="Gekozen indeling en communicatie"
          href="/definitief"
          kleur="bg-green-500"
        />
      </div>
    </div>
  );
}

function StatusKaart({
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

function ProcesLink({
  nummer,
  titel,
  beschrijving,
  href,
  kleur,
}: {
  nummer: string;
  titel: string;
  beschrijving: string;
  href: string;
  kleur: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
    >
      <span
        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${kleur}`}
      >
        {nummer}
      </span>
      <div>
        <h4 className="font-semibold text-gray-900">{titel}</h4>
        <p className="text-sm text-gray-500">{beschrijving}</p>
      </div>
    </Link>
  );
}
