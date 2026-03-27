/**
 * Seed-script: genereert een complete demo-database voor c.k.v. Oranje Wit.
 *
 * Genereert:
 * - ~283 leden (213 jeugd + 70 senioren) met realistische Nederlandse namen
 * - ~33 teams (26 jeugd + 7 senioren) met KNKV-kleuren en teamratings
 * - 4 seizoenen historie (2022-2023 t/m 2025-2026) met doorstroming en verloop
 * - Scouting-data voor het huidige seizoen (rapporten, sessies, spelerskaarten)
 *
 * Idempotent: verwijdert eerst alle DEMO-data, maakt dan alles opnieuw aan.
 *
 * Gebruik: pnpm seed:demo  (of: npx tsx -r dotenv/config scripts/seed-demo-data.ts)
 */

import "dotenv/config";
import { prisma } from "../packages/database/src/index";
import { logger } from "@oranje-wit/types";

// ═══════════════════════════════════════════════════════════
// CONFIGURATIE
// ═══════════════════════════════════════════════════════════

const SEIZOENEN = ["2022-2023", "2023-2024", "2024-2025", "2025-2026"] as const;
const HUIDIG_SEIZOEN = "2025-2026";
const PEILJAAR = 2026; // 31 december van dit jaar

// Prefix voor demo-data — maakt cleanup eenvoudig
// Tests (e2e/scouting) verwachten TSTN als prefix (TSTN001, TSTN099, etc.)
const DEMO_PREFIX = "TSTN";

// E2E testgebruiker — krijgt een Scout record met TC-rol
const E2E_TEST_EMAIL = "antjanlaban@gmail.com";

// Seeded random number generator voor reproduceerbare resultaten
class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 2 ** 32;
    return (this.seed >>> 0) / 2 ** 32;
  }
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  pick<T>(arr: T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }
  shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  gaussian(mean: number, stddev: number): number {
    // Box-Muller transform
    const u1 = this.next();
    const u2 = this.next();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * stddev;
  }
}

const rng = new SeededRandom(42);

// ═══════════════════════════════════════════════════════════
// NAAM-GENERATIE
// ═══════════════════════════════════════════════════════════

const ROEPNAMEN_M = [
  "Daan",
  "Sem",
  "Liam",
  "Luuk",
  "Jesse",
  "Lucas",
  "Milan",
  "Finn",
  "Bram",
  "Noah",
  "Lars",
  "Tim",
  "Stijn",
  "Thomas",
  "Max",
  "Ruben",
  "Thijs",
  "Sven",
  "Julian",
  "Niels",
  "Joep",
  "Jasper",
  "Tom",
  "Bas",
  "Rick",
  "Kevin",
  "Mark",
  "Paul",
  "Dennis",
  "Peter",
  "Koen",
  "Wouter",
  "Erik",
  "Jan",
  "Pim",
  "Cas",
  "Levi",
  "Mees",
  "Noud",
  "Tijn",
  "Hidde",
  "Guus",
  "Teun",
  "Gijs",
  "Jens",
  "Sam",
  "Stan",
  "Pepijn",
  "Hugo",
  "Rens",
  "Tygo",
  "Ties",
  "Owen",
  "Fynn",
  "Xavi",
  "Jayden",
  "Mohamed",
  "Youssef",
  "Ibrahim",
  "Thijmen",
  "Floris",
  "Jelmer",
  "Sander",
  "Martijn",
  "Robin",
  "Stefan",
  "Arjan",
  "Marco",
  "René",
  "Frank",
  "Hans",
  "Bart",
  "Pieter",
  "Wim",
  "Henk",
  "Gerrit",
];

const ROEPNAMEN_V = [
  "Emma",
  "Julia",
  "Sophie",
  "Anna",
  "Lisa",
  "Eva",
  "Sara",
  "Mila",
  "Lotte",
  "Fleur",
  "Noa",
  "Tessa",
  "Lynn",
  "Roos",
  "Isa",
  "Nina",
  "Sanne",
  "Floor",
  "Femke",
  "Iris",
  "Amber",
  "Noor",
  "Britt",
  "Lieke",
  "Kim",
  "Laura",
  "Anne",
  "Maria",
  "Linda",
  "Esther",
  "Marieke",
  "Demi",
  "Bo",
  "Zoë",
  "Fenna",
  "Maud",
  "Vera",
  "Yara",
  "Naomi",
  "Hannah",
  "Liv",
  "Olivia",
  "Evi",
  "Lina",
  "Jasmijn",
  "Milou",
  "Puck",
  "Merel",
  "Jill",
  "Nikki",
  "Anouk",
  "Nienke",
  "Karlijn",
  "Suzanne",
  "Monique",
  "Jessica",
  "Patricia",
  "Sandra",
  "Ellen",
  "Corine",
  "Wilma",
  "Inge",
  "Renate",
  "Tineke",
  "Wendy",
  "Diana",
  "Sylvia",
  "Jolanda",
];

const ACHTERNAMEN = [
  "Bakker",
  "Visser",
  "Smit",
  "Meijer",
  "Bos",
  "Janssen",
  "Peters",
  "Hendriks",
  "Dekker",
  "Brouwer",
  "Vos",
  "Kok",
  "Mulder",
  "Graaf",
  "Jansen",
  "Groot",
  "Dijkstra",
  "Boer",
  "Dam",
  "Vermeer",
  "Willems",
  "Jacobs",
  "Berg",
  "Vries",
  "Jong",
  "Kramer",
  "Kuiper",
  "Schouten",
  "Verhoeven",
  "Klein",
  "Maas",
  "Leeuwen",
  "Wolf",
  "Vliet",
  "Hoek",
  "Haan",
  "Ruiter",
  "Dijk",
  "Admiraal",
  "Ven",
  "Donker",
  "Burg",
  "Prins",
  "Roos",
  "Wit",
  "Zwart",
  "Molenaar",
  "Eijk",
  "Laan",
  "Appel",
  "Koning",
  "Meer",
  "Dalen",
  "Steen",
  "Hart",
  "Berger",
  "Waard",
  "Kampen",
  "Hoorn",
  "Vogel",
  "Linden",
  "Veld",
  "Rijn",
  "Beek",
  "Poel",
  "Broek",
  "Sloot",
  "Wijk",
  "Buren",
  "Spijk",
];

const TUSSENVOEGSELS = [
  null,
  null,
  null,
  null,
  null, // 50% geen tussenvoegsel
  "van",
  "van",
  "de",
  "de",
  "van de",
  "van den",
  "van der",
  "den",
  "ter",
  "in 't",
];

function generateRelCode(index: number): string {
  return `${DEMO_PREFIX}${String(index).padStart(3, "0")}`;
}

interface DemoSpeler {
  relCode: string;
  roepnaam: string;
  achternaam: string;
  tussenvoegsel: string | null;
  geslacht: "M" | "V";
  geboortedatum: Date;
  geboortejaar: number;
  groep: string; // blauw, groen, geel, oranje, rood_b, u15, u17, u19, senioren
  startSeizoen: string; // wanneer begonnen
}

function generateDate(year: number, monthMin: number, monthMax: number): Date {
  const month = rng.int(monthMin, monthMax);
  const day = rng.int(1, 28); // safe voor alle maanden
  return new Date(year, month, day);
}

// ═══════════════════════════════════════════════════════════
// RETENTIE UIT JEUGDMODEL
// ═══════════════════════════════════════════════════════════

const RETENTIE_PER_LEEFTIJD: Record<number, number> = {
  5: 0.85,
  6: 0.82,
  7: 0.84,
  8: 0.95,
  9: 0.93,
  10: 0.93,
  11: 0.92,
  12: 0.9,
  13: 0.94,
  14: 0.95,
  15: 0.92,
  16: 0.87,
  17: 0.82,
  18: 0.84,
};

