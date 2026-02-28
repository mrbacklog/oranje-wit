import Link from "next/link";
import { notFound } from "next/navigation";
import { getSpelerDetail } from "@/lib/queries/spelers";
import { getSeizoen } from "@/lib/utils/seizoen";

const STATUS_KLEUREN: Record<string, string> = {
  behouden: "bg-green-100 text-green-800",
  nieuw: "bg-blue-100 text-blue-800",
  herinschrijver: "bg-purple-100 text-purple-800",
  uitgestroomd: "bg-red-100 text-red-800",
  niet_spelend_geworden: "bg-yellow-100 text-yellow-800",
};

export default async function SpelerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ relCode: string }>;
  searchParams: Promise<{ seizoen?: string }>;
}) {
  const { relCode } = await params;
  const sp = await searchParams;
  const seizoen = getSeizoen(sp);
  const qs = sp.seizoen ? `?seizoen=${sp.seizoen}` : "";

  const speler = await getSpelerDetail(relCode);
  if (!speler) notFound();

  const volledigeNaam = [speler.roepnaam, speler.tussenvoegsel, speler.achternaam]
    .filter(Boolean)
    .join(" ");

  const leeftijd = speler.geboortejaar ? new Date().getFullYear() - speler.geboortejaar : null;

  return (
    <>
      <div className="mb-6">
        <Link href={`/spelers${qs}`} className="hover:text-ow-oranje text-sm text-gray-500">
          &larr; Terug naar overzicht
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8 flex items-start gap-6">
        {speler.heeftFoto ? (
          <img
            src={`/api/foto/${speler.relCode}`}
            alt={volledigeNaam}
            className="h-24 w-24 rounded-full object-cover shadow-sm"
          />
        ) : (
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 text-2xl font-bold text-gray-400">
            {speler.roepnaam[0]}
            {speler.achternaam[0]}
          </span>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{volledigeNaam}</h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
            {leeftijd && (
              <span>
                {leeftijd} jaar ({speler.geboortejaar})
              </span>
            )}
            <span className={speler.geslacht === "M" ? "text-blue-500" : "text-pink-500"}>
              {speler.geslacht === "M" ? "\u2642 Man" : "\u2640 Vrouw"}
            </span>
            {speler.lidSinds && (
              <span>
                Lid sinds{" "}
                {new Date(speler.lidSinds).toLocaleDateString("nl-NL", {
                  year: "numeric",
                  month: "long",
                })}
              </span>
            )}
            {speler.afmelddatum && (
              <span className="text-red-600">
                Afgemeld{" "}
                {new Date(speler.afmelddatum).toLocaleDateString("nl-NL", {
                  year: "numeric",
                  month: "long",
                })}
              </span>
            )}
            <span>{speler.seizoenen.length} seizoenen actief</span>
          </div>
        </div>
      </div>

      {/* Seizoensoverzicht (team + verloop gebundeld) */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Seizoensoverzicht</h2>
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium tracking-wide text-gray-500 uppercase">
                <th className="px-4 py-3">Seizoen</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {speler.seizoenen.map((s) => {
                const comp = (c: string) => s.competities.find((x) => x.competitie === c)?.team;
                const zaal = comp("zaal") || comp("zaal_deel1") || comp("zaal_deel2");
                // Prioriteit: zaal > veld_voorjaar > veld_najaar > seizoensteam
                const team = zaal || comp("veld_voorjaar") || comp("veld_najaar") || s.team;
                const isHuidig = s.seizoen === seizoen;
                const verloop = speler.verloop.find((v) => v.seizoen === s.seizoen);

                return (
                  <tr
                    key={s.seizoen}
                    className={`border-b border-gray-50 ${isHuidig ? "bg-ow-oranje-bg" : ""}`}
                  >
                    <td className="px-4 py-2.5 font-medium text-gray-900">{s.seizoen}</td>
                    <td className="text-ow-oranje px-4 py-2.5 font-semibold">{team}</td>
                    <td className="px-4 py-2.5">
                      {verloop ? (
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_KLEUREN[verloop.status] || "bg-gray-100 text-gray-800"}`}
                        >
                          {verloop.status.replace(/_/g, " ")}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {speler.seizoenen.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-gray-400">Geen historie beschikbaar</p>
          )}
        </div>
      </div>
    </>
  );
}
