import { logger } from "@oranje-wit/types";
import {
  getInstroomUitstroom,
  getInstroomPerSeizoenMV,
  getUitstroomPerSeizoenMV,
  getAankomstigeUitstroom,
  getIntraSeizoenFlow,
  type AankomstigeUitstroomer,
  type IntraSeizoenFlow,
} from "@/lib/monitor/queries/verloop";
import {
  getCohortRetentieMatrix,
  getEersteSeizoenRetentie,
  getWaterfallData,
  getWaterfallDataLopend,
  getInstroomPerSeizoenMVLeeftijd,
  getUitstroomPerSeizoenMVLeeftijd,
} from "@/lib/monitor/queries/retentie";
import { HUIDIG_SEIZOEN } from "@/lib/monitor/utils/seizoen";
import {
  getPijplijn,
  getProjectie,
  type ProjectieResult,
} from "@/lib/monitor/queries/samenstelling";
import { KritiekeMomentenTabel } from "./verloop-widgets";
import type { WaterfallItem, KritiekMoment, RetentieDataPoint } from "@/lib/monitor/utils/retentie";
import { RetentieCurve } from "@/components/monitor/charts/retentie-curve";
import { RetentieTabs } from "./retentie-tabs";
import { WaterfallChart } from "./waterfall-chart";
import { CohortenContent } from "./cohorten-content";
import { VerloopCombinedContent } from "./retentie-verloop-combined";
import { PrognoseContent } from "./retentie-prognose-content";
import {
  detecteerKritiekeMomenten,
  detecteerPatronen,
  berekenWaterfall,
} from "@/lib/monitor/utils/retentie";

export async function RetentieContent() {
  let verloop, instroomPerSeizoen, uitstroomPerSeizoen;
  let instroomLeeftijd, uitstroomLeeftijd;
  let cohortData, eersteSeizoen, waterfallRaw, waterfallLopendRaw;
  let aankomstigeUitstroom: AankomstigeUitstroomer[];
  let intraSeizoenFlow: IntraSeizoenFlow;
  let pijplijn, projectie: ProjectieResult;

  try {
    [
      verloop,
      instroomPerSeizoen,
      uitstroomPerSeizoen,
      instroomLeeftijd,
      uitstroomLeeftijd,
      cohortData,
      eersteSeizoen,
      waterfallRaw,
      waterfallLopendRaw,
      aankomstigeUitstroom,
      intraSeizoenFlow,
      pijplijn,
      projectie,
    ] = await Promise.all([
      getInstroomUitstroom(),
      getInstroomPerSeizoenMV(),
      getUitstroomPerSeizoenMV(),
      getInstroomPerSeizoenMVLeeftijd(),
      getUitstroomPerSeizoenMVLeeftijd(),
      getCohortRetentieMatrix(),
      getEersteSeizoenRetentie(),
      getWaterfallData(),
      getWaterfallDataLopend(),
      getAankomstigeUitstroom(),
      getIntraSeizoenFlow(HUIDIG_SEIZOEN),
      getPijplijn(HUIDIG_SEIZOEN),
      getProjectie(HUIDIG_SEIZOEN),
    ]);
  } catch (error) {
    logger.error("Fout bij ophalen ledendynamiek-data:", error);
    return (
      <div
        className="rounded-xl p-6 shadow-sm"
        style={{ backgroundColor: "var(--color-error-50)" }}
      >
        <h3 className="text-signal-rood mb-2 text-sm font-semibold">
          Data kon niet geladen worden
        </h3>
        <p className="text-signal-rood text-sm">
          Er ging iets mis bij het ophalen van de ledendynamiek-gegevens. Probeer de pagina opnieuw
          te laden.
        </p>
      </div>
    );
  }

  // --- Retentie tab ---
  const retentieData = verloop.retentie_alle_seizoenen
    .filter((r) => r.retentie_totaal !== null)
    .map((r) => ({
      leeftijd: r.leeftijd,
      retentie: r.retentie_totaal! * 100,
      retentie_m: r.retentie_M ? r.retentie_M * 100 : undefined,
      retentie_v: r.retentie_V ? r.retentie_V * 100 : undefined,
    }));

  const retentieJeugd = retentieData.filter((r) => r.leeftijd >= 5 && r.leeftijd <= 12);
  const retentieTieners = retentieData.filter((r) => r.leeftijd >= 12 && r.leeftijd <= 22);
  const retentieSenioren = retentieData.filter((r) => r.leeftijd >= 22 && r.leeftijd <= 40);
  const kritiekeMomenten = detecteerKritiekeMomenten(retentieData);

  const waterfallData = waterfallRaw
    ? berekenWaterfall(
        waterfallRaw.behouden,
        waterfallRaw.instroomNieuw,
        waterfallRaw.instroomTerug,
        waterfallRaw.uitstroom
      )
    : null;

  const waterfallLopendData = waterfallLopendRaw
    ? berekenWaterfall(
        waterfallLopendRaw.behouden,
        waterfallLopendRaw.instroomNieuw,
        waterfallLopendRaw.instroomTerug,
        waterfallLopendRaw.uitstroom
      )
    : null;

  // --- Instroom tab ---
  const instroomData = verloop.instroom_per_leeftijd
    .filter((r) => r.leeftijd >= 4 && r.leeftijd <= 30)
    .map((r) => ({ leeftijd: r.leeftijd, M: r.M, V: r.V }));

  const instroomSeizoenData = instroomPerSeizoen.map((r) => ({
    seizoen: r.seizoen,
    seizoenKort: `${r.seizoen.slice(2, 4)}/${r.seizoen.slice(7, 9)}`,
    isLopend: r.seizoen === HUIDIG_SEIZOEN,
    M: r.M,
    V: r.V,
  }));

  const instroomPatronen = detecteerPatronen(instroomData, "instroom");

  // --- Uitstroom tab ---
  const uitstroomData = verloop.uitstroom_per_leeftijd
    .filter((r) => r.leeftijd >= 4 && r.leeftijd <= 30)
    .map((r) => ({ leeftijd: r.leeftijd, M: r.M, V: r.V }));

  const uitstroomSeizoenData = uitstroomPerSeizoen.map((r) => ({
    seizoen: r.seizoen,
    seizoenKort: `${r.seizoen.slice(2, 4)}/${r.seizoen.slice(7, 9)}`,
    isLopend: r.seizoen === HUIDIG_SEIZOEN,
    M: r.M,
    V: r.V,
  }));

  const uitstroomPatronen = detecteerPatronen(uitstroomData, "uitstroom");

  // --- Prognose tab ---
  const piramideData = pijplijn.perLeeftijd.map((row) => ({
    leeftijd: row.leeftijd,
    band: row.band,
    huidige_m: row.huidig_m,
    huidige_v: row.huidig_v,
    streef_m: row.benodigd_m,
    streef_v: row.benodigd_v,
  }));

  const leeftijdsGroepen = [
    { titel: "Jongste jeugd (5\u201312)", subtitel: "F/E/D-jeugd", data: retentieJeugd },
    {
      titel: "Tieners & jeugd (12\u201322)",
      subtitel: "C/B/A-jeugd + jong-senioren",
      data: retentieTieners,
    },
    { titel: "Senioren (22\u201340)", subtitel: "Volwassen leden", data: retentieSenioren },
  ];

  return (
    <RetentieTabs
      behoudContent={
        <RetentieTabContent
          waterfallData={waterfallData}
          waterfallSeizoen={waterfallRaw?.seizoen}
          waterfallLopendData={waterfallLopendData}
          leeftijdsGroepen={leeftijdsGroepen}
          kritiekeMomenten={kritiekeMomenten}
        />
      }
      verloopContent={
        <VerloopCombinedContent
          instroomLi={instroomLeeftijd.at(-1)}
          instroomVi={instroomLeeftijd.at(-2)}
          uitstroomLi={uitstroomLeeftijd.at(-1)}
          uitstroomVi={uitstroomLeeftijd.at(-2)}
          instroomLeeftijdData={instroomData}
          uitstroomLeeftijdData={uitstroomData}
          instroomSeizoenData={instroomSeizoenData}
          uitstroomSeizoenData={uitstroomSeizoenData}
          instroomPatronen={instroomPatronen}
          uitstroomPatronen={uitstroomPatronen}
          intraSeizoenFlow={intraSeizoenFlow}
          aankomstigeUitstroom={aankomstigeUitstroom}
        />
      }
      cohortenContent={<CohortenContent cohortData={cohortData} eersteSeizoen={eersteSeizoen} />}
      prognoseContent={<PrognoseContent projectie={projectie} piramideData={piramideData} />}
    />
  );
}

