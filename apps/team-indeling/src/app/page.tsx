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
      <h2 className="mb-6 text-xl font-bold text-gray-900">Overzicht seizoen 2026-2027</h2>

      {/* Status kaarten */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatusKaart
          titel="Laatste import"
          waarde={
            laatsteImport ? new Date(laatsteImport.createdAt).toLocaleDateString("nl-NL") : "Geen"
          }
          sub={laatsteImport ? `Seizoen ${laatsteImport.seizoen}` : "Nog geen data geimporteerd"}
        />
        <StatusKaart
          titel="Blauwdruk"
          waarde={blauwdruk ? "Aanwezig" : "Ontbreekt"}
          sub={blauwdruk ? `Seizoen ${blauwdruk.seizoen}` : "Nog geen blauwdruk aangemaakt"}
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
      <h3 className="mb-4 text-lg font-semibold text-gray-700">Processtappen</h3>
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

function StatusKaart({ titel, waarde, sub }: { titel: string; waarde: string; sub: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{titel}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{waarde}</p>
      <p className="mt-1 text-xs text-gray-400">{sub}</p>
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
      className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm"
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white ${kleur}`}
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
