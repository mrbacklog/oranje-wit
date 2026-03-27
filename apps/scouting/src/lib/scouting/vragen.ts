/* eslint-disable max-lines */
/**
 * Scouting vragen configuratie — v3.0 (Pijlerevolutie).
 *
 * Gebruikt de LeeftijdsgroepConfig uit @oranje-wit/types voor pijlernamen,
 * schalen en blokken. Backward compatible: de oude 6-pijler SCOUTING_CONFIG
 * wordt nog ge-exporteerd voor bestaande rapporten.
 *
 * Nieuwe rapporten gebruiken getScoutingConfigV3() die dynamische pijlers
 * en kern/verdieping markering ondersteunt.
 */

import type {
  LeeftijdsgroepNaamV3,
  PijlerCode,
  SchaalTypeV3,
  PijlerConfig,
} from "@oranje-wit/types";
import { LEEFTIJDSGROEP_CONFIG } from "@oranje-wit/types";
import type { SchaalType, LeeftijdsgroepNaam } from "./leeftijdsgroep";

// ─── Legacy types (backward compatible) ───

/** @deprecated Gebruik PijlerCode uit @oranje-wit/types */
export type Pijler = "SCH" | "AAN" | "PAS" | "VER" | "FYS" | "MEN";

export const PIJLER_LABELS: Record<Pijler, string> = {
  SCH: "Schieten",
  AAN: "Aanval",
  PAS: "Passen",
  VER: "Verdediging",
  FYS: "Fysiek",
  MEN: "Mentaal",
};

export const PIJLER_ICONEN: Record<Pijler, string> = {
  SCH: "🎯",
  AAN: "⚡",
  PAS: "🤝",
  VER: "🛡️",
  FYS: "💪",
  MEN: "🧠",
};

// ─── V3 types ───

export interface ScoutingVraagV3 {
  id: string;
  pijlerCode: PijlerCode;
  label: string;
  vraagTekst: string;
  isKern: boolean;
}

export interface ScoutingGroepConfigV3 {
  band: LeeftijdsgroepNaamV3;
  schaalType: SchaalTypeV3;
  schaalMin: number;
  schaalMax: number;
  pijlers: PijlerConfig[];
  items: ScoutingVraagV3[];
  heeftFysiekProfiel: boolean;
  heeftSignaalvlag: boolean;
  signaalvlagType: "ja_nee" | "scorend" | null;
}

// ─── V3 items per leeftijdsgroep (hardcoded, spiegel van het raamwerk) ───

const ITEMS_BLAUW: ScoutingVraagV3[] = [
  {
    id: "bal_gooien",
    pijlerCode: "BAL",
    label: "Gooien",
    vraagTekst: "Kan de bal gooien naar een ander",
    isKern: true,
  },
  {
    id: "bal_vangen",
    pijlerCode: "BAL",
    label: "Vangen",
    vraagTekst: "Kan de bal vangen",
    isKern: true,
  },
  {
    id: "bew_rennen",
    pijlerCode: "BEWEGEN",
    label: "Rennen",
    vraagTekst: "Rent en stopt zonder te vallen",
    isKern: true,
  },
  {
    id: "bew_richting",
    pijlerCode: "BEWEGEN",
    label: "Richting veranderen",
    vraagTekst: "Kan van richting veranderen",
    isKern: true,
  },
  {
    id: "bew_energie",
    pijlerCode: "BEWEGEN",
    label: "Energie",
    vraagTekst: "Beweegt graag en veel",
    isKern: true,
  },
  {
    id: "spel_balbezit",
    pijlerCode: "SPEL",
    label: "Balbezit",
    vraagTekst: "Begrijpt wij/zij hebben de bal",
    isKern: true,
  },
  {
    id: "sam_samenspelen",
    pijlerCode: "SAMEN",
    label: "Samenspelen",
    vraagTekst: "Speelt samen, geeft de bal af",
    isKern: true,
  },
  {
    id: "sam_luisteren",
    pijlerCode: "SAMEN",
    label: "Luisteren",
    vraagTekst: "Luistert naar de trainer",
    isKern: true,
  },
  {
    id: "ik_durft",
    pijlerCode: "IK",
    label: "Durft mee te doen",
    vraagTekst: "Durft mee te doen",
    isKern: true,
  },
  {
    id: "ik_plezier",
    pijlerCode: "IK",
    label: "Plezier",
    vraagTekst: "Heeft zichtbaar plezier",
    isKern: true,
  },
];

