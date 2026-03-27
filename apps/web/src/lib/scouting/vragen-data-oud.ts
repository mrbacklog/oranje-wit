import type { ScoutingVraag } from "./vragen";

// ─── Geel (leeftijd 10-12): 18 vragen, sterren-schaal (3 per pijler) ───

export const VRAGEN_GEEL: ScoutingVraag[] = [
  {
    id: "sch_afstandsschot",
    pijler: "SCH",
    label: "Afstandsschot",
    vraagTekst: "Schiet goed van afstand",
  },
  {
    id: "sch_doorloopbal",
    pijler: "SCH",
    label: "Doorloopbal",
    vraagTekst: "Maakt doorloopballen",
  },
  {
    id: "sch_schotkeuze",
    pijler: "SCH",
    label: "Schotkeuze",
    vraagTekst: "Kiest het juiste moment om te schieten",
  },
  {
    id: "aan_vrijlopen",
    pijler: "AAN",
    label: "Vrijlopen",
    vraagTekst: "Loopt slim vrij van de tegenstander",
  },
  {
    id: "aan_positie",
    pijler: "AAN",
    label: "Positiespel",
    vraagTekst: "Neemt goede posities in bij aanval",
  },
  {
    id: "aan_dreigen",
    pijler: "AAN",
    label: "Dreigen",
    vraagTekst: "Dreigt richting de korf",
  },
  {
    id: "pas_techniek",
    pijler: "PAS",
    label: "Passtechniek",
    vraagTekst: "Gooit technisch goed over",
  },
  {
    id: "pas_overzicht",
    pijler: "PAS",
    label: "Overzicht",
    vraagTekst: "Ziet vrije medespelers staan",
  },
  {
    id: "pas_balbehandeling",
    pijler: "PAS",
    label: "Balbehandeling",
    vraagTekst: "Vangt en verwerkt de bal goed",
  },
  {
    id: "ver_dekken",
    pijler: "VER",
    label: "Dekken",
    vraagTekst: "Dekt de tegenstander goed af",
  },
  {
    id: "ver_onderscheppen",
    pijler: "VER",
    label: "Onderscheppen",
    vraagTekst: "Onderschept ballen",
  },
  {
    id: "ver_positie",
    pijler: "VER",
    label: "Verdedigingspositie",
    vraagTekst: "Staat op de goede plek bij verdedigen",
  },
  {
    id: "fys_snelheid",
    pijler: "FYS",
    label: "Snelheid",
    vraagTekst: "Is snel in korte sprints",
  },
  {
    id: "fys_uithoudingsvermogen",
    pijler: "FYS",
    label: "Uithoudingsvermogen",
    vraagTekst: "Houdt het tempo de hele wedstrijd vol",
  },
  {
    id: "fys_beweeglijkheid",
    pijler: "FYS",
    label: "Beweeglijkheid",
    vraagTekst: "Beweegt soepel en wendbaar",
  },
  {
    id: "men_inzet",
    pijler: "MEN",
    label: "Inzet",
    vraagTekst: "Geeft altijd 100% inzet",
  },
  {
    id: "men_concentratie",
    pijler: "MEN",
    label: "Concentratie",
    vraagTekst: "Blijft geconcentreerd tijdens de wedstrijd",
  },
  {
    id: "men_coachbaarheid",
    pijler: "MEN",
    label: "Coachbaarheid",
    vraagTekst: "Neemt aanwijzingen goed aan",
  },
];

// ─── Oranje (leeftijd 13-15): 24 vragen, sterren-schaal (4 per pijler) ───

