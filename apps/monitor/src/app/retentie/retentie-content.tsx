import { logger } from "@oranje-wit/types";
import {
  getInstroomUitstroom,
  getInstroomPerSeizoenMV,
  getUitstroomPerSeizoenMV,
  getAankomstigeUitstroom,
  getIntraSeizoenFlow,
  type AankomstigeUitstroomer,
  type IntraSeizoenFlow,
} from "@/lib/queries/verloop";
import {
  getCohortRetentieMatrix,
  getEersteSeizoenRetentie,
  getWaterfallData,
  getWaterfallDataLopend,
  getInstroomPerSeizoenMVLeeftijd,
  getUitstroomPerSeizoenMVLeeftijd,
} from "@/lib/queries/retentie";
import type { SeizoenMVLeeftijdRow } from "@/lib/queries/retentie";
import { HUIDIG_SEIZOEN } from "@/lib/huidig-seizoen";
import {
  AankomstigeUitstroomTabel,
  IntraSeizoenFlowCard,
  KritiekeMomentenTabel,
} from "./verloop-widgets";
import type { WaterfallItem, KritiekMoment, RetentieDataPoint } from "@/lib/utils/retentie";
import { RetentieCurve } from "@/components/charts/retentie-curve";
import { RetentieTabs } from "./retentie-tabs";
import { GroupedBarChart } from "./grouped-bar-chart";
import { SeizoenBarChart } from "./seizoen-bar-chart";
import { KpiCards } from "./kpi-cards";
import { WaterfallChart } from "./waterfall-chart";
import { CohortenContent } from "./cohorten-content";
import {
  detecteerKritiekeMomenten,
  detecteerPatronen,
  berekenWaterfall,
} from "@/lib/utils/retentie";

