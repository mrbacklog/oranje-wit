import { PageHeader, BandPill } from "@oranje-wit/ui";
import { getTeamsRegister } from "@/lib/queries/teams";
import { getStafPerTeam } from "@/lib/queries/staf";
import { getSeizoen } from "@/lib/utils/seizoen";

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ seizoen?: string }>;
}) {
  const params = await searchParams;
  const seizoen = getSeizoen(params);

  const [register, stafPerTeam] = await Promise.all([
    getTeamsRegister(seizoen),
    getStafPerTeam(seizoen),
  ]);

  // Groepeer register teams per categorie
  const perCategorie = new Map<string, typeof register.teams>();
  for (const team of register.teams) {
    const cat = team.categorie || "Overig";
    if (!perCategorie.has(cat)) perCategorie.set(cat, []);
    perCategorie.get(cat)!.push(team);
  }

  const categorieVolgorde = [
    "Kangoeroe",
    "F-jeugd",
    "E-jeugd",
    "D-jeugd",
    "C-jeugd",
    "B-jeugd",
    "A-jeugd",
    "Senioren",
  ];

  const gesorteerdeCategorieen = [...perCategorie.entries()].sort(
    ([a], [b]) => {
      const ia = categorieVolgorde.findIndex((c) =>
        a.toLowerCase().includes(c.toLowerCase())
      );
      const ib = categorieVolgorde.findIndex((c) =>
        b.toLowerCase().includes(c.toLowerCase())
      );
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    }
  );

  return (
    <>
      <PageHeader
        title="Teams"
        subtitle="Hoeveel teams, hoe samengesteld?"
      />

      {/* Overzicht */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Totaal teams
          </p>
          <p className="mt-1 text-3xl font-bold text-ow-oranje">
            {register.teams.length}
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Categorieen
          </p>
          <p className="mt-1 text-3xl font-bold text-ow-oranje">
            {perCategorie.size}
          </p>
        </div>
      </div>

      {/* Teams per categorie */}
      {gesorteerdeCategorieen.map(([categorie, teams]) => (
        <div key={categorie} className="mb-8">
          <h3 className="mb-3 text-lg font-semibold text-gray-800">
            {categorie}
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => {
              const heeftPeriodes = Object.values(team.periodes).some(
                (p) => p !== null
              );

              return (
                <div
                  key={team.ow_code}
                  className="rounded-xl bg-white p-5 shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-base font-bold text-gray-900">
                      {team.ow_code}
                    </h4>
                    {team.kleur && <BandPill band={team.kleur} />}
                  </div>

                  {team.spelvorm && (
                    <p className="mt-1 text-xs text-gray-400">
                      {team.spelvorm}
                      {team.leeftijdsgroep && ` | ${team.leeftijdsgroep}`}
                    </p>
                  )}

                  {/* Periodes */}
                  {heeftPeriodes && (
                    <div className="mt-3 border-t border-gray-100 pt-3">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-500">
                            <th className="py-1 text-left font-medium">
                              Periode
                            </th>
                            <th className="py-1 text-center font-medium">
                              J-nr
                            </th>
                            <th className="py-1 text-center font-medium">
                              Pool
                            </th>
                            <th className="py-1 text-right font-medium">
                              Sterkte
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(
                            [
                              ["veld_najaar", "Veld najaar"],
                              ["zaal_deel1", "Zaal 1"],
                              ["zaal_deel2", "Zaal 2"],
                              ["veld_voorjaar", "Veld voorjaar"],
                            ] as const
                          ).map(([key, label]) => {
                            const p = team.periodes[key];
                            if (!p) return null;
                            return (
                              <tr
                                key={key}
                                className="border-t border-gray-50"
                              >
                                <td className="py-1">{label}</td>
                                <td className="py-1 text-center">
                                  {p.j_nummer || "-"}
                                </td>
                                <td className="py-1 text-center">
                                  {p.pool || "-"}
                                </td>
                                <td className="py-1 text-right">
                                  {p.sterkte ?? "-"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Staf */}
                  {stafPerTeam.has(team.ow_code) && (
                    <div className="mt-3 border-t border-gray-100 pt-3">
                      <p className="mb-1 text-xs font-medium text-gray-500">
                        Staf
                      </p>
                      <div className="space-y-0.5">
                        {stafPerTeam.get(team.ow_code)!.map((s) => (
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
      ))}
    </>
  );
}