function retentiekans(leeftijd: number): number {
  if (leeftijd < 5) return 0.85;
  if (leeftijd > 18) return 0.9;
  return RETENTIE_PER_LEEFTIJD[leeftijd] ?? 0.9;
}

// ═══════════════════════════════════════════════════════════
// TEAM-DEFINITIE
// ═══════════════════════════════════════════════════════════

interface TeamDef {
  naam: string;
  kleur: string;
  categorie: "a" | "b";
  aCat?: string; // U15, U17, U19
  spelvorm: "4-tal" | "8-tal";
  minSpelers: number;
  maxSpelers: number;
  geboortejaarMin: number; // vroegst mogelijke geboortejaar (oudste)
  geboortejaarMax: number; // laatst mogelijke geboortejaar (jongste)
  knkvRating: number; // KNKV teamrating voor seizoen 2025-2026
  seniorenType?: string; // "selectie" | "wedstrijd" | "breedte" | "midweek"
}

// Teams voor seizoen 2025-2026 (peildatum 31-12-2025)
// Geboortejaren gebaseerd op KNKV-regels
function buildTeamDefs(): TeamDef[] {
  return [
    // === PAARS (geen team, trainingsgroep) ===
    // Paars = 2021-2022 geboortejaar, 5 kinderen, geen competitie

    // === BLAUW (4 teams, 4-tal) ===
    // 6-7 jaar: geboortejaar 2019-2021 (peildatum 31-12-2025)
    {
      naam: "J15",
      kleur: "blauw",
      categorie: "b",
      spelvorm: "4-tal",
      minSpelers: 5,
      maxSpelers: 6,
      geboortejaarMin: 2019,
      geboortejaarMax: 2021,
      knkvRating: 15,
    },
    {
      naam: "J16",
      kleur: "blauw",
      categorie: "b",
      spelvorm: "4-tal",
      minSpelers: 5,
      maxSpelers: 6,
      geboortejaarMin: 2019,
      geboortejaarMax: 2020,
      knkvRating: 25,
    },
    {
      naam: "J17",
      kleur: "blauw",
      categorie: "b",
      spelvorm: "4-tal",
      minSpelers: 5,
      maxSpelers: 6,
      geboortejaarMin: 2019,
      geboortejaarMax: 2020,
      knkvRating: 30,
    },
    {
      naam: "J18",
      kleur: "blauw",
      categorie: "b",
      spelvorm: "4-tal",
      minSpelers: 5,
      maxSpelers: 6,
      geboortejaarMin: 2020,
      geboortejaarMax: 2021,
      knkvRating: 12,
    },

    // === GROEN (5 teams, 4-tal) ===
    // 8-9 jaar: geboortejaar 2017-2018
    {
      naam: "J11",
      kleur: "groen",
      categorie: "b",
      spelvorm: "4-tal",
      minSpelers: 5,
      maxSpelers: 6,
      geboortejaarMin: 2017,
      geboortejaarMax: 2018,
      knkvRating: 55,
    },
    {
      naam: "J12",
      kleur: "groen",
      categorie: "b",
      spelvorm: "4-tal",
      minSpelers: 5,
      maxSpelers: 6,
      geboortejaarMin: 2017,
      geboortejaarMax: 2018,
      knkvRating: 65,
    },
    {
      naam: "J13",
      kleur: "groen",
      categorie: "b",
      spelvorm: "4-tal",
      minSpelers: 5,
      maxSpelers: 6,
      geboortejaarMin: 2017,
      geboortejaarMax: 2018,
      knkvRating: 72,
    },
    {
      naam: "J14",
      kleur: "groen",
      categorie: "b",
      spelvorm: "4-tal",
      minSpelers: 5,
      maxSpelers: 6,
      geboortejaarMin: 2017,
      geboortejaarMax: 2018,
      knkvRating: 48,
    },
    {
      naam: "J10",
      kleur: "groen",
      categorie: "b",
      spelvorm: "4-tal",
      minSpelers: 5,
      maxSpelers: 6,
      geboortejaarMin: 2017,
      geboortejaarMax: 2018,
      knkvRating: 60,
    },

    // === GEEL (5 teams, 8-tal) ===
    // 10-12 jaar: geboortejaar 2014-2016
    {
      naam: "J6",
      kleur: "geel",
      categorie: "b",
      spelvorm: "8-tal",
      minSpelers: 8,
      maxSpelers: 11,
      geboortejaarMin: 2014,
      geboortejaarMax: 2016,
      knkvRating: 85,
    },
    {
      naam: "J7",
      kleur: "geel",
      categorie: "b",
      spelvorm: "8-tal",
      minSpelers: 8,
      maxSpelers: 11,
      geboortejaarMin: 2014,
      geboortejaarMax: 2016,
      knkvRating: 78,
    },
    {
      naam: "J8",
      kleur: "geel",
      categorie: "b",
      spelvorm: "8-tal",
      minSpelers: 8,
      maxSpelers: 11,
      geboortejaarMin: 2014,
      geboortejaarMax: 2016,
      knkvRating: 100,
    },
    {
      naam: "J9",
      kleur: "geel",
      categorie: "b",
      spelvorm: "8-tal",
      minSpelers: 8,
      maxSpelers: 11,
      geboortejaarMin: 2014,
      geboortejaarMax: 2016,
      knkvRating: 95,
    },
    {
      naam: "J5",
      kleur: "geel",
      categorie: "b",
      spelvorm: "8-tal",
      minSpelers: 8,
      maxSpelers: 11,
      geboortejaarMin: 2014,
      geboortejaarMax: 2016,
      knkvRating: 108,
    },

    // === ORANJE (5 teams, 8-tal) ===
    // 13-15 jaar: geboortejaar 2011-2013
    {
      naam: "J1",
      kleur: "oranje",
      categorie: "b",
      spelvorm: "8-tal",
      minSpelers: 8,
      maxSpelers: 11,
      geboortejaarMin: 2011,
      geboortejaarMax: 2013,
      knkvRating: 118,
    },
    {
      naam: "J2",
      kleur: "oranje",
      categorie: "b",
      spelvorm: "8-tal",
      minSpelers: 8,
      maxSpelers: 11,
      geboortejaarMin: 2011,
      geboortejaarMax: 2013,
      knkvRating: 112,
    },
    {
      naam: "J3",
      kleur: "oranje",
      categorie: "b",
      spelvorm: "8-tal",
      minSpelers: 8,
      maxSpelers: 11,
      geboortejaarMin: 2011,
      geboortejaarMax: 2013,
      knkvRating: 105,
    },
    {
      naam: "J4",
      kleur: "oranje",
      categorie: "b",
      spelvorm: "8-tal",
      minSpelers: 8,
      maxSpelers: 11,
      geboortejaarMin: 2011,
      geboortejaarMax: 2013,
      knkvRating: 98,
    },
    {
      naam: "J19",
      kleur: "oranje",
      categorie: "b",
      spelvorm: "8-tal",
      minSpelers: 8,
      maxSpelers: 11,
      geboortejaarMin: 2011,
      geboortejaarMax: 2013,
      knkvRating: 92,
    },

    // === ROOD B (4 teams, 8-tal) ===
    // 16-18 jaar: geboortejaar 2008-2010
    {
      naam: "J20",
      kleur: "rood",
      categorie: "b",
      spelvorm: "8-tal",
      minSpelers: 8,
      maxSpelers: 11,
      geboortejaarMin: 2008,
      geboortejaarMax: 2010,
      knkvRating: 125,
    },
    {
      naam: "J21",
      kleur: "rood",
      categorie: "b",
      spelvorm: "8-tal",
      minSpelers: 8,
      maxSpelers: 11,
      geboortejaarMin: 2008,
      geboortejaarMax: 2010,
      knkvRating: 115,
    },
    {
      naam: "J22",
      kleur: "rood",
      categorie: "b",
      spelvorm: "8-tal",
      minSpelers: 8,
      maxSpelers: 11,
      geboortejaarMin: 2008,
      geboortejaarMax: 2010,
      knkvRating: 110,
    },
    {
      naam: "J23",
      kleur: "rood",
      categorie: "b",
      spelvorm: "8-tal",
      minSpelers: 8,
      maxSpelers: 11,
      geboortejaarMin: 2008,
      geboortejaarMax: 2010,
      knkvRating: 118,
    },

    // === A-CATEGORIE (3 teams) ===
    // U15: geboortejaar 2011-2012 (seizoen 2025-2026: 13-14 jaar op 31-12-2025)
    {
      naam: "U15",
      kleur: "rood",
      categorie: "a",
      aCat: "U15",
      spelvorm: "8-tal",
      minSpelers: 8,
      maxSpelers: 10,
      geboortejaarMin: 2011,
      geboortejaarMax: 2012,
      knkvRating: 135,
    },
    // U17: geboortejaar 2009-2010
    {
      naam: "U17",
      kleur: "rood",
      categorie: "a",
      aCat: "U17",
      spelvorm: "8-tal",
      minSpelers: 8,
      maxSpelers: 10,
      geboortejaarMin: 2009,
      geboortejaarMax: 2010,
      knkvRating: 147,
    },
    // U19: geboortejaar 2007-2008
    {
      naam: "U19",
      kleur: "rood",
      categorie: "a",
      aCat: "U19",
      spelvorm: "8-tal",
      minSpelers: 8,
      maxSpelers: 10,
      geboortejaarMin: 2007,
      geboortejaarMax: 2008,
      knkvRating: 155,
    },

    // === SENIOREN (7 teams) ===
    {
      naam: "H1",
      kleur: "senioren",
      categorie: "a",
      spelvorm: "8-tal",
      minSpelers: 11,
      maxSpelers: 11,
      geboortejaarMin: 1985,
      geboortejaarMax: 2006,
      knkvRating: 170,
      seniorenType: "selectie",
    },
    {
      naam: "D1",
      kleur: "senioren",
      categorie: "a",
      spelvorm: "8-tal",
      minSpelers: 11,
      maxSpelers: 11,
      geboortejaarMin: 1985,
      geboortejaarMax: 2006,
      knkvRating: 165,
      seniorenType: "selectie",
    },
    {
      naam: "3",
      kleur: "senioren",
      categorie: "b",
      spelvorm: "8-tal",
      minSpelers: 10,
      maxSpelers: 10,
      geboortejaarMin: 1985,
      geboortejaarMax: 2005,
      knkvRating: 140,
      seniorenType: "wedstrijd",
    },
    {
      naam: "4",
      kleur: "senioren",
      categorie: "b",
      spelvorm: "8-tal",
      minSpelers: 10,
      maxSpelers: 10,
      geboortejaarMin: 1985,
      geboortejaarMax: 2005,
      knkvRating: 130,
      seniorenType: "wedstrijd",
    },
    {
      naam: "5",
      kleur: "senioren",
      categorie: "b",
      spelvorm: "8-tal",
      minSpelers: 10,
      maxSpelers: 10,
      geboortejaarMin: 1985,
      geboortejaarMax: 2003,
      knkvRating: 110,
      seniorenType: "breedte",
    },
    {
      naam: "6",
      kleur: "senioren",
      categorie: "b",
      spelvorm: "8-tal",
      minSpelers: 10,
      maxSpelers: 10,
      geboortejaarMin: 1985,
      geboortejaarMax: 2003,
      knkvRating: 105,
      seniorenType: "breedte",
    },
    {
      naam: "MW1",
      kleur: "senioren",
      categorie: "b",
      spelvorm: "8-tal",
      minSpelers: 8,
      maxSpelers: 8,
      geboortejaarMin: 1970,
      geboortejaarMax: 1995,
      knkvRating: 85,
      seniorenType: "midweek",
    },
  ];
}