const ITEMS_GROEN: ScoutingVraagV3[] = [
  {
    id: "bal_schieten",
    pijlerCode: "BAL",
    label: "Schieten",
    vraagTekst: "Schiet op de korf",
    isKern: true,
  },
  {
    id: "bal_gooien_vangen",
    pijlerCode: "BAL",
    label: "Gooien en vangen",
    vraagTekst: "Kan goed gooien en vangen",
    isKern: true,
  },
  {
    id: "bew_vrijlopen",
    pijlerCode: "BEWEGEN",
    label: "Vrijlopen",
    vraagTekst: "Loopt vrij van de tegenstander",
    isKern: true,
  },
  {
    id: "bew_snel",
    pijlerCode: "BEWEGEN",
    label: "Snel",
    vraagTekst: "Is snel en beweeglijk",
    isKern: true,
  },
  {
    id: "spel_schotkeuze",
    pijlerCode: "SPEL",
    label: "Schotkeuze",
    vraagTekst: "Schiet als er ruimte is",
    isKern: true,
  },
  {
    id: "spel_meelopen",
    pijlerCode: "SPEL",
    label: "Meelopen",
    vraagTekst: "Verdedigt actief (loopt mee)",
    isKern: true,
  },
  {
    id: "sam_samenspelen",
    pijlerCode: "SAMEN",
    label: "Samenspelen",
    vraagTekst: "Speelt samen in aanval",
    isKern: true,
  },
  {
    id: "sam_communicatie",
    pijlerCode: "SAMEN",
    label: "Communicatie",
    vraagTekst: "Praat met teamgenoten bij verdedigen",
    isKern: true,
  },
  {
    id: "ik_doorzetten",
    pijlerCode: "IK",
    label: "Doorzetten",
    vraagTekst: "Probeert opnieuw na een mislukte actie",
    isKern: true,
  },
  {
    id: "ik_omgaan_verliezen",
    pijlerCode: "IK",
    label: "Omgaan met verliezen",
    vraagTekst: "Gaat goed om met verliezen",
    isKern: true,
  },
  // Verdieping
  {
    id: "bal_afgeven",
    pijlerCode: "BAL",
    label: "Bal afgeven",
    vraagTekst: "Geeft de bal af aan een vrije medespeler",
    isKern: false,
  },
  {
    id: "bew_uithouding",
    pijlerCode: "BEWEGEN",
    label: "Uithouding",
    vraagTekst: "Houdt het tempo vol",
    isKern: false,
  },
  {
    id: "spel_positie",
    pijlerCode: "SPEL",
    label: "Positie",
    vraagTekst: "Staat op goede plekken in het veld",
    isKern: false,
  },
  {
    id: "sam_aanmoedigen",
    pijlerCode: "SAMEN",
    label: "Aanmoedigen",
    vraagTekst: "Moedigt teamgenoten aan",
    isKern: false,
  },
];

