export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageContainer, PageHeader } from "@oranje-wit/ui";
import { getSeizoenVerloop, type SeizoenVerloopLid } from "@/lib/queries/verloop";

const STATUS_ICON: Record<string, string> = {
  nieuw: "★",
  herinschrijver: "↩",
  uitgestroomd: "✕",
};

const STATUS_KLEUR: Record<string, string> = {
  nieuw: "text-ow-oranje",
  herinschrijver: "text-knkv-paars",
  uitgestroomd: "text-signal-rood",
};

function groepeerOpGeboortejaar(leden: SeizoenVerloopLid[]) {
  const groepen = new Map<number | "onbekend", SeizoenVerloopLid[]>();
  for (const lid of leden) {
    const key = lid.geboortejaar ?? "onbekend";
    if (!groepen.has(key)) groepen.set(key, []);
    groepen.get(key)!.push(lid);
  }
  return groepen;
}

function VerloopLijst({
  titel,
  leden,
  teamVeld,
  kleur,
}: {
  titel: string;
  leden: SeizoenVerloopLid[];
  teamVeld: "teamNieuw" | "teamVorig";
  kleur: string;
}) {
  const groepen = groepeerOpGeboortejaar(leden);

  return (
    <div className="bg-surface-card rounded-xl p-5 shadow-sm">
      <h3 className="text-text-secondary mb-4 text-sm font-semibold tracking-wide uppercase">
        {titel} <span className={`ml-1 ${kleur}`}>({leden.length})</span>
      </h3>

      {leden.length === 0 ? (
        <p className="text-text-muted text-sm">Geen data voor dit seizoen</p>
      ) : (
        <div className="space-y-4">
          {[...groepen.entries()].map(([jaar, groep]) => (
            <div key={String(jaar)}>
              <div className="border-border-light mb-1.5 flex items-center gap-2 border-b pb-1">
                {jaar === "onbekend" ? (
                  <span className="text-text-muted text-xs font-semibold">Onbekend</span>
                ) : (
                  <Link
                    href={`/samenstelling/${jaar}`}
                    className="text-ow-oranje text-xs font-semibold hover:underline"
                  >
                    {jaar}
                  </Link>
                )}
                <span className="text-text-muted text-xs">({groep.length})</span>
              </div>
              <div className="space-y-0.5">
                {groep.map((lid) => {
                  const naam = [lid.roepnaam, lid.tussenvoegsel, lid.achternaam]
                    .filter(Boolean)
                    .join(" ");
                  const team = lid[teamVeld];

                  return (
                    <div
                      key={lid.relCode}
                      className="hover:bg-surface-sunken flex items-center gap-2 rounded px-2 py-0.5 text-sm"
                    >
                      <span
                        className={`w-4 text-center ${STATUS_KLEUR[lid.status] || "text-text-muted"}`}
                        title={lid.status}
                      >
                        {STATUS_ICON[lid.status] || "·"}
                      </span>
                      <Link
                        href={`/spelers/${lid.relCode}`}
                        className="hover:text-ow-oranje text-text-primary hover:underline"
                      >
                        {naam}
                      </Link>
                      <span
                        style={{
                          color:
                            lid.geslacht === "M" ? "var(--color-info-500)" : "var(--knkv-rood-400)",
                        }}
                      >
                        {lid.geslacht === "M" ? "♂" : "♀"}
                      </span>
                      {team && <span className="text-text-muted ml-auto text-xs">{team}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function SeizoenVerloopPage({
  params,
}: {
  params: Promise<{ seizoen: string }>;
}) {
  const { seizoen } = await params;

  if (!seizoen.match(/^\d{4}-\d{4}$/)) notFound();

  const data = await getSeizoenVerloop(seizoen);

  if (data.instroom.length === 0 && data.uitstroom.length === 0) notFound();

  const retentie =
    data.totaalVorig > 0 ? Math.round((data.behouden / data.totaalVorig) * 100) : null;

  return (
    <PageContainer animated>
      <div className="mb-6">
        <Link href="/retentie" className="hover:text-ow-oranje text-text-muted text-sm">
          &larr; Terug naar retentie
        </Link>
      </div>

      <PageHeader
        title={`Seizoen ${seizoen}`}
        subtitle={`${data.totaalNieuw} leden — ${data.instroom.length} instroom, ${data.uitstroom.length} uitstroom${retentie !== null ? ` — retentie ${retentie}%` : ""}`}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <VerloopLijst
          titel="Instroom"
          leden={data.instroom}
          teamVeld="teamNieuw"
          kleur="text-signal-groen"
        />
        <VerloopLijst
          titel="Uitstroom"
          leden={data.uitstroom}
          teamVeld="teamVorig"
          kleur="text-signal-rood"
        />
      </div>
    </PageContainer>
  );
}