// ═══════════════════════════════════════════════════════════
// SPELER-GENERATIE
// ═══════════════════════════════════════════════════════════

function generateSpelers(): DemoSpeler[] {
  const spelers: DemoSpeler[] = [];
  let idx = 1;
  const usedNames = new Set<string>();

  function createSpeler(
    geslacht: "M" | "V",
    geboortejaarMin: number,
    geboortejaarMax: number,
    groep: string,
    startSeizoen: string
  ): DemoSpeler {
    const roepnaam = rng.pick(geslacht === "M" ? ROEPNAMEN_M : ROEPNAMEN_V);
    let achternaam: string;
    let tussenvoegsel: string | null;
    let fullName: string;

    // Zorg voor unieke naam+achternaam combinatie
    do {
      achternaam = rng.pick(ACHTERNAMEN);
      tussenvoegsel = rng.pick(TUSSENVOEGSELS);
      fullName = `${roepnaam}-${tussenvoegsel ?? ""}-${achternaam}`;
    } while (usedNames.has(fullName));
    usedNames.add(fullName);

    const geboortejaar = rng.int(geboortejaarMin, geboortejaarMax);
    const geboortedatum = generateDate(geboortejaar, 0, 11);

    return {
      relCode: generateRelCode(idx++),
      roepnaam,
      achternaam,
      tussenvoegsel,
      geslacht,
      geboortedatum,
      geboortejaar,
      groep,
      startSeizoen,
    };
  }

  // ══════════════════════════════════════════════════════
  // VOLGORDE: senioren EERST zodat TSTN001-010 senioren zijn
  // (E2E tests verwachten: TSTN001-010 = senioren, geb 1995-2005)
  // ══════════════════════════════════════════════════════

  // --- SENIOREN (70 spelers, 7 teams) --- EERST voor TSTN001+
  // H1 selectie (11 heren) -> TSTN001-011
  for (let i = 0; i < 11; i++)
    spelers.push(createSpeler("M", 1995, 2005, "h1", seizoenVoorSenioren()));
  // D1 selectie (11 dames) -> TSTN012-022
  for (let i = 0; i < 11; i++)
    spelers.push(createSpeler("V", 1995, 2005, "d1", seizoenVoorSenioren()));
  // Gemengde teams 3 t/m 6 (5M + 5V per team) -> TSTN023-062
  for (const teamGroep of ["sen3", "sen4", "sen5", "sen6"]) {
    for (let i = 0; i < 5; i++)
      spelers.push(createSpeler("M", 1988, 2005, teamGroep, seizoenVoorSenioren()));
    for (let i = 0; i < 5; i++)
      spelers.push(createSpeler("V", 1988, 2005, teamGroep, seizoenVoorSenioren()));
  }
  // MW1 (4M + 4V) -> TSTN063-070
  for (let i = 0; i < 4; i++)
    spelers.push(createSpeler("M", 1970, 1995, "mw1", seizoenVoorSenioren()));
  for (let i = 0; i < 4; i++)
    spelers.push(createSpeler("V", 1970, 1995, "mw1", seizoenVoorSenioren()));

  // --- PAARS (5 kinderen, 2021-2022, trainingsgroep) -> TSTN071-075 ---
  for (let i = 0; i < 3; i++) spelers.push(createSpeler("M", 2021, 2022, "paars", HUIDIG_SEIZOEN));
  for (let i = 0; i < 2; i++) spelers.push(createSpeler("V", 2021, 2022, "paars", HUIDIG_SEIZOEN));

  // --- BLAUW (23 spelers, 4 teams van 5-6) -> TSTN076-098 ---
  // (23 i.p.v. 22 zodat U15 bij TSTN099 begint, zoals tests verwachten)
  for (let i = 0; i < 12; i++)
    spelers.push(createSpeler("M", 2019, 2021, "blauw", seizoenVoorInstroom(2019, 2021)));
  for (let i = 0; i < 11; i++)
    spelers.push(createSpeler("V", 2019, 2021, "blauw", seizoenVoorInstroom(2019, 2021)));

  // --- A-CATEGORIE U15 (geb 2011-2012) -> TSTN099+ ---
  // (direct na blauw, zodat TSTN099 = eerste U15, zoals tests verwachten)
  // U15: 5M + 4V = 9
  for (let i = 0; i < 5; i++)
    spelers.push(createSpeler("M", 2011, 2012, "u15", seizoenVoorInstroom(2011, 2012)));
  for (let i = 0; i < 4; i++)
    spelers.push(createSpeler("V", 2011, 2012, "u15", seizoenVoorInstroom(2011, 2012)));

  // --- GROEN (28 spelers, 5 teams van 5-6) ---
  for (let i = 0; i < 14; i++)
    spelers.push(createSpeler("M", 2017, 2018, "groen", seizoenVoorInstroom(2017, 2018)));
  for (let i = 0; i < 14; i++)
    spelers.push(createSpeler("V", 2017, 2018, "groen", seizoenVoorInstroom(2017, 2018)));

  // --- GEEL (45 spelers, 5 teams van 8-11) ---
  for (let i = 0; i < 23; i++)
    spelers.push(createSpeler("M", 2014, 2016, "geel", seizoenVoorInstroom(2014, 2016)));
  for (let i = 0; i < 22; i++)
    spelers.push(createSpeler("V", 2014, 2016, "geel", seizoenVoorInstroom(2014, 2016)));

  // --- ORANJE (48 spelers, 5 teams van 8-11) ---
  for (let i = 0; i < 24; i++)
    spelers.push(createSpeler("M", 2011, 2013, "oranje", seizoenVoorInstroom(2011, 2013)));
  for (let i = 0; i < 24; i++)
    spelers.push(createSpeler("V", 2011, 2013, "oranje", seizoenVoorInstroom(2011, 2013)));

  // --- ROOD B (38 spelers, 4 teams van 8-11) ---
  for (let i = 0; i < 19; i++)
    spelers.push(createSpeler("M", 2008, 2010, "rood_b", seizoenVoorInstroom(2008, 2010)));
  for (let i = 0; i < 19; i++)
    spelers.push(createSpeler("V", 2008, 2010, "rood_b", seizoenVoorInstroom(2008, 2010)));

  // --- A-CATEGORIE U17 + U19 (18 spelers) ---
  // U17 (geb 2009-2010): 5M + 4V = 9
  for (let i = 0; i < 5; i++)
    spelers.push(createSpeler("M", 2009, 2010, "u17", seizoenVoorInstroom(2009, 2010)));
  for (let i = 0; i < 4; i++)
    spelers.push(createSpeler("V", 2009, 2010, "u17", seizoenVoorInstroom(2009, 2010)));
  // U19 (geb 2007-2008): 5M + 4V = 9
  for (let i = 0; i < 5; i++)
    spelers.push(createSpeler("M", 2007, 2008, "u19", seizoenVoorInstroom(2007, 2008)));
  for (let i = 0; i < 4; i++)
    spelers.push(createSpeler("V", 2007, 2008, "u19", seizoenVoorInstroom(2007, 2008)));

  logger.info(`Gegenereerd: ${spelers.length} spelers`);
  return spelers;
}

