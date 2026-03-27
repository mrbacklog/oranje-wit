export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageContainer } from "@oranje-wit/ui";
import { getSpelerDetail } from "@/lib/queries/spelers";
import { getSeizoen } from "@/lib/utils/seizoen";

const STATUS_KLEUREN: Record<string, string> = {
  behouden: "text-signal-groen",
  nieuw: "text-ow-oranje",
  herinschrijver: "text-ow-oranje",
  uitgestroomd: "text-signal-rood",
  niet_spelend_geworden: "text-signal-geel",
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
    <PageContainer animated>
      <div className="mb-6">
        <Link href={`/spelers${qs}`} className="hover:text-ow-oranje text-text-muted text-sm">
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
          <span className="bg-surface-sunken text-text-muted flex h-24 w-24 items-center justify-center rounded-full text-2xl font-bold">
            {speler.roepnaam[0]}
            {speler.achternaam[0]}
          </span>
        )}
        <div>
          <h1 className="text-text-primary text-2xl font-bold">{volledigeNaam}</h1>
          <div className="text-text-secondary mt-2 flex flex-wrap gap-4 text-sm">
            {leeftijd && (
              <span>
                {leeftijd} jaar (
                <Link
                  href={`/samenstelling/${speler.geboortejaar}?seizoen=${seizoen}`}
                  className="text-ow-oranje hover:underline"
                >
                  {speler.geboortejaar}
                </Link>
                )
              </span>
            )}
            <span
              style={{
                color: speler.geslacht === "M" ? "var(--color-info-500)" : "var(--knkv-rood-400)",
              }}
            >
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
              <span className="text-signal-rood">
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
        <h2 className="text-text-primary mb-4 text-lg font-semibold">Seizoensoverzicht</h2>
        <div className="bg-surface-card overflow-x-auto rounded-xl shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border-light text-text-muted border-b text-left text-xs font-medium tracking-wide uppercase">
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
                    className={`border-border-light border-b ${isHuidig ? "bg-ow-oranje-bg" : ""}`}
                  >
                    <td className="text-text-primary px-4 py-2.5 font-medium">{s.seizoen}</td>
                    <td className="text-ow-oranje px-4 py-2.5 font-semibold">{team}</td>
                    <td className="px-4 py-2.5">
                      {verloop ? (
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_KLEUREN[verloop.status] || "bg-surface-sunken text-text-secondary"}`}
                        >
                          {verloop.status.replace(/_/g, " ")}
                        </span>
                      ) : (
                        <span className="text-text-muted">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {speler.seizoenen.length === 0 && (
            <p className="text-text-muted px-4 py-8 text-center text-sm">
              Geen historie beschikbaar
            </p>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
