/**
 * Seed-data voor de itemcatalogus — Vaardigheidsraamwerk v3.0
 *
 * Laadt alle pijlers, kern- en verdiepingsitems per leeftijdsgroep in de database.
 * Bron: docs/jeugdontwikkeling/vaardigheidsraamwerk-v3.md (sectie 4)
 *
 * Gebruik: npx tsx packages/database/prisma/seed-items.ts
 *
 * BELANGRIJK: Dit script maakt een RaamwerkVersie aan voor seizoen 2025-2026
 * en vult deze met alle leeftijdsgroepen, pijlers en items.
 */

import { prisma } from "@oranje-wit/database";
import { logger } from "@oranje-wit/types";

// prisma singleton uit @oranje-wit/database

// ============================================================
// Types
// ============================================================

interface PijlerDef {
  code: string;
  naam: string;
  icoon: string;
  blok: string | null;
  gewicht: number;
  volgorde: number;
}

interface ItemDef {
  itemCode: string;
  label: string;
  vraagTekst: string;
  isKern: boolean;
  categorie: string | null; // "KERN" | "ONDERSCHEIDEND" (alleen Rood)
  volgorde: number;
}

interface GroepDef {
  band: string;
  schaalType: string;
  maxScore: number;
  schaalMin: number;
  schaalMax: number;
  schaalMediaan: number;
  halveBereik: number;
  bandbreedteCoach: number;
  bandbreedteScout: number;
  kernItemsTarget: number;
  pijlers: (PijlerDef & { items: ItemDef[] })[];
}

// ============================================================
// Data: pijlers en items per leeftijdsgroep
// ============================================================

const PAARS: GroepDef = {
  band: "paars",
  schaalType: "observatie",
  maxScore: 1,
  schaalMin: 0,
  schaalMax: 1,
  schaalMediaan: 0.5,
  halveBereik: 0.5,
  bandbreedteCoach: 0,
  bandbreedteScout: 0,
  kernItemsTarget: 3,
  pijlers: [], // Paars heeft geen pijlers, observaties worden als losse items opgeslagen
};

const BLAUW: GroepDef = {
  band: "blauw",
  schaalType: "ja_nogniet",
  maxScore: 1,
  schaalMin: 0,
  schaalMax: 100,
  schaalMediaan: 50,
  halveBereik: 50,
  bandbreedteCoach: 15,
  bandbreedteScout: 18,
  kernItemsTarget: 10,
  pijlers: [
    {
      code: "BAL",
      naam: "Bal",
      icoon: "ball",
      blok: null,
      gewicht: 0.25,
      volgorde: 1,
      items: [
        {
          itemCode: "bal_gooien",
          label: "Gooien",
          vraagTekst: "Kan de bal gooien naar een ander",
          isKern: true,
          categorie: null,
          volgorde: 1,
        },
        {
          itemCode: "bal_vangen",
          label: "Vangen",
          vraagTekst: "Kan de bal vangen",
          isKern: true,
          categorie: null,
          volgorde: 2,
        },
      ],
    },
    {
      code: "BEWEGEN",
      naam: "Bewegen",
      icoon: "run",
      blok: null,
      gewicht: 0.25,
      volgorde: 2,
      items: [
        {
          itemCode: "bew_rennen",
          label: "Rennen",
          vraagTekst: "Rent en stopt zonder te vallen",
          isKern: true,
          categorie: null,
          volgorde: 1,
        },
        {
          itemCode: "bew_richting",
          label: "Richting veranderen",
          vraagTekst: "Kan van richting veranderen tijdens het bewegen",
          isKern: true,
          categorie: null,
          volgorde: 2,
        },
        {
          itemCode: "bew_energie",
          label: "Energie",
          vraagTekst: "Beweegt graag en veel; is actief en energiek",
          isKern: true,
          categorie: null,
          volgorde: 3,
        },
      ],
    },
    {
      code: "SPEL",
      naam: "Spel",
      icoon: "game",
      blok: null,
      gewicht: 0.25,
      volgorde: 3,
      items: [
        {
          itemCode: "spel_balbezit",
          label: "Balbezit begrijpen",
          vraagTekst: 'Begrijpt "wij hebben de bal / zij hebben de bal"',
          isKern: true,
          categorie: null,
          volgorde: 1,
        },
      ],
    },
    {
      code: "SAMEN",
      naam: "Samen",
      icoon: "team",
      blok: null,
      gewicht: 0.125,
      volgorde: 4,
      items: [
        {
          itemCode: "sam_samenspelen",
          label: "Samenspelen",
          vraagTekst: "Speelt samen met anderen (geeft de bal af)",
          isKern: true,
          categorie: null,
          volgorde: 1,
        },
        {
          itemCode: "sam_luisteren",
          label: "Luisteren",
          vraagTekst: "Luistert naar uitleg van de trainer",
          isKern: true,
          categorie: null,
          volgorde: 2,
        },
      ],
    },
    {
      code: "IK",
      naam: "Ik",
      icoon: "star",
      blok: null,
      gewicht: 0.125,
      volgorde: 5,
      items: [
        {
          itemCode: "ik_durft",
          label: "Durven",
          vraagTekst: "Durft mee te doen aan oefeningen en spelletjes",
          isKern: true,
          categorie: null,
          volgorde: 1,
        },
        {
          itemCode: "ik_plezier",
          label: "Plezier",
          vraagTekst: "Heeft zichtbaar plezier tijdens training of wedstrijd",
          isKern: true,
          categorie: null,
          volgorde: 2,
        },
      ],
    },
  ],
};