function seizoenVoorInstroom(geboortejaarMin: number, geboortejaarMax: number): string {
  // Meeste jeugdspelers komen binnen bij leeftijd 6-9
  // Geef een seizoen dat past bij wanneer ze begonnen zijn
  const gjaar = rng.int(geboortejaarMin, geboortejaarMax);
  const instroomLeeftijd = rng.int(6, 9);
  const startjaar = gjaar + instroomLeeftijd;
  // Clamp naar ons bereik
  if (startjaar <= 2022) return "2022-2023";
  if (startjaar >= 2025) return "2025-2026";
  return `${startjaar}-${startjaar + 1}`;
}

function seizoenVoorSenioren(): string {
  return rng.pick(["2022-2023", "2023-2024", "2024-2025"]);
}

// ═══════════════════════════════════════════════════════════
// TEAM-TOEWIJZING PER SEIZOEN
// ═══════════════════════════════════════════════════════════

interface SeizoenToewijzing {
  speler: DemoSpeler;
  team: string;
  kleur: string;
  categorie: "a" | "b";
}

function bepaalKleurGroepVoorSeizoen(speler: DemoSpeler, seizoen: string): string | null {
  const seizoenStartJaar = parseInt(seizoen.split("-")[0]);
  const leeftijdOpPeildatum = seizoenStartJaar - speler.geboortejaar;

  // Senioren blijven senioren
  if (["h1", "d1", "sen3", "sen4", "sen5", "sen6", "mw1"].includes(speler.groep)) {
    return speler.groep;
  }

  // A-categorie spelers
  if (["u15", "u17", "u19"].includes(speler.groep)) {
    if (leeftijdOpPeildatum >= 19) return null; // te oud
    if (leeftijdOpPeildatum >= 17) return "u19";
    if (leeftijdOpPeildatum >= 15) return "u17";
    if (leeftijdOpPeildatum >= 13) return "u15";
    return "oranje"; // nog te jong voor A-cat
  }

  // B-categorie: kleur op basis van leeftijd
  if (leeftijdOpPeildatum <= 4) return "paars";
  if (leeftijdOpPeildatum <= 7) return "blauw";
  if (leeftijdOpPeildatum <= 9) return "groen";
  if (leeftijdOpPeildatum <= 12) return "geel";
  if (leeftijdOpPeildatum <= 15) return "oranje";
  if (leeftijdOpPeildatum <= 18) return "rood_b";
  return null; // te oud voor jeugd
}

function buildSeizoenToewijzingen(
  spelers: DemoSpeler[],
  teamDefs: TeamDef[],
  seizoen: string
): SeizoenToewijzing[] {
  const toewijzingen: SeizoenToewijzing[] = [];

  // Verzamel spelers per groep
  const perGroep = new Map<string, DemoSpeler[]>();

  for (const speler of spelers) {
    // Controleer of speler al bestond in dit seizoen
    const seizoenStartJaar = parseInt(seizoen.split("-")[0]);
    const startJaar = parseInt(speler.startSeizoen.split("-")[0]);
    if (startJaar > seizoenStartJaar) continue; // nog niet begonnen

    // Retentie check: bij eerdere seizoenen, sommigen stoppen
    if (seizoen !== HUIDIG_SEIZOEN && seizoen !== speler.startSeizoen) {
      const leeftijd = seizoenStartJaar - speler.geboortejaar;
      const kans = retentiekans(leeftijd);
      if (rng.next() > kans) continue; // gestopt
    }

    const groep = bepaalKleurGroepVoorSeizoen(speler, seizoen);
    if (!groep) continue;

    if (!perGroep.has(groep)) perGroep.set(groep, []);
    perGroep.get(groep)!.push(speler);
  }

  // Verdeel spelers over teams per groep
  for (const [groep, groepSpelers] of perGroep) {
    const matching = teamDefs.filter((t) => {
      if (groep === "paars") return false;
      if (groep === "blauw") return t.kleur === "blauw";
      if (groep === "groen") return t.kleur === "groen";
      if (groep === "geel") return t.kleur === "geel";
      if (groep === "oranje") return t.kleur === "oranje" && t.categorie === "b";
      if (groep === "rood_b") return t.kleur === "rood" && t.categorie === "b";
      if (groep === "u15") return t.aCat === "U15";
      if (groep === "u17") return t.aCat === "U17";
      if (groep === "u19") return t.aCat === "U19";
      if (groep === "h1") return t.naam === "H1";
      if (groep === "d1") return t.naam === "D1";
      if (groep === "sen3") return t.naam === "3";
      if (groep === "sen4") return t.naam === "4";
      if (groep === "sen5") return t.naam === "5";
      if (groep === "sen6") return t.naam === "6";
      if (groep === "mw1") return t.naam === "MW1";
      return false;
    });

    if (matching.length === 0) continue;

    // Verdeel spelers gelijkmatig (round-robin) over beschikbare teams
    const shuffled = rng.shuffle(groepSpelers);
    for (let i = 0; i < shuffled.length; i++) {
      const team = matching[i % matching.length];
      const kleur = team.kleur === "senioren" ? "senioren" : team.kleur;
      toewijzingen.push({
        speler: shuffled[i],
        team: team.naam,
        kleur,
        categorie: team.categorie,
      });
    }
  }

  return toewijzingen;
}

