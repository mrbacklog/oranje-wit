/**
 * Planning-plugin voor Daisy — seizoenscyclus en TC-kalender
 */

import { z } from "zod";

const seizoenscyclus: Record<
  string,
  { periode: string; tcActiviteiten: string[]; knkvDeadlines: string[] }
> = {
  augustus: {
    periode: "Start",
    tcActiviteiten: [
      "Seizoensopening",
      "Teams definitief communiceren",
      "Staf toewijzen aan teams",
    ],
    knkvDeadlines: ["Teamopgave veldcompetitie najaar"],
  },
  september: {
    periode: "Start",
    tcActiviteiten: [
      "Eerste wedstrijden veldcompetitie",
      "Evaluatie instroom nieuwe leden",
      "Stafvergadering 1",
    ],
    knkvDeadlines: ["Start veldcompetitie najaar"],
  },
  oktober: {
    periode: "Draaiend",
    tcActiviteiten: ["Tussentijdse check teambalans", "Signalering retentierisicos"],
    knkvDeadlines: [],
  },
  november: {
    periode: "Draaiend",
    tcActiviteiten: ["Teamopgave zaalcompetitie voorbereiden", "Evaluatieronde 1 plannen"],
    knkvDeadlines: ["Teamopgave zaalcompetitie"],
  },
  december: {
    periode: "Draaiend",
    tcActiviteiten: ["Evaluatieronde 1 uitvoeren", "Peildatum leeftijdscategorien (31 dec)"],
    knkvDeadlines: ["Peildatum speelgerechtigdheid"],
  },
  januari: {
    periode: "Draaiend",
    tcActiviteiten: ["Start zaalcompetitie", "Evaluaties verwerken", "Retentiegesprekken"],
    knkvDeadlines: ["Start zaalcompetitie"],
  },
  februari: {
    periode: "Draaiend",
    tcActiviteiten: ["Teamopgave veldcompetitie voorjaar", "Tussentijdse teamaanpassingen"],
    knkvDeadlines: ["Teamopgave veldcompetitie voorjaar"],
  },
  maart: {
    periode: "Oogsten & Zaaien",
    tcActiviteiten: [
      "Blauwdruk volgend seizoen starten",
      "Inventarisatie beschikbare staf",
      "Evaluatieronde 2 plannen",
    ],
    knkvDeadlines: ["Start veldcompetitie voorjaar"],
  },
  april: {
    periode: "Oogsten & Zaaien",
    tcActiviteiten: [
      "Concepten teamindeling uitwerken",
      "Evaluatieronde 2 uitvoeren",
      "Scenarioplanning",
    ],
    knkvDeadlines: [],
  },
  mei: {
    periode: "Oogsten & Zaaien",
    tcActiviteiten: [
      "Scenarios vergelijken en kiezen",
      "Werkindeling vaststellen",
      "Communicatie naar leden voorbereiden",
    ],
    knkvDeadlines: ["Teamopgave volgend seizoen (indicatief)"],
  },
  juni: {
    periode: "Oogsten & Zaaien",
    tcActiviteiten: [
      "Definitieve indeling communiceren",
      "Staftoewijzing volgend seizoen",
      "Seizoensafsluiting",
    ],
    knkvDeadlines: ["Definitieve teamopgave volgend seizoen"],
  },
  juli: {
    periode: "Zomerreces",
    tcActiviteiten: ["Zomerstop", "Eventuele naregistraties verwerken"],
    knkvDeadlines: [],
  },
};

export const planningTools = {
  weekOverzicht: {
    description: "Geeft TC-activiteiten en KNKV-deadlines voor een bepaalde maand in het seizoen",
    inputSchema: z.object({
      maand: z
        .string()
        .describe("Naam van de maand in het Nederlands (bijv. 'maart', 'september')"),
    }),
    execute: async ({ maand }: { maand: string }) => {
      const key = maand.toLowerCase().trim();
      const data = seizoenscyclus[key];

      if (!data) {
        return {
          fout: `Onbekende maand: "${maand}". Gebruik een Nederlandse maandnaam.`,
        };
      }

      return {
        maand: key,
        periode: data.periode,
        tcActiviteiten: data.tcActiviteiten,
        knkvDeadlines:
          data.knkvDeadlines.length > 0 ? data.knkvDeadlines : ["Geen deadlines deze maand"],
      };
    },
  },
};