export async function RetentieContent() {
  let verloop, instroomPerSeizoen, uitstroomPerSeizoen;
  let instroomLeeftijd, uitstroomLeeftijd;
  let cohortData, eersteSeizoen, waterfallRaw, waterfallLopendRaw;
  let aankomstigeUitstroom: AankomstigeUitstroomer[];
  let intraSeizoenFlow: IntraSeizoenFlow;

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
    ]);
  } catch (error) {
    logger.error("Fout bij ophalen ledendynamiek-data:", error);
    return (
      <div className="rounded-xl bg-red-50 p-6 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-red-700">Data kon niet geladen worden</h3>
        <p className="text-sm text-red-600">
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
      instroomContent={
        <VerloopTabContent
          type="instroom"
          li={instroomLeeftijd.at(-1)}
          vi={instroomLeeftijd.at(-2)}
          leeftijdData={instroomData}
          seizoenData={instroomSeizoenData}
          patronen={instroomPatronen}
          intraSeizoenFlow={intraSeizoenFlow}
        />
      }
      uitstroomContent={
        <VerloopTabContent
          type="uitstroom"
          li={uitstroomLeeftijd.at(-1)}
          vi={uitstroomLeeftijd.at(-2)}
          leeftijdData={uitstroomData}
          seizoenData={uitstroomSeizoenData}
          patronen={uitstroomPatronen}
          aankomstigeUitstroom={aankomstigeUitstroom}
        />
      }
      cohortenContent={<CohortenContent cohortData={cohortData} eersteSeizoen={eersteSeizoen} />}
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
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-wide text-amber-800 uppercase">
              Ledenverloop {HUIDIG_SEIZOEN}
            </h3>
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-800">
              Voorlopig — seizoen loopt nog
            </span>
          </div>
          <p className="mb-4 text-xs text-amber-700">
            Begin seizoen &rarr; instroom (nieuw + terug) &rarr; uitstroom &rarr; eind seizoen.
            Cijfers zijn onvolledig zolang het seizoen loopt.
          </p>
          <WaterfallChart data={waterfallLopendData} />
        </div>
      )}

      {waterfallData && (
        <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold tracking-wide text-gray-700 uppercase">
            Ledenverloop {waterfallSeizoen}
          </h3>
          <p className="mb-4 text-xs text-gray-400">
            Begin seizoen &rarr; instroom (nieuw + terug) &rarr; uitstroom &rarr; eind seizoen
          </p>
          <WaterfallChart data={waterfallData} />
        </div>
      )}

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        {leeftijdsGroepen.map((groep) => (
          <div key={groep.titel} className="rounded-xl bg-white p-5 shadow-sm">
            <h3 className="mb-1 text-sm font-semibold tracking-wide text-gray-700 uppercase">
              {groep.titel}
            </h3>
            <p className="mb-3 text-xs text-gray-400">{groep.subtitel}</p>
            <RetentieCurve data={groep.data} toonMV={true} />
          </div>
        ))}
      </div>

      {kritiekeMomenten.length > 0 && <KritiekeMomentenTabel momenten={kritiekeMomenten} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// Instroom/Uitstroom tab (gedeeld component)
// ---------------------------------------------------------------------------

function VerloopTabContent({
  type,
  li,
  vi,
  leeftijdData,
  seizoenData,
  patronen,
  aankomstigeUitstroom,
  intraSeizoenFlow,
}: {
  type: "instroom" | "uitstroom";
  li?: SeizoenMVLeeftijdRow;
  vi?: SeizoenMVLeeftijdRow;
  leeftijdData: { leeftijd: number; M: number; V: number }[];
  seizoenData: { seizoen: string; seizoenKort: string; isLopend: boolean; M: number; V: number }[];
  patronen: string[];
  aankomstigeUitstroom?: AankomstigeUitstroomer[];
  intraSeizoenFlow?: IntraSeizoenFlow;
}) {
  const label = type === "instroom" ? "Instroom" : "Uitstroom";
  const liIsLopend = li?.isLopend ?? false;
  const trendTotaal = li && vi ? li.totaal - vi.totaal : 0;
  const trendJeugd = li && vi ? li.jeugdTotaal - vi.jeugdTotaal : 0;
  const trendSenioren = li && vi ? li.seniorenTotaal - vi.seniorenTotaal : 0;
  const bgKleur = type === "instroom" ? "bg-blue-50" : "bg-red-50";
  const titleKleur = type === "instroom" ? "text-blue-700" : "text-red-700";
  const textKleur = type === "instroom" ? "text-blue-900" : "text-red-900";

  return (
    <>
      {liIsLopend && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <span className="mt-0.5 text-amber-500">&#9888;</span>
          <p className="text-sm text-amber-800">
            <strong>Lopend seizoen</strong> — de cijfers hieronder zijn voorlopig. Het seizoen loopt
            nog en niet alle spelers zijn al ingeschreven. De gemiddelden zijn berekend over de
            laatste 5 afgeronde seizoenen.
          </p>
        </div>
      )}

      <KpiCards
        items={[
          {
            label: `${label} totaal${liIsLopend ? " (voorlopig)" : ""}`,
            waarde: li ? String(li.totaal) : "-",
            detail: li ? `${li.M} \u2642 / ${li.V} \u2640` : undefined,
            trend: trendTotaal,
            trendLabel: `${trendTotaal >= 0 ? "+" : ""}${trendTotaal} vs vorig`,
          },
          {
            label: `Jeugd (6\u201318)${liIsLopend ? " (voorlopig)" : ""}`,
            waarde: li ? String(li.jeugdTotaal) : "-",
            detail: li ? `${li.jeugdM} \u2642 / ${li.jeugdV} \u2640` : undefined,
            trend: trendJeugd,
            trendLabel: `${trendJeugd >= 0 ? "+" : ""}${trendJeugd} vs vorig`,
          },
          {
            label: `Senioren (19+)${liIsLopend ? " (voorlopig)" : ""}`,
            waarde: li ? String(li.seniorenTotaal) : "-",
            detail: li ? `${li.seniorenM} \u2642 / ${li.seniorenV} \u2640` : undefined,
            trend: trendSenioren,
            trendLabel: `${trendSenioren >= 0 ? "+" : ""}${trendSenioren} vs vorig`,
          },
        ]}
      />

      {type === "uitstroom" && aankomstigeUitstroom && aankomstigeUitstroom.length > 0 && (
        <AankomstigeUitstroomTabel leden={aankomstigeUitstroom} />
      )}

      {type === "instroom" && intraSeizoenFlow && <IntraSeizoenFlowCard flow={intraSeizoenFlow} />}

      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold tracking-wide text-gray-700 uppercase">
          Gemiddelde {type} per leeftijd (laatste 5 afgeronde seizoenen)
        </h3>
        <GroupedBarChart data={leeftijdData} kleurM="#3B82F6" kleurV="#EC4899" />
        {patronen.length > 0 && (
          <div className={`mt-4 rounded-lg ${bgKleur} px-4 py-3`}>
            <h4 className={`mb-2 text-xs font-semibold tracking-wide ${titleKleur} uppercase`}>
              Patronen
            </h4>
            <ul className={`space-y-1 text-sm ${textKleur}`}>
              {patronen.map((p, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-xs">&#128161;</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold tracking-wide text-gray-700 uppercase">
          {label} per seizoen
        </h3>
        <p className="mb-4 text-xs text-gray-400">
          Klik op een seizoen voor de namenlijst.
          {type === "uitstroom" && (
            <>
              {" "}
              Uitstroom van het lopende seizoen is niet-definitief: spelers die nog niet zijn
              ingeschreven tellen mee.
            </>
          )}
        </p>
        <SeizoenBarChart data={seizoenData} kleurM="#3B82F6" kleurV="#EC4899" />
      </div>
    </>
  );
}