// ═══════════════════════════════════════════════════════════
// SCOUTING SCORE GENERATIE
// ═══════════════════════════════════════════════════════════

const SCOUTING_PIJLERS = ["schot", "aanval", "passing", "verdediging", "fysiek", "mentaal"];

interface ScoutingScores {
  schot: number;
  aanval: number;
  passing: number;
  verdediging: number;
  fysiek: number;
  mentaal: number;
}

function generateScoutingScores(
  teamRating: number,
  kleur: string,
  isTopSpeler: boolean
): ScoutingScores {
  // Score-ranges per kleur (uit score-model.md)
  const ranges: Record<string, { min: number; max: number; mediaan: number }> = {
    blauw: { min: 0, max: 40, mediaan: 20 },
    groen: { min: 5, max: 55, mediaan: 30 },
    geel: { min: 15, max: 70, mediaan: 42 },
    oranje: { min: 25, max: 85, mediaan: 55 },
    rood: { min: 35, max: 99, mediaan: 67 },
  };

  const range = ranges[kleur] ?? ranges.rood;

  // Basis: overall rond teamgemiddelde met spreiding
  const offset = isTopSpeler ? rng.gaussian(10, 3) : rng.gaussian(0, 8);
  const targetOverall = Math.round(range.mediaan + offset);

  // Genereer per pijler met spreiding rond de overall
  const scores: ScoutingScores = {
    schot: 0,
    aanval: 0,
    passing: 0,
    verdediging: 0,
    fysiek: 0,
    mentaal: 0,
  };

  for (const pijler of SCOUTING_PIJLERS) {
    const pijlerScore = Math.round(rng.gaussian(targetOverall, 6));
    (scores as Record<string, number>)[pijler] = Math.max(
      range.min,
      Math.min(range.max, pijlerScore)
    );
  }

  return scores;
}

