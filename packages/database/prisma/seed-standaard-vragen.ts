/**
 * Seed standaardvragen voor de seizoensblauwdruk.
 *
 * Draai met: npx tsx packages/database/prisma/seed-standaard-vragen.ts
 */

import { prisma } from "@oranje-wit/database";

type VraagDef = {
  code: string;
  vraag: string;
  groep: string;
  volgorde: number;
  antwoordType: "TEKST" | "GETAL" | "JA_NEE" | "KEUZE" | "GETAL_RANGE";
  opties?: string[];
  toonAls?: { code: string; operator: string; waarde: number | boolean };
};

const VRAGEN: VraagDef[] = [
  // ═══════════════════════════════════════════════
  // GROEP 1: TEAMAANTALLEN
  // ═══════════════════════════════════════════════
  {
    code: "TEAMS_SENIOREN_A",
    vraag: "Hoeveel A-categorie seniorenteams?",
    groep: "TEAMAANTALLEN",
    volgorde: 1,
    antwoordType: "GETAL",
  },
  {
    code: "TEAMS_SENIOREN_B",
    vraag: "Hoeveel B-categorie seniorenteams?",
    groep: "TEAMAANTALLEN",
    volgorde: 2,
    antwoordType: "GETAL",
  },
  {
    code: "TEAMS_U19",
    vraag: "Hoeveel U19 teams?",
    groep: "TEAMAANTALLEN",
    volgorde: 3,
    antwoordType: "GETAL",
  },
  {
    code: "TEAMS_U17",
    vraag: "Hoeveel U17 teams?",
    groep: "TEAMAANTALLEN",
    volgorde: 4,
    antwoordType: "GETAL",
  },
  {
    code: "TEAMS_U15",
    vraag: "Hoeveel U15 teams?",
    groep: "TEAMAANTALLEN",
    volgorde: 5,
    antwoordType: "GETAL",
  },

  // ═══════════════════════════════════════════════
  // GROEP 2: SELECTIESTRUCTUUR
  // ═══════════════════════════════════════════════

  // — Senioren 1e selectie (bij >= 3 A-teams)
  {
    code: "SELECTIE_SEN1_ACTIEF",
    vraag: "Is er een 1e senioren selectie (Sen 1 + Sen 2) bij seizoensstart?",
    groep: "SELECTIESTRUCTUUR",
    volgorde: 10,
    antwoordType: "JA_NEE",
    toonAls: { code: "TEAMS_SENIOREN_A", operator: ">=", waarde: 3 },
  },
  {
    code: "SELECTIE_SEN1_COMMUNICATIE",
    vraag:
      "Wordt de samenstelling vooraf bekendgemaakt of vindt selectie plaats gedurende het seizoen?",
    groep: "SELECTIESTRUCTUUR",
    volgorde: 11,
    antwoordType: "KEUZE",
    opties: ["Vooraf bekendgemaakt", "Selectie gedurende seizoen"],
    toonAls: { code: "SELECTIE_SEN1_ACTIEF", operator: "==", waarde: true },
  },
  {
    code: "SELECTIE_SEN1_AFVALLERS",
    vraag:
      "Worden er afvallers verwacht bij de 1e selectie waarvoor een passende plaats moet worden vrijgehouden?",
    groep: "SELECTIESTRUCTUUR",
    volgorde: 12,
    antwoordType: "JA_NEE",
    toonAls: { code: "SELECTIE_SEN1_ACTIEF", operator: "==", waarde: true },
  },

  // — Senioren 2e selectie (bij >= 4 A-teams)
  {
    code: "SELECTIE_SEN2_ACTIEF",
    vraag: "Is er een 2e senioren selectie bij seizoensstart? Zo ja, welke 2 A-categorie teams?",
    groep: "SELECTIESTRUCTUUR",
    volgorde: 13,
    antwoordType: "JA_NEE",
    toonAls: { code: "TEAMS_SENIOREN_A", operator: ">=", waarde: 4 },
  },
  {
    code: "SELECTIE_SEN2_COMMUNICATIE",
    vraag:
      "Wordt de samenstelling vooraf bekendgemaakt of vindt selectie plaats gedurende het seizoen?",
    groep: "SELECTIESTRUCTUUR",
    volgorde: 14,
    antwoordType: "KEUZE",
    opties: ["Vooraf bekendgemaakt", "Selectie gedurende seizoen"],
    toonAls: { code: "SELECTIE_SEN2_ACTIEF", operator: "==", waarde: true },
  },
  {
    code: "SELECTIE_SEN2_AFVALLERS",
    vraag:
      "Worden er afvallers verwacht bij de 2e selectie waarvoor een passende plaats moet worden vrijgehouden?",
    groep: "SELECTIESTRUCTUUR",
    volgorde: 15,
    antwoordType: "JA_NEE",
    toonAls: { code: "SELECTIE_SEN2_ACTIEF", operator: "==", waarde: true },
  },

  // — U19 selectie (bij >= 2 teams)
  {
    code: "SELECTIE_U19_ACTIEF",
    vraag: "Is er een U19 selectie (U19-1 + U19-2) bij seizoensstart?",
    groep: "SELECTIESTRUCTUUR",
    volgorde: 20,
    antwoordType: "JA_NEE",
    toonAls: { code: "TEAMS_U19", operator: ">=", waarde: 2 },
  },
  {
    code: "SELECTIE_U19_COMMUNICATIE",
    vraag:
      "Wordt de samenstelling vooraf bekendgemaakt of vindt selectie plaats gedurende het seizoen?",
    groep: "SELECTIESTRUCTUUR",
    volgorde: 21,
    antwoordType: "KEUZE",
    opties: ["Vooraf bekendgemaakt", "Selectie gedurende seizoen"],
    toonAls: { code: "SELECTIE_U19_ACTIEF", operator: "==", waarde: true },
  },
  {
    code: "SELECTIE_U19_AFVALLERS",
    vraag:
      "Worden er afvallers verwacht bij de U19 selectie waarvoor een passende plaats moet worden vrijgehouden?",
    groep: "SELECTIESTRUCTUUR",
    volgorde: 22,
    antwoordType: "JA_NEE",
    toonAls: { code: "SELECTIE_U19_ACTIEF", operator: "==", waarde: true },
  },

  // — U17 selectie (bij >= 2 teams)
  {
    code: "SELECTIE_U17_ACTIEF",
    vraag: "Is er een U17 selectie (U17-1 + U17-2) bij seizoensstart?",
    groep: "SELECTIESTRUCTUUR",
    volgorde: 30,
    antwoordType: "JA_NEE",
    toonAls: { code: "TEAMS_U17", operator: ">=", waarde: 2 },
  },
  {
    code: "SELECTIE_U17_COMMUNICATIE",
    vraag:
      "Wordt de samenstelling vooraf bekendgemaakt of vindt selectie plaats gedurende het seizoen?",
    groep: "SELECTIESTRUCTUUR",
    volgorde: 31,
    antwoordType: "KEUZE",
    opties: ["Vooraf bekendgemaakt", "Selectie gedurende seizoen"],
    toonAls: { code: "SELECTIE_U17_ACTIEF", operator: "==", waarde: true },
  },
  {
    code: "SELECTIE_U17_AFVALLERS",
    vraag:
      "Worden er afvallers verwacht bij de U17 selectie waarvoor een passende plaats moet worden vrijgehouden?",
    groep: "SELECTIESTRUCTUUR",
    volgorde: 32,
    antwoordType: "JA_NEE",
    toonAls: { code: "SELECTIE_U17_ACTIEF", operator: "==", waarde: true },
  },

  // — U15 selectie (bij >= 2 teams)
  {
    code: "SELECTIE_U15_ACTIEF",
    vraag: "Is er een U15 selectie (U15-1 + U15-2) bij seizoensstart?",
    groep: "SELECTIESTRUCTUUR",
    volgorde: 40,
    antwoordType: "JA_NEE",
    toonAls: { code: "TEAMS_U15", operator: ">=", waarde: 2 },
  },
  {
    code: "SELECTIE_U15_COMMUNICATIE",
    vraag:
      "Wordt de samenstelling vooraf bekendgemaakt of vindt selectie plaats gedurende het seizoen?",
    groep: "SELECTIESTRUCTUUR",
    volgorde: 41,
    antwoordType: "KEUZE",
    opties: ["Vooraf bekendgemaakt", "Selectie gedurende seizoen"],
    toonAls: { code: "SELECTIE_U15_ACTIEF", operator: "==", waarde: true },
  },
  {
    code: "SELECTIE_U15_AFVALLERS",
    vraag:
      "Worden er afvallers verwacht bij de U15 selectie waarvoor een passende plaats moet worden vrijgehouden?",
    groep: "SELECTIESTRUCTUUR",
    volgorde: 42,
    antwoordType: "JA_NEE",
    toonAls: { code: "SELECTIE_U15_ACTIEF", operator: "==", waarde: true },
  },

  // ═══════════════════════════════════════════════
  // GROEP 3: BEZETTINGSGRAAD
  // ═══════════════════════════════════════════════

  // A-cat selecties
  {
    code: "BEZETTING_SEN_A_SELECTIE",
    vraag: "Bezettingsgraad A-categorie senioren selectie (per geslacht)",
    groep: "BEZETTINGSGRAAD",
    volgorde: 50,
    antwoordType: "GETAL_RANGE",
    toonAls: { code: "SELECTIE_SEN1_ACTIEF", operator: "==", waarde: true },
  },
  {
    code: "BEZETTING_U19_SELECTIE",
    vraag: "Bezettingsgraad U19 selectie (per geslacht)",
    groep: "BEZETTINGSGRAAD",
    volgorde: 51,
    antwoordType: "GETAL_RANGE",
    toonAls: { code: "SELECTIE_U19_ACTIEF", operator: "==", waarde: true },
  },
  {
    code: "BEZETTING_U17_SELECTIE",
    vraag: "Bezettingsgraad U17 selectie (per geslacht)",
    groep: "BEZETTINGSGRAAD",
    volgorde: 52,
    antwoordType: "GETAL_RANGE",
    toonAls: { code: "SELECTIE_U17_ACTIEF", operator: "==", waarde: true },
  },
  {
    code: "BEZETTING_U15_SELECTIE",
    vraag: "Bezettingsgraad U15 selectie (per geslacht)",
    groep: "BEZETTINGSGRAAD",
    volgorde: 53,
    antwoordType: "GETAL_RANGE",
    toonAls: { code: "SELECTIE_U15_ACTIEF", operator: "==", waarde: true },
  },

  // A-cat per team
  {
    code: "BEZETTING_SEN_A_TEAM",
    vraag: "Bezettingsgraad A-categorie senioren per team (per geslacht)",
    groep: "BEZETTINGSGRAAD",
    volgorde: 54,
    antwoordType: "GETAL_RANGE",
  },
  {
    code: "BEZETTING_U19_TEAM",
    vraag: "Bezettingsgraad U19 per team (per geslacht)",
    groep: "BEZETTINGSGRAAD",
    volgorde: 55,
    antwoordType: "GETAL_RANGE",
  },
  {
    code: "BEZETTING_U17_TEAM",
    vraag: "Bezettingsgraad U17 per team (per geslacht)",
    groep: "BEZETTINGSGRAAD",
    volgorde: 56,
    antwoordType: "GETAL_RANGE",
  },
  {
    code: "BEZETTING_U15_TEAM",
    vraag: "Bezettingsgraad U15 per team (per geslacht)",
    groep: "BEZETTINGSGRAAD",
    volgorde: 57,
    antwoordType: "GETAL_RANGE",
  },

  // B-cat
  {
    code: "BEZETTING_SEN_B_TEAM",
    vraag: "Bezettingsgraad B-categorie senioren per team (per geslacht)",
    groep: "BEZETTINGSGRAAD",
    volgorde: 58,
    antwoordType: "GETAL_RANGE",
  },
  {
    code: "BEZETTING_ROOD",
    vraag: "Bezettingsgraad Rood (B-categorie 8-tal) per team (per geslacht)",
    groep: "BEZETTINGSGRAAD",
    volgorde: 60,
    antwoordType: "GETAL_RANGE",
  },
  {
    code: "BEZETTING_ORANJE",
    vraag: "Bezettingsgraad Oranje (B-categorie 8-tal) per team (per geslacht)",
    groep: "BEZETTINGSGRAAD",
    volgorde: 61,
    antwoordType: "GETAL_RANGE",
  },
  {
    code: "BEZETTING_GEEL",
    vraag: "Bezettingsgraad Geel (B-categorie 8-tal) per team (per geslacht)",
    groep: "BEZETTINGSGRAAD",
    volgorde: 62,
    antwoordType: "GETAL_RANGE",
  },
  {
    code: "BEZETTING_GEEL_4",
    vraag: "Bezettingsgraad Geel 4-korfbal per team (per geslacht)",
    groep: "BEZETTINGSGRAAD",
    volgorde: 63,
    antwoordType: "GETAL_RANGE",
  },
  {
    code: "BEZETTING_GROEN",
    vraag: "Bezettingsgraad Groen (4-korfbal) per team (per geslacht)",
    groep: "BEZETTINGSGRAAD",
    volgorde: 64,
    antwoordType: "GETAL_RANGE",
  },
  {
    code: "BEZETTING_BLAUW",
    vraag: "Bezettingsgraad Blauw (4-korfbal) per team (per geslacht)",
    groep: "BEZETTINGSGRAAD",
    volgorde: 65,
    antwoordType: "GETAL_RANGE",
  },

  // ═══════════════════════════════════════════════
  // GROEP 4: DOORSTROOM EN BELEID
  // ═══════════════════════════════════════════════
  {
    code: "DOORSTROOM_VERVROEGD",
    vraag: "Mogen spelers vervroegd doorstromen naar een hogere categorie?",
    groep: "DOORSTROOM",
    volgorde: 70,
    antwoordType: "JA_NEE",
  },
  {
    code: "DOORSTROOM_DUBBELSPELEN",
    vraag: "Is dubbelspelen toegestaan dit seizoen?",
    groep: "DOORSTROOM",
    volgorde: 71,
    antwoordType: "JA_NEE",
  },
  {
    code: "DOORSTROOM_TERUGSTROMEN",
    vraag: "Mag een speler terugstromen naar een lagere categorie?",
    groep: "DOORSTROOM",
    volgorde: 72,
    antwoordType: "JA_NEE",
  },
];

async function main() {
  console.log(`Seeding ${VRAGEN.length} standaardvragen...`);

  for (const v of VRAGEN) {
    await prisma.standaardVraag.upsert({
      where: { code: v.code },
      create: {
        code: v.code,
        vraag: v.vraag,
        groep: v.groep,
        volgorde: v.volgorde,
        antwoordType: v.antwoordType,
        opties: v.opties ?? [],
        toonAls: v.toonAls ?? undefined,
      },
      update: {
        vraag: v.vraag,
        groep: v.groep,
        volgorde: v.volgorde,
        antwoordType: v.antwoordType,
        opties: v.opties ?? [],
        toonAls: v.toonAls ?? undefined,
      },
    });
  }

  console.log(`✓ ${VRAGEN.length} standaardvragen geseeded`);
}

main().catch(console.error);
