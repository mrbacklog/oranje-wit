import { Suspense } from "react";
import Link from "next/link";
import { KpiCard } from "@oranje-wit/ui";
import { InfoPageHeader } from "@/components/info/InfoPageHeader";
import { SeizoenKiezer } from "@/components/layout/seizoen-kiezer";
import { getSignaleringen } from "@/lib/queries/signalering";
import { getSeizoen } from "@/lib/utils/seizoen";
import { SignaleringCard } from "@/components/signalering/SignaleringCard";
import type { SignaleringRow } from "@/lib/queries/signalering";

function buildStrategischOverzicht(signaleringen: SignaleringRow[]) {
  const actief = signaleringen.filter((s) => s.ernst === "kritiek" || s.ernst === "aandacht");
  if (actief.length === 0) return null;

  const werving = actief.filter((s) => s.type === "instroom" || s.type === "pijplijn_vulgraad");
  const retentie = actief.filter((s) => s.type === "retentie" || s.type === "trendbreuk");
  const pijplijn = actief.filter(
    (s) => s.type === "forward_projectie" || s.type === "genderdisbalans"
  );

  const themas: { titel: string; signalen: SignaleringRow[]; link: string }[] = [];
  if (werving.length > 0)
    themas.push({ titel: "Werving", signalen: werving, link: "/retentie?tab=instroom" });
  if (retentie.length > 0)
    themas.push({ titel: "Retentie", signalen: retentie, link: "/retentie" });
  if (pijplijn.length > 0)
    themas.push({ titel: "Pijplijn", signalen: pijplijn, link: "/projecties" });

  return themas;
}

export default async function SignaleringPage({
  searchParams,
}: {
  searchParams: Promise<{ seizoen?: string }>;
}) {
  const params = await searchParams;
  const seizoen = getSeizoen(params);

  const signaleringen = await getSignaleringen(seizoen);

  const kritiek = signaleringen.filter((s) => s.ernst === "kritiek").length;
  const aandacht = signaleringen.filter((s) => s.ernst === "aandacht").length;
  const opKoers = signaleringen.length - kritiek - aandacht;

  const ernstVolgorde: Record<string, number> = {
    kritiek: 0,
    aandacht: 1,
    opkoers: 2,
  };
  const gesorteerd = [...signaleringen].sort(
    (a, b) => (ernstVolgorde[a.ernst] ?? 3) - (ernstVolgorde[b.ernst] ?? 3)
  );

  const themas = buildStrategischOverzicht(signaleringen);

  return (
    <>
      <InfoPageHeader
        title="Signalering"
        subtitle="Waar moeten we op letten? Acties en aandachtspunten."
        infoTitle="Over Signalering"
        actions={
          <Suspense>
            <SeizoenKiezer />
          </Suspense>
        }
      >
        <div className="space-y-4">
          <section>
            <h4 className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Wat zie je?
            </h4>
            <p>Automatische signaleringen en gerichte adviezen voor het geselecteerde seizoen.</p>
          </section>
          <section>
            <h4 className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Signaaltypen
            </h4>
            <p>
              <strong>Retentie/Instroom:</strong> behoud en werving van leden.{" "}
              <strong>Pijplijn:</strong> vulgraad van U-categorieën. <strong>Projectie:</strong>{" "}
              vooruitblik 1-3 seizoenen. <strong>Gender/Trend:</strong> balans en trendbreuken.
            </p>
          </section>
        </div>
      </InfoPageHeader>

      {/* KPI cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Kritiek" value={kritiek} signal="rood" />
        <KpiCard label="Aandacht" value={aandacht} signal="geel" />
        <KpiCard label="Op koers" value={opKoers} signal="groen" />
      </div>

      {/* Strategisch overzicht */}
      {themas && themas.length > 0 && (
        <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold tracking-wide text-gray-700 uppercase">
            Strategisch advies
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {themas.map((thema) => {
              const heeftKritiek = thema.signalen.some((s) => s.ernst === "kritiek");
              const topAdvies = thema.signalen.find((s) => s.advies)?.advies;
              return (
                <div
                  key={thema.titel}
                  className={`rounded-lg border p-4 ${
                    heeftKritiek ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900">{thema.titel}</h4>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        heeftKritiek ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {thema.signalen.length} signaal{thema.signalen.length !== 1 ? "en" : ""}
                    </span>
                  </div>
                  {topAdvies && <p className="mb-2 text-xs text-gray-600">{topAdvies}</p>}
                  <Link
                    href={thema.link}
                    className="text-ow-oranje hover:text-ow-oranje/80 text-xs font-medium"
                  >
                    Bekijk details →
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Alert list */}
      {gesorteerd.length === 0 ? (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-gray-500">Geen signaleringen voor seizoen {seizoen}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {gesorteerd.map((s) => (
            <SignaleringCard key={s.id} signalering={s} />
          ))}
        </div>
      )}
    </>
  );
}
