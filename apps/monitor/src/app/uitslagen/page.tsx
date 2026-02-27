import Link from "next/link";
import { PageHeader } from "@oranje-wit/ui";
import { getOWTeamsMetUitslagen } from "@/lib/queries/uitslagen";
import { getSeizoen } from "@/lib/utils/seizoen";

export default async function UitslagenPage({
  searchParams,
}: {
  searchParams: Promise<{ seizoen?: string }>;
}) {
  const sp = await searchParams;
  const seizoen = getSeizoen(sp);
  const teams = await getOWTeamsMetUitslagen(seizoen);
  const qs = `?seizoen=${seizoen}`;

  // Groepeer op basis van teamcode-prefix
  const categorieen = [
    { label: "Senioren", filter: (c: string) => /^\d+$/.test(c) },
    { label: "A-jeugd", filter: (c: string) => c.startsWith("A") },
    { label: "B-jeugd", filter: (c: string) => c.startsWith("B") },
    { label: "C-jeugd", filter: (c: string) => c.startsWith("C") },
    { label: "D-jeugd", filter: (c: string) => c.startsWith("D") },
    { label: "E-jeugd", filter: (c: string) => c.startsWith("E") },
    { label: "F-jeugd", filter: (c: string) => c.startsWith("F") },
    {
      label: "Overig",
      filter: (c: string) => !/^[A-F\d]/.test(c),
    },
  ];

  return (
    <>
      <PageHeader
        title="Uitslagen"
        subtitle={`Poule-standen per team in seizoen ${seizoen}`}
      />

      {teams.length === 0 ? (
        <p className="text-gray-500">
          Geen uitslagen gevonden voor seizoen {seizoen}.
        </p>
      ) : (
        <>
          <div className="mb-8 rounded-xl bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Teams met uitslagen
            </p>
            <p className="mt-1 text-3xl font-bold text-ow-oranje">
              {teams.length}
            </p>
          </div>

          {categorieen.map(({ label, filter }) => {
            const catTeams = teams.filter((t) => filter(t.teamCode));
            if (catTeams.length === 0) return null;
            return (
              <div key={label} className="mb-8">
                <h3 className="mb-3 text-lg font-semibold text-gray-800">
                  {label}
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {catTeams.map((team) => {
                    // Tel periodes en bereken beste positie
                    const periodes = new Set(
                      team.poules.map((p) => p.periode)
                    );
                    const owPosities = team.poules.flatMap((p) =>
                      p.regels
                        .filter((r) => r.isOW)
                        .map((r) => r.positie)
                    );
                    const bestePositie = Math.min(...owPosities);

                    return (
                      <Link
                        key={team.teamCode}
                        href={`/uitslagen/${encodeURIComponent(team.teamCode)}${qs}`}
                        className="group rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md hover:ring-2 hover:ring-ow-oranje/30"
                      >
                        <h4 className="text-base font-bold text-gray-900 group-hover:text-ow-oranje">
                          {team.teamCode}
                        </h4>
                        <p className="mt-1 text-xs text-gray-500">
                          {team.poules.length}{" "}
                          {team.poules.length === 1 ? "poule" : "poules"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {[...periodes]
                            .map((p) =>
                              p === "veld_najaar"
                                ? "VN"
                                : p === "zaal"
                                  ? "Z"
                                  : "VV"
                            )
                            .join(" · ")}
                        </p>
                        {bestePositie <= 2 && (
                          <span className="mt-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            #{bestePositie}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}
    </>
  );
}
