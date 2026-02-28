import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@oranje-wit/ui";
import {
  getSeizoenVerloop,
  type SeizoenVerloopLid,
} from "@/lib/queries/verloop";

const STATUS_ICON: Record<string, string> = {
  nieuw: "★",
  herinschrijver: "↩",
  uitgestroomd: "✕",
};

const STATUS_KLEUR: Record<string, string> = {
  nieuw: "text-blue-600",
  herinschrijver: "text-purple-600",
  uitgestroomd: "text-red-600",
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
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
        {titel}{" "}
        <span className={`ml-1 ${kleur}`}>({leden.length})</span>
      </h3>

      {leden.length === 0 ? (
        <p className="text-sm text-gray-400">Geen data voor dit seizoen</p>
      ) : (
        <div className="space-y-4">
          {[...groepen.entries()].map(([jaar, groep]) => (
            <div key={String(jaar)}>
              <div className="mb-1.5 flex items-center gap-2 border-b border-gray-100 pb-1">
                <span className="text-xs font-semibold text-gray-500">
                  {jaar === "onbekend" ? "Onbekend" : jaar}
                </span>
                <span className="text-xs text-gray-400">
                  ({groep.length})
                </span>
              </div>
              <div className="space-y-0.5">
                {groep.map((lid) => {
                  const naam = [
                    lid.roepnaam,
                    lid.tussenvoegsel,
                    lid.achternaam,
                  ]
                    .filter(Boolean)
                    .join(" ");
                  const team = lid[teamVeld];

                  return (
                    <div
                      key={lid.relCode}
                      className="flex items-center gap-2 rounded px-2 py-0.5 text-sm hover:bg-gray-50"
                    >
                      <span
                        className={`w-4 text-center ${STATUS_KLEUR[lid.status] || "text-gray-400"}`}
                        title={lid.status}
                      >
                        {STATUS_ICON[lid.status] || "·"}
                      </span>
                      <Link
                        href={`/spelers/${lid.relCode}`}
                        className="text-gray-900 hover:text-ow-oranje hover:underline"
                      >
                        {naam}
                      </Link>
                      <span
                        className={`${lid.geslacht === "M" ? "text-blue-500" : "text-pink-500"}`}
                      >
                        {lid.geslacht === "M" ? "♂" : "♀"}
                      </span>
                      {team && (
                        <span className="ml-auto text-xs text-gray-400">
                          {team}
                        </span>
                      )}
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
    data.totaalVorig > 0
      ? Math.round((data.behouden / data.totaalVorig) * 100)
      : null;

  return (
    <>
      <div className="mb-6">
        <Link href="/" className="text-sm text-gray-500 hover:text-ow-oranje">
          &larr; Terug naar dashboard
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
          kleur="text-green-600"
        />
        <VerloopLijst
          titel="Uitstroom"
          leden={data.uitstroom}
          teamVeld="teamVorig"
          kleur="text-red-600"
        />
      </div>
    </>
  );
}