const GROEN: GroepDef = {
  band: "groen",
  schaalType: "goed_oke_nogniet",
  maxScore: 1,
  schaalMin: 0,
  schaalMax: 100,
  schaalMediaan: 50,
  halveBereik: 50,
  bandbreedteCoach: 18,
  bandbreedteScout: 22,
  kernItemsTarget: 10,
  pijlers: [
    {
      code: "BAL",
      naam: "Bal",
      icoon: "ball",
      blok: null,
      gewicht: 0.25,
      volgorde: 1,
      items: [
        {
          itemCode: "bal_schieten",
          label: "Schieten",
          vraagTekst: "Schiet op de korf",
          isKern: true,
          categorie: null,
          volgorde: 1,
        },
        {
          itemCode: "bal_gooien_vangen",
          label: "Gooien en vangen",
          vraagTekst: "Kan de bal goed gooien en vangen",
          isKern: true,
          categorie: null,
          volgorde: 2,
        },
        {
          itemCode: "bal_vrije_mede",
          label: "Vrije medespeler",
          vraagTekst: "Geeft de bal aan een vrije medespeler",
          isKern: false,
          categorie: null,
          volgorde: 3,
        },
      ],
    },
    {
      code: "BEWEGEN",
      naam: "Bewegen",
      icoon: "run",
      blok: null,
      gewicht: 0.25,
      volgorde: 2,
      items: [
        {
          itemCode: "bew_vrijlopen",
          label: "Vrijlopen",
          vraagTekst: "Loopt vrij van de tegenstander",
          isKern: true,
          categorie: null,
          volgorde: 1,
        },
        {
          itemCode: "bew_positie",
          label: "Positie",
          vraagTekst: "Staat op goede plekken in het vak",
          isKern: false,
          categorie: null,
          volgorde: 2,
        },
        {
          itemCode: "bew_snel",
          label: "Snel",
          vraagTekst: "Is snel en beweeglijk",
          isKern: true,
          categorie: null,
          volgorde: 3,
        },
        {
          itemCode: "bew_uithouding",
          label: "Uithouding",
          vraagTekst: "Houdt het tempo vol tijdens de hele wedstrijd",
          isKern: false,
          categorie: null,
          volgorde: 4,
        },
      ],
    },
    {
      code: "SPEL",
      naam: "Spel",
      icoon: "game",
      blok: null,
      gewicht: 0.25,
      volgorde: 3,
      items: [
        {
          itemCode: "spel_schotkeuze",
          label: "Schotkeuze",
          vraagTekst: "Schiet als er ruimte is (niet als tegenstander ervoor staat)",
          isKern: true,
          categorie: null,
          volgorde: 1,
        },
        {
          itemCode: "spel_bal_afpakken",
          label: "Bal afpakken",
          vraagTekst: "Probeert de bal af te pakken",
          isKern: false,
          categorie: null,
          volgorde: 2,
        },
        {
          itemCode: "spel_meelopen",
          label: "Meelopen",
          vraagTekst: "Verdedigt actief (loopt mee met tegenstander)",
          isKern: true,
          categorie: null,
          volgorde: 3,
        },
      ],
    },
    {
      code: "SAMEN",
      naam: "Samen",
      icoon: "team",
      blok: null,
      gewicht: 0.125,
      volgorde: 4,
      items: [
        {
          itemCode: "sam_samenspelen",
          label: "Samenspelen",
          vraagTekst: "Speelt samen in aanval; zoekt de combinatie",
          isKern: true,
          categorie: null,
          volgorde: 1,
        },
        {
          itemCode: "sam_communicatie",
          label: "Communicatie",
          vraagTekst: "Praat met teamgenoten bij het verdedigen",
          isKern: true,
          categorie: null,
          volgorde: 2,
        },
      ],
    },
    {
      code: "IK",
      naam: "Ik",
      icoon: "star",
      blok: null,
      gewicht: 0.125,
      volgorde: 5,
      items: [
        {
          itemCode: "ik_doorzetten",
          label: "Doorzetten",
          vraagTekst: "Probeert het opnieuw na een mislukte actie",
          isKern: true,
          categorie: null,
          volgorde: 1,
        },
        {
          itemCode: "ik_omgaan_verliezen",
          label: "Omgaan met verliezen",
          vraagTekst: "Gaat goed om met verliezen",
          isKern: true,
          categorie: null,
          volgorde: 2,
        },
      ],
    },
  ],
};

const GEEL: GroepDef = {
  band: "geel",
  schaalType: "sterren",
  maxScore: 5,
  schaalMin: 1,
  schaalMax: 5,
  schaalMediaan: 3,
  halveBereik: 2,
  bandbreedteCoach: 20,
  bandbreedteScout: 28,
  kernItemsTarget: 10,
  pijlers: [
    {
      code: "AANVALLEN",
      naam: "Aanvallen",
      icoon: "zap",
      blok: "korfbalacties",
      gewicht: 0.18,
      volgorde: 1,
      items: [
        {
          itemCode: "aan_vrijlopen",
          label: "Vrijlopen",
          vraagTekst: "Loopt slim vrij van de tegenstander",
          isKern: true,
          categorie: null,
          volgorde: 1,
        },
        {
          itemCode: "aan_positie",
          label: "Positie",
          vraagTekst: "Neemt goede posities in bij aanval",
          isKern: false,
          categorie: null,
          volgorde: 2,
        },
        {
          itemCode: "aan_dreigen",
          label: "Dreigen",
          vraagTekst: "Dreigt richting de korf (dwingt verdediger tot keuze)",
          isKern: false,
          categorie: null,
          volgorde: 3,
        },
        {
          itemCode: "aan_balbezit",
          label: "Balbezit",
          vraagTekst: "Houdt de bal vast onder druk van de tegenstander",
          isKern: true,
          categorie: null,
          volgorde: 4,
        },
        {
          itemCode: "aan_omschakeling",
          label: "Omschakeling",
          vraagTekst: "Schakelt snel over naar aanval na balverovering",
          isKern: false,
          categorie: null,
          volgorde: 5,
        },
      ],
    },
    {
      code: "VERDEDIGEN",
      naam: "Verdedigen",
      icoon: "shield",
      blok: "korfbalacties",
      gewicht: 0.18,
      volgorde: 2,
      items: [
        {
          itemCode: "ver_dekken",
          label: "Dekken",
          vraagTekst: "Dekt de tegenstander goed af",
          isKern: true,
          categorie: null,
          volgorde: 1,
        },
        {
          itemCode: "ver_onderscheppen",
          label: "Onderscheppen",
          vraagTekst: "Onderschept ballen (leest de passing-lijn)",
          isKern: false,
          categorie: null,
          volgorde: 2,
        },
        {
          itemCode: "ver_druk",
          label: "Druk zetten",
          vraagTekst: "Maakt het de schutter moeilijk door druk te zetten",
          isKern: false,
          categorie: null,
          volgorde: 3,
        },
        {
          itemCode: "ver_bal_veroveren",
          label: "Bal veroveren",
          vraagTekst: "Probeert de bal te veroveren",
          isKern: true,
          categorie: null,
          volgorde: 4,
        },
        {
          itemCode: "ver_meebewegen",
          label: "Meebewegen",
          vraagTekst: "Beweegt mee met de tegenstander (voetwerk)",
          isKern: false,
          categorie: null,
          volgorde: 5,
        },
      ],
    },
    {
      code: "TECHNIEK",
      naam: "Techniek",
      icoon: "target",
      blok: "spelerskwaliteiten",
      gewicht: 0.18,
      volgorde: 3,
      items: [
        {
          itemCode: "tec_schieten",
          label: "Schieten",
          vraagTekst: "Schiet goed van afstand (techniek, kracht)",
          isKern: true,
          categorie: null,
          volgorde: 1,
        },
        {
          itemCode: "tec_doorloopbal",
          label: "Doorloopbal",
          vraagTekst: "Maakt doorloopballen (timing, afzet)",
          isKern: false,
          categorie: null,
          volgorde: 2,
        },
        {
          itemCode: "tec_passen",
          label: "Passen",
          vraagTekst: "Gooit technisch goed over (strak, zuiver)",
          isKern: true,
          categorie: null,
          volgorde: 3,
        },
        {
          itemCode: "tec_balbehandeling",
          label: "Balbehandeling",
          vraagTekst: "Vangt en verwerkt de bal goed",
          isKern: false,
          categorie: null,
          volgorde: 4,
        },
      ],
    },
    {
      code: "TACTIEK",
      naam: "Tactiek",
      icoon: "puzzle",
      blok: "spelerskwaliteiten",
      gewicht: 0.18,
      volgorde: 4,
      items: [
        {
          itemCode: "tac_schotkeuze",
          label: "Schotkeuze",
          vraagTekst: "Kiest het juiste moment om te schieten",
          isKern: true,
          categorie: null,
          volgorde: 1,
        },
        {
          itemCode: "tac_overzicht",
          label: "Overzicht",
          vraagTekst: "Ziet vrije medespelers staan",
          isKern: false,
          categorie: null,
          volgorde: 2,
        },
        {
          itemCode: "tac_samenspel",
          label: "Samenspel",
          vraagTekst: "Zoekt de combinatie; speelt de bal naar een beter staande medespeler",
          isKern: false,
          categorie: null,
          volgorde: 3,
        },
      ],
    },
    {
      code: "MENTAAL",
      naam: "Mentaal",
      icoon: "brain",
      blok: "spelerskwaliteiten",
      gewicht: 0.14,
      volgorde: 5,
      items: [
        {
          itemCode: "men_inzet",
          label: "Inzet",
          vraagTekst: "Laat zichtbare inspanning zien, ook in het laatste kwart",
          isKern: true,
          categorie: null,
          volgorde: 1,
        },
        {
          itemCode: "men_concentratie",
          label: "Concentratie",
          vraagTekst: "Maakt geen fouten door onoplettendheid; blijft bij de les",
          isKern: false,
          categorie: null,
          volgorde: 2,
        },
        {
          itemCode: "men_coachbaarheid",
          label: "Coachbaarheid",
          vraagTekst: "Probeert het anders na feedback van de trainer",
          isKern: false,
          categorie: null,
          volgorde: 3,
        },
        {
          itemCode: "men_plezier",
          label: "Plezier",
          vraagTekst: "Lacht, moedigt anderen aan, komt graag naar training",
          isKern: true,
          categorie: null,
          volgorde: 4,
        },
        {
          itemCode: "men_herstelt",
          label: "Herstel na fout",
          vraagTekst: "Gaat verder met de volgende actie na een fout; treurt niet lang",
          isKern: false,
          categorie: null,
          volgorde: 5,
        },
      ],
    },
    {
      code: "FYSIEK",
      naam: "Fysiek",
      icoon: "muscle",
      blok: "spelerskwaliteiten",
      gewicht: 0.14,
      volgorde: 6,
      items: [
        {
          itemCode: "fys_snelheid",
          label: "Snelheid",
          vraagTekst: "Is snel in korte sprints",
          isKern: true,
          categorie: null,
          volgorde: 1,
        },
        {
          itemCode: "fys_uithoudingsvermogen",
          label: "Uithouding",
          vraagTekst: "Houdt het tempo de hele wedstrijd vol",
          isKern: false,
          categorie: null,
          volgorde: 2,
        },
        {
          itemCode: "fys_beweeglijkheid",
          label: "Beweeglijkheid",
          vraagTekst: "Beweegt soepel en wendbaar",
          isKern: false,
          categorie: null,
          volgorde: 3,
        },
      ],
    },
  ],
};

