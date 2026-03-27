/* eslint-disable max-lines */
/**
 * Seed vaardigheidsraamwerk v3.0 naar de database.
 *
 * Verwijdert eerst de oude v1.1 versie en maakt een nieuwe RaamwerkVersie aan
 * voor seizoen 2025-2026 met status ACTIEF, vult alle 6 banden (paars t/m rood)
 * met hun pijlers en alle ontwikkelitems per band.
 *
 * Bron: docs/jeugdontwikkeling/vaardigheidsraamwerk-v3.md (definitief beleidsdocument)
 *       docs/jeugdontwikkeling/items-korfbalacties.md
 *       docs/jeugdontwikkeling/items-persoonlijk.md
 *       docs/jeugdontwikkeling/overzicht-raamwerk.md
 *       packages/types/src/leeftijdsgroep-config.ts
 *
 * Idempotent: draait via upsert.
 *
 * Draai met:
 *   pnpm dlx tsx -r dotenv/config scripts/import/seed-raamwerk.ts
 */

import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../../packages/database/.env") });
import { prisma } from "../../packages/database/src/index";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PijlerDef {
  code: string;
  naam: string;
  icoon: string;
  blok: string | null;
  gewicht: number;
}

interface ItemDef {
  itemCode: string;
  label: string;
  vraagTekst: string;
  isKern: boolean;
  categorie?: string | null; // "KERN" | "ONDERSCHEIDEND" (Rood)
  observatie?: string | null;
}

interface GroepDef {
  band: string;
  schaalType: string;
  maxScore: number;
  doelAantal: number;
  schaalMin: number;
  schaalMax: number;
  schaalMediaan: number;
  halveBereik: number;
  bandbreedteCoach: number;
  bandbreedteScout: number;
  kernItemsTarget: number;
  pijlers: { pijler: PijlerDef; items: ItemDef[] }[];
}

// ---------------------------------------------------------------------------
// Helper: item kort
// ---------------------------------------------------------------------------

function item(
  itemCode: string,
  label: string,
  vraagTekst: string,
  isKern: boolean = true,
  categorie?: string | null,
  observatie?: string | null
): ItemDef {
  return {
    itemCode,
    label,
    vraagTekst,
    isKern,
    categorie: categorie ?? null,
    observatie: observatie ?? null,
  };
}

// ---------------------------------------------------------------------------
// Data per band — v3.0 definitief
// ---------------------------------------------------------------------------

