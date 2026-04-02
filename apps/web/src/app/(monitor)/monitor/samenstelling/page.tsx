export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { PageContainer } from "@oranje-wit/ui";
import { InfoPageHeader } from "@/components/monitor/info/InfoPageHeader";
import {
  getPerGeboortejaar,
  getPijplijn,
  getVerwachteInstroom,
} from "@/lib/monitor/queries/samenstelling";
import { getCohorten } from "@/lib/monitor/queries/cohorten";
import { getSeizoen } from "@/lib/monitor/utils/seizoen";
import { berekenKnelpunten } from "@/lib/monitor/utils/pijplijn";
import { Ledenboog } from "@/components/monitor/charts/ledenboog";
import { CohortHeatmap } from "@/components/monitor/charts/cohort-heatmap";
import { Doelkaart } from "@/app/(monitor)/monitor/projecties/doelkaart";
import { PijplijnTable } from "@/app/(monitor)/monitor/projecties/pijplijn-table";
import { KnelpuntenGrid } from "@/app/(monitor)/monitor/projecties/knelpunten-grid";
import { RetentieCurve } from "@/app/(monitor)/monitor/projecties/retentie-curve";

function ChartFallback() {
  return <div className="bg-surface-sunken h-56 animate-pulse rounded-lg" aria-hidden />;
}

export default async function SamenstellingPage({
  searchParams,
}: {
  searchParams: Promise<{ seizoen?: string }>;
}) {
  const params = await searchParams;
  const seizoen = getSeizoen(params);

  const [geboortejaar, cohorten, pijplijn, verwachteInstroom] = await Promise.all([
    getPerGeboortejaar(seizoen),
    getCohorten(),
    getPijplijn(seizoen),
    getVerwachteInstroom(seizoen),
  ]);

  const startJaar = parseInt(seizoen.split("-")[0], 10);
  const doel = pijplijn.doelPerCategorie;
  const categorieen = [
    { label: "U15", leeftijden: "13-14", ...pijplijn.huidig.U15 },
    { label: "U17", leeftijden: "15-16", ...pijplijn.huidig.U17 },
    { label: "U19", leeftijden: "17-18", ...pijplijn.huidig.U19 },
  ] as const;

  const knelpunten = berekenKnelpunten(pijplijn.groeiFactoren);

  const boogMap = new Map<number, { M: number; V: number; band: string }>();
  for (const row of geboortejaar.data) {
    if (!row.geboortejaar) continue;
    const existing = boogMap.get(row.geboortejaar);
    const band = row.a_categorie || "Overig";
    if (existing) {
      if (row.geslacht === "M") existing.M += row.aantal;
      else existing.V += row.aantal;
    } else {
      boogMap.set(row.geboortejaar, {
        M: row.geslacht === "M" ? row.aantal : 0,
        V: row.geslacht === "V" ? row.aantal : 0,
        band,
      });
    }
  }
  const boogData = [...boogMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([gj, d]) => ({ geboortejaar: gj, ...d }));

  const { seizoenen, per_cohort } = cohorten;
  const seizoenenDesc = [...seizoenen].reverse();

  return (
    <PageContainer animated>
      <InfoPageHeader
        title="Samenstelling"
        subtitle="Ledenstructuur, pijplijn en cohortanalyse."
        infoTitle="Over Samenstelling"
        actions={null}
      >
        <div className="space-y-4">
          <section>
            <h4 className="text-text-muted mb-1 text-xs font-semibold tracking-wide uppercase">
              Wat zie je?
            </h4>
            <p>
              Eén doorlopend overzicht: doelkaart (U15/U17/U19), populatiepiramide, pijplijn per
              leeftijd, cohort-heatmap over seizoenen, en waar we historisch spelers verliezen of
              winnen.
            </p>
          </section>
          <section>
            <h4 className="text-text-muted mb-1 text-xs font-semibold tracking-wide uppercase">
              Secties
            </h4>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>
                <strong>Doelkaart:</strong> vulgraad t.o.v. het streefaantal per selectiecategorie.
              </li>
              <li>
                <strong>Populatiepiramide:</strong> huidige verdeling per geboortejaar (klikbaar
                naar cohortdetail).
              </li>
              <li>
                <strong>Pijplijn-tabel:</strong> huidig, benodigd en vulgraad per leeftijd, met
                verwachte instroom waar relevant.
              </li>
              <li>
                <strong>Cohort-heatmap:</strong> actieve leden per geboortejaar door de tijd.
              </li>
              <li>
                <strong>Groei-factoren en knelpunten:</strong> netto behoud per leeftijdsovergang en
                waar we het meest kunnen investeren.
              </li>
            </ul>
          </section>
        </div>
      </InfoPageHeader>

      <div className="space-y-8">
        <section>
          <h3 className="text-text-secondary mb-1 text-sm font-semibold tracking-wide uppercase">
            Doelkaart
          </h3>
          <p className="text-text-muted mb-4 text-xs">
            KPI&apos;s voor U15, U17 en U19: huidige aantallen ten opzichte van het doel per
            categorie.
          </p>
          <Doelkaart categorieen={categorieen} doel={doel} />
        </section>

        <div className="bg-surface-card rounded-xl p-6 shadow-sm">
          <h3 className="text-text-secondary mb-1 text-sm font-semibold tracking-wide uppercase">
            Populatiepiramide
          </h3>
          <p className="text-text-muted mb-4 text-xs">
            Horizontale piramide per geboortejaar — klik op een jaartal voor het cohortdetail.
          </p>
          <Suspense fallback={<ChartFallback />}>
            {boogData.length > 0 ? (
              <Ledenboog data={boogData} seizoen={seizoen} />
            ) : (
              <p className="text-text-muted text-sm">Geen data beschikbaar.</p>
            )}
          </Suspense>
        </div>

        <section>
          <h3 className="text-text-secondary mb-1 text-sm font-semibold tracking-wide uppercase">
            Pijplijn-tabel
          </h3>
          <p className="text-text-muted mb-4 text-xs">
            Per leeftijd: huidig, benodigd en vulgraad — inclusief verwachte tussentijdse instroom.
          </p>
          <PijplijnTable
            perLeeftijd={pijplijn.perLeeftijd}
            startJaar={startJaar}
            verwachteInstroom={verwachteInstroom}
          />
        </section>

        <div className="bg-surface-card rounded-xl p-6 shadow-sm">
          <h3 className="text-text-secondary mb-1 text-sm font-semibold tracking-wide uppercase">
            Cohort-heatmap
          </h3>
          <p className="text-text-muted mb-4 text-xs">
            Geboortejaar × seizoen: intensiteit toont hoeveel actieve leden per cohort.
          </p>
          <Suspense fallback={<ChartFallback />}>
            <CohortHeatmap data={per_cohort} seizoenen={seizoenenDesc} />
          </Suspense>
        </div>

        <section className="space-y-8">
          <div className="bg-surface-card rounded-xl p-6 shadow-sm">
            <h3 className="text-text-secondary mb-1 text-sm font-semibold tracking-wide uppercase">
              Waar lekken we?
            </h3>
            <p className="text-text-muted mb-4 text-xs">
              Netto groei per leeftijdsovergang. Boven 100% = instroom &gt; uitstroom. Onder 100% =
              nettoverlies.
            </p>
            <Suspense fallback={<ChartFallback />}>
              <RetentieCurve factoren={pijplijn.groeiFactoren} />
            </Suspense>
          </div>
          <KnelpuntenGrid knelpunten={knelpunten} />
        </section>
      </div>
    </PageContainer>
  );
}