const ITEMS_GEEL: ScoutingVraagV3[] = [
  // Kern
  {
    id: "aan_vrijlopen",
    pijlerCode: "AANVALLEN",
    label: "Vrijlopen",
    vraagTekst: "Loopt slim vrij van de tegenstander",
    isKern: true,
  },
  {
    id: "aan_balbezit",
    pijlerCode: "AANVALLEN",
    label: "Balbezit",
    vraagTekst: "Houdt de bal vast onder druk",
    isKern: true,
  },
  {
    id: "ver_dekken",
    pijlerCode: "VERDEDIGEN",
    label: "Dekken",
    vraagTekst: "Dekt de tegenstander goed af",
    isKern: true,
  },
  {
    id: "ver_bal_veroveren",
    pijlerCode: "VERDEDIGEN",
    label: "Bal veroveren",
    vraagTekst: "Probeert de bal te veroveren",
    isKern: true,
  },
  {
    id: "tec_schieten",
    pijlerCode: "TECHNIEK",
    label: "Schieten",
    vraagTekst: "Schiet goed van afstand",
    isKern: true,
  },
  {
    id: "tec_passen",
    pijlerCode: "TECHNIEK",
    label: "Passen",
    vraagTekst: "Gooit technisch goed over",
    isKern: true,
  },
  {
    id: "tac_schotkeuze",
    pijlerCode: "TACTIEK",
    label: "Schotkeuze",
    vraagTekst: "Kiest het juiste moment om te schieten",
    isKern: true,
  },
  {
    id: "men_inzet",
    pijlerCode: "MENTAAL",
    label: "Inzet",
    vraagTekst: "Laat zichtbare inspanning zien",
    isKern: true,
  },
  {
    id: "men_plezier",
    pijlerCode: "MENTAAL",
    label: "Plezier",
    vraagTekst: "Lacht, moedigt aan, komt graag",
    isKern: true,
  },
  {
    id: "fys_snelheid",
    pijlerCode: "FYSIEK",
    label: "Snelheid",
    vraagTekst: "Is snel in korte sprints",
    isKern: true,
  },
  // Verdieping
  {
    id: "aan_positie",
    pijlerCode: "AANVALLEN",
    label: "Positiespel",
    vraagTekst: "Neemt goede posities in bij aanval",
    isKern: false,
  },
  {
    id: "aan_dreigen",
    pijlerCode: "AANVALLEN",
    label: "Dreigen",
    vraagTekst: "Dreigt richting de korf",
    isKern: false,
  },
  {
    id: "ver_onderscheppen",
    pijlerCode: "VERDEDIGEN",
    label: "Onderscheppen",
    vraagTekst: "Onderschept ballen",
    isKern: false,
  },
  {
    id: "ver_positie",
    pijlerCode: "VERDEDIGEN",
    label: "Positie",
    vraagTekst: "Staat op de goede plek bij verdedigen",
    isKern: false,
  },
  {
    id: "tec_balbehandeling",
    pijlerCode: "TECHNIEK",
    label: "Balbehandeling",
    vraagTekst: "Vangt en verwerkt de bal goed",
    isKern: false,
  },
  {
    id: "tec_doorloopbal",
    pijlerCode: "TECHNIEK",
    label: "Doorloopbal",
    vraagTekst: "Maakt doorloopballen",
    isKern: false,
  },
  {
    id: "tac_positiespel",
    pijlerCode: "TACTIEK",
    label: "Positiespel",
    vraagTekst: "Begrijpt basispatronen in aanval en verdediging",
    isKern: false,
  },
  {
    id: "tac_samenspel",
    pijlerCode: "TACTIEK",
    label: "Samenspel",
    vraagTekst: "Zoekt en vindt de samenwerking",
    isKern: false,
  },
  {
    id: "men_concentratie",
    pijlerCode: "MENTAAL",
    label: "Concentratie",
    vraagTekst: "Blijft geconcentreerd tijdens de wedstrijd",
    isKern: false,
  },
  {
    id: "men_coachbaarheid",
    pijlerCode: "MENTAAL",
    label: "Coachbaarheid",
    vraagTekst: "Neemt aanwijzingen goed aan",
    isKern: false,
  },
  {
    id: "fys_uithouding",
    pijlerCode: "FYSIEK",
    label: "Uithouding",
    vraagTekst: "Houdt het tempo de hele wedstrijd vol",
    isKern: false,
  },
  {
    id: "fys_beweeglijk",
    pijlerCode: "FYSIEK",
    label: "Beweeglijkheid",
    vraagTekst: "Beweegt soepel en wendbaar",
    isKern: false,
  },
  {
    id: "aan_omschakeling",
    pijlerCode: "AANVALLEN",
    label: "Omschakeling",
    vraagTekst: "Schakelt snel om van verdediging naar aanval",
    isKern: false,
  },
  {
    id: "ver_communicatie",
    pijlerCode: "VERDEDIGEN",
    label: "Communicatie",
    vraagTekst: "Stuurt medespelers aan bij verdedigen",
    isKern: false,
  },
  {
    id: "tec_overzicht",
    pijlerCode: "TECHNIEK",
    label: "Overzicht",
    vraagTekst: "Ziet vrije medespelers staan",
    isKern: false,
  },
];