// ---------------------------------------------------------------------------
// Retentie-tab sub-component
// ---------------------------------------------------------------------------

function RetentieTabContent({
  waterfallData,
  waterfallSeizoen,
  waterfallLopendData,
  leeftijdsGroepen,
  kritiekeMomenten,
}: {
  waterfallData: WaterfallItem[] | null;
  waterfallSeizoen?: string;
  waterfallLopendData: WaterfallItem[] | null;
  leeftijdsGroepen: { titel: string; subtitel: string; data: RetentieDataPoint[] }[];
  kritiekeMomenten: KritiekMoment[];
}) {
  return (
    <>
      {waterfallLopendData && (
        <div
          className="mb-8 rounded-xl border p-6 shadow-sm"
          style={{
            borderColor: "var(--color-warning-100)",
            backgroundColor: "var(--color-warning-50)",
          }}
        >
          <div className="mb-1 flex items-center gap-2">
            <h3 className="text-signal-geel text-sm font-semibold tracking-wide uppercase">
              Ledenverloop {HUIDIG_SEIZOEN}
            </h3>
            <span
              className="text-signal-geel rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: "var(--color-warning-100)" }}
            >
              Voorlopig — seizoen loopt nog
            </span>
          </div>
          <p className="text-signal-geel mb-4 text-xs">
            Begin seizoen &rarr; instroom (nieuw + terug) &rarr; uitstroom &rarr; eind seizoen.
            Cijfers zijn onvolledig zolang het seizoen loopt.
          </p>
          <WaterfallChart data={waterfallLopendData} />
        </div>
      )}

      {waterfallData && (
        <div className="bg-surface-card mb-8 rounded-xl p-6 shadow-sm">
          <h3 className="text-text-secondary mb-1 text-sm font-semibold tracking-wide uppercase">
            Ledenverloop {waterfallSeizoen}
          </h3>
          <p className="text-text-muted mb-4 text-xs">
            Begin seizoen &rarr; instroom (nieuw + terug) &rarr; uitstroom &rarr; eind seizoen
          </p>
          <WaterfallChart data={waterfallData} />
        </div>
      )}

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        {leeftijdsGroepen.map((groep) => (
          <div key={groep.titel} className="bg-surface-card rounded-xl p-5 shadow-sm">
            <h3 className="text-text-secondary mb-1 text-sm font-semibold tracking-wide uppercase">
              {groep.titel}
            </h3>
            <p className="text-text-muted mb-3 text-xs">{groep.subtitel}</p>
            <RetentieCurve data={groep.data} toonMV={true} />
          </div>
        ))}
      </div>

      {kritiekeMomenten.length > 0 && <KritiekeMomentenTabel momenten={kritiekeMomenten} />}
    </>
  );
}
