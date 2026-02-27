import Link from "next/link";
import { PageHeader } from "@oranje-wit/ui";
import { getOWTeamsMetUitslagen } from "@/lib/queries/uitslagen";
import { getStafPerTeam } from "@/lib/queries/staf";
import { getSeizoen } from "@/lib/utils/seizoen";
import { notFound } from "next/navigation";

const PERIODE_LABELS: Record<string, string> = {
  veld_najaar: "Veld najaar",
  zaal: "Zaal",
  veld_voorjaar: "Veld voorjaar",
};

const PERIODE_VOLGORDE = ["veld_najaar", "zaal", "veld_voorjaar"];

export default async function TeamUitslagenPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamCode: string }>;
  searchParams: Promise<{ seizoen?: string }>;
}) {
  const { teamCode: rawCode } = await params;
  const teamCode = decodeURIComponent(rawCode);
  const sp = await searchParams;
  const seizoen = getSeizoen(sp);

  const [alleTeams, stafPerTeam] = await Promise.all([
    getOWTeamsMetUitslagen(seizoen),
    getStafPerTeam(seizoen),
  ]);
  const team = alleTeams.find((t) => t.teamCode === teamCode);

  if (!team) notFound();

  const staf = stafPerTeam.get(teamCode);

  // Groepeer poules per periode
  const perPeriode = new Map<string, typeof team.poules>();
  for (const poule of team.poules) {
    if (!perPeriode.has(poule.periode)) perPeriode.set(poule.periode, []);
    perPeriode.get(poule.periode)!.push(poule);
  }

  const qs = `?seizoen=${seizoen}`;

  return (
    <>
      <div className="mb-2">
        <Link
          href={`/teamhistorie${qs}`}
          className="text-sm text-gray-500 hover:text-ow-oranje transition-colors"
        >
          &larr; Alle teams
        </Link>
      </div>

      <PageHeader
        title={`Oranje Wit ${teamCode}`}
        subtitle={`Uitslagen seizoen ${seizoen}`}
      />

      {/* Staf */}
      {staf && staf.length > 0 && (
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-gray-700">Staf</h3>
          <div className="space-y-1">
            {staf.map((s) => (
              <div
                key={s.stafCode}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-700">{s.naam}</span>
                <span className="text-gray-400">{s.rol}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {team.poules.length === 0 ? (
        <p className="text-gray-500">
          Geen poule-uitslagen gevonden voor dit team in seizoen {seizoen}.
        </p>
      ) : (
        PERIODE_VOLGORDE.filter((p) => perPeriode.has(p)).map((periode) => (
          <div key={periode} className="mb-8">
            <h3 className="mb-3 text-lg font-semibold text-gray-800">
              {PERIODE_LABELS[periode] || periode}
            </h3>
            <div className="space-y-4">
              {perPeriode.get(periode)!.map((poule) => (
                <div
                  key={`${poule.pool}-${poule.niveau}`}
                  className="overflow-hidden rounded-xl bg-white shadow-sm"
                >
                  <div className="border-b border-gray-100 px-5 py-3">
                    <span className="font-medium text-gray-700">
                      {poule.niveau || poule.pool}
                    </span>
                    {poule.niveau && (
                      <span className="ml-2 text-xs text-gray-400">
                        Poule {poule.pool}
                      </span>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 text-xs text-gray-500">
                          <th className="w-10 px-3 py-2 text-center font-medium">
                            #
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            Team
                          </th>
                          <th className="w-10 px-2 py-2 text-center font-medium">
                            GS
                          </th>
                          <th className="w-10 px-2 py-2 text-center font-medium">
                            W
                          </th>
                          <th className="w-10 px-2 py-2 text-center font-medium">
                            G
                          </th>
                          <th className="w-10 px-2 py-2 text-center font-medium">
                            V
                          </th>
                          <th className="w-10 px-2 py-2 text-center font-medium">
                            VR
                          </th>
                          <th className="w-10 px-2 py-2 text-center font-medium">
                            TG
                          </th>
                          <th className="w-12 px-2 py-2 text-center font-semibold">
                            Pt
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {poule.regels.map((r) => (
                          <tr
                            key={r.positie}
                            className={`border-t border-gray-50 ${
                              r.isOW
                                ? "bg-ow-oranje-bg font-semibold text-ow-oranje"
                                : "text-gray-700"
                            }`}
                          >
                            <td className="px-3 py-2 text-center">
                              {r.positie}
                            </td>
                            <td className="px-3 py-2">{r.teamNaam}</td>
                            <td className="px-2 py-2 text-center">
                              {r.gespeeld}
                            </td>
                            <td className="px-2 py-2 text-center">
                              {r.gewonnen}
                            </td>
                            <td className="px-2 py-2 text-center">
                              {r.gelijk}
                            </td>
                            <td className="px-2 py-2 text-center">
                              {r.verloren}
                            </td>
                            <td className="px-2 py-2 text-center">
                              {r.doelpuntenVoor}
                            </td>
                            <td className="px-2 py-2 text-center">
                              {r.doelpuntenTegen}
                            </td>
                            <td className="px-2 py-2 text-center font-bold">
                              {r.punten}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </>
  );
}