const ITEMS_ORANJE: ScoutingVraagV3[] = [
  // Kern (10)
  {
    id: "aan_vrijlopen",
    pijlerCode: "AANVALLEN",
    label: "Vrijlopen",
    vraagTekst: "Loopt op het juiste moment vrij",
    isKern: true,
  },
  {
    id: "aan_1op1",
    pijlerCode: "AANVALLEN",
    label: "1-op-1",
    vraagTekst: "Wint individuele duels in aanvalsverband",
    isKern: true,
  },
  {
    id: "ver_dekken",
    pijlerCode: "VERDEDIGEN",
    label: "Dekken",
    vraagTekst: "Dekt de directe tegenstander strak af",
    isKern: true,
  },
  {
    id: "ver_omschakeling",
    pijlerCode: "VERDEDIGEN",
    label: "Omschakeling",
    vraagTekst: "Schakelt direct terug na balverlies",
    isKern: true,
  },
  {
    id: "tec_schieten",
    pijlerCode: "TECHNIEK",
    label: "Schieten",
    vraagTekst: "Schiet geplaatst van afstand",
    isKern: true,
  },
  {
    id: "tac_besluitvorming",
    pijlerCode: "TACTIEK",
    label: "Besluitvorming",
    vraagTekst: "Maakt de juiste keuze: schieten, passen of vasthouden",
    isKern: true,
  },
  {
    id: "men_inzet",
    pijlerCode: "MENTAAL",
    label: "Inzet",
    vraagTekst: "Geeft maximale inzet, ook bij achterstand",
    isKern: true,
  },
  {
    id: "men_plezier",
    pijlerCode: "MENTAAL",
    label: "Plezier",
    vraagTekst: "Laat zien plezier te hebben, ook bij verlies",
    isKern: true,
  },
  {
    id: "soc_communicatie",
    pijlerCode: "SOCIAAL",
    label: "Communicatie",
    vraagTekst: "Communiceert duidelijk met medespelers",
    isKern: true,
  },
  {
    id: "fys_snelheid",
    pijlerCode: "FYSIEK",
    label: "Snelheid",
    vraagTekst: "Is explosief snel in sprints",
    isKern: true,
  },
  // Verdieping (selectie van 30)
  {
    id: "aan_positie",
    pijlerCode: "AANVALLEN",
    label: "Positiespel",
    vraagTekst: "Neemt sterke aanvalsposities in",
    isKern: false,
  },
  {
    id: "aan_dreigen",
    pijlerCode: "AANVALLEN",
    label: "Dreigen",
    vraagTekst: "Brengt de verdediging in problemen door te dreigen",
    isKern: false,
  },
  {
    id: "aan_omschakeling",
    pijlerCode: "AANVALLEN",
    label: "Omschakeling",
    vraagTekst: "Schakelt snel om van verdediging naar aanval",
    isKern: false,
  },
  {
    id: "ver_onderscheppen",
    pijlerCode: "VERDEDIGEN",
    label: "Onderscheppen",
    vraagTekst: "Leest het spel en onderschept ballen",
    isKern: false,
  },
  {
    id: "ver_rebound",
    pijlerCode: "VERDEDIGEN",
    label: "Rebound",
    vraagTekst: "Pakt rebounds na een schot",
    isKern: false,
  },
  {
    id: "ver_communicatie",
    pijlerCode: "VERDEDIGEN",
    label: "Communicatie",
    vraagTekst: "Stuurt medespelers aan bij verdedigen",
    isKern: false,
  },
  {
    id: "tec_passen",
    pijlerCode: "TECHNIEK",
    label: "Passen",
    vraagTekst: "Geeft strakke, zuivere passes",
    isKern: false,
  },
  {
    id: "tec_balbehandeling",
    pijlerCode: "TECHNIEK",
    label: "Balbehandeling",
    vraagTekst: "Controleert de bal onder druk",
    isKern: false,
  },
  {
    id: "tec_doorloopbal",
    pijlerCode: "TECHNIEK",
    label: "Doorloopbal",
    vraagTekst: "Maakt doorloopballen onder druk",
    isKern: false,
  },
  {
    id: "tec_schotkeuze",
    pijlerCode: "TECHNIEK",
    label: "Schotkeuze",
    vraagTekst: "Kiest het juiste schot op het juiste moment",
    isKern: false,
  },
  {
    id: "tac_positiespel",
    pijlerCode: "TACTIEK",
    label: "Positiespel",
    vraagTekst: "Begrijpt wedstrijdpatronen en voert ze uit",
    isKern: false,
  },
  {
    id: "tac_overzicht",
    pijlerCode: "TACTIEK",
    label: "Overzicht",
    vraagTekst: "Heeft goed overzicht over het speelveld",
    isKern: false,
  },
  {
    id: "men_concentratie",
    pijlerCode: "MENTAAL",
    label: "Concentratie",
    vraagTekst: "Blijft scherp in cruciale momenten",
    isKern: false,
  },
  {
    id: "men_weerbaarheid",
    pijlerCode: "MENTAAL",
    label: "Weerbaarheid",
    vraagTekst: "Herstelt snel na tegenslagen",
    isKern: false,
  },
  {
    id: "soc_samenwerking",
    pijlerCode: "SOCIAAL",
    label: "Samenwerking",
    vraagTekst: "Werkt samen en stelt het team boven zichzelf",
    isKern: false,
  },
  {
    id: "soc_teamsfeer",
    pijlerCode: "SOCIAAL",
    label: "Teamsfeer",
    vraagTekst: "Draagt bij aan een positieve teamsfeer",
    isKern: false,
  },
  {
    id: "soc_rolacceptatie",
    pijlerCode: "SOCIAAL",
    label: "Rolacceptatie",
    vraagTekst: "Accepteert de eigen rol in het team",
    isKern: false,
  },
  {
    id: "fys_uithouding",
    pijlerCode: "FYSIEK",
    label: "Uithouding",
    vraagTekst: "Houdt het hoge tempo de hele wedstrijd vol",
    isKern: false,
  },
  {
    id: "fys_kracht",
    pijlerCode: "FYSIEK",
    label: "Kracht",
    vraagTekst: "Zet het lichaam goed in bij duels",
    isKern: false,
  },
  {
    id: "fys_beweeglijk",
    pijlerCode: "FYSIEK",
    label: "Beweeglijkheid",
    vraagTekst: "Beweegt soepel en kan snel van richting veranderen",
    isKern: false,
  },
];

