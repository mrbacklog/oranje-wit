/**
 * Seed scouting-itemcatalogus naar de database.
 *
 * Maakt een CatalogusVersie aan voor seizoen 2025-2026 met status ACTIEF,
 * vult alle banden (blauw t/m rood) met hun pijlers en items.
 *
 * Idempotent: als de versie al bestaat, wordt deze bijgewerkt.
 *
 * Draai met:
 *   npx tsx -r dotenv/config scripts/import/seed-catalogus.ts
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
}

interface ItemDef {
  itemCode: string;
  label: string;
  vraagTekst: string;
}

interface GroepDef {
  band: string;
  schaalType: string;
  maxScore: number;
  doelAantal: number;
  pijlers: { pijler: PijlerDef; items: ItemDef[] }[];
}

// ---------------------------------------------------------------------------
// Pijler metadata
// ---------------------------------------------------------------------------

const P: Record<string, PijlerDef> = {
  SCH: { code: "SCH", naam: "Schieten", icoon: "\uD83C\uDFAF" },
  AAN: { code: "AAN", naam: "Aanval", icoon: "\u26A1" },
  PAS: { code: "PAS", naam: "Passen", icoon: "\uD83E\uDD1D" },
  VER: { code: "VER", naam: "Verdediging", icoon: "\uD83D\uDEE1\uFE0F" },
  FYS: { code: "FYS", naam: "Fysiek", icoon: "\uD83D\uDCAA" },
  MEN: { code: "MEN", naam: "Mentaal", icoon: "\uD83E\uDDE0" },
};

// ---------------------------------------------------------------------------
// Data per band
// ---------------------------------------------------------------------------

const GROEPEN: GroepDef[] = [
  // === BLAUW (5-7) ===
  {
    band: "blauw",
    schaalType: "smiley",
    maxScore: 3,
    doelAantal: 8,
    pijlers: [
      {
        pijler: P.FYS,
        items: [
          {
            itemCode: "fys_beweegt_graag",
            label: "Beweegt graag",
            vraagTekst: "Beweegt graag en veel",
          },
          {
            itemCode: "fys_rennen_stoppen",
            label: "Rennen en stoppen",
            vraagTekst: "Kan rennen en stoppen",
          },
        ],
      },
      {
        pijler: P.PAS,
        items: [
          {
            itemCode: "pas_gooien_vangen",
            label: "Gooien en vangen",
            vraagTekst: "Kan gooien en vangen",
          },
        ],
      },
      {
        pijler: P.MEN,
        items: [
          { itemCode: "men_luistert", label: "Luistert", vraagTekst: "Luistert naar uitleg" },
          {
            itemCode: "men_samenspel",
            label: "Samenspelen",
            vraagTekst: "Speelt samen met anderen",
          },
          { itemCode: "men_durft", label: "Durft mee te doen", vraagTekst: "Durft mee te doen" },
        ],
      },
    ],
  },

  // === GROEN (8-9) ===
  {
    band: "groen",
    schaalType: "smiley",
    maxScore: 3,
    doelAantal: 12,
    pijlers: [
      {
        pijler: P.PAS,
        items: [
          {
            itemCode: "pas_gooien_vangen",
            label: "Gooien en vangen",
            vraagTekst: "Kan de bal goed gooien en vangen",
          },
          {
            itemCode: "pas_vrije_medespeler",
            label: "Vrije medespeler",
            vraagTekst: "Geeft de bal aan een vrije medespeler",
          },
        ],
      },
      {
        pijler: P.SCH,
        items: [
          {
            itemCode: "sch_schieten_korf",
            label: "Schieten op korf",
            vraagTekst: "Schiet op de korf",
          },
        ],
      },
      {
        pijler: P.AAN,
        items: [
          {
            itemCode: "aan_vrijlopen",
            label: "Vrijlopen",
            vraagTekst: "Loopt vrij van tegenstander",
          },
          { itemCode: "aan_positie", label: "Positiespel", vraagTekst: "Staat op goede plekken" },
        ],
      },
      {
        pijler: P.VER,
        items: [
          {
            itemCode: "ver_bal_afpakken",
            label: "Bal afpakken",
            vraagTekst: "Probeert de bal af te pakken",
          },
          { itemCode: "ver_actief", label: "Actief verdedigen", vraagTekst: "Verdedigt actief" },
        ],
      },
      {
        pijler: P.FYS,
        items: [
          {
            itemCode: "fys_snel_beweeglijk",
            label: "Snel en beweeglijk",
            vraagTekst: "Is snel en beweeglijk",
          },
        ],
      },
      {
        pijler: P.MEN,
        items: [
          {
            itemCode: "men_samenwerken",
            label: "Samenwerken",
            vraagTekst: "Werkt goed samen in het team",
          },
          {
            itemCode: "men_doorzetten",
            label: "Doorzetten",
            vraagTekst: "Blijft proberen na een fout",
          },
        ],
      },
    ],
  },

  // === GEEL (10-12) ===
  {
    band: "geel",
    schaalType: "sterren",
    maxScore: 5,
    doelAantal: 20,
    pijlers: [
      {
        pijler: P.SCH,
        items: [
          {
            itemCode: "sch_afstandsschot",
            label: "Afstandsschot",
            vraagTekst: "Schiet goed van afstand",
          },
          { itemCode: "sch_doorloopbal", label: "Doorloopbal", vraagTekst: "Maakt doorloopballen" },
          {
            itemCode: "sch_schotkeuze",
            label: "Schotkeuze",
            vraagTekst: "Kiest het juiste moment om te schieten",
          },
        ],
      },
      {
        pijler: P.AAN,
        items: [
          {
            itemCode: "aan_vrijlopen",
            label: "Vrijlopen",
            vraagTekst: "Loopt slim vrij van de tegenstander",
          },
          {
            itemCode: "aan_positie",
            label: "Positiespel",
            vraagTekst: "Neemt goede posities in bij aanval",
          },
          { itemCode: "aan_dreigen", label: "Dreigen", vraagTekst: "Dreigt richting de korf" },
        ],
      },
      {
        pijler: P.PAS,
        items: [
          {
            itemCode: "pas_techniek",
            label: "Passtechniek",
            vraagTekst: "Gooit technisch goed over",
          },
          {
            itemCode: "pas_overzicht",
            label: "Overzicht",
            vraagTekst: "Ziet vrije medespelers staan",
          },
          {
            itemCode: "pas_balbehandeling",
            label: "Balbehandeling",
            vraagTekst: "Vangt en verwerkt de bal goed",
          },
        ],
      },
      {
        pijler: P.VER,
        items: [
          { itemCode: "ver_dekken", label: "Dekken", vraagTekst: "Dekt de tegenstander goed af" },
          {
            itemCode: "ver_onderscheppen",
            label: "Onderscheppen",
            vraagTekst: "Onderschept ballen",
          },
          {
            itemCode: "ver_positie",
            label: "Verdedigingspositie",
            vraagTekst: "Staat op de goede plek bij verdedigen",
          },
        ],
      },
      {
        pijler: P.FYS,
        items: [
          { itemCode: "fys_snelheid", label: "Snelheid", vraagTekst: "Is snel in korte sprints" },
          {
            itemCode: "fys_uithoudingsvermogen",
            label: "Uithoudingsvermogen",
            vraagTekst: "Houdt het tempo de hele wedstrijd vol",
          },
          {
            itemCode: "fys_beweeglijkheid",
            label: "Beweeglijkheid",
            vraagTekst: "Beweegt soepel en wendbaar",
          },
        ],
      },
      {
        pijler: P.MEN,
        items: [
          { itemCode: "men_inzet", label: "Inzet", vraagTekst: "Geeft altijd 100% inzet" },
          {
            itemCode: "men_concentratie",
            label: "Concentratie",
            vraagTekst: "Blijft geconcentreerd tijdens de wedstrijd",
          },
          {
            itemCode: "men_coachbaarheid",
            label: "Coachbaarheid",
            vraagTekst: "Neemt aanwijzingen goed aan",
          },
        ],
      },
    ],
  },

  // === ORANJE (13-15) ===
  {
    band: "oranje",
    schaalType: "sterren",
    maxScore: 5,
    doelAantal: 35,
    pijlers: [
      {
        pijler: P.SCH,
        items: [
          {
            itemCode: "sch_afstandsschot",
            label: "Afstandsschot",
            vraagTekst: "Schiet goed van afstand",
          },
          { itemCode: "sch_doorloopbal", label: "Doorloopbal", vraagTekst: "Maakt doorloopballen" },
          {
            itemCode: "sch_schotkeuze",
            label: "Schotkeuze",
            vraagTekst: "Kiest het juiste moment om te schieten",
          },
          {
            itemCode: "sch_penalty",
            label: "Strafworp",
            vraagTekst: "Scoort strafworpen betrouwbaar",
          },
        ],
      },
      {
        pijler: P.AAN,
        items: [
          {
            itemCode: "aan_vrijlopen",
            label: "Vrijlopen",
            vraagTekst: "Loopt slim vrij van de tegenstander",
          },
          {
            itemCode: "aan_positie",
            label: "Positiespel",
            vraagTekst: "Neemt goede posities in bij aanval",
          },
          { itemCode: "aan_dreigen", label: "Dreigen", vraagTekst: "Dreigt richting de korf" },
          {
            itemCode: "aan_omschakeling",
            label: "Omschakeling",
            vraagTekst: "Schakelt snel om van verdediging naar aanval",
          },
        ],
      },
      {
        pijler: P.PAS,
        items: [
          {
            itemCode: "pas_techniek",
            label: "Passtechniek",
            vraagTekst: "Gooit technisch goed over",
          },
          {
            itemCode: "pas_overzicht",
            label: "Overzicht",
            vraagTekst: "Ziet vrije medespelers staan",
          },
          {
            itemCode: "pas_besluitvorming",
            label: "Besluitvorming",
            vraagTekst: "Maakt de juiste keuze: passen, schieten of vasthouden",
          },
          {
            itemCode: "pas_balbehandeling",
            label: "Balbehandeling",
            vraagTekst: "Vangt en verwerkt de bal goed",
          },
        ],
      },
      {
        pijler: P.VER,
        items: [
          { itemCode: "ver_dekken", label: "Dekken", vraagTekst: "Dekt de tegenstander goed af" },
          {
            itemCode: "ver_onderscheppen",
            label: "Onderscheppen",
            vraagTekst: "Onderschept ballen",
          },
          { itemCode: "ver_rebound", label: "Rebound", vraagTekst: "Pakt rebounds na een schot" },
          {
            itemCode: "ver_communicatie",
            label: "Verdedigingscommunicatie",
            vraagTekst: "Stuurt medespelers aan bij verdedigen",
          },
        ],
      },
      {
        pijler: P.FYS,
        items: [
          { itemCode: "fys_snelheid", label: "Snelheid", vraagTekst: "Is snel in korte sprints" },
          {
            itemCode: "fys_uithoudingsvermogen",
            label: "Uithoudingsvermogen",
            vraagTekst: "Houdt het tempo de hele wedstrijd vol",
          },
          {
            itemCode: "fys_kracht",
            label: "Kracht",
            vraagTekst: "Zet het lichaam goed in bij duels",
          },
          {
            itemCode: "fys_beweeglijkheid",
            label: "Beweeglijkheid",
            vraagTekst: "Beweegt soepel en wendbaar",
          },
        ],
      },
      {
        pijler: P.MEN,
        items: [
          { itemCode: "men_inzet", label: "Inzet", vraagTekst: "Geeft altijd 100% inzet" },
          {
            itemCode: "men_concentratie",
            label: "Concentratie",
            vraagTekst: "Blijft geconcentreerd tijdens de wedstrijd",
          },
          {
            itemCode: "men_leiderschap",
            label: "Leiderschap",
            vraagTekst: "Neemt verantwoordelijkheid en stuurt anderen aan",
          },
          {
            itemCode: "men_weerbaarheid",
            label: "Weerbaarheid",
            vraagTekst: "Herstelt snel na tegenslagen",
          },
        ],
      },
    ],
  },

  // === ROOD (16-18) ===
  {
    band: "rood",
    schaalType: "slider",
    maxScore: 99,
    doelAantal: 56,
    pijlers: [
      {
        pijler: P.SCH,
        items: [
          {
            itemCode: "sch_afstandsschot",
            label: "Afstandsschot",
            vraagTekst: "Schiet krachtig en geplaatst van afstand",
          },
          {
            itemCode: "sch_doorloopbal",
            label: "Doorloopbal",
            vraagTekst: "Maakt doorloopballen onder hoge druk",
          },
          {
            itemCode: "sch_schotkeuze",
            label: "Schotkeuze",
            vraagTekst: "Kiest het optimale schot in elke situatie",
          },
          {
            itemCode: "sch_penalty",
            label: "Strafworp",
            vraagTekst: "Scoort strafworpen onder druk",
          },
          {
            itemCode: "sch_variatie",
            label: "Schotvariatie",
            vraagTekst: "Heeft meerdere schotvormen in het arsenaal",
          },
          {
            itemCode: "sch_scorend_vermogen",
            label: "Scorend vermogen",
            vraagTekst: "Is klinisch in de afronding",
          },
        ],
      },
      {
        pijler: P.AAN,
        items: [
          {
            itemCode: "aan_vrijlopen",
            label: "Vrijlopen",
            vraagTekst: "Loopt slim vrij van de tegenstander",
          },
          {
            itemCode: "aan_positie",
            label: "Positiespel",
            vraagTekst: "Neemt goede posities in bij aanval",
          },
          { itemCode: "aan_dreigen", label: "Dreigen", vraagTekst: "Dreigt richting de korf" },
          {
            itemCode: "aan_omschakeling",
            label: "Omschakeling",
            vraagTekst: "Schakelt snel om van verdediging naar aanval",
          },
          {
            itemCode: "aan_1_op_1",
            label: "1-tegen-1",
            vraagTekst: "Wint duels in 1-tegen-1 situaties",
          },
          {
            itemCode: "aan_spelcreatie",
            label: "Spelcreatie",
            vraagTekst: "Creëert kansen voor medespelers",
          },
        ],
      },
      {
        pijler: P.PAS,
        items: [
          {
            itemCode: "pas_techniek",
            label: "Passtechniek",
            vraagTekst: "Gooit technisch goed over",
          },
          {
            itemCode: "pas_overzicht",
            label: "Overzicht",
            vraagTekst: "Ziet vrije medespelers staan",
          },
          {
            itemCode: "pas_besluitvorming",
            label: "Besluitvorming",
            vraagTekst: "Maakt de juiste keuze: passen, schieten of vasthouden",
          },
          {
            itemCode: "pas_balbehandeling",
            label: "Balbehandeling",
            vraagTekst: "Vangt en verwerkt de bal goed",
          },
          {
            itemCode: "pas_aanname",
            label: "Aanname",
            vraagTekst: "Neemt de bal in volle sprint feilloos aan",
          },
          {
            itemCode: "pas_creativiteit",
            label: "Creativiteit",
            vraagTekst: "Verrast met onverwachte passes en acties",
          },
        ],
      },
      {
        pijler: P.VER,
        items: [
          { itemCode: "ver_dekken", label: "Dekken", vraagTekst: "Dekt de tegenstander goed af" },
          {
            itemCode: "ver_onderscheppen",
            label: "Onderscheppen",
            vraagTekst: "Onderschept ballen",
          },
          { itemCode: "ver_rebound", label: "Rebound", vraagTekst: "Pakt rebounds na een schot" },
          {
            itemCode: "ver_communicatie",
            label: "Verdedigingscommunicatie",
            vraagTekst: "Stuurt medespelers aan bij verdedigen",
          },
          { itemCode: "ver_blok", label: "Blokken", vraagTekst: "Blokkeert effectief schoten" },
          {
            itemCode: "ver_druk_zetten",
            label: "Druk zetten",
            vraagTekst: "Zet continu druk op de bal",
          },
        ],
      },
      {
        pijler: P.FYS,
        items: [
          { itemCode: "fys_snelheid", label: "Snelheid", vraagTekst: "Is snel in korte sprints" },
          {
            itemCode: "fys_uithoudingsvermogen",
            label: "Uithoudingsvermogen",
            vraagTekst: "Houdt het tempo de hele wedstrijd vol",
          },
          {
            itemCode: "fys_kracht",
            label: "Kracht",
            vraagTekst: "Zet het lichaam goed in bij duels",
          },
          {
            itemCode: "fys_beweeglijkheid",
            label: "Beweeglijkheid",
            vraagTekst: "Beweegt soepel en wendbaar",
          },
          {
            itemCode: "fys_sprongkracht",
            label: "Sprongkracht",
            vraagTekst: "Heeft goede sprongkracht bij rebounds en schoten",
          },
          {
            itemCode: "fys_herstel",
            label: "Herstel",
            vraagTekst: "Herstelt snel na intensieve acties",
          },
        ],
      },
      {
        pijler: P.MEN,
        items: [
          { itemCode: "men_inzet", label: "Inzet", vraagTekst: "Geeft altijd 100% inzet" },
          {
            itemCode: "men_concentratie",
            label: "Concentratie",
            vraagTekst: "Blijft geconcentreerd tijdens de wedstrijd",
          },
          {
            itemCode: "men_leiderschap",
            label: "Leiderschap",
            vraagTekst: "Neemt verantwoordelijkheid en stuurt anderen aan",
          },
          {
            itemCode: "men_weerbaarheid",
            label: "Weerbaarheid",
            vraagTekst: "Herstelt snel na tegenslagen",
          },
          {
            itemCode: "men_spelintelligentie",
            label: "Spelintelligentie",
            vraagTekst: "Leest het spel en anticipeert op situaties",
          },
          {
            itemCode: "men_wedstrijdmentaliteit",
            label: "Wedstrijdmentaliteit",
            vraagTekst: "Presteert beter naarmate de wedstrijd belangrijker is",
          },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const SEIZOEN = "2025-2026";
const VERSIE_NAAM = "Vaardigheidsraamwerk v1.1";

async function main() {
  process.stdout.write(`Seed catalogus voor seizoen ${SEIZOEN}...\n\n`);

  // 1. Upsert CatalogusVersie
  const versie = await prisma.catalogusVersie.upsert({
    where: { seizoen: SEIZOEN },
    create: {
      seizoen: SEIZOEN,
      naam: VERSIE_NAAM,
      status: "ACTIEF",
      gepubliceerdOp: new Date(),
    },
    update: {
      naam: VERSIE_NAAM,
      status: "ACTIEF",
      gepubliceerdOp: new Date(),
    },
  });
  process.stdout.write(`Versie: ${versie.id} (${versie.seizoen}, ${versie.status})\n\n`);

  let totaalItems = 0;

  for (const groepDef of GROEPEN) {
    // 2. Upsert CatalogusGroep
    const groep = await prisma.catalogusGroep.upsert({
      where: {
        versieId_band: {
          versieId: versie.id,
          band: groepDef.band,
        },
      },
      create: {
        versieId: versie.id,
        band: groepDef.band,
        schaalType: groepDef.schaalType,
        maxScore: groepDef.maxScore,
        doelAantal: groepDef.doelAantal,
      },
      update: {
        schaalType: groepDef.schaalType,
        maxScore: groepDef.maxScore,
        doelAantal: groepDef.doelAantal,
      },
    });

    let groepItems = 0;

    for (let pIdx = 0; pIdx < groepDef.pijlers.length; pIdx++) {
      const pijlerDef = groepDef.pijlers[pIdx];

      // 3. Upsert CatalogusPijler
      const pijler = await prisma.catalogusPijler.upsert({
        where: {
          groepId_code: {
            groepId: groep.id,
            code: pijlerDef.pijler.code,
          },
        },
        create: {
          groepId: groep.id,
          code: pijlerDef.pijler.code,
          naam: pijlerDef.pijler.naam,
          icoon: pijlerDef.pijler.icoon,
          volgorde: pIdx,
        },
        update: {
          naam: pijlerDef.pijler.naam,
          icoon: pijlerDef.pijler.icoon,
          volgorde: pIdx,
        },
      });

      // 4. Upsert CatalogusItems
      for (let iIdx = 0; iIdx < pijlerDef.items.length; iIdx++) {
        const itemDef = pijlerDef.items[iIdx];

        await prisma.catalogusItem.upsert({
          where: {
            pijlerId_itemCode: {
              pijlerId: pijler.id,
              itemCode: itemDef.itemCode,
            },
          },
          create: {
            pijlerId: pijler.id,
            itemCode: itemDef.itemCode,
            label: itemDef.label,
            vraagTekst: itemDef.vraagTekst,
            volgorde: iIdx,
          },
          update: {
            label: itemDef.label,
            vraagTekst: itemDef.vraagTekst,
            volgorde: iIdx,
          },
        });

        groepItems++;
      }
    }

    totaalItems += groepItems;
    const pijlerCodes = groepDef.pijlers.map((p) => p.pijler.code).join(", ");
    process.stdout.write(
      `  ${groepDef.band.padEnd(7)} | ${groepDef.schaalType.padEnd(7)} | max ${String(groepDef.maxScore).padStart(2)} | ${groepDef.pijlers.length} pijlers (${pijlerCodes}) | ${groepItems} items\n`
    );
  }

  process.stdout.write(`\nKlaar! ${totaalItems} items in ${GROEPEN.length} banden geseeded.\n`);
}

main()
  .catch((e) => {
    process.stderr.write(`Fout: ${String(e)}\n`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