function overallScore(scores: ScoutingScores): number {
  const values = Object.values(scores);
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

// ═══════════════════════════════════════════════════════════
// CLEANUP
// ═══════════════════════════════════════════════════════════

async function cleanup() {
  logger.info("=== Verwijderen bestaande demo-data ===");

  // Scouting-gerelateerde data eerst (vanwege FK-relaties)
  const deletedKaarten = await prisma.spelersKaart.deleteMany({
    where: { spelerId: { startsWith: DEMO_PREFIX } },
  });
  logger.info(`  SpelersKaart: ${deletedKaarten.count} verwijderd`);

  // Verwijder rapporten van demo-spelers EN van demo/E2E scouts
  const deletedRapporten = await prisma.scoutingRapport.deleteMany({
    where: {
      OR: [
        { spelerId: { startsWith: DEMO_PREFIX } },
        { scout: { email: { startsWith: "demo-" } } },
        { scout: { email: E2E_TEST_EMAIL } },
      ],
    },
  });
  logger.info(`  ScoutingRapport: ${deletedRapporten.count} verwijderd`);

  // Verwijder vergelijkingen van demo/E2E scouts
  const deletedVergelijkingen = await prisma.scoutingVergelijking.deleteMany({
    where: {
      scout: {
        OR: [
          { email: { startsWith: "demo-" } },
          { email: E2E_TEST_EMAIL },
        ],
      },
    },
  });
  logger.info(`  ScoutingVergelijking: ${deletedVergelijkingen.count} verwijderd`);

  // Verwijder toewijzingen van demo/E2E scouts
  const deletedToewijzingen = await prisma.scoutToewijzing.deleteMany({
    where: {
      scout: {
        OR: [
          { email: { startsWith: "demo-" } },
          { email: E2E_TEST_EMAIL },
        ],
      },
    },
  });
  logger.info(`  ScoutToewijzing: ${deletedToewijzingen.count} verwijderd`);

  // TeamScoutingSessies: verwijder sessies waarvan alle rapporten demo zijn
  // Dit is moeilijk in een bulk-operatie, doe het via scout cleanup

  const deletedSessies = await prisma.teamScoutingSessie.deleteMany({
    where: {
      scout: {
        OR: [
          { email: { startsWith: "demo-" } },
          { email: E2E_TEST_EMAIL },
        ],
      },
    },
  });
  logger.info(`  TeamScoutingSessie: ${deletedSessies.count} verwijderd`);

  const deletedBadges = await prisma.scoutBadge.deleteMany({
    where: {
      scout: {
        OR: [
          { email: { startsWith: "demo-" } },
          { email: E2E_TEST_EMAIL },
        ],
      },
    },
  });
  logger.info(`  ScoutBadge: ${deletedBadges.count} verwijderd`);

  const deletedScouts = await prisma.scout.deleteMany({
    where: {
      OR: [
        { email: { startsWith: "demo-" } },
        { email: E2E_TEST_EMAIL }, // E2E testgebruiker scout-profiel
      ],
    },
  });
  logger.info(`  Scout: ${deletedScouts.count} verwijderd`);

  // Evaluaties
  const deletedEval = await prisma.evaluatie.deleteMany({
    where: { spelerId: { startsWith: DEMO_PREFIX } },
  });
  logger.info(`  Evaluatie: ${deletedEval.count} verwijderd`);

  const deletedZelf = await prisma.spelerZelfEvaluatie.deleteMany({
    where: { spelerId: { startsWith: DEMO_PREFIX } },
  });
  logger.info(`  SpelerZelfEvaluatie: ${deletedZelf.count} verwijderd`);

  // TI-gerelateerde koppelingen
  const deletedTS = await prisma.teamSpeler.deleteMany({
    where: { spelerId: { startsWith: DEMO_PREFIX } },
  });
  logger.info(`  TeamSpeler: ${deletedTS.count} verwijderd`);

  const deletedSP = await prisma.selectieSpeler.deleteMany({
    where: { spelerId: { startsWith: DEMO_PREFIX } },
  });
  logger.info(`  SelectieSpeler: ${deletedSP.count} verwijderd`);

  const deletedPins = await prisma.pin.deleteMany({
    where: { spelerId: { startsWith: DEMO_PREFIX } },
  });
  logger.info(`  Pin: ${deletedPins.count} verwijderd`);

  // Competitie-data
  const deletedCS = await prisma.competitieSpeler.deleteMany({
    where: { relCode: { startsWith: DEMO_PREFIX } },
  });
  logger.info(`  CompetitieSpeler: ${deletedCS.count} verwijderd`);

  // Ledenverloop
  const deletedLV = await prisma.ledenverloop.deleteMany({
    where: { relCode: { startsWith: DEMO_PREFIX } },
  });
  logger.info(`  Ledenverloop: ${deletedLV.count} verwijderd`);

  // Spelers (TI)
  const deletedSpeler = await prisma.speler.deleteMany({
    where: { id: { startsWith: DEMO_PREFIX } },
  });
  logger.info(`  Speler: ${deletedSpeler.count} verwijderd`);

  // Leden (Monitor)
  const deletedLid = await prisma.lid.deleteMany({
    where: { relCode: { startsWith: DEMO_PREFIX } },
  });
  logger.info(`  Lid: ${deletedLid.count} verwijderd`);

  logger.info("Cleanup voltooid.");
}

// ═══════════════════════════════════════════════════════════
// SEED FUNCTIES
// ═══════════════════════════════════════════════════════════

async function seedSeizoenen() {
  logger.info("=== Seizoenen aanmaken ===");

  for (const seizoen of SEIZOENEN) {
    const [startStr, eindStr] = seizoen.split("-");
    const startJaar = parseInt(startStr);
    const eindJaar = parseInt(eindStr);

    await prisma.seizoen.upsert({
      where: { seizoen },
      update: {},
      create: {
        seizoen,
        startJaar,
        eindJaar,
        startDatum: new Date(startJaar, 7, 1), // 1 augustus
        eindDatum: new Date(eindJaar, 5, 30), // 30 juni
        peildatum: new Date(startJaar, 11, 31), // 31 december
      },
    });
    logger.info(`  Seizoen ${seizoen} ✓`);
  }
}

async function seedLeden(spelers: DemoSpeler[]) {
  logger.info("=== Leden aanmaken ===");

  const batchSize = 50;
  for (let i = 0; i < spelers.length; i += batchSize) {
    const batch = spelers.slice(i, i + batchSize);
    await prisma.lid.createMany({
      data: batch.map((s) => ({
        relCode: s.relCode,
        roepnaam: s.roepnaam,
        achternaam: s.achternaam,
        tussenvoegsel: s.tussenvoegsel,
        geslacht: s.geslacht,
        geboortejaar: s.geboortejaar,
        geboortedatum: s.geboortedatum,
        lidSinds: new Date(parseInt(s.startSeizoen.split("-")[0]), 7, 1),
        lidsoort: "Junior",
      })),
      skipDuplicates: true,
    });
  }

  logger.info(`  ${spelers.length} leden aangemaakt`);
}

async function seedTISpelers(spelers: DemoSpeler[], toewijzingenHuidig: SeizoenToewijzing[]) {
  logger.info("=== TI Spelers aanmaken ===");

  // Bouw huidige teamtoewijzing per speler
  const huidigTeamMap = new Map<string, SeizoenToewijzing>();
  for (const tw of toewijzingenHuidig) {
    huidigTeamMap.set(tw.speler.relCode, tw);
  }

  const teamDefs = buildTeamDefs();

  const batchSize = 50;
  for (let i = 0; i < spelers.length; i += batchSize) {
    const batch = spelers.slice(i, i + batchSize);
    await prisma.speler.createMany({
      data: batch.map((s) => {
        const tw = huidigTeamMap.get(s.relCode);
        const teamDef = tw ? teamDefs.find((t) => t.naam === tw.team) : null;

        // Bereken leeftijd op peildatum
        const leeftijd = PEILJAAR - s.geboortejaar;

        // Bepaal A-categorie info
        let aCat: string | undefined;
        let aJaars: string | undefined;
        if (teamDef?.aCat) {
          aCat = teamDef.aCat;
          const geboortejaarGrenzen: Record<string, number[]> = {
            U15: [2011, 2012],
            U17: [2009, 2010],
            U19: [2007, 2008],
          };
          const grenzen = geboortejaarGrenzen[aCat];
          aJaars = grenzen && s.geboortejaar === grenzen[1] ? "1e" : "2e";
        }

        // Bepaal de scouting-leeftijdsgroep kleur (op basis van leeftijd, niet team)
        // Dit is belangrijk omdat A-categorie teams kleur "rood" hebben,
        // maar de scouting-app de leeftijdsgroep-kleur nodig heeft.
        function leeftijdsgroepKleur(lft: number): string {
          if (lft <= 5) return "paars";
          if (lft <= 7) return "blauw";
          if (lft <= 9) return "groen";
          if (lft <= 12) return "geel";
          if (lft <= 15) return "oranje";
          if (lft <= 18) return "rood";
          return "senioren";
        }

        return {
          id: s.relCode,
          roepnaam: s.roepnaam,
          achternaam: s.tussenvoegsel ? `${s.tussenvoegsel} ${s.achternaam}` : s.achternaam,
          geboortejaar: s.geboortejaar,
          geboortedatum: s.geboortedatum,
          geslacht: s.geslacht as "M" | "V",
          lidSinds: `${parseInt(s.startSeizoen.split("-")[0])}-08-01`,
          huidig: tw
            ? {
                team: tw.team,
                categorie: tw.categorie,
                kleur: leeftijdsgroepKleur(leeftijd),
                a_categorie: aCat ?? null,
                a_jaars: aJaars ?? null,
                leeftijd,
              }
            : null,
          seizoenenActief: Math.max(1, PEILJAAR - parseInt(s.startSeizoen.split("-")[0])),
          instroomLeeftijd: parseInt(s.startSeizoen.split("-")[0]) - s.geboortejaar,
          status: "BESCHIKBAAR" as const,
        };
      }),
      skipDuplicates: true,
    });
  }

  logger.info(`  ${spelers.length} TI spelers aangemaakt`);
}

async function seedCompetitieSpelers(spelers: DemoSpeler[], teamDefs: TeamDef[]) {
  logger.info("=== Competitie-spelers per seizoen aanmaken ===");

  let totaal = 0;

  for (const seizoen of SEIZOENEN) {
    const toewijzingen = buildSeizoenToewijzingen(spelers, teamDefs, seizoen);

    const competities = ["veld_najaar", "zaal", "veld_voorjaar"];

    const records: Array<{
      relCode: string;
      seizoen: string;
      competitie: string;
      team: string;
      geslacht: string;
      bron: string;
      betrouwbaar: boolean;
    }> = [];

    for (const tw of toewijzingen) {
      for (const competitie of competities) {
        records.push({
          relCode: tw.speler.relCode,
          seizoen,
          competitie,
          team: tw.team,
          geslacht: tw.speler.geslacht,
          bron: "demo_seed",
          betrouwbaar: true,
        });
      }
    }

    // Batch insert
    const batchSize = 200;
    for (let i = 0; i < records.length; i += batchSize) {
      await prisma.competitieSpeler.createMany({
        data: records.slice(i, i + batchSize),
        skipDuplicates: true,
      });
    }

    totaal += records.length;
    logger.info(
      `  ${seizoen}: ${toewijzingen.length} spelers, ${records.length} competitie-records`
    );
  }

  logger.info(`  Totaal: ${totaal} competitie-records aangemaakt`);
}

async function seedOWTeams(teamDefs: TeamDef[]) {
  logger.info("=== OW Teams per seizoen aanmaken ===");

  let totaal = 0;

  for (const seizoen of SEIZOENEN) {
    const seizoenStartJaar = parseInt(seizoen.split("-")[0]);

    for (const def of teamDefs) {
      // Skip paars (geen competitieteam)
      if (def.kleur === "paars") continue;

      const owCode = `${DEMO_PREFIX}-${def.naam}`;

      // Rating groeit licht over seizoenen
      const seizoenIndex = SEIZOENEN.indexOf(seizoen as (typeof SEIZOENEN)[number]);
      const ratingGroei = seizoenIndex * rng.int(2, 5);
      const rating = def.knkvRating - (3 - seizoenIndex) * 3 + ratingGroei;

      await prisma.oWTeam.upsert({
        where: {
          seizoen_owCode: { seizoen, owCode },
        },
        update: {
          // Bij re-seed: bijwerken leeftijdsgroep (was mogelijk null in eerdere runs)
          leeftijdsgroep: def.aCat ?? (def.kleur !== "senioren" ? def.kleur : null),
          kleur: def.kleur === "senioren" ? null : def.kleur,
          naam: `OW ${def.naam}`,
        },
        create: {
          seizoen,
          owCode,
          naam: `OW ${def.naam}`,
          categorie: def.categorie,
          kleur: def.kleur === "senioren" ? null : def.kleur,
          // leeftijdsgroep: A-cat teams gebruiken de officiële benaming (U15, U17, U19),
          // B-cat jeugdteams gebruiken de KNKV-kleur als leeftijdsgroep.
          // Senioren teams hebben geen leeftijdsgroep.
          leeftijdsgroep: def.aCat ?? (def.kleur !== "senioren" ? def.kleur : null),
          spelvorm: def.spelvorm,
          isSelectie: def.categorie === "a",
          sortOrder: teamDefs.indexOf(def),
        },
      });

      // Team-alias aanmaken (J-nummer mapping)
      const teamRecord = await prisma.oWTeam.findUnique({
        where: { seizoen_owCode: { seizoen, owCode } },
      });

      if (teamRecord) {
        await prisma.teamAlias.upsert({
          where: {
            seizoen_alias: { seizoen, alias: def.naam },
          },
          update: {},
          create: {
            seizoen,
            alias: def.naam,
            owTeamId: teamRecord.id,
            owCode,
          },
        });

        // TeamPeriode met rating
        for (const periode of ["veld_najaar", "zaal_deel1", "veld_voorjaar"]) {
          await prisma.teamPeriode.upsert({
            where: {
              teamId_periode: { teamId: teamRecord.id, periode },
            },
            update: {},
            create: {
              teamId: teamRecord.id,
              periode,
              jNummer: def.naam,
              sterkte: Math.round(rating),
              gemLeeftijd:
                def.kleur === "senioren"
                  ? 25 + rng.int(-5, 5)
                  : seizoenStartJaar - (def.geboortejaarMin + def.geboortejaarMax) / 2,
            },
          });
        }
      }

      totaal++;
    }
  }

  logger.info(`  ${totaal} OW teams aangemaakt over ${SEIZOENEN.length} seizoenen`);
}

async function seedScoutingData(
  spelers: DemoSpeler[],
  toewijzingen: SeizoenToewijzing[],
  teamDefs: TeamDef[]
) {
  logger.info("=== Scouting-data genereren (huidig seizoen) ===");

  // Maak E2E testgebruiker Scout-profiel aan (TC-rol, vrij scouten)
  const e2eScout = await prisma.scout.create({
    data: {
      naam: "Ant-Jan Laban",
      email: E2E_TEST_EMAIL,
      xp: 250,
      level: 3,
      rol: "TC",
      vrijScouten: true,
    },
  });
  logger.info(`  E2E testgebruiker Scout aangemaakt: ${e2eScout.email} (rol=TC)`);

  // Maak 3 demo-scouts aan
  const scoutData = [
    { naam: "Demo Trainer A", email: "demo-trainer-a@example.com" },
    { naam: "Demo Trainer B", email: "demo-trainer-b@example.com" },
    { naam: "Demo Scout C", email: "demo-scout-c@example.com" },
  ];

  const scouts: Array<{ id: string; naam: string; email: string }> = [];
  for (const s of scoutData) {
    const scout = await prisma.scout.create({
      data: {
        naam: s.naam,
        email: s.email,
        xp: rng.int(100, 500),
        level: rng.int(1, 5),
        rol: "SCOUT",
        vrijScouten: true,
      },
    });
    scouts.push(scout);
  }

  logger.info(`  ${scouts.length} scouts aangemaakt`);

  // Bouw team-naar-spelers mapping
  const teamSpelers = new Map<string, SeizoenToewijzing[]>();
  for (const tw of toewijzingen) {
    if (!teamSpelers.has(tw.team)) teamSpelers.set(tw.team, []);
    teamSpelers.get(tw.team)!.push(tw);
  }

  let rapportenAantal = 0;
  let sessieAantal = 0;
  let kaartenAantal = 0;

  // Per team: maak scouting sessies en rapporten
  for (const [teamNaam, teamToewijzingen] of teamSpelers) {
    const teamDef = teamDefs.find((t) => t.naam === teamNaam);
    if (!teamDef) continue;

    // Skip paars en senioren voor scouting
    if (teamDef.kleur === "paars" || teamDef.kleur === "senioren") continue;

    // Zoek OWTeam record voor dit team
    const owCode = `${DEMO_PREFIX}-${teamNaam}`;
    const owTeam = await prisma.oWTeam.findUnique({
      where: { seizoen_owCode: { seizoen: HUIDIG_SEIZOEN, owCode } },
    });
    if (!owTeam) continue;

    // Selecteer 3-5 spelers voor individuele scouting
    const aantalScouting = Math.min(teamToewijzingen.length, rng.int(3, 5));
    const scoutingSpelers = rng.shuffle(teamToewijzingen).slice(0, aantalScouting);

    // 1 trainer-evaluatie sessie per team (TEAM-methode)
    const scout = rng.pick(scouts);
    const sessie = await prisma.teamScoutingSessie.create({
      data: {
        scoutId: scout.id,
        owTeamId: owTeam.id,
        seizoen: HUIDIG_SEIZOEN,
        context: "TRAINING",
        contextDetail: `Demo training ${teamNaam}`,
        rankings: null,
      },
    });
    sessieAantal++;

    // Per scouting-speler: maak rapport
    for (const tw of scoutingSpelers) {
      const isTopSpeler = rng.next() > 0.7;
      const kleurVoorScoring = teamDef.kleur === "senioren" ? "rood" : teamDef.kleur;
      const scores = generateScoutingScores(teamDef.knkvRating, kleurVoorScoring, isTopSpeler);
      const overall = overallScore(scores);

      await prisma.scoutingRapport.create({
        data: {
          scoutId: scout.id,
          spelerId: tw.speler.relCode,
          seizoen: HUIDIG_SEIZOEN,
          context: rng.pick(["WEDSTRIJD", "TRAINING"] as const),
          scores: scores as unknown as Record<string, unknown>,
          overallScore: overall,
          teamSessieId: sessie.id,
          relatie: "GEEN",
        },
      });
      rapportenAantal++;

      // SpelersKaart voor scouting-spelers
      await prisma.spelersKaart.upsert({
        where: {
          spelerId_seizoen: {
            spelerId: tw.speler.relCode,
            seizoen: HUIDIG_SEIZOEN,
          },
        },
        update: {},
        create: {
          spelerId: tw.speler.relCode,
          seizoen: HUIDIG_SEIZOEN,
          overall,
          schot: scores.schot,
          aanval: scores.aanval,
          passing: scores.passing,
          verdediging: scores.verdediging,
          fysiek: scores.fysiek,
          mentaal: scores.mentaal,
          aantalRapporten: 1,
          betrouwbaarheid: "concept",
          trendOverall: rng.int(-3, 5),
        },
      });
      kaartenAantal++;
    }

    // Cross-validatie: bij teams in Oranje/Rood, voeg een 2e scout-rapport toe
    if (teamDef.kleur === "oranje" || (teamDef.kleur === "rood" && teamDef.categorie === "b")) {
      const crossScout = scouts.find((s) => s.id !== scout.id) ?? scouts[0];
      const crossSpelers = scoutingSpelers.slice(0, Math.min(3, scoutingSpelers.length));

      for (const tw of crossSpelers) {
        const kleurVoorScoring = teamDef.kleur;
        const scores = generateScoutingScores(
          teamDef.knkvRating,
          kleurVoorScoring,
          rng.next() > 0.5
        );
        const overall = overallScore(scores);

        await prisma.scoutingRapport.create({
          data: {
            scoutId: crossScout.id,
            spelerId: tw.speler.relCode,
            seizoen: HUIDIG_SEIZOEN,
            context: "WEDSTRIJD",
            scores: scores as unknown as Record<string, unknown>,
            overallScore: overall,
            relatie: "GEEN",
          },
        });
        rapportenAantal++;

        // Update spelerskaart met 2e rapport
        await prisma.spelersKaart.update({
          where: {
            spelerId_seizoen: {
              spelerId: tw.speler.relCode,
              seizoen: HUIDIG_SEIZOEN,
            },
          },
          data: {
            aantalRapporten: 2,
            betrouwbaarheid: "concept",
            overall: Math.round(
              (overall +
                (scores.schot +
                  scores.aanval +
                  scores.passing +
                  scores.verdediging +
                  scores.fysiek +
                  scores.mentaal) /
                  6) /
                2
            ),
          },
        });
      }
    }
  }

  logger.info(`  ${sessieAantal} scouting-sessies aangemaakt`);
  logger.info(`  ${rapportenAantal} scouting-rapporten aangemaakt`);
  logger.info(`  ${kaartenAantal} spelerskaarten aangemaakt`);
}

async function seedLedenverloop(spelers: DemoSpeler[], teamDefs: TeamDef[]) {
  logger.info("=== Ledenverloop berekenen ===");

  let totaal = 0;

  // Per seizoen (behalve het eerste) ledenverloop berekenen
  for (let i = 1; i < SEIZOENEN.length; i++) {
    const seizoen = SEIZOENEN[i];
    const vorigSeizoen = SEIZOENEN[i - 1];
    const seizoenStartJaar = parseInt(seizoen.split("-")[0]);

    const vorigeToewijzingen = buildSeizoenToewijzingen(spelers, teamDefs, vorigSeizoen);
    const huidigeToewijzingen = buildSeizoenToewijzingen(spelers, teamDefs, seizoen);

    const vorigeSet = new Set(vorigeToewijzingen.map((tw) => tw.speler.relCode));
    const huidigeSet = new Set(huidigeToewijzingen.map((tw) => tw.speler.relCode));
    const huidigeMap = new Map(huidigeToewijzingen.map((tw) => [tw.speler.relCode, tw]));
    const vorigeMap = new Map(vorigeToewijzingen.map((tw) => [tw.speler.relCode, tw]));

    const records: Array<{
      seizoen: string;
      relCode: string;
      status: string;
      geboortejaar: number;
      geslacht: string;
      leeftijdVorig: number | null;
      leeftijdNieuw: number | null;
      teamVorig: string | null;
      teamNieuw: string | null;
    }> = [];

    // Behouden: in beide seizoenen aanwezig
    for (const relCode of huidigeSet) {
      const speler = spelers.find((s) => s.relCode === relCode);
      if (!speler) continue;

      const leeftijdNieuw = seizoenStartJaar - speler.geboortejaar;
      const leeftijdVorig = leeftijdNieuw - 1;

      if (vorigeSet.has(relCode)) {
        records.push({
          seizoen,
          relCode,
          status: "behouden",
          geboortejaar: speler.geboortejaar,
          geslacht: speler.geslacht,
          leeftijdVorig,
          leeftijdNieuw,
          teamVorig: vorigeMap.get(relCode)?.team ?? null,
          teamNieuw: huidigeMap.get(relCode)?.team ?? null,
        });
      } else {
        // Nieuw dit seizoen
        const isHerinschrijver = parseInt(speler.startSeizoen.split("-")[0]) < seizoenStartJaar - 1;
        records.push({
          seizoen,
          relCode,
          status: isHerinschrijver ? "herinschrijver" : "nieuw",
          geboortejaar: speler.geboortejaar,
          geslacht: speler.geslacht,
          leeftijdVorig: null,
          leeftijdNieuw,
          teamVorig: null,
          teamNieuw: huidigeMap.get(relCode)?.team ?? null,
        });
      }
    }

    // Uitgestroomd: vorig seizoen wel, dit seizoen niet
    for (const relCode of vorigeSet) {
      if (huidigeSet.has(relCode)) continue;
      const speler = spelers.find((s) => s.relCode === relCode);
      if (!speler) continue;

      const leeftijdVorig = seizoenStartJaar - 1 - speler.geboortejaar;

      records.push({
        seizoen,
        relCode,
        status: "uitgestroomd",
        geboortejaar: speler.geboortejaar,
        geslacht: speler.geslacht,
        leeftijdVorig,
        leeftijdNieuw: null,
        teamVorig: vorigeMap.get(relCode)?.team ?? null,
        teamNieuw: null,
      });
    }

    // Batch insert
    const batchSize = 100;
    for (let j = 0; j < records.length; j += batchSize) {
      await prisma.ledenverloop.createMany({
        data: records.slice(j, j + batchSize),
        skipDuplicates: true,
      });
    }

    totaal += records.length;
    logger.info(`  ${seizoen}: ${records.length} verloop-records`);
  }

  logger.info(`  Totaal: ${totaal} ledenverloop-records aangemaakt`);
}

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════

async function main() {
  logger.info("╔═══════════════════════════════════════════╗");
  logger.info("║  Demo Seed — c.k.v. Oranje Wit           ║");
  logger.info("║  ~283 leden, ~33 teams, 4 seizoenen       ║");
  logger.info("╚═══════════════════════════════════════════╝");
  logger.info("");

  const startTime = Date.now();

  // Stap 1: Cleanup
  await cleanup();
  logger.info("");

  // Stap 2: Genereer speler-data (in-memory)
  const spelers = generateSpelers();
  const teamDefs = buildTeamDefs();
  logger.info("");

  // Stap 3: Seizoenen
  await seedSeizoenen();
  logger.info("");

  // Stap 4: Leden (Monitor-tabel)
  await seedLeden(spelers);
  logger.info("");

  // Stap 5: OW Teams per seizoen
  await seedOWTeams(teamDefs);
  logger.info("");

  // Stap 6: Competitie-spelers per seizoen (4 seizoenen x 3 competities)
  await seedCompetitieSpelers(spelers, teamDefs);
  logger.info("");

  // Stap 7: TI Spelers (team-indeling Speler-records)
  const huidigeToewijzingen = buildSeizoenToewijzingen(spelers, teamDefs, HUIDIG_SEIZOEN);
  await seedTISpelers(spelers, huidigeToewijzingen);
  logger.info("");

  // Stap 8: Ledenverloop
  await seedLedenverloop(spelers, teamDefs);
  logger.info("");

  // Stap 9: Scouting-data (alleen huidig seizoen)
  await seedScoutingData(spelers, huidigeToewijzingen, teamDefs);
  logger.info("");

  // Samenvatting
  const duur = ((Date.now() - startTime) / 1000).toFixed(1);
  logger.info("═══════════════════════════════════════════");
  logger.info("SAMENVATTING");
  logger.info("═══════════════════════════════════════════");
  logger.info(`  Leden:           ${spelers.length}`);
  logger.info(`  Teams:           ${teamDefs.length}`);
  logger.info(`  Seizoenen:       ${SEIZOENEN.length}`);
  logger.info(`  Huidig seizoen:  ${HUIDIG_SEIZOEN}`);
  logger.info(`  Duur:            ${duur}s`);
  logger.info("═══════════════════════════════════════════");
}

main()
  .catch((e: unknown) => {
    logger.error("Seed fout:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