const ORANJE: GroepDef = {
  band: "oranje",
  schaalType: "slider",
  maxScore: 10,
  schaalMin: 1,
  schaalMax: 10,
  schaalMediaan: 5.5,
  halveBereik: 4.5,
  bandbreedteCoach: 22,
  bandbreedteScout: 30,
  kernItemsTarget: 10,
  pijlers: [
    {
      code: "AANVALLEN",
      naam: "Aanvallen",
      icoon: "zap",
      blok: "korfbalacties",
      gewicht: 0.16,
      volgorde: 1,
      items: [
        {
          itemCode: "aan_vrijlopen",
          label: "Vrijlopen",
          vraagTekst: "Loopt op het juiste moment vrij (timing + misleiding)",
          isKern: true,
          categorie: null,
          volgorde: 1,
        },
        {
          itemCode: "aan_positie",
          label: "Positie",
          vraagTekst: "Neemt sterke aanvalsposities in (diepte, aanspeelbaarheid)",
          isKern: false,
          categorie: null,
          volgorde: 2,
        },
        {
          itemCode: "aan_dreigen",
          label: "Dreigen",
          vraagTekst: "Brengt de verdediging in problemen door te dreigen (schot/doorloop dilemma)",
          isKern: false,
          categorie: null,
          volgorde: 3,
        },
        {
          itemCode: "aan_zonder_bal",
          label: "Zonder bal",
          vraagTekst: "Beweegt doelgericht ook zonder bal, houdt de verdediger bezig",
          isKern: false,
          categorie: null,
          volgorde: 4,
        },
        {
          itemCode: "aan_balbezit",
          label: "Balbezit",
          vraagTekst: "Beschermt de bal onder druk, draait weg van verdediger",
          isKern: false,
          categorie: null,
          volgorde: 5,
        },
        {
          itemCode: "aan_omschakeling",
          label: "Omschakeling",
          vraagTekst: "Schakelt snel om van verdediging naar aanval (mentale switch)",
          isKern: false,
          categorie: null,
          volgorde: 6,
        },
      ],
    },
    {
      code: "VERDEDIGEN",
      naam: "Verdedigen",
      icoon: "shield",
      blok: "korfbalacties",
      gewicht: 0.16,
      volgorde: 2,
      items: [
        {
          itemCode: "ver_dekken",
          label: "Dekken",
          vraagTekst: "Dekt de directe tegenstander strak af (positie, contact, discipline)",
          isKern: true,
          categorie: null,
          volgorde: 1,
        },
        {
          itemCode: "ver_onderscheppen",
          label: "Onderscheppen",
          vraagTekst: "Leest het spel en onderschept ballen, anticipeert op passes",
          isKern: false,
          categorie: null,
          volgorde: 2,
        },
        {
          itemCode: "ver_druk",
          label: "Druk zetten",
          vraagTekst: "Zet druk op de balbezitter bij schietpositie",
          isKern: false,
          categorie: null,
          volgorde: 3,
        },
        {
          itemCode: "ver_rebound",
          label: "Rebound",
          vraagTekst: "Pakt rebounds na een schot (positie, timing)",
          isKern: false,
          categorie: null,
          volgorde: 4,
        },
        {
          itemCode: "ver_communicatie",
          label: "Communicatie",
          vraagTekst: "Stuurt medespelers aan bij verdedigen (roept, waarschuwt)",
          isKern: false,
          categorie: null,
          volgorde: 5,
        },
        {
          itemCode: "ver_omschakeling",
          label: "Omschakeling",
          vraagTekst: "Schakelt snel om van aanval naar verdediging na balverlies",
          isKern: true,
          categorie: null,
          volgorde: 6,
        },
      ],
    },
    {
      code: "TECHNIEK",
      naam: "Techniek",
      icoon: "target",
      blok: "spelerskwaliteiten",
      gewicht: 0.16,
      volgorde: 3,
      items: [
        {
          itemCode: "tec_afstandsschot",
          label: "Afstandsschot",
          vraagTekst: "Schiet goed en hard van afstand, ook vanuit beweging",
          isKern: true,
          categorie: null,
          volgorde: 1,
        },
        {
          itemCode: "tec_doorloopbal",
          label: "Doorloopbal",
          vraagTekst: "Maakt doorloopballen links en rechts onder lichte druk",
          isKern: false,
          categorie: null,
          volgorde: 2,
        },
        {
          itemCode: "tec_schottechniek",
          label: "Schottechniek",
          vraagTekst: "Heeft een zuivere, herhaalbare schietbeweging",
          isKern: false,
          categorie: null,
          volgorde: 3,
        },
        {
          itemCode: "tec_passtechniek",
          label: "Passtechniek",
          vraagTekst: "Geeft strakke, zuivere passes over korte en lange afstand",
          isKern: false,
          categorie: null,
          volgorde: 4,
        },
        {
          itemCode: "tec_balbehandeling",
          label: "Balbehandeling",
          vraagTekst: "Controleert de bal onder druk (twee handen, een hand, in beweging)",
          isKern: false,
          categorie: null,
          volgorde: 5,
        },
        {
          itemCode: "tec_aanname",
          label: "Aanname",
          vraagTekst: "Neemt de bal aan terwijl hij/zij in beweging is, kan direct doorspelen",
          isKern: false,
          categorie: null,
          volgorde: 6,
        },
      ],
    },
    {
      code: "TACTIEK",
      naam: "Tactiek",
      icoon: "puzzle",
      blok: "spelerskwaliteiten",
      gewicht: 0.16,
      volgorde: 4,
      items: [
        {
          itemCode: "tac_schotkeuze",
          label: "Schotkeuze",
          vraagTekst: "Kiest het juiste schot op het juiste moment",
          isKern: false,
          categorie: null,
          volgorde: 1,
        },
        {
          itemCode: "tac_overzicht",
          label: "Overzicht",
          vraagTekst: "Heeft goed overzicht over het speelveld, ziet meerdere opties",
          isKern: false,
          categorie: null,
          volgorde: 2,
        },
        {
          itemCode: "tac_besluitvorming",
          label: "Besluitvorming",
          vraagTekst: "Maakt de juiste keuze: passen, schieten of vasthouden",
          isKern: true,
          categorie: null,
          volgorde: 3,
        },
        {
          itemCode: "tac_samenspel",
          label: "Samenspel",
          vraagTekst: "Zoekt de combinatie en geeft de extra pass als een medespeler beter staat",
          isKern: false,
          categorie: null,
          volgorde: 4,
        },
        {
          itemCode: "tac_tempo",
          label: "Tempo",
          vraagTekst: "Past het tempo aan: versnelt bij overmacht, vertraagt als het nodig is",
          isKern: false,
          categorie: null,
          volgorde: 5,
        },
      ],
    },
    {
      code: "MENTAAL",
      naam: "Mentaal",
      icoon: "brain",
      blok: "persoonlijk",
      gewicht: 0.12,
      volgorde: 5,
      items: [
        {
          itemCode: "men_inzet",
          label: "Inzet",
          vraagTekst: "Geeft maximale inzet ongeacht de stand of de tegenstander",
          isKern: true,
          categorie: null,
          volgorde: 1,
        },
        {
          itemCode: "men_concentratie",
          label: "Concentratie",
          vraagTekst: "Blijft scherp in cruciale momenten; laat zich niet afleiden",
          isKern: false,
          categorie: null,
          volgorde: 2,
        },
        {
          itemCode: "men_weerbaarheid",
          label: "Weerbaarheid",
          vraagTekst: "Herstelt zichtbaar snel na tegenslagen; fouten werken niet door",
          isKern: false,
          categorie: null,
          volgorde: 3,
        },
        {
          itemCode: "men_leiderschap",
          label: "Leiderschap",
          vraagTekst:
            "Stuurt medespelers aan met concrete aanwijzingen; vraagt de bal in druksituaties",
          isKern: false,
          categorie: null,
          volgorde: 4,
        },
        {
          itemCode: "men_groei",
          label: "Groei",
          vraagTekst: "Zoekt uitdaging en leert van feedback; kiest de moeilijke oefening",
          isKern: false,
          categorie: null,
          volgorde: 5,
        },
        {
          itemCode: "men_plezier",
          label: "Plezier",
          vraagTekst: "Straalt plezier uit tijdens training en wedstrijd; reageert enthousiast",
          isKern: true,
          categorie: null,
          volgorde: 6,
        },
      ],
    },
    {
      code: "SOCIAAL",
      naam: "Sociaal",
      icoon: "users",
      blok: "persoonlijk",
      gewicht: 0.12,
      volgorde: 6,
      items: [
        {
          itemCode: "soc_communicatie",
          label: "Communicatie",
          vraagTekst:
            "Communiceert duidelijk op het veld; roept vrijlopen aan, waarschuwt voor lopers",
          isKern: true,
          categorie: null,
          volgorde: 1,
        },
        {
          itemCode: "soc_samenwerking",
          label: "Samenwerking",
          vraagTekst: "Zoekt de combinatie en geeft de extra pass als een medespeler beter staat",
          isKern: false,
          categorie: null,
          volgorde: 2,
        },
        {
          itemCode: "soc_teamsfeer",
          label: "Teamsfeer",
          vraagTekst: "Viert doelpunten van anderen; staat naast een medespeler die een fout maakt",
          isKern: false,
          categorie: null,
          volgorde: 3,
        },
        {
          itemCode: "soc_rolacceptatie",
          label: "Rolacceptatie",
          vraagTekst:
            "Klaagt niet als hij/zij in een ondersteunende rol speelt; teambelang boven eigenbelang",
          isKern: false,
          categorie: null,
          volgorde: 4,
        },
        {
          itemCode: "soc_conflicthantering",
          label: "Conflicthantering",
          vraagTekst: "Lost meningsverschillen op het veld constructief op; zoekt de dialoog",
          isKern: false,
          categorie: null,
          volgorde: 5,
        },
        {
          itemCode: "soc_veiligheid",
          label: "Sociale veiligheid",
          vraagTekst: "Voelt zich veilig om risico's te nemen en fouten te maken",
          isKern: false,
          categorie: null,
          volgorde: 6,
        },
      ],
    },
    {
      code: "FYSIEK",
      naam: "Fysiek",
      icoon: "muscle",
      blok: "persoonlijk",
      gewicht: 0.12,
      volgorde: 7,
      items: [
        {
          itemCode: "fys_snelheid",
          label: "Snelheid",
          vraagTekst: "Is explosief snel in de eerste meters en bij vrijlopen",
          isKern: true,
          categorie: null,
          volgorde: 1,
        },
        {
          itemCode: "fys_uithoudingsvermogen",
          label: "Uithouding",
          vraagTekst: "Presteert op gelijk niveau in het eerste en laatste kwart",
          isKern: false,
          categorie: null,
          volgorde: 2,
        },
        {
          itemCode: "fys_beweeglijkheid",
          label: "Beweeglijkheid",
          vraagTekst: "Verandert snel van richting zonder snelheidsverlies",
          isKern: false,
          categorie: null,
          volgorde: 3,
        },
        {
          itemCode: "fys_kracht",
          label: "Kracht",
          vraagTekst: "Zet het lichaam goed in bij duels en bij het schieten",
          isKern: false,
          categorie: null,
          volgorde: 4,
        },
        {
          itemCode: "fys_actiesnelheid",
          label: "Actiesnelheid",
          vraagTekst: "Handelt snel in spelsituaties: ziet de kans en voert direct uit",
          isKern: false,
          categorie: null,
          volgorde: 5,
        },
      ],
    },
  ],
};

