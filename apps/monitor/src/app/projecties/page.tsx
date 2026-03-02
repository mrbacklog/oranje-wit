import { Suspense } from "react";
import { InfoPageHeader } from "@/components/info/InfoPageHeader";
import { SeizoenKiezer } from "@/components/layout/seizoen-kiezer";
import { getPijplijn, getProjectie, getVerwachteInstroom } from "@/lib/queries/samenstelling";
import { getSeizoen } from "@/lib/utils/seizoen";
import { berekenKnelpunten } from "@/lib/utils/pijplijn";
import { ProjectiePiramide } from "./projectie-piramide";
import { RetentieCurve } from "./retentie-curve";
import { Doelkaart } from "./doelkaart";
import { PijplijnTable } from "./pijplijn-table";
import { KnelpuntenGrid } from "./knelpunten-grid";
import { DoorstroomTable } from "./doorstroom-table";
import { U17ProjectionTable } from "./u17-projection-table";
import { SeniorenTable } from "./senioren-table";

export default async function JeugdpijplijnPage({
  searchParams,
}: {
  searchParams: Promise<{ seizoen?: string }>;
}) {
  const params = await searchParams;
  const seizoen = getSeizoen(params);

  const startJaar = parseInt(seizoen.split("-")[0]);
  const [pijplijn, projectie, verwachteInstroom] = await Promise.all([
    getPijplijn(seizoen),
    getProjectie(seizoen),
    getVerwachteInstroom(seizoen),
  ]);

  const doel = pijplijn.doelPerCategorie;
  const categorieen = [
    { label: "U15", leeftijden: "13-14", ...pijplijn.huidig.U15 },
    { label: "U17", leeftijden: "15-16", ...pijplijn.huidig.U17 },
    { label: "U19", leeftijden: "17-18", ...pijplijn.huidig.U19 },
  ] as const;

  // Piramide-data: huidig vs benodigd per leeftijd
  const piramideData = pijplijn.perLeeftijd.map((row) => ({
    leeftijd: row.leeftijd,
    band: row.band,
    huidige_m: row.huidig_m,
    huidige_v: row.huidig_v,
    streef_m: row.benodigd_m,
    streef_v: row.benodigd_v,
  }));

  const knelpunten = berekenKnelpunten(pijplijn.groeiFactoren);

  return (
    <>
      <InfoPageHeader
        title="Jeugdpijplijn"
        subtitle="Van instroom tot senioren — streef 12♂ + 13♀ per geboortejaar."
        infoTitle="Over Jeugdpijplijn"
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
            <p>
              De complete jeugdpijplijn van instroom (6 jaar) tot senioren (22 jaar). Streef is 12
              jongens + 13 meiden per geboortejaar. Jongere leeftijden (&lt;12) worden teruggerekend
              met groei-factoren op basis van de laatste 5 seizoenen.
            </p>
          </section>
          <section>
            <h4 className="mb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
              Kleuren
            </h4>
            <p>
              <span className="text-green-600">●</span> ≥90% op koers,{" "}
              <span className="text-yellow-500">●</span> 70-89% aandacht,{" "}
              <span className="text-red-500">●</span> &lt;70% tekort.
            </p>
          </section>
        </div>
      </InfoPageHeader>

      <Doelkaart categorieen={categorieen} doel={doel} />

      <PijplijnTable
        perLeeftijd={pijplijn.perLeeftijd}
        startJaar={startJaar}
        verwachteInstroom={verwachteInstroom}
      />

      {/* Sectie 3: Retentiecurve */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold tracking-wide text-gray-700 uppercase">
          Waar lekken we?
        </h3>
        <p className="mb-4 text-xs text-gray-500">
          Netto groei per leeftijdsovergang. Boven 100% = instroom &gt; uitstroom. Onder 100% =
          nettoverlies.
        </p>
        <RetentieCurve factoren={pijplijn.groeiFactoren} />
      </div>

      <KnelpuntenGrid knelpunten={knelpunten} />

      <DoorstroomTable />

      {/* Sectie 6: Piramide huidig vs benodigd */}
      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold tracking-wide text-gray-700 uppercase">
          Huidig vs. benodigd
        </h3>
        <p className="mb-4 text-xs text-gray-500">
          Huidig (solid) vs. benodigd (transparant) — per leeftijd en geslacht
        </p>
        {piramideData.length > 0 ? (
          <ProjectiePiramide data={piramideData} />
        ) : (
          <p className="text-sm text-gray-500">Geen data beschikbaar.</p>
        )}
      </div>

      <U17ProjectionTable u17={projectie.u17} />

      <SeniorenTable senioren={projectie.senioren} />
    </>
  );
}
