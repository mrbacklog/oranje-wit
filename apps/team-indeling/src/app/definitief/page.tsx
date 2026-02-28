import { prisma } from "@/lib/db/prisma";
import { PEILJAAR } from "@oranje-wit/types";
import Link from "next/link";
import BesluitenLog from "@/components/definitief/BesluitenLog";
import ExportPanel from "@/components/definitief/ExportPanel";

export const dynamic = "force-dynamic";

const SEIZOEN = "2026-2027";

const CATEGORIE_LABELS: Record<string, string> = {
  B_CATEGORIE: "B-categorie",
  A_CATEGORIE: "A-categorie",
  SENIOREN: "Senioren",
};

const KLEUR_LABELS: Record<string, string> = {
  BLAUW: "Blauw",
  GROEN: "Groen",
  GEEL: "Geel",
  ORANJE: "Oranje",
  ROOD: "Rood",
};

const VALIDATIE_KLEUREN: Record<string, string> = {
  GROEN: "bg-green-100 text-green-700",
  ORANJE: "bg-orange-100 text-orange-700",
  ROOD: "bg-red-100 text-red-700",
  ONBEKEND: "bg-gray-100 text-gray-500",
};

export default async function DefinitiefPage() {
  const definitief = await prisma.scenario.findFirst({
    where: { status: "DEFINITIEF" },
    include: {
      concept: {
        include: {
          blauwdruk: true,
        },
      },
      versies: {
        include: {
          teams: {
            include: {
              spelers: {
                include: { speler: true },
              },
              staf: {
                include: { staf: true },
              },
            },
            orderBy: { volgorde: "asc" },
          },
          logItems: {
            include: {
              door: { select: { naam: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { nummer: "desc" },
        take: 1,
      },
    },
  });

  if (!definitief) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Definitieve indeling</h2>
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
          <p className="text-sm text-gray-500">Nog geen scenario definitief gemaakt.</p>
          <Link
            href="/scenarios"
            className="mt-3 text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            Ga naar scenario&apos;s &rarr;
          </Link>
        </div>
      </div>
    );
  }

  const laatsteVersie = definitief.versies[0];
  const teams = laatsteVersie?.teams ?? [];
  const logEntries = laatsteVersie?.logItems ?? [];

  // Groepeer teams per categorie
  const categorieGroepen = new Map<string, typeof teams>();
  for (const team of teams) {
    const cat = team.categorie;
    if (!categorieGroepen.has(cat)) {
      categorieGroepen.set(cat, []);
    }
    categorieGroepen.get(cat)!.push(team);
  }

  // Sorteer A-categorie teams op naam (U15-1 boven U15-2, etc.)
  const aTeams = categorieGroepen.get("A_CATEGORIE");
  if (aTeams) {
    aTeams.sort((a, b) => a.naam.localeCompare(b.naam, "nl"));
  }

  // Volgorde: B_CATEGORIE, A_CATEGORIE, SENIOREN
  const categorieVolgorde = ["B_CATEGORIE", "A_CATEGORIE", "SENIOREN"];
  const gesorteerdeCategorieen = [...categorieGroepen.entries()].sort(
    (a, b) => categorieVolgorde.indexOf(a[0]) - categorieVolgorde.indexOf(b[0])
  );

  const totaalSpelers = teams.reduce((sum, t) => sum + t.spelers.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Definitieve indeling</h2>
          <p className="mt-1 text-sm text-gray-500">
            Scenario: <span className="font-medium">{definitief.naam}</span> &mdash; {SEIZOEN}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Definitief
        </span>
      </div>

      {/* Samenvatting */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs tracking-wide text-gray-500 uppercase">Teams</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{teams.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs tracking-wide text-gray-500 uppercase">Spelers ingedeeld</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totaalSpelers}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs tracking-wide text-gray-500 uppercase">Versie</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{laatsteVersie?.nummer ?? "-"}</p>
        </div>
      </div>

      {/* Teams per categorie */}
      {gesorteerdeCategorieen.map(([categorie, catTeams]) => (
        <div key={categorie}>
          <h3 className="mb-3 text-sm font-semibold tracking-wide text-gray-700 uppercase">
            {CATEGORIE_LABELS[categorie] ?? categorie}
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {catTeams.map((team) => (
              <div
                key={team.id}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white print:break-inside-avoid"
              >
                {/* Team header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-gray-900">{team.naam}</h4>
                    {team.kleur && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                        {KLEUR_LABELS[team.kleur] ?? team.kleur}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{team.spelers.length} spelers</span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${
                        VALIDATIE_KLEUREN[team.validatieStatus] ?? VALIDATIE_KLEUREN.ONBEKEND
                      }`}
                    >
                      {team.validatieStatus === "GROEN"
                        ? "OK"
                        : team.validatieStatus === "ONBEKEND"
                          ? "?"
                          : team.validatieStatus}
                    </span>
                  </div>
                </div>

                {/* Spelers */}
                <ul className="divide-y divide-gray-50">
                  {team.spelers
                    .sort((a, b) => {
                      // Sorteer op achternaam
                      const nameCompare = a.speler.achternaam.localeCompare(
                        b.speler.achternaam,
                        "nl"
                      );
                      if (nameCompare !== 0) return nameCompare;
                      return a.speler.roepnaam.localeCompare(b.speler.roepnaam, "nl");
                    })
                    .map((ts) => (
                      <li
                        key={ts.id}
                        className="flex items-center justify-between px-4 py-1.5 text-sm"
                      >
                        <span className="text-gray-800">
                          {ts.speler.roepnaam} {ts.speler.achternaam}
                        </span>
                        <span className="text-xs text-gray-400">
                          {ts.speler.geboortejaar} ({PEILJAAR - ts.speler.geboortejaar}j) &middot;{" "}
                          {ts.speler.geslacht}
                        </span>
                      </li>
                    ))}
                  {team.spelers.length === 0 && (
                    <li className="px-4 py-3 text-sm text-gray-400">Geen spelers</li>
                  )}
                </ul>

                {/* Staf */}
                {team.staf.length > 0 && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-2">
                    <p className="text-xs text-gray-500">
                      Staf: {team.staf.map((s) => `${s.staf.naam} (${s.rol})`).join(", ")}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Besluitenlog */}
      <BesluitenLog entries={logEntries} />

      {/* Export */}
      <ExportPanel teams={teams} seizoen={SEIZOEN} />
    </div>
  );
}