const ROOD: GroepDef = {
  band: "rood",
  schaalType: "slider",
  maxScore: 10,
  schaalMin: 1,
  schaalMax: 10,
  schaalMediaan: 5.5,
  halveBereik: 4.5,
  bandbreedteCoach: 25,
  bandbreedteScout: 32,
  kernItemsTarget: 9,
  pijlers: [
    {
      code: "AANVALLEN",
      naam: "Aanvallen",
      icoon: "zap",
      blok: "korfbalacties",
      gewicht: 0.12,
      volgorde: 1,
      items: [
        {
          itemCode: "aan_vrijlopen",
          label: "Vrijlopen",
          vraagTekst:
            "Creert ruimte door slim vrij te lopen: in-uit, V-loop, achterdeur, met optimale timing",
          isKern: true,
          categorie: "KERN",
          volgorde: 1,
        },
        {
          itemCode: "aan_positie",
          label: "Positie",
          vraagTekst:
            "Neemt dominante aanvalsposities in: voor/achter korf, creert diepte, altijd aanspeelbaar",
          isKern: false,
          categorie: "KERN",
          volgorde: 2,
        },
        {
          itemCode: "aan_dreigen",
          label: "Dreigen",
          vraagTekst:
            "Dwingt verdedigers in onmogelijke keuzes: schot/doorloop dilemma constant aanwezig",
          isKern: false,
          categorie: "KERN",
          volgorde: 3,
        },
        {
          itemCode: "aan_zonder_bal",
          label: "Zonder bal",
          vraagTekst:
            "Beweegt continu doelgericht zonder bal: creert ruimte voor anderen, trekt verdedigers weg",
          isKern: false,
          categorie: "KERN",
          volgorde: 4,
        },
        {
          itemCode: "aan_spelcreatie",
          label: "Spelcreatie",
          vraagTekst:
            "Creert kansen voor medespelers, is de regisseur van de aanval, dicteert het tempo",
          isKern: false,
          categorie: "ONDERSCHEIDEND",
          volgorde: 5,
        },
        {
          itemCode: "aan_1_op_1",
          label: "1-op-1",
          vraagTekst:
            "Wint individuele duels door snelheid, lichaamstaal of schijnbeweging, dwingt strafworpen af",
          isKern: false,
          categorie: "ONDERSCHEIDEND",
          volgorde: 6,
        },
        {
          itemCode: "aan_balbezit",
          label: "Balbezit",
          vraagTekst:
            "Beschermt de bal foutloos onder hoge druk; draait weg, schermt af, lichaam als schild",
          isKern: false,
          categorie: "KERN",
          volgorde: 7,
        },
        {
          itemCode: "aan_omschakeling_va",
          label: "Omschakeling V->A",
          vraagTekst:
            "Schakelt razendsnel om na balverovering, sprint naar aanvalsvak of geeft de snelle lange pass",
          isKern: false,
          categorie: "KERN",
          volgorde: 8,
        },
      ],
    },
    {
      code: "VERDEDIGEN",
      naam: "Verdedigen",
      icoon: "shield",
      blok: "korfbalacties",
      gewicht: 0.12,
      volgorde: 2,
      items: [
        {
          itemCode: "ver_dekken",
          label: "Dekken",
          vraagTekst:
            "Dekt de tegenstander strak en gedisciplineerd, blijft tussen tegenstander en korf, zonder overtredingen",
          isKern: true,
          categorie: "KERN",
          volgorde: 1,
        },
        {
          itemCode: "ver_onderscheppen",
          label: "Onderscheppen",
          vraagTekst: "Anticipeert en onderschept gevaarlijke ballen, leest passing lanes",
          isKern: false,
          categorie: "KERN",
          volgorde: 2,
        },
        {
          itemCode: "ver_druk_zetten",
          label: "Druk zetten",
          vraagTekst:
            "Zet continu druk op de balbezitter, maakt het moeilijk om te passen of te schieten",
          isKern: false,
          categorie: "KERN",
          volgorde: 3,
        },
        {
          itemCode: "ver_rebound",
          label: "Rebound",
          vraagTekst:
            "Domineert de rebound-zone: goede positie, timing, box-out, zet direct de omschakeling in",
          isKern: false,
          categorie: "KERN",
          volgorde: 4,
        },
        {
          itemCode: "ver_omschakeling_av",
          label: "Omschakeling A->V",
          vraagTekst:
            "Na balverlies onmiddellijk terug in verdedigende modus, pakt de dichtstbijzijnde tegenstander",
          isKern: false,
          categorie: "KERN",
          volgorde: 5,
        },
        {
          itemCode: "ver_discipline",
          label: "Discipline",
          vraagTekst:
            "Blijft gedisciplineerd verdedigen ook bij achterstand of frustratie, geen onnodige overtredingen",
          isKern: false,
          categorie: "KERN",
          volgorde: 6,
        },
        {
          itemCode: "ver_communicatie",
          label: "Communicatie",
          vraagTekst:
            "Organiseert de verdediging door constant te communiceren: wissels, lopers, dekkingsafspraken",
          isKern: false,
          categorie: "ONDERSCHEIDEND",
          volgorde: 7,
        },
        {
          itemCode: "ver_blok",
          label: "Blok",
          vraagTekst:
            "Blokkeert effectief schoten door timing, onderscheidt echt schot van schijnbeweging",
          isKern: false,
          categorie: "ONDERSCHEIDEND",
          volgorde: 8,
        },
        {
          itemCode: "ver_helpverdediging",
          label: "Helpverdediging",
          vraagTekst:
            "Helpt uit bij doorbraak, schuift en roteert mee zonder eigen tegenstander volledig los te laten",
          isKern: false,
          categorie: "ONDERSCHEIDEND",
          volgorde: 9,
        },
      ],
    },
    {
      code: "SCOREN",
      naam: "Scoren",
      icoon: "target",
      blok: "korfbalacties",
      gewicht: 0.12,
      volgorde: 3,
      items: [
        {
          itemCode: "sco_afstandsschot",
          label: "Afstandsschot",
          vraagTekst:
            "Schiet krachtig en geplaatst van afstand, droog en uit de beweging, scoort consistent",
          isKern: true,
          categorie: "KERN",
          volgorde: 1,
        },
        {
          itemCode: "sco_doorloopbal",
          label: "Doorloopbal",
          vraagTekst:
            "Maakt doorloopballen onder hoge druk, vanuit verschillende hoeken, links- en rechtshandig",
          isKern: false,
          categorie: "KERN",
          volgorde: 2,
        },
        {
          itemCode: "sco_strafworp",
          label: "Strafworp",
          vraagTekst:
            "Scoort strafworpen onder druk, heeft een vaste routine, laat zich niet afleiden",
          isKern: false,
          categorie: "KERN",
          volgorde: 3,
        },
        {
          itemCode: "sco_variatie",
          label: "Schotvariatie",
          vraagTekst:
            "Heeft meerdere schotvormen in het arsenaal (draaibal, lob, scoop, schijnschot)",
          isKern: false,
          categorie: "ONDERSCHEIDEND",
          volgorde: 4,
        },
        {
          itemCode: "sco_scorend_vermogen",
          label: "Scorend vermogen",
          vraagTekst:
            "Is klinisch in de afronding: scoort in beslissende momenten, mist zelden vrije kansen",
          isKern: false,
          categorie: "ONDERSCHEIDEND",
          volgorde: 5,
        },
        {
          itemCode: "sco_na_dreiging",
          label: "Scoren na dreiging",
          vraagTekst:
            "Schiet effectief direct na een dreigactie (schijnbeweging, aanbieden, terugtrekken)",
          isKern: false,
          categorie: "ONDERSCHEIDEND",
          volgorde: 6,
        },
        {
          itemCode: "sco_kracht",
          label: "Schotkracht",
          vraagTekst: "Heeft voldoende schotkracht vanuit een stabiele positie, ook vermoeid",
          isKern: false,
          categorie: "KERN",
          volgorde: 7,
        },
      ],
    },
    {
      code: "TECHNIEK",
      naam: "Techniek",
      icoon: "wrench",
      blok: "spelerskwaliteiten",
      gewicht: 0.12,
      volgorde: 4,
      items: [
        {
          itemCode: "tec_schottechniek",
          label: "Schottechniek",
          vraagTekst:
            "Schiet met een stabiele, herhaalbare techniek, ook onder fysieke druk en vermoeidheid",
          isKern: false,
          categorie: "KERN",
          volgorde: 1,
        },
        {
          itemCode: "tec_passtechniek",
          label: "Passtechniek",
          vraagTekst:
            "Geeft technisch perfecte passes: borst, overhand, pols, bodem, getimed en op snelheid",
          isKern: true,
          categorie: "KERN",
          volgorde: 2,
        },
        {
          itemCode: "tec_balbehandeling",
          label: "Balbehandeling",
          vraagTekst:
            "Controleert de bal foutloos onder hoge druk, vangt met twee handen en een hand",
          isKern: false,
          categorie: "KERN",
          volgorde: 3,
        },
        {
          itemCode: "tec_aanname",
          label: "Aanname",
          vraagTekst:
            "Neemt de bal in volle sprint feilloos aan, de aanname is onderdeel van de actie",
          isKern: false,
          categorie: "KERN",
          volgorde: 4,
        },
        {
          itemCode: "tec_eenhandig",
          label: "Eenhandig",
          vraagTekst:
            "Kan de bal met een hand controleren, passen en afronden, vergroot het speelbare bereik",
          isKern: false,
          categorie: "ONDERSCHEIDEND",
          volgorde: 5,
        },
        {
          itemCode: "tec_verdedigingshouding",
          label: "Verdedigingshouding",
          vraagTekst:
            "Verdedigt uitdagend: actieve schijnkant, goede voetverplaatsing, drukkend meebewegen",
          isKern: false,
          categorie: "KERN",
          volgorde: 6,
        },
      ],
    },
    {
      code: "TACTIEK",
      naam: "Tactiek",
      icoon: "puzzle",
      blok: "spelerskwaliteiten",
      gewicht: 0.1,
      volgorde: 5,
      items: [
        {
          itemCode: "tac_aanvalspatronen",
          label: "Aanvalspatronen",
          vraagTekst:
            "Kent standaard aanvalsopstellingen (4-0, 3-1, wissel), past aan op tegenstander",
          isKern: false,
          categorie: "KERN",
          volgorde: 1,
        },
        {
          itemCode: "tac_verdedigingsvorm",
          label: "Verdedigingsvorm",
          vraagTekst:
            "Herkent de aanvalsopstelling van de tegenstander en past de eigen verdediging aan",
          isKern: false,
          categorie: "ONDERSCHEIDEND",
          volgorde: 2,
        },
        {
          itemCode: "tac_samenspel",
          label: "Samenspel",
          vraagTekst:
            "Speelt het team beter; zoekt de combinatie; stelt teambelang boven persoonlijke statistieken",
          isKern: false,
          categorie: "KERN",
          volgorde: 3,
        },
        {
          itemCode: "tac_tempo",
          label: "Tempo",
          vraagTekst:
            "Bepaalt het tempo van de aanval: versnelt bij overmacht, vertraagt als verdediging georganiseerd is",
          isKern: false,
          categorie: "ONDERSCHEIDEND",
          volgorde: 4,
        },
        {
          itemCode: "tac_besluitvorming",
          label: "Besluitvorming",
          vraagTekst: "Maakt onder druk de juiste keuze",
          isKern: true,
          categorie: "KERN",
          volgorde: 5,
        },
      ],
    },
    {
      code: "SPELINTELLIGENTIE",
      naam: "Spelintelligentie",
      icoon: "brain",
      blok: "spelerskwaliteiten",
      gewicht: 0.1,
      volgorde: 6,
      items: [
        {
          itemCode: "spi_spellezing",
          label: "Spellezing",
          vraagTekst:
            "Leest het spel voortdurend: herkent de opstellingsvorm, ziet ruimtes ontstaan, voorspelt de volgende actie",
          isKern: true,
          categorie: "KERN",
          volgorde: 1,
        },
        {
          itemCode: "spi_anticipatie",
          label: "Anticipatie",
          vraagTekst:
            "Reageert niet op wat er gebeurt, maar op wat er gaat gebeuren; staat al op de juiste plek",
          isKern: false,
          categorie: "KERN",
          volgorde: 2,
        },
        {
          itemCode: "spi_besluitvorming",
          label: "Besluitvorming",
          vraagTekst:
            "Maakt in een fractie van een seconde de juiste keuze; kiest in 80%+ van de gevallen de beste optie",
          isKern: false,
          categorie: "KERN",
          volgorde: 3,
        },
        {
          itemCode: "spi_patronenherkenning",
          label: "Patronenherkenning",
          vraagTekst:
            "Herkent aanvalspatronen van de tegenstander al na 2-3 balbezittingen en past de dekking aan",
          isKern: false,
          categorie: "ONDERSCHEIDEND",
          volgorde: 4,
        },
        {
          itemCode: "spi_adaptief",
          label: "Adaptief",
          vraagTekst:
            "Past het eigen spel aan op de tegenstander, de omstandigheden en de wedstrijdsituatie",
          isKern: false,
          categorie: "ONDERSCHEIDEND",
          volgorde: 5,
        },
        {
          itemCode: "spi_tactisch_geheugen",
          label: "Tactisch geheugen",
          vraagTekst:
            "Onthoudt patronen en afspraken uit de voorbereiding; leert van eerdere wedstrijden",
          isKern: false,
          categorie: "ONDERSCHEIDEND",
          volgorde: 6,
        },
      ],
    },
    {
      code: "MENTAAL",
      naam: "Mentaal",
      icoon: "lightbulb",
      blok: "persoonlijk",
      gewicht: 0.1,
      volgorde: 7,
      items: [
        {
          itemCode: "men_inzet",
          label: "Inzet",
          vraagTekst:
            "Geeft altijd 100% inzet; niet afhankelijk van externe motivatie; net zo hard in training als wedstrijd",
          isKern: true,
          categorie: "KERN",
          volgorde: 1,
        },
        {
          itemCode: "men_concentratie",
          label: "Concentratie",
          vraagTekst:
            "Houdt volledige focus 2x30 minuten; kan concentratie vasthouden in de laatste minuut, bij strafworpen",
          isKern: false,
          categorie: "KERN",
          volgorde: 2,
        },
        {
          itemCode: "men_weerbaarheid",
          label: "Weerbaarheid",
          vraagTekst:
            "Blijft presteren onder druk en na tegenslagen; wordt sterker naarmate de druk toeneemt",
          isKern: false,
          categorie: "KERN",
          volgorde: 3,
        },
        {
          itemCode: "men_wedstrijdmentaliteit",
          label: "Wedstrijdmentaliteit",
          vraagTekst:
            "Presteert beter naarmate de wedstrijd belangrijker is; wil de beslissende bal",
          isKern: false,
          categorie: "KERN",
          volgorde: 4,
        },
        {
          itemCode: "men_trainingsmentaliteit",
          label: "Trainingsmentaliteit",
          vraagTekst:
            "Benadert elke training als kans om beter te worden; werkt zelfstandig aan zwakke punten",
          isKern: false,
          categorie: "KERN",
          volgorde: 5,
        },
        {
          itemCode: "men_drukbestendigheid",
          label: "Drukbestendigheid",
          vraagTekst:
            "Presteert op topniveau onder extreme druk: halve finale, strafworpenreeks; blijft rationeel",
          isKern: false,
          categorie: "ONDERSCHEIDEND",
          volgorde: 6,
        },
        {
          itemCode: "men_zelfkritiek",
          label: "Zelfkritiek",
          vraagTekst:
            "Kan eigen prestaties eerlijk analyseren; gebruikt feedback constructief; is nooit klaar met leren",
          isKern: false,
          categorie: "ONDERSCHEIDEND",
          volgorde: 7,
        },
      ],
    },
    {
      code: "SOCIAAL",
      naam: "Sociaal",
      icoon: "users",
      blok: "persoonlijk",
      gewicht: 0.1,
      volgorde: 8,
      items: [
        {
          itemCode: "soc_veldcommunicatie",
          label: "Veldcommunicatie",
          vraagTekst:
            "Communiceert continu en duidelijk; communicatie is concreet en helpend, niet kritisch",
          isKern: true,
          categorie: "KERN",
          volgorde: 1,
        },
        {
          itemCode: "soc_samenwerking",
          label: "Samenwerking",
          vraagTekst:
            "Speelt het team beter; zoekt de combinatie; stelt teambelang boven statistieken",
          isKern: false,
          categorie: "KERN",
          volgorde: 2,
        },
        {
          itemCode: "soc_rolacceptatie",
          label: "Rolacceptatie",
          vraagTekst:
            "Accepteert wisselende rollen: soms de ster, soms de waterdrager; teambelang boven eigenbelang",
          isKern: false,
          categorie: "KERN",
          volgorde: 3,
        },
        {
          itemCode: "soc_aanstekelijk_plezier",
          label: "Aanstekelijk plezier",
          vraagTekst:
            "Speelt met zichtbaar plezier dat aanstekelijk is voor het team; passie als motor",
          isKern: false,
          categorie: "KERN",
          volgorde: 4,
        },
        {
          itemCode: "soc_coaching",
          label: "Coaching",
          vraagTekst:
            "Helpt minder ervaren teamgenoten met korte, positieve aanwijzingen; trekt het niveau omhoog",
          isKern: false,
          categorie: "ONDERSCHEIDEND",
          volgorde: 5,
        },
        {
          itemCode: "soc_teamsfeer",
          label: "Teamsfeer",
          vraagTekst:
            "Draagt actief bij aan positieve teamsfeer; viert doelpunten van anderen; verbinder in het team",
          isKern: false,
          categorie: "ONDERSCHEIDEND",
          volgorde: 6,
        },
        {
          itemCode: "soc_conflicthantering",
          label: "Conflicthantering",
          vraagTekst:
            "Kan meningsverschillen constructief oplossen; houdt het hoofd koel bij frustratie",
          isKern: false,
          categorie: "ONDERSCHEIDEND",
          volgorde: 7,
        },
      ],
    },
    {
      code: "FYSIEK",
      naam: "Fysiek",
      icoon: "muscle",
      blok: "persoonlijk",
      gewicht: 0.12,
      volgorde: 9,
      items: [
        {
          itemCode: "fys_snelheid",
          label: "Snelheid",
          vraagTekst:
            "Is explosief snel over de eerste 5-10 meter; de eerste stap laat de verdediger achter zich",
          isKern: true,
          categorie: "KERN",
          volgorde: 1,
        },
        {
          itemCode: "fys_uithoudingsvermogen",
          label: "Uithouding",
          vraagTekst:
            "Presteert constant op hoog niveau 2x30 minuten; geen prestatieverlies in de tweede helft",
          isKern: false,
          categorie: "KERN",
          volgorde: 2,
        },
        {
          itemCode: "fys_kracht",
          label: "Kracht",
          vraagTekst:
            "Houdt stand in fysieke duels; stabiliseert de romp; gebruikt het lichaam als schild",
          isKern: false,
          categorie: "KERN",
          volgorde: 3,
        },
        {
          itemCode: "fys_beweeglijkheid",
          label: "Beweeglijkheid",
          vraagTekst: "Beweegt soepel met snelle richtingsveranderingen; lage zwaartepunthouding",
          isKern: false,
          categorie: "KERN",
          volgorde: 4,
        },
        {
          itemCode: "fys_actiesnelheid",
          label: "Actiesnelheid",
          vraagTekst:
            "Reageert razendsnel in spelsituaties; de tijd tussen zien en doen is minimaal",
          isKern: false,
          categorie: "KERN",
          volgorde: 5,
        },
        {
          itemCode: "fys_sprongkracht",
          label: "Sprongkracht",
          vraagTekst:
            "Springt hoog bij rebounds en afstandsschoten; combineert sprongkracht met timing",
          isKern: false,
          categorie: "ONDERSCHEIDEND",
          volgorde: 6,
        },
        {
          itemCode: "fys_herstel",
          label: "Herstel",
          vraagTekst: "Herstelt snel na intensieve acties; is direct klaar voor de volgende actie",
          isKern: false,
          categorie: "ONDERSCHEIDEND",
          volgorde: 7,
        },
      ],
    },
  ],
};