export const VRAGEN_ORANJE: ScoutingVraag[] = [
  {
    id: "sch_afstandsschot",
    pijler: "SCH",
    label: "Afstandsschot",
    vraagTekst: "Schiet goed en hard van afstand",
  },
  {
    id: "sch_doorloopbal",
    pijler: "SCH",
    label: "Doorloopbal",
    vraagTekst: "Maakt doorloopballen onder druk",
  },
  {
    id: "sch_schotkeuze",
    pijler: "SCH",
    label: "Schotkeuze",
    vraagTekst: "Kiest het juiste schot op het juiste moment",
  },
  {
    id: "sch_penalty",
    pijler: "SCH",
    label: "Strafworp",
    vraagTekst: "Scoort strafworpen betrouwbaar",
  },
  {
    id: "aan_vrijlopen",
    pijler: "AAN",
    label: "Vrijlopen",
    vraagTekst: "Loopt op het juiste moment vrij",
  },
  {
    id: "aan_positie",
    pijler: "AAN",
    label: "Positiespel",
    vraagTekst: "Neemt sterke aanvalsposities in",
  },
  {
    id: "aan_dreigen",
    pijler: "AAN",
    label: "Dreigen",
    vraagTekst: "Brengt de verdediging in problemen door te dreigen",
  },
  {
    id: "aan_omschakeling",
    pijler: "AAN",
    label: "Omschakeling",
    vraagTekst: "Schakelt snel om van verdediging naar aanval",
  },
  {
    id: "pas_techniek",
    pijler: "PAS",
    label: "Passtechniek",
    vraagTekst: "Geeft strakke, zuivere passes",
  },
  {
    id: "pas_overzicht",
    pijler: "PAS",
    label: "Overzicht",
    vraagTekst: "Heeft goed overzicht over het speelveld",
  },
  {
    id: "pas_besluitvorming",
    pijler: "PAS",
    label: "Besluitvorming",
    vraagTekst: "Maakt de juiste keuze: passen, schieten of vasthouden",
  },
  {
    id: "pas_balbehandeling",
    pijler: "PAS",
    label: "Balbehandeling",
    vraagTekst: "Controleert de bal onder druk",
  },
  {
    id: "ver_dekken",
    pijler: "VER",
    label: "Dekken",
    vraagTekst: "Dekt de directe tegenstander strak af",
  },
  {
    id: "ver_onderscheppen",
    pijler: "VER",
    label: "Onderscheppen",
    vraagTekst: "Leest het spel en onderschept ballen",
  },
  {
    id: "ver_rebound",
    pijler: "VER",
    label: "Rebound",
    vraagTekst: "Pakt rebounds na een schot",
  },
  {
    id: "ver_communicatie",
    pijler: "VER",
    label: "Verdedigingscommunicatie",
    vraagTekst: "Stuurt medespelers aan bij verdedigen",
  },
  {
    id: "fys_snelheid",
    pijler: "FYS",
    label: "Snelheid",
    vraagTekst: "Is explosief snel in sprints",
  },
  {
    id: "fys_uithoudingsvermogen",
    pijler: "FYS",
    label: "Uithoudingsvermogen",
    vraagTekst: "Houdt het hoge tempo de hele wedstrijd vol",
  },
  {
    id: "fys_kracht",
    pijler: "FYS",
    label: "Kracht",
    vraagTekst: "Zet het lichaam goed in bij duels",
  },
  {
    id: "fys_beweeglijkheid",
    pijler: "FYS",
    label: "Beweeglijkheid",
    vraagTekst: "Beweegt soepel en kan snel van richting veranderen",
  },
  {
    id: "men_inzet",
    pijler: "MEN",
    label: "Inzet",
    vraagTekst: "Geeft altijd maximale inzet",
  },
  {
    id: "men_concentratie",
    pijler: "MEN",
    label: "Concentratie",
    vraagTekst: "Blijft scherp in cruciale momenten",
  },
  {
    id: "men_leiderschap",
    pijler: "MEN",
    label: "Leiderschap",
    vraagTekst: "Neemt verantwoordelijkheid en stuurt anderen aan",
  },
  {
    id: "men_weerbaarheid",
    pijler: "MEN",
    label: "Weerbaarheid",
    vraagTekst: "Herstelt snel na tegenslagen",
  },
];