const GROEPEN: GroepDef[] = [
  // =========================================================================
  // PAARS (4-5) — 3 observatie-items, geen pijlers
  // =========================================================================
  {
    band: "paars",
    schaalType: "observatie",
    maxScore: 1,
    doelAantal: 3,
    schaalMin: 0,
    schaalMax: 1,
    schaalMediaan: 0.5,
    halveBereik: 0.5,
    bandbreedteCoach: 0,
    bandbreedteScout: 0,
    kernItemsTarget: 3,
    // Paars heeft geen pijlers — items worden als "losse" observaties opgeslagen
    // We gebruiken een pseudo-pijler "OBSERVATIE" om de DB-constraint te respecteren
    pijlers: [
      {
        pijler: { code: "OBSERVATIE", naam: "Observatie", icoon: "eye", blok: null, gewicht: 1.0 },
        items: [
          item("obs_gooien", "Gooit naar iemand", "Gooit de bal bewust naar iemand of iets", true),
          item("obs_bewegen", "Beweegt graag", "Rent, springt en beweegt graag", true),
          item("obs_plezier", "Heeft plezier", "Heeft plezier en wil terugkomen", true),
        ],
      },
    ],
  },

  // =========================================================================
  // BLAUW (5-7) — 5 pijlers, 10 items + 1 signaalvlag = 11
  // =========================================================================
  {
    band: "blauw",
    schaalType: "ja_nogniet",
    maxScore: 2,
    doelAantal: 11,
    schaalMin: 0,
    schaalMax: 100,
    schaalMediaan: 50,
    halveBereik: 50,
    bandbreedteCoach: 15,
    bandbreedteScout: 18,
    kernItemsTarget: 10,
    pijlers: [
      {
        pijler: { code: "BAL", naam: "Bal", icoon: "ball", blok: null, gewicht: 0.25 },
        items: [
          item("bal_gooien", "Gooien", "Kan de bal gooien naar een ander"),
          item("bal_vangen", "Vangen", "Kan de bal vangen"),
        ],
      },
      {
        pijler: { code: "BEWEGEN", naam: "Bewegen", icoon: "run", blok: null, gewicht: 0.25 },
        items: [
          item("bew_rennen", "Rennen en stoppen", "Rent en stopt zonder te vallen"),
          item(
            "bew_richting",
            "Richting veranderen",
            "Kan van richting veranderen tijdens het bewegen"
          ),
          item("bew_energie", "Energie", "Beweegt graag en veel; is actief en energiek"),
        ],
      },
      {
        pijler: { code: "SPEL", naam: "Spel", icoon: "game", blok: null, gewicht: 0.25 },
        items: [
          item(
            "spel_balbezit",
            "Balbezit begrijpen",
            'Begrijpt "wij hebben de bal / zij hebben de bal"'
          ),
        ],
      },
      {
        pijler: { code: "SAMEN", naam: "Samen", icoon: "team", blok: null, gewicht: 0.125 },
        items: [
          item("sam_samenspelen", "Samenspelen", "Speelt samen met anderen (geeft de bal af)"),
          item("sam_luisteren", "Luisteren", "Luistert naar uitleg van de trainer"),
        ],
      },
      {
        pijler: { code: "IK", naam: "Ik", icoon: "star", blok: null, gewicht: 0.125 },
        items: [
          item("ik_durft", "Durft mee te doen", "Durft mee te doen aan oefeningen en spelletjes"),
          item("ik_plezier", "Plezier", "Heeft zichtbaar plezier tijdens training of wedstrijd"),
          // Signaalvlag
          item("veilig_welkom", "Signaalvlag", "Voelt het kind zich welkom in de groep?", false),
        ],
      },
    ],
  },

  // =========================================================================
  // GROEN (8-9) — 5 pijlers, 14 items + 1 signaalvlag = 15
  // Kern: 10, Verdieping: 4
  // =========================================================================
  {
    band: "groen",
    schaalType: "goed_oke_nogniet",
    maxScore: 3,
    doelAantal: 15,
    schaalMin: 0,
    schaalMax: 100,
    schaalMediaan: 50,
    halveBereik: 50,
    bandbreedteCoach: 18,
    bandbreedteScout: 22,
    kernItemsTarget: 10,
    pijlers: [
      {
        pijler: { code: "BAL", naam: "Bal", icoon: "ball", blok: null, gewicht: 0.25 },
        items: [
          // Kern
          item("bal_schieten", "Schieten", "Schiet op de korf"),
          item("bal_gooien_vangen", "Gooien en vangen", "Kan de bal goed gooien en vangen"),
          // Verdieping
          item(
            "bal_vrije_mede",
            "Vrije medespeler",
            "Geeft de bal aan een vrije medespeler",
            false
          ),
        ],
      },
      {
        pijler: { code: "BEWEGEN", naam: "Bewegen", icoon: "run", blok: null, gewicht: 0.25 },
        items: [
          // Kern
          item("bew_vrijlopen", "Vrijlopen", "Loopt vrij van de tegenstander"),
          item("bew_snel", "Snel en beweeglijk", "Is snel en beweeglijk"),
          // Verdieping
          item("bew_positie", "Positie", "Staat op goede plekken in het vak", false),
          item(
            "bew_uithouding",
            "Uithouding",
            "Houdt het tempo vol tijdens de hele wedstrijd",
            false
          ),
        ],
      },
      {
        pijler: { code: "SPEL", naam: "Spel", icoon: "game", blok: null, gewicht: 0.25 },
        items: [
          // Kern
          item(
            "spel_schotkeuze",
            "Schotkeuze",
            "Schiet als er ruimte is (niet als tegenstander ervoor staat)"
          ),
          item("spel_meelopen", "Meelopen", "Verdedigt actief (loopt mee met tegenstander)"),
          // Verdieping
          item("spel_bal_afpakken", "Bal afpakken", "Probeert de bal af te pakken", false),
        ],
      },
      {
        pijler: { code: "SAMEN", naam: "Samen", icoon: "team", blok: null, gewicht: 0.125 },
        items: [
          // Kern
          item("sam_samenspelen", "Samenspelen", "Speelt samen in aanval; zoekt de combinatie"),
          item("sam_communicatie", "Communicatie", "Praat met teamgenoten bij het verdedigen"),
        ],
      },
      {
        pijler: { code: "IK", naam: "Ik", icoon: "star", blok: null, gewicht: 0.125 },
        items: [
          // Kern
          item("ik_doorzetten", "Doorzetten", "Probeert het opnieuw na een mislukte actie"),
          item("ik_omgaan_verliezen", "Omgaan met verliezen", "Gaat goed om met verliezen"),
          // Signaalvlag
          item(
            "veilig_welkom",
            "Signaalvlag",
            "Voelt het kind zich veilig en welkom in het team?",
            false
          ),
        ],
      },
    ],
  },

  // =========================================================================
  // GEEL (10-12) — 6 pijlers, 25 items
  // Kern: 10, Verdieping: 15
  // =========================================================================
  {
    band: "geel",
    schaalType: "sterren",
    maxScore: 5,
    doelAantal: 26,
    schaalMin: 1.0,
    schaalMax: 5.0,
    schaalMediaan: 3.0,
    halveBereik: 2.0,
    bandbreedteCoach: 20,
    bandbreedteScout: 28,
    kernItemsTarget: 10,
    pijlers: [
      {
        pijler: {
          code: "AANVALLEN",
          naam: "Aanvallen",
          icoon: "zap",
          blok: "korfbalacties",
          gewicht: 0.18,
        },
        items: [
          // Kern
          item("aan_vrijlopen", "Vrijlopen", "Loopt slim vrij van de tegenstander"),
          item("aan_balbezit", "Balbezit", "Houdt de bal vast onder druk van de tegenstander"),
          // Verdieping
          item("aan_positie", "Positiespel", "Neemt goede posities in bij aanval", false),
          item(
            "aan_dreigen",
            "Dreigen",
            "Dreigt richting de korf (dwingt verdediger tot keuze)",
            false
          ),
          item(
            "aan_omschakeling",
            "Omschakeling",
            "Schakelt snel over naar aanval na balverovering",
            false
          ),
        ],
      },
      {
        pijler: {
          code: "VERDEDIGEN",
          naam: "Verdedigen",
          icoon: "shield",
          blok: "korfbalacties",
          gewicht: 0.18,
        },
        items: [
          // Kern
          item("ver_dekken", "Dekken", "Dekt de tegenstander goed af"),
          item("ver_bal_veroveren", "Bal veroveren", "Probeert de bal te veroveren"),
          // Verdieping
          item(
            "ver_onderscheppen",
            "Onderscheppen",
            "Onderschept ballen (leest de passing-lijn)",
            false
          ),
          item("ver_druk", "Druk", "Maakt het de schutter moeilijk door druk te zetten", false),
          item("ver_meebewegen", "Meebewegen", "Beweegt mee met de tegenstander (voetwerk)", false),
        ],
      },
      {
        pijler: {
          code: "TECHNIEK",
          naam: "Techniek",
          icoon: "target",
          blok: "spelerskwaliteiten",
          gewicht: 0.18,
        },
        items: [
          // Kern
          item("tec_schieten", "Schieten", "Schiet goed van afstand (techniek, kracht)"),
          item("tec_passen", "Passen", "Gooit technisch goed over (strak, zuiver)"),
          // Verdieping
          item("tec_doorloopbal", "Doorloopbal", "Maakt doorloopballen (timing, afzet)", false),
          item("tec_balbehandeling", "Balbehandeling", "Vangt en verwerkt de bal goed", false),
        ],
      },
      {
        pijler: {
          code: "TACTIEK",
          naam: "Tactiek",
          icoon: "puzzle",
          blok: "spelerskwaliteiten",
          gewicht: 0.18,
        },
        items: [
          // Kern
          item("tac_schotkeuze", "Schotkeuze", "Kiest het juiste moment om te schieten"),
          // Verdieping
          item("tac_overzicht", "Overzicht", "Ziet vrije medespelers staan", false),
          item(
            "tac_samenspel",
            "Samenspel",
            "Zoekt de combinatie; speelt de bal naar een beter staande medespeler",
            false
          ),
        ],
      },
      {
        pijler: {
          code: "MENTAAL",
          naam: "Mentaal",
          icoon: "brain",
          blok: "spelerskwaliteiten",
          gewicht: 0.14,
        },
        items: [
          // Kern
          item("men_inzet", "Inzet", "Laat zichtbare inspanning zien, ook in het laatste kwart"),
          item(
            "men_plezier",
            "Plezier",
            "Lacht, moedigt anderen aan, komt graag naar training en wedstrijd"
          ),
          // Verdieping
          item(
            "men_concentratie",
            "Concentratie",
            "Maakt geen fouten door onoplettendheid; blijft bij de les",
            false
          ),
          item(
            "men_coachbaarheid",
            "Coachbaarheid",
            "Probeert het anders na feedback van de trainer",
            false
          ),
          item(
            "men_herstelt",
            "Herstelt na fout",
            "Gaat verder met de volgende actie na een fout; treurt niet lang",
            false
          ),
          // Signaalvlag (scorend bij Geel)
          item(
            "soc_veiligheid",
            "Sociale veiligheid",
            "Durft fouten te maken zonder bang te zijn voor reacties van teamgenoten",
            false
          ),
        ],
      },
      {
        pijler: {
          code: "FYSIEK",
          naam: "Fysiek",
          icoon: "muscle",
          blok: "spelerskwaliteiten",
          gewicht: 0.14,
        },
        items: [
          // Kern
          item("fys_snelheid", "Snelheid", "Is snel in korte sprints"),
          // Verdieping
          item(
            "fys_uithoudingsvermogen",
            "Uithoudingsvermogen",
            "Houdt het tempo de hele wedstrijd vol",
            false
          ),
          item("fys_beweeglijkheid", "Beweeglijkheid", "Beweegt soepel en wendbaar", false),
        ],
      },
    ],
  },

  // =========================================================================
  // ORANJE (13-15) — 7 pijlers, 40 items
  // Kern: 10, Verdieping: 30
  // =========================================================================
  {
    band: "oranje",
    schaalType: "slider",
    maxScore: 10,
    doelAantal: 41,
    schaalMin: 1.0,
    schaalMax: 10.0,
    schaalMediaan: 5.5,
    halveBereik: 4.5,
    bandbreedteCoach: 22,
    bandbreedteScout: 30,
    kernItemsTarget: 10,
    pijlers: [
      {
        pijler: {
          code: "AANVALLEN",
          naam: "Aanvallen",
          icoon: "zap",
          blok: "korfbalacties",
          gewicht: 0.16,
        },
        items: [
          // Kern
          item(
            "aan_vrijlopen",
            "Vrijlopen",
            "Loopt op het juiste moment vrij (timing + misleiding)"
          ),
          item("aan_1op1", "1-tegen-1", "Wint individuele duels in aanvalsverband"),
          // Verdieping
          item(
            "aan_positie",
            "Positiespel",
            "Neemt sterke aanvalsposities in (diepte, aanspeelbaarheid)",
            false
          ),
          item(
            "aan_dreigen",
            "Dreigen",
            "Brengt de verdediging in problemen door te dreigen (schot/doorloop dilemma)",
            false
          ),
          item(
            "aan_zonder_bal",
            "Spel zonder bal",
            "Beweegt doelgericht ook zonder bal, houdt de verdediger bezig",
            false
          ),
          item(
            "aan_balbezit",
            "Balbezit",
            "Beschermt de bal onder druk, draait weg van verdediger",
            false
          ),
          item(
            "aan_omschakeling",
            "Omschakeling V>A",
            "Schakelt snel om van verdediging naar aanval (mentale switch)",
            false
          ),
        ],
      },
      {
        pijler: {
          code: "VERDEDIGEN",
          naam: "Verdedigen",
          icoon: "shield",
          blok: "korfbalacties",
          gewicht: 0.16,
        },
        items: [
          // Kern
          item(
            "ver_dekken",
            "Dekken",
            "Dekt de directe tegenstander strak af (positie, contact, discipline)"
          ),
          item(
            "ver_omschakeling",
            "Omschakeling A>V",
            "Schakelt snel om van aanval naar verdediging na balverlies"
          ),
          // Verdieping
          item(
            "ver_onderscheppen",
            "Onderscheppen",
            "Leest het spel en onderschept ballen, anticipeert op passes",
            false
          ),
          item("ver_druk", "Druk", "Zet druk op de balbezitter bij schietpositie", false),
          item("ver_rebound", "Rebound", "Pakt rebounds na een schot (positie, timing)", false),
          item(
            "ver_communicatie",
            "Verdedigingscommunicatie",
            "Stuurt medespelers aan bij verdedigen (roept, waarschuwt)",
            false
          ),
        ],
      },
      {
        pijler: {
          code: "TECHNIEK",
          naam: "Techniek",
          icoon: "target",
          blok: "spelerskwaliteiten",
          gewicht: 0.16,
        },
        items: [
          // Kern
          item(
            "tec_afstandsschot",
            "Afstandsschot",
            "Schiet goed en hard van afstand, ook vanuit beweging"
          ),
          // Verdieping
          item(
            "tec_doorloopbal",
            "Doorloopbal",
            "Maakt doorloopballen links en rechts onder lichte druk",
            false
          ),
          item(
            "tec_schottechniek",
            "Schottechniek",
            "Heeft een zuivere, herhaalbare schietbeweging",
            false
          ),
          item(
            "tec_passtechniek",
            "Passtechniek",
            "Geeft strakke, zuivere passes over korte en lange afstand",
            false
          ),
          item(
            "tec_balbehandeling",
            "Balbehandeling",
            "Controleert de bal onder druk (twee handen, een hand, in beweging)",
            false
          ),
          item(
            "tec_aanname",
            "Aanname",
            "Neemt de bal aan terwijl hij/zij in beweging is, kan direct doorspelen",
            false
          ),
        ],
      },
      {
        pijler: {
          code: "TACTIEK",
          naam: "Tactiek",
          icoon: "puzzle",
          blok: "spelerskwaliteiten",
          gewicht: 0.16,
        },
        items: [
          // Kern
          item(
            "tac_besluitvorming",
            "Besluitvorming",
            "Maakt de juiste keuze: passen, schieten of vasthouden"
          ),
          // Verdieping
          item(
            "tac_schotkeuze",
            "Schotkeuze",
            "Kiest het juiste schot op het juiste moment",
            false
          ),
          item(
            "tac_overzicht",
            "Overzicht",
            "Heeft goed overzicht over het speelveld, ziet meerdere opties",
            false
          ),
          item(
            "tac_samenspel",
            "Samenspel",
            "Zoekt de combinatie en geeft de extra pass als een medespeler beter staat",
            false
          ),
          item(
            "tac_tempo",
            "Tempo",
            "Past het tempo aan: versnelt bij overmacht, vertraagt als het nodig is",
            false
          ),
        ],
      },
      {
        pijler: {
          code: "MENTAAL",
          naam: "Mentaal",
          icoon: "brain",
          blok: "persoonlijk",
          gewicht: 0.12,
        },
        items: [
          // Kern
          item("men_inzet", "Inzet", "Geeft maximale inzet ongeacht de stand of de tegenstander"),
          item(
            "men_plezier",
            "Plezier",
            "Straalt plezier uit tijdens training en wedstrijd; reageert enthousiast"
          ),
          // Verdieping
          item(
            "men_concentratie",
            "Concentratie",
            "Blijft scherp in cruciale momenten; laat zich niet afleiden",
            false
          ),
          item(
            "men_weerbaarheid",
            "Weerbaarheid",
            "Herstelt zichtbaar snel na tegenslagen; fouten werken niet door",
            false
          ),
          item(
            "men_leiderschap",
            "Leiderschap",
            "Stuurt medespelers aan met concrete aanwijzingen; vraagt de bal in druksituaties",
            false
          ),
          item(
            "men_groei",
            "Groei",
            "Zoekt uitdaging en leert van feedback; kiest de moeilijke oefening",
            false
          ),
        ],
      },
      {
        pijler: {
          code: "SOCIAAL",
          naam: "Sociaal",
          icoon: "users",
          blok: "persoonlijk",
          gewicht: 0.12,
        },
        items: [
          // Kern
          item(
            "soc_communicatie",
            "Communicatie",
            "Communiceert duidelijk op het veld; roept vrijlopen aan, waarschuwt voor lopers"
          ),
          // Verdieping
          item(
            "soc_samenwerking",
            "Samenwerking",
            "Zoekt de combinatie en geeft de extra pass als een medespeler beter staat",
            false
          ),
          item(
            "soc_teamsfeer",
            "Teamsfeer",
            "Viert doelpunten van anderen; staat naast een medespeler die een fout maakt",
            false
          ),
          item(
            "soc_rolacceptatie",
            "Rolacceptatie",
            "Klaagt niet als hij/zij in een ondersteunende rol speelt; teambelang boven eigenbelang",
            false
          ),
          item(
            "soc_conflicthantering",
            "Conflicthantering",
            "Lost meningsverschillen op het veld constructief op; zoekt de dialoog",
            false
          ),
          // Signaalvlag (scorend)
          item(
            "soc_veiligheid",
            "Sociale veiligheid",
            "Voelt zich veilig om risico's te nemen en fouten te maken",
            false
          ),
        ],
      },
      {
        pijler: {
          code: "FYSIEK",
          naam: "Fysiek",
          icoon: "muscle",
          blok: "persoonlijk",
          gewicht: 0.12,
        },
        items: [
          // Kern
          item(
            "fys_snelheid",
            "Snelheid",
            "Is explosief snel in de eerste meters en bij vrijlopen"
          ),
          // Verdieping
          item(
            "fys_uithoudingsvermogen",
            "Uithoudingsvermogen",
            "Presteert op gelijk niveau in het eerste en laatste kwart",
            false
          ),
          item(
            "fys_beweeglijkheid",
            "Beweeglijkheid",
            "Verandert snel van richting zonder snelheidsverlies",
            false
          ),
          item(
            "fys_kracht",
            "Kracht",
            "Zet het lichaam goed in bij duels en bij het schieten",
            false
          ),
          item(
            "fys_actiesnelheid",
            "Actiesnelheid",
            "Handelt snel in spelsituaties: ziet de kans en voert direct uit",
            false
          ),
        ],
      },
    ],
  },

  // =========================================================================
  // ROOD (16-18) — 9 pijlers, 62 items (KERN/ONDERSCHEIDEND)
  // =========================================================================
  {
    band: "rood",
    schaalType: "slider",
    maxScore: 10,
    doelAantal: 63,
    schaalMin: 1.0,
    schaalMax: 10.0,
    schaalMediaan: 5.5,
    halveBereik: 4.5,
    bandbreedteCoach: 25,
    bandbreedteScout: 32,
    kernItemsTarget: 9,
    pijlers: [
      {
        pijler: {
          code: "AANVALLEN",
          naam: "Aanvallen",
          icoon: "zap",
          blok: "korfbalacties",
          gewicht: 0.12,
        },
        items: [
          item(
            "aan_vrijlopen",
            "Vrijlopen",
            "Creert ruimte door slim vrij te lopen: in-uit, V-loop, achterdeur, met optimale timing",
            true,
            "KERN"
          ),
          item(
            "aan_positie",
            "Positiespel",
            "Neemt dominante aanvalsposities in: voor/achter korf, creert diepte, altijd aanspeelbaar",
            true,
            "KERN"
          ),
          item(
            "aan_dreigen",
            "Dreigen",
            "Dwingt verdedigers in onmogelijke keuzes: schot/doorloop dilemma constant aanwezig",
            true,
            "KERN"
          ),
          item(
            "aan_zonder_bal",
            "Spel zonder bal",
            "Beweegt continu doelgericht zonder bal: creert ruimte voor anderen, trekt verdedigers weg",
            true,
            "KERN"
          ),
          item(
            "aan_spelcreatie",
            "Spelcreatie",
            "Creert kansen voor medespelers, is de regisseur van de aanval, dicteert het tempo",
            false,
            "ONDERSCHEIDEND"
          ),
          item(
            "aan_1_op_1",
            "1-tegen-1",
            "Wint individuele duels door snelheid, lichaamstaal of schijnbeweging, dwingt strafworpen af",
            false,
            "ONDERSCHEIDEND"
          ),
          item(
            "aan_balbezit",
            "Balbezit",
            "Beschermt de bal foutloos onder hoge druk; draait weg, schermt af, lichaam als schild",
            true,
            "KERN"
          ),
          item(
            "aan_omschakeling_va",
            "Omschakeling V>A",
            "Schakelt razendsnel om na balverovering, sprint naar aanvalsvak of geeft de snelle lange pass",
            true,
            "KERN"
          ),
        ],
      },
      {
        pijler: {
          code: "VERDEDIGEN",
          naam: "Verdedigen",
          icoon: "shield",
          blok: "korfbalacties",
          gewicht: 0.12,
        },
        items: [
          item(
            "ver_dekken",
            "Dekken",
            "Dekt de tegenstander strak en gedisciplineerd, blijft tussen tegenstander en korf, zonder overtredingen",
            true,
            "KERN"
          ),
          item(
            "ver_onderscheppen",
            "Onderscheppen",
            "Anticipeert en onderschept gevaarlijke ballen, leest passing lanes",
            true,
            "KERN"
          ),
          item(
            "ver_druk_zetten",
            "Druk zetten",
            "Zet continu druk op de balbezitter, maakt het moeilijk om te passen of te schieten",
            true,
            "KERN"
          ),
          item(
            "ver_rebound",
            "Rebound",
            "Domineert de rebound-zone: goede positie, timing, box-out, zet direct de omschakeling in",
            true,
            "KERN"
          ),
          item(
            "ver_omschakeling_av",
            "Omschakeling A>V",
            "Na balverlies onmiddellijk terug in verdedigende modus, pakt de dichtstbijzijnde tegenstander",
            true,
            "KERN"
          ),
          item(
            "ver_discipline",
            "Discipline",
            "Blijft gedisciplineerd verdedigen ook bij achterstand of frustratie, geen onnodige overtredingen",
            true,
            "KERN"
          ),
          item(
            "ver_communicatie",
            "Verdedigingscommunicatie",
            "Organiseert de verdediging door constant te communiceren: wissels, lopers, dekkingsafspraken",
            false,
            "ONDERSCHEIDEND"
          ),
          item(
            "ver_blok",
            "Blokken",
            "Blokkeert effectief schoten door timing, onderscheidt echt schot van schijnbeweging",
            false,
            "ONDERSCHEIDEND"
          ),
          item(
            "ver_helpverdediging",
            "Helpverdediging",
            "Helpt uit bij doorbraak, schuift en roteert mee zonder eigen tegenstander volledig los te laten",
            false,
            "ONDERSCHEIDEND"
          ),
        ],
      },
      {
        pijler: {
          code: "SCOREN",
          naam: "Scoren",
          icoon: "target",
          blok: "korfbalacties",
          gewicht: 0.12,
        },
        items: [
          item(
            "sco_afstandsschot",
            "Afstandsschot",
            "Schiet krachtig en geplaatst van afstand, droog en uit de beweging, scoort consistent",
            true,
            "KERN"
          ),
          item(
            "sco_doorloopbal",
            "Doorloopbal",
            "Maakt doorloopballen onder hoge druk, vanuit verschillende hoeken, links- en rechtshandig",
            true,
            "KERN"
          ),
          item(
            "sco_strafworp",
            "Strafworp",
            "Scoort strafworpen onder druk, heeft een vaste routine, laat zich niet afleiden",
            true,
            "KERN"
          ),
          item(
            "sco_variatie",
            "Schotvariatie",
            "Heeft meerdere schotvormen in het arsenaal (draaibal, lob, scoop, schijnschot)",
            false,
            "ONDERSCHEIDEND"
          ),
          item(
            "sco_scorend_vermogen",
            "Scorend vermogen",
            "Is klinisch in de afronding: scoort in beslissende momenten, mist zelden vrije kansen",
            false,
            "ONDERSCHEIDEND"
          ),
          item(
            "sco_na_dreiging",
            "Schieten na dreiging",
            "Schiet effectief direct na een dreigactie (schijnbeweging, aanbieden, terugtrekken)",
            false,
            "ONDERSCHEIDEND"
          ),
          item(
            "sco_kracht",
            "Schotkracht",
            "Heeft voldoende schotkracht vanuit een stabiele positie, ook vermoeid",
            true,
            "KERN"
          ),
        ],
      },
      {
        pijler: {
          code: "TECHNIEK",
          naam: "Techniek",
          icoon: "wrench",
          blok: "spelerskwaliteiten",
          gewicht: 0.12,
        },
        items: [
          item(
            "tec_schottechniek",
            "Schottechniek",
            "Schiet met een stabiele, herhaalbare techniek, ook onder fysieke druk en vermoeidheid",
            true,
            "KERN"
          ),
          item(
            "tec_passtechniek",
            "Passtechniek",
            "Geeft technisch perfecte passes: borst, overhand, pols, bodem, getimed en op snelheid",
            true,
            "KERN"
          ),
          item(
            "tec_balbehandeling",
            "Balbehandeling",
            "Controleert de bal foutloos onder hoge druk, vangt met twee handen en een hand",
            true,
            "KERN"
          ),
          item(
            "tec_aanname",
            "Aanname",
            "Neemt de bal in volle sprint feilloos aan, de aanname is onderdeel van de actie",
            true,
            "KERN"
          ),
          item(
            "tec_eenhandig",
            "Eenhandig spelen",
            "Kan de bal met een hand controleren, passen en afronden, vergroot het speelbare bereik",
            false,
            "ONDERSCHEIDEND"
          ),
          item(
            "tec_verdedigingshouding",
            "Verdedigingshouding",
            "Verdedigt uitdagend: actieve schijnkant, goede voetverplaatsing, drukkend meebewegen",
            true,
            "KERN"
          ),
        ],
      },
      {
        pijler: {
          code: "TACTIEK",
          naam: "Tactiek",
          icoon: "puzzle",
          blok: "spelerskwaliteiten",
          gewicht: 0.1,
        },
        items: [
          item(
            "tac_aanvalspatronen",
            "Aanvalspatronen",
            "Kent standaard aanvalsopstellingen (4-0, 3-1, wissel), past aan op tegenstander",
            true,
            "KERN"
          ),
          item(
            "tac_verdedigingsvorm",
            "Verdedigingsvorm",
            "Herkent de aanvalsopstelling van de tegenstander en past de eigen verdediging aan",
            false,
            "ONDERSCHEIDEND"
          ),
          item(
            "tac_samenspel",
            "Samenspel",
            "Speelt het team beter; zoekt de combinatie; stelt teambelang boven persoonlijke statistieken",
            true,
            "KERN"
          ),
          item(
            "tac_tempo",
            "Tempo",
            "Bepaalt het tempo van de aanval: versnelt bij overmacht, vertraagt als verdediging georganiseerd is",
            false,
            "ONDERSCHEIDEND"
          ),
          item(
            "tac_transitie",
            "Transitie",
            "Organiseert de snelle aanval na omschakeling; kiest tussen direct doorspelen of opbouwen",
            true,
            "KERN"
          ),
        ],
      },
      {
        pijler: {
          code: "SPELINTELLIGENTIE",
          naam: "Spelintelligentie",
          icoon: "brain",
          blok: "spelerskwaliteiten",
          gewicht: 0.1,
        },
        items: [
          item(
            "spi_spellezing",
            "Spellezing",
            "Leest het spel voortdurend: herkent de opstellingsvorm, ziet ruimtes ontstaan, voorspelt de volgende actie",
            true,
            "KERN"
          ),
          item(
            "spi_anticipatie",
            "Anticipatie",
            "Reageert niet op wat er gebeurt, maar op wat er gaat gebeuren; staat al op de juiste plek",
            true,
            "KERN"
          ),
          item(
            "spi_besluitvorming",
            "Besluitvorming",
            "Maakt in een fractie van een seconde de juiste keuze; kiest in 80%+ van de gevallen de beste optie",
            true,
            "KERN"
          ),
          item(
            "spi_patronenherkenning",
            "Patronenherkenning",
            "Herkent aanvalspatronen van de tegenstander al na 2-3 balbezittingen en past de dekking aan",
            false,
            "ONDERSCHEIDEND"
          ),
          item(
            "spi_adaptief",
            "Adaptief vermogen",
            "Past het eigen spel aan op de tegenstander, de omstandigheden en de wedstrijdsituatie",
            false,
            "ONDERSCHEIDEND"
          ),
          item(
            "spi_tactisch_geheugen",
            "Tactisch geheugen",
            "Onthoudt patronen en afspraken uit de voorbereiding; leert van eerdere wedstrijden",
            false,
            "ONDERSCHEIDEND"
          ),
        ],
      },
      {
        pijler: {
          code: "MENTAAL",
          naam: "Mentaal",
          icoon: "lightbulb",
          blok: "persoonlijk",
          gewicht: 0.1,
        },
        items: [
          item(
            "men_inzet",
            "Inzet",
            "Geeft altijd 100% inzet; niet afhankelijk van externe motivatie; net zo hard in training als wedstrijd",
            true,
            "KERN"
          ),
          item(
            "men_concentratie",
            "Concentratie",
            "Houdt volledige focus 2x30 minuten; kan concentratie vasthouden in de laatste minuut, bij strafworpen",
            true,
            "KERN"
          ),
          item(
            "men_weerbaarheid",
            "Weerbaarheid",
            "Blijft presteren onder druk en na tegenslagen; wordt sterker naarmate de druk toeneemt",
            true,
            "KERN"
          ),
          item(
            "men_wedstrijdmentaliteit",
            "Wedstrijdmentaliteit",
            "Presteert beter naarmate de wedstrijd belangrijker is; wil de beslissende bal",
            true,
            "KERN"
          ),
          item(
            "men_trainingsmentaliteit",
            "Trainingsmentaliteit",
            "Benadert elke training als kans om beter te worden; werkt zelfstandig aan zwakke punten",
            true,
            "KERN"
          ),
          item(
            "men_drukbestendigheid",
            "Drukbestendigheid",
            "Presteert op topniveau onder extreme druk: halve finale, strafworpenreeks; blijft rationeel",
            false,
            "ONDERSCHEIDEND"
          ),
          item(
            "men_zelfkritiek",
            "Zelfkritiek",
            "Kan eigen prestaties eerlijk analyseren; gebruikt feedback constructief; is nooit klaar met leren",
            false,
            "ONDERSCHEIDEND"
          ),
        ],
      },
      {
        pijler: {
          code: "SOCIAAL",
          naam: "Sociaal",
          icoon: "users",
          blok: "persoonlijk",
          gewicht: 0.1,
        },
        items: [
          item(
            "soc_veldcommunicatie",
            "Veldcommunicatie",
            "Communiceert continu en duidelijk; communicatie is concreet en helpend, niet kritisch",
            true,
            "KERN"
          ),
          item(
            "soc_samenwerking",
            "Samenwerking",
            "Speelt het team beter; zoekt de combinatie; stelt teambelang boven statistieken",
            true,
            "KERN"
          ),
          item(
            "soc_rolacceptatie",
            "Rolacceptatie",
            "Accepteert wisselende rollen: soms de ster, soms de waterdrager; teambelang boven eigenbelang",
            true,
            "KERN"
          ),
          item(
            "soc_aanstekelijk_plezier",
            "Aanstekelijk plezier",
            "Speelt met zichtbaar plezier dat aanstekelijk is voor het team; passie als motor",
            true,
            "KERN"
          ),
          item(
            "soc_coaching",
            "Coaching",
            "Helpt minder ervaren teamgenoten met korte, positieve aanwijzingen; trekt het niveau omhoog",
            false,
            "ONDERSCHEIDEND"
          ),
          item(
            "soc_teamsfeer",
            "Teamsfeer",
            "Draagt actief bij aan positieve teamsfeer; viert doelpunten van anderen; verbinder in het team",
            false,
            "ONDERSCHEIDEND"
          ),
          item(
            "soc_conflicthantering",
            "Conflicthantering",
            "Kan meningsverschillen constructief oplossen; houdt het hoofd koel bij frustratie",
            false,
            "ONDERSCHEIDEND"
          ),
          // Signaalvlag (scorend)
          item(
            "soc_veiligheid",
            "Sociale veiligheid",
            "Voelt zich veilig in het team; kan kwetsbaar zijn zonder sociale consequenties",
            true,
            "KERN"
          ),
        ],
      },
      {
        pijler: {
          code: "FYSIEK",
          naam: "Fysiek",
          icoon: "muscle",
          blok: "persoonlijk",
          gewicht: 0.12,
        },
        items: [
          item(
            "fys_snelheid",
            "Snelheid",
            "Is explosief snel over de eerste 5-10 meter; de eerste stap laat de verdediger achter zich",
            true,
            "KERN"
          ),
          item(
            "fys_uithoudingsvermogen",
            "Uithoudingsvermogen",
            "Presteert constant op hoog niveau 2x30 minuten; geen prestatieverlies in de tweede helft",
            true,
            "KERN"
          ),
          item(
            "fys_kracht",
            "Kracht",
            "Houdt stand in fysieke duels; stabiliseert de romp; gebruikt het lichaam als schild",
            true,
            "KERN"
          ),
          item(
            "fys_beweeglijkheid",
            "Beweeglijkheid",
            "Beweegt soepel met snelle richtingsveranderingen; lage zwaartepunthouding",
            true,
            "KERN"
          ),
          item(
            "fys_actiesnelheid",
            "Actiesnelheid",
            "Reageert razendsnel in spelsituaties; de tijd tussen zien en doen is minimaal",
            true,
            "KERN"
          ),
          item(
            "fys_sprongkracht",
            "Sprongkracht",
            "Springt hoog bij rebounds en afstandsschoten; combineert sprongkracht met timing",
            false,
            "ONDERSCHEIDEND"
          ),
          item(
            "fys_herstel",
            "Herstelvermogen",
            "Herstelt snel na intensieve acties; is direct klaar voor de volgende actie",
            false,
            "ONDERSCHEIDEND"
          ),
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const SEIZOEN = "2025-2026";
const VERSIE_NAAM = "Vaardigheidsraamwerk v3.0";

async function main() {
  process.stdout.write(`\n=== Seed raamwerk v3.0 voor seizoen ${SEIZOEN} ===\n\n`);

  // -------------------------------------------------------------------------
  // Stap 0: Verwijder oude versie (v1.1) als die bestaat
  // -------------------------------------------------------------------------
  const oudeVersie = await prisma.raamwerkVersie.findUnique({
    where: { seizoen: SEIZOEN },
  });

  if (oudeVersie) {
    process.stdout.write(`Oude versie gevonden: "${oudeVersie.naam}" (${oudeVersie.id})\n`);
    process.stdout.write(`Verwijderen van oude data (cascade: groepen -> pijlers -> items)...\n`);

    // Cascade delete: RaamwerkVersie -> Leeftijdsgroep -> Pijler -> OntwikkelItem
    await prisma.raamwerkVersie.delete({
      where: { seizoen: SEIZOEN },
    });

    process.stdout.write(`Oude versie verwijderd.\n\n`);
  }

  // -------------------------------------------------------------------------
  // Stap 1: Maak nieuwe RaamwerkVersie aan
  // -------------------------------------------------------------------------
  const versie = await prisma.raamwerkVersie.create({
    data: {
      seizoen: SEIZOEN,
      naam: VERSIE_NAAM,
      status: "ACTIEF",
      gepubliceerdOp: new Date(),
      opmerking: "Vaardigheidsraamwerk v3.0 — Pijlerevolutie (Inside Out). 6 banden, 155+ items.",
    },
  });
  process.stdout.write(`Versie aangemaakt: ${versie.id} (${versie.seizoen}, ${versie.status})\n\n`);

  // -------------------------------------------------------------------------
  // Stap 2: Seed alle banden
  // -------------------------------------------------------------------------
  let totaalItems = 0;

  for (const groepDef of GROEPEN) {
    // Maak Leeftijdsgroep aan
    const groep = await prisma.leeftijdsgroep.create({
      data: {
        versieId: versie.id,
        band: groepDef.band,
        schaalType: groepDef.schaalType,
        maxScore: groepDef.maxScore,
        doelAantal: groepDef.doelAantal,
        schaalMin: groepDef.schaalMin,
        schaalMax: groepDef.schaalMax,
        schaalMediaan: groepDef.schaalMediaan,
        halveBereik: groepDef.halveBereik,
        bandbreedteCoach: groepDef.bandbreedteCoach,
        bandbreedteScout: groepDef.bandbreedteScout,
        kernItemsTarget: groepDef.kernItemsTarget,
      },
    });

    let groepItems = 0;

    for (let pIdx = 0; pIdx < groepDef.pijlers.length; pIdx++) {
      const pijlerDef = groepDef.pijlers[pIdx];

      // Maak Pijler aan
      const pijler = await prisma.pijler.create({
        data: {
          groepId: groep.id,
          code: pijlerDef.pijler.code,
          naam: pijlerDef.pijler.naam,
          icoon: pijlerDef.pijler.icoon,
          blok: pijlerDef.pijler.blok,
          gewicht: pijlerDef.pijler.gewicht,
          volgorde: pIdx,
        },
      });

      // Maak items aan
      for (let iIdx = 0; iIdx < pijlerDef.items.length; iIdx++) {
        const itemDef = pijlerDef.items[iIdx];

        await prisma.ontwikkelItem.create({
          data: {
            pijlerId: pijler.id,
            itemCode: itemDef.itemCode,
            label: itemDef.label,
            vraagTekst: itemDef.vraagTekst,
            isKern: itemDef.isKern,
            categorie: itemDef.categorie,
            observatie: itemDef.observatie,
            volgorde: iIdx,
          },
        });

        groepItems++;
      }
    }

    totaalItems += groepItems;

    const pijlerCodes = groepDef.pijlers.map((p) => p.pijler.code).join(", ");
    const kernCount = groepDef.pijlers.reduce(
      (sum, p) => sum + p.items.filter((i) => i.isKern).length,
      0
    );

    process.stdout.write(
      `  ${groepDef.band.padEnd(7)} | ${groepDef.schaalType.padEnd(16)} | max ${String(groepDef.maxScore).padStart(2)} | ` +
        `${groepDef.pijlers.length} pijlers (${pijlerCodes}) | ` +
        `${groepItems} items (${kernCount} kern)\n`
    );
  }

  process.stdout.write(
    `\n=== Klaar! ${totaalItems} items in ${GROEPEN.length} banden geseeded. ===\n\n`
  );

  // -------------------------------------------------------------------------
  // Stap 3: Validatie
  // -------------------------------------------------------------------------
  process.stdout.write(`Validatie:\n`);

  const dbGroepen = await prisma.leeftijdsgroep.findMany({
    where: { versieId: versie.id },
    include: {
      pijlers: {
        include: { items: true },
        orderBy: { volgorde: "asc" },
      },
    },
    orderBy: { band: "asc" },
  });

  for (const g of dbGroepen) {
    const itemCount = g.pijlers.reduce((sum, p) => sum + p.items.length, 0);
    const kernCount = g.pijlers.reduce((sum, p) => sum + p.items.filter((i) => i.isKern).length, 0);
    process.stdout.write(
      `  ${g.band.padEnd(7)} | ${g.pijlers.length} pijlers | ${itemCount} items (${kernCount} kern) | target: ${g.doelAantal}\n`
    );
  }
}

main()
  .catch((e) => {
    process.stderr.write(`Fout: ${String(e)}\n`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