const ITEMS_ROOD: ScoutingVraagV3[] = [
  // Kern (9)
  {
    id: "aan_vrijlopen",
    pijlerCode: "AANVALLEN",
    label: "Vrijlopen",
    vraagTekst: "Creert ruimte door slim vrij te lopen",
    isKern: true,
  },
  {
    id: "ver_dekken",
    pijlerCode: "VERDEDIGEN",
    label: "Dekken",
    vraagTekst: "Dekt strak en gedisciplineerd",
    isKern: true,
  },
  {
    id: "sco_afstandsschot",
    pijlerCode: "SCOREN",
    label: "Afstandsschot",
    vraagTekst: "Schiet krachtig en geplaatst van afstand",
    isKern: true,
  },
  {
    id: "tec_passen",
    pijlerCode: "TECHNIEK",
    label: "Passen",
    vraagTekst: "Geeft strakke, zuivere passes op snelheid",
    isKern: true,
  },
  {
    id: "tac_besluitvorming",
    pijlerCode: "TACTIEK",
    label: "Besluitvorming",
    vraagTekst: "Maakt onder druk de juiste keuze",
    isKern: true,
  },
  {
    id: "spi_spellezing",
    pijlerCode: "SPELINTELLIGENTIE",
    label: "Spellezing",
    vraagTekst: "Leest het spel en anticipeert",
    isKern: true,
  },
  {
    id: "men_inzet",
    pijlerCode: "MENTAAL",
    label: "Inzet",
    vraagTekst: "Geeft maximale inzet ongeacht stand of belang",
    isKern: true,
  },
  {
    id: "soc_communicatie",
    pijlerCode: "SOCIAAL",
    label: "Communicatie",
    vraagTekst: "Communiceert continu en duidelijk op het veld",
    isKern: true,
  },
  {
    id: "fys_snelheid",
    pijlerCode: "FYSIEK",
    label: "Snelheid",
    vraagTekst: "Is explosief snel over de eerste meters",
    isKern: true,
  },
  // Verdieping (selectie van 51)
  {
    id: "aan_positie",
    pijlerCode: "AANVALLEN",
    label: "Positiespel",
    vraagTekst: "Neemt uitstekende aanvalsposities in",
    isKern: false,
  },
  {
    id: "aan_dreigen",
    pijlerCode: "AANVALLEN",
    label: "Dreigen",
    vraagTekst: "Creert constante dreiging richting de korf",
    isKern: false,
  },
  {
    id: "aan_omschakeling",
    pijlerCode: "AANVALLEN",
    label: "Omschakeling",
    vraagTekst: "Schakelt bliksemsnel om naar aanval",
    isKern: false,
  },
  {
    id: "aan_1op1",
    pijlerCode: "AANVALLEN",
    label: "1-op-1",
    vraagTekst: "Wint individuele duels in aanvalsverband",
    isKern: false,
  },
  {
    id: "ver_onderscheppen",
    pijlerCode: "VERDEDIGEN",
    label: "Onderscheppen",
    vraagTekst: "Leest het spel en onderschept passes",
    isKern: false,
  },
  {
    id: "ver_omschakeling",
    pijlerCode: "VERDEDIGEN",
    label: "Omschakeling",
    vraagTekst: "Schakelt direct terug na balverlies",
    isKern: false,
  },
  {
    id: "ver_rebound",
    pijlerCode: "VERDEDIGEN",
    label: "Rebound",
    vraagTekst: "Pakt rebounds onder druk",
    isKern: false,
  },
  {
    id: "ver_communicatie",
    pijlerCode: "VERDEDIGEN",
    label: "Communicatie",
    vraagTekst: "Stuurt en organiseert de verdediging",
    isKern: false,
  },
  {
    id: "sco_doorloopbal",
    pijlerCode: "SCOREN",
    label: "Doorloopbal",
    vraagTekst: "Maakt doorloopballen onder hoge druk",
    isKern: false,
  },
  {
    id: "sco_strafworp",
    pijlerCode: "SCOREN",
    label: "Strafworp",
    vraagTekst: "Scoort strafworpen onder druk",
    isKern: false,
  },
  {
    id: "sco_variatie",
    pijlerCode: "SCOREN",
    label: "Schotvariatie",
    vraagTekst: "Heeft meerdere schotvormen",
    isKern: false,
  },
  {
    id: "sco_scorend_vermogen",
    pijlerCode: "SCOREN",
    label: "Scorend vermogen",
    vraagTekst: "Is klinisch in de afronding",
    isKern: false,
  },
  {
    id: "sco_dreigen",
    pijlerCode: "SCOREN",
    label: "Schieten na dreiging",
    vraagTekst: "Scoort na eigen dreiging",
    isKern: false,
  },
  {
    id: "tec_balbehandeling",
    pijlerCode: "TECHNIEK",
    label: "Balbehandeling",
    vraagTekst: "Controleert de bal foutloos onder druk",
    isKern: false,
  },
  {
    id: "tec_overzicht",
    pijlerCode: "TECHNIEK",
    label: "Overzicht",
    vraagTekst: "Heeft excellent overzicht over het veld",
    isKern: false,
  },
  {
    id: "tac_positiespel",
    pijlerCode: "TACTIEK",
    label: "Positiespel",
    vraagTekst: "Voert het wedstrijdplan foutloos uit",
    isKern: false,
  },
  {
    id: "tac_wedstrijdplan",
    pijlerCode: "TACTIEK",
    label: "Wedstrijdplan",
    vraagTekst: "Begrijpt en past het wedstrijdplan aan",
    isKern: false,
  },
  {
    id: "spi_anticipatie",
    pijlerCode: "SPELINTELLIGENTIE",
    label: "Anticipatie",
    vraagTekst: "Anticipeert op acties van tegenstanders",
    isKern: false,
  },
  {
    id: "spi_patronen",
    pijlerCode: "SPELINTELLIGENTIE",
    label: "Patronen",
    vraagTekst: "Herkent patronen in het spel",
    isKern: false,
  },
  {
    id: "spi_adaptief",
    pijlerCode: "SPELINTELLIGENTIE",
    label: "Adaptief",
    vraagTekst: "Past het spel aan op basis van de situatie",
    isKern: false,
  },
  {
    id: "men_concentratie",
    pijlerCode: "MENTAAL",
    label: "Concentratie",
    vraagTekst: "Blijft geconcentreerd gedurende 60 minuten",
    isKern: false,
  },
  {
    id: "men_weerbaarheid",
    pijlerCode: "MENTAAL",
    label: "Weerbaarheid",
    vraagTekst: "Herstelt snel na tegenslagen",
    isKern: false,
  },
  {
    id: "men_leiderschap",
    pijlerCode: "MENTAAL",
    label: "Leiderschap",
    vraagTekst: "Neemt verantwoordelijkheid in moeilijke situaties",
    isKern: false,
  },
  {
    id: "soc_samenwerking",
    pijlerCode: "SOCIAAL",
    label: "Samenwerking",
    vraagTekst: "Stelt het team boven persoonlijk belang",
    isKern: false,
  },
  {
    id: "soc_teamsfeer",
    pijlerCode: "SOCIAAL",
    label: "Teamsfeer",
    vraagTekst: "Draagt bij aan een positieve sfeer",
    isKern: false,
  },
  {
    id: "soc_rolacceptatie",
    pijlerCode: "SOCIAAL",
    label: "Rolacceptatie",
    vraagTekst: "Accepteert de eigen rol en draagt bij",
    isKern: false,
  },
  {
    id: "soc_conflicthantering",
    pijlerCode: "SOCIAAL",
    label: "Conflicthantering",
    vraagTekst: "Gaat constructief om met meningsverschillen",
    isKern: false,
  },
  {
    id: "fys_uithouding",
    pijlerCode: "FYSIEK",
    label: "Uithouding",
    vraagTekst: "Houdt hoog niveau 60 minuten vol",
    isKern: false,
  },
  {
    id: "fys_kracht",
    pijlerCode: "FYSIEK",
    label: "Kracht",
    vraagTekst: "Zet kracht effectief in bij duels",
    isKern: false,
  },
  {
    id: "fys_beweeglijk",
    pijlerCode: "FYSIEK",
    label: "Beweeglijkheid",
    vraagTekst: "Verandert vlot van richting",
    isKern: false,
  },
];

