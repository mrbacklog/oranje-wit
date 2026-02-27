import Link from "next/link";
import { PageHeader } from "@oranje-wit/ui";
import { getOWTeamsMetUitslagen } from "@/lib/queries/uitslagen";
import { getStafPerTeam, getStafSeizoenen } from "@/lib/queries/staf";
import { getSeizoen } from "@/lib/utils/seizoen";
import { sorteerTeamCode, categoriseerTeam } from "@/lib/utils/team-sort";

export default async function TeamhistoriePage({
  searchParams,
}: {
  searchParams: Promise<{ seizoen?: string }>;
}) {
  const sp = await searchParams;
  const seizoen = getSeizoen(sp);

  const [teams, stafPerTeam, seizoenen] = await Promise.all([
    getOWTeamsMetUitslagen(seizoen),
    getStafPerTeam(seizoen),
    getStafSeizoenen(),
  ]);

  const qs = `?seizoen=${seizoen}`;

  // Verzamel alle teams (uit uitslagen + staf) voor volledig overzicht
  const alleTeamCodes = new Set<string>();
  for (const t of teams) alleTeamCodes.add(t.teamCode);
  for (const code of stafPerTeam.keys()) alleTeamCodes.add(code);

  // Maak lookup voor uitslagen
  const uitslagenMap = new Map(teams.map((t) => [t.teamCode, t]));

  // Sorteer alle teams
  const gesorteerdeTeams = [...alleTeamCodes].sort(
    (a, b) => sorteerTeamCode(a) - sorteerTeamCode(b)
  );

  // Groepeer per categorie
  const CATEGORIEEN = [
    "Senioren",
    "Midweek",
    "A-jeugd",
    "B-jeugd",
    "C-jeugd",
    "D-jeugd",
    "E-jeugd",
    "F-jeugd",
    "Overig",
  ] as const;

  const perCategorie = new Map<string, string[]>();
  for (const code of gesorteerdeTeams) {
    const cat = categoriseerTeam(code);
    if (!perCategorie.has(cat)) perCategorie.set(cat, []);
    perCategorie.get(cat)!.push(code);
  }

  return (
    <>
      <PageHeader
        title="Teamhistorie"
        subtitle={`Overzicht teams, staf en resultaten — ${seizoen}`}
      />

      {/* Seizoen-navigatie */}
      {seizoenen.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {seizoenen.map((s) => (
            <Link
              key={s}
              href={`/teamhistorie?seizoen=${s}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                s === seizoen
                  ? "bg-ow-oranje text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s}
            </Link>
          ))}
        </div>
      )}

      {/* KPI's */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Teams
          </p>
          <p className="mt-1 text-3xl font-bold text-ow-oranje">
            {alleTeamCodes.size}
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Teams met uitslagen
          </p>
          <p className="mt-1 text-3xl font-bold text-ow-oranje">
            {teams.length}
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Teams met staf
          </p>
          <p className="mt-1 text-3xl font-bold text-ow-oranje">
            {stafPerTeam.size}
          </p>
        </div>
      </div>

      {/* Teams per categorie */}
      {alleTeamCodes.size === 0 ? (
        <p className="text-gray-500">
          Geen teams gevonden voor seizoen {seizoen}.
        </p>
      ) : (
        CATEGORIEEN.map((cat) => {
          const teamCodes = perCategorie.get(cat);
          if (!teamCodes || teamCodes.length === 0) return null;
          return (
            <div key={cat} className="mb-8">
              <h3 className="mb-3 text-lg font-semibold text-gray-800">
                {cat}
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teamCodes.map((code) => {
                  const uitslag = uitslagenMap.get(code);
                  const staf = stafPerTeam.get(code);

                  // Periodes uit uitslagen
                  const periodes = uitslag
                    ? [...new Set(uitslag.poules.map((p) => p.periode))]
                    : [];
                  const owPosities = uitslag
                    ? uitslag.poules.flatMap((p) =>
                        p.regels.filter((r) => r.isOW).map((r) => r.positie)
                      )
                    : [];
                  const bestePositie =
                    owPosities.length > 0 ? Math.min(...owPosities) : null;

                  return (
                    <div
                      key={code}
                      className="rounded-xl bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        {uitslag ? (
                          <Link
                            href={`/teamhistorie/${encodeURIComponent(code)}${qs}`}
                            className="text-base font-bold text-gray-900 hover:text-ow-oranje transition-colors"
                          >
                            {code}
                          </Link>
                        ) : (
                          <h4 className="text-base font-bold text-gray-900">
                            {code}
                          </h4>
                        )}
                        <div className="flex items-center gap-2">
                          {bestePositie !== null && bestePositie <= 2 && (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                              #{bestePositie}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Periodes */}
                      {periodes.length > 0 && (
                        <p className="mt-1 text-xs text-gray-400">
                          {uitslag!.poules.length}{" "}
                          {uitslag!.poules.length === 1 ? "poule" : "poules"}
                          {" · "}
                          {periodes
                            .map((p) =>
                              p === "veld_najaar"
                                ? "VN"
                                : p === "zaal"
                                  ? "Z"
                                  : "VV"
                            )
                            .join(" · ")}
                        </p>
                      )}

                      {/* Staf */}
                      {staf && staf.length > 0 && (
                        <div className="mt-3 border-t border-gray-100 pt-3">
                          <div className="space-y-0.5">
                            {staf.map((s) => (
                              <div
                                key={s.stafCode}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="text-gray-700">{s.naam}</span>
                                <span className="text-gray-400">{s.rol}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </>
  );
}