// ============================================================
// Alle groepen
// ============================================================

const ALLE_GROEPEN: GroepDef[] = [PAARS, BLAUW, GROEN, GEEL, ORANJE, ROOD];

// ============================================================
// Seed-functie
// ============================================================

async function seed() {
  const SEIZOEN = "2025-2026";

  logger.info(`[seed-items] Start seeding vaardigheidsraamwerk v3.0 voor seizoen ${SEIZOEN}`);

  // 1. Maak of update de raamwerkversie
  const versie = await prisma.raamwerkVersie.upsert({
    where: { seizoen: SEIZOEN },
    create: {
      seizoen: SEIZOEN,
      naam: "Vaardigheidsraamwerk v3.0",
      status: "CONCEPT",
      opmerking: "Pijlerevolutie: 5 -> 6 -> 7 -> 9 pijlers. Gegenereerd door seed-items.ts.",
    },
    update: {
      naam: "Vaardigheidsraamwerk v3.0",
      opmerking: "Pijlerevolutie: 5 -> 6 -> 7 -> 9 pijlers. Gegenereerd door seed-items.ts.",
    },
  });

  logger.info(`[seed-items] Raamwerkversie: ${versie.id} (${versie.naam})`);

  let totaalPijlers = 0;
  let totaalItems = 0;

  for (const groep of ALLE_GROEPEN) {
    // 2. Upsert leeftijdsgroep
    const bestaandeGroep = await prisma.leeftijdsgroep.findUnique({
      where: { versieId_band: { versieId: versie.id, band: groep.band } },
    });

    const leeftijdsgroep = bestaandeGroep
      ? await prisma.leeftijdsgroep.update({
          where: { id: bestaandeGroep.id },
          data: {
            schaalType: groep.schaalType,
            maxScore: groep.maxScore,
            schaalMin: groep.schaalMin,
            schaalMax: groep.schaalMax,
            schaalMediaan: groep.schaalMediaan,
            halveBereik: groep.halveBereik,
            bandbreedteCoach: groep.bandbreedteCoach,
            bandbreedteScout: groep.bandbreedteScout,
            kernItemsTarget: groep.kernItemsTarget,
          },
        })
      : await prisma.leeftijdsgroep.create({
          data: {
            versieId: versie.id,
            band: groep.band,
            schaalType: groep.schaalType,
            maxScore: groep.maxScore,
            doelAantal: groep.pijlers.reduce((sum, p) => sum + p.items.length, 0),
            schaalMin: groep.schaalMin,
            schaalMax: groep.schaalMax,
            schaalMediaan: groep.schaalMediaan,
            halveBereik: groep.halveBereik,
            bandbreedteCoach: groep.bandbreedteCoach,
            bandbreedteScout: groep.bandbreedteScout,
            kernItemsTarget: groep.kernItemsTarget,
          },
        });

    logger.info(`[seed-items] Groep ${groep.band}: ${groep.pijlers.length} pijlers`);

    for (const pijlerDef of groep.pijlers) {
      // 3. Upsert pijler
      const bestaandePijler = await prisma.pijler.findUnique({
        where: { groepId_code: { groepId: leeftijdsgroep.id, code: pijlerDef.code } },
      });

      const pijler = bestaandePijler
        ? await prisma.pijler.update({
            where: { id: bestaandePijler.id },
            data: {
              naam: pijlerDef.naam,
              icoon: pijlerDef.icoon,
              volgorde: pijlerDef.volgorde,
              blok: pijlerDef.blok,
              gewicht: pijlerDef.gewicht,
            },
          })
        : await prisma.pijler.create({
            data: {
              groepId: leeftijdsgroep.id,
              code: pijlerDef.code,
              naam: pijlerDef.naam,
              icoon: pijlerDef.icoon,
              volgorde: pijlerDef.volgorde,
              blok: pijlerDef.blok,
              gewicht: pijlerDef.gewicht,
            },
          });

      totaalPijlers++;

      for (const itemDef of pijlerDef.items) {
        // 4. Upsert item
        const bestaandItem = await prisma.ontwikkelItem.findUnique({
          where: { pijlerId_itemCode: { pijlerId: pijler.id, itemCode: itemDef.itemCode } },
        });

        if (bestaandItem) {
          await prisma.ontwikkelItem.update({
            where: { id: bestaandItem.id },
            data: {
              label: itemDef.label,
              vraagTekst: itemDef.vraagTekst,
              isKern: itemDef.isKern,
              categorie: itemDef.categorie,
              volgorde: itemDef.volgorde,
              actief: true,
            },
          });
        } else {
          await prisma.ontwikkelItem.create({
            data: {
              pijlerId: pijler.id,
              itemCode: itemDef.itemCode,
              label: itemDef.label,
              vraagTekst: itemDef.vraagTekst,
              isKern: itemDef.isKern,
              categorie: itemDef.categorie,
              volgorde: itemDef.volgorde,
              actief: true,
            },
          });
        }

        totaalItems++;
      }
    }
  }

  logger.info(
    `[seed-items] Klaar! ${totaalPijlers} pijlers, ${totaalItems} items aangemaakt/bijgewerkt.`
  );
}

// ============================================================
// Uitvoeren
// ============================================================

seed()
  .catch((e) => {
    logger.error("[seed-items] Fout:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