const ITEMS_PER_GROEP: Record<LeeftijdsgroepNaamV3, ScoutingVraagV3[]> = {
  paars: [], // observatienotitie, geen items
  blauw: ITEMS_BLAUW,
  groen: ITEMS_GROEN,
  geel: ITEMS_GEEL,
  oranje: ITEMS_ORANJE,
  rood: ITEMS_ROOD,
};

// ─── V3 config functies ───

/**
 * Haal de volledige scoutingconfiguratie op voor een leeftijdsgroep.
 * Dit is de v3 versie met dynamische pijlers en kern/verdieping.
 */
export function getScoutingConfigV3(band: LeeftijdsgroepNaamV3): ScoutingGroepConfigV3 {
  const config = LEEFTIJDSGROEP_CONFIG[band];
  return {
    band,
    schaalType: config.schaalType,
    schaalMin: config.schaalMin,
    schaalMax: config.schaalMax,
    pijlers: config.pijlers,
    items: ITEMS_PER_GROEP[band],
    heeftFysiekProfiel: config.heeftFysiekProfiel,
    heeftSignaalvlag: config.heeftSignaalvlag,
    signaalvlagType: config.signaalvlagType,
  };
}

/**
 * Haal alleen de kern-items op (voor TEAM-methode).
 */
export function getKernItems(band: LeeftijdsgroepNaamV3): ScoutingVraagV3[] {
  return ITEMS_PER_GROEP[band].filter((item) => item.isKern);
}

