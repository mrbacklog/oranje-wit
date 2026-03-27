export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { PageContainer } from "@oranje-wit/ui";
import { InfoPageHeader } from "@/components/monitor/info/InfoPageHeader";
import {
  getPijplijn,
  getProjectie,
  getVerwachteInstroom,
} from "@/lib/monitor/queries/samenstelling";
import { HUIDIG_SEIZOEN } from "@/lib/monitor/utils/seizoen";
import { berekenKnelpunten } from "@/lib/monitor/utils/pijplijn";
import { ProjectiePiramide } from "./projectie-piramide";
import { RetentieCurve } from "./retentie-curve";
import { Doelkaart } from "./doelkaart";
import { PijplijnTable } from "./pijplijn-table";
import { KnelpuntenGrid } from "./knelpunten-grid";
import { DoorstroomTable } from "./doorstroom-table";
import { U17ProjectionTable } from "./u17-projection-table";
import { SeniorenTable } from "./senioren-table";
import { PijplijnTabs } from "./pijplijn-tabs";

export default async function JeugdpijplijnPage() {
  const seizoen = HUIDIG_SEIZOEN;

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
    <PageContainer animated>
      <InfoPageHeader
        title="Jeugdpijplijn"
        subtitle="Van instroom tot senioren \u2014 streef 12\u2642 + 13\u2640 per geboortejaar."
        infoTitle="Over Jeugdpijplijn"
      >
        <div className="space-y-4">
          <section>
            <h4 className="text-text-muted mb-1 text-xs font-semibold tracking-wide uppercase">
              Wat zie je?
            </h4>
            <p>
              De complete jeugdpijplijn van instroom (6 jaar) tot senioren (22 jaar). Streef is 12
              jongens + 13 meiden per geboortejaar.
            </p>
          </section>
          <section>
            <h4 className="text-text-muted mb-1 text-xs font-semibold tracking-wide uppercase">
              Tabs
            </h4>
            <p>
              <strong>Pijplijn</strong> toont de huidige stand per leeftijd, knelpunten en waar we
              spelers verliezen.
            </p>
            <p className="mt-1">
              <strong>Projectie</strong> kijkt vooruit: doorstroompercentages, piramide huidig vs.
              benodigd, en de weg naar senioren.
            </p>
          </section>
        </div>
      </InfoPageHeader>

      <PijplijnTabs
        pijplijnContent={
          <>
            <Doelkaart categorieen={categorieen} doel={doel} />

            <PijplijnTable
              perLeeftijd={pijplijn.perLeeftijd}
              startJaar={startJaar}
              verwachteInstroom={verwachteInstroom}
            />

            <div className="bg-surface-card mb-8 rounded-xl p-6 shadow-sm">
              <h3 className="text-text-secondary mb-1 text-sm font-semibold tracking-wide uppercase">
                Waar lekken we?
              </h3>
              <p className="text-text-muted mb-4 text-xs">
                Netto groei per leeftijdsovergang. Boven 100% = instroom &gt; uitstroom. Onder 100%
                = nettoverlies.
              </p>
              <RetentieCurve factoren={pijplijn.groeiFactoren} />
            </div>

            <KnelpuntenGrid knelpunten={knelpunten} />
          </>
        }
        projectieContent={
          <>
            <DoorstroomTable />

            <div className="bg-surface-card mb-8 rounded-xl p-6 shadow-sm">
              <h3 className="text-text-secondary mb-1 text-sm font-semibold tracking-wide uppercase">
                Huidig vs. benodigd
              </h3>
              <p className="text-text-muted mb-4 text-xs">
                Huidig (solid) vs. benodigd (transparant) — per leeftijd en geslacht
              </p>
              {piramideData.length > 0 ? (
                <ProjectiePiramide data={piramideData} />
              ) : (
                <p className="text-text-muted text-sm">Geen data beschikbaar.</p>
              )}
            </div>

            <U17ProjectionTable u17={projectie.u17} />

            <SeniorenTable senioren={projectie.senioren} />
          </>
        }
      />
    </PageContainer>
  );
}