/**
 * Groepeer items per pijler.
 */
export function itemsPerPijlerV3(
  band: LeeftijdsgroepNaamV3,
  kernOnly: boolean = false
): Record<string, ScoutingVraagV3[]> {
  const items = kernOnly ? getKernItems(band) : ITEMS_PER_GROEP[band];
  const result: Record<string, ScoutingVraagV3[]> = {};
  const config = LEEFTIJDSGROEP_CONFIG[band];

  // Initialiseer alle pijlers
  for (const p of config.pijlers) {
    result[p.code] = [];
  }

  for (const item of items) {
    if (result[item.pijlerCode]) {
      result[item.pijlerCode].push(item);
    }
  }

  return result;
}

// ─── Legacy exports (backward compatible) ───

/** @deprecated Gebruik ScoutingVraagV3 */
export interface ScoutingVraag {
  id: string;
  pijler: Pijler;
  label: string;
  vraagTekst: string;
}

/** @deprecated Gebruik ScoutingGroepConfigV3 */
export interface ScoutingGroepConfig {
  schaalType: SchaalType;
  maxScore: number;
  vragen: ScoutingVraag[];
}

// Legacy import (wordt niet meer actief gebruikt)
import { VRAGEN_PAARS_BLAUW, VRAGEN_GROEN } from "./vragen-data-jong";
import { VRAGEN_GEEL, VRAGEN_ORANJE } from "./vragen-data-oud";
import { VRAGEN_ROOD } from "./vragen-data-rood";

/** @deprecated Gebruik getScoutingConfigV3() */
export const SCOUTING_CONFIG: Record<LeeftijdsgroepNaam, ScoutingGroepConfig> = {
  paars: { schaalType: "smiley", maxScore: 3, vragen: VRAGEN_PAARS_BLAUW },
  blauw: { schaalType: "smiley", maxScore: 3, vragen: VRAGEN_PAARS_BLAUW },
  groen: { schaalType: "smiley", maxScore: 3, vragen: VRAGEN_GROEN },
  geel: { schaalType: "sterren", maxScore: 5, vragen: VRAGEN_GEEL },
  oranje: { schaalType: "sterren", maxScore: 5, vragen: VRAGEN_ORANJE },
  rood: { schaalType: "slider", maxScore: 99, vragen: VRAGEN_ROOD },
};

/** @deprecated Gebruik itemsPerPijlerV3() */
export function vragenPerPijler(groep: LeeftijdsgroepNaam): Record<Pijler, ScoutingVraag[]> {
  const config = SCOUTING_CONFIG[groep];
  const result: Record<Pijler, ScoutingVraag[]> = {
    SCH: [],
    AAN: [],
    PAS: [],
    VER: [],
    FYS: [],
    MEN: [],
  };
  for (const vraag of config.vragen) {
    result[vraag.pijler].push(vraag);
  }
  return result;
}

/** @deprecated Gebruik getPijlerCodes() */
export function actievePijlers(groep: LeeftijdsgroepNaam): Pijler[] {
  const perPijler = vragenPerPijler(groep);
  return (Object.keys(perPijler) as Pijler[]).filter((p) => perPijler[p].length > 0);
}
