/**
 * Definieert de volledige seed-dataset voor E2E tests.
 *
 * 14 teams, ~129 spelers, 2 seizoenen, verloop-data.
 * Alle rel_codes hebben TST-prefix voor herkenning/cleanup.
 */

// ── Team definities ──────────────────────────────────────────────────────

export interface TeamDef {
  owCode: string;
  naam: string;
  categorie: string; // "a" | "b"
  leeftijdsgroep: string | null;
  spelvorm: string;
  isSelectie: boolean;
  selectieOwCode: string | null;
  kleur: string | null;
  aantalSpelers: number;
  geboortejaarRange: [number, number]; // [min, max] inclusief
  sortOrder: number;
}

export const SEIZOEN_HUIDIG = "2025-2026";
export const SEIZOEN_VORIG = "2024-2025";
export const PEILDATUM_JAAR = 2025;

export const TEAMS: TeamDef[] = [
  // ── Senioren ──────────────────────────────────────────────────────────
  {
    owCode: "OW-S1",
    naam: "Senioren 1",
    categorie: "a",
    leeftijdsgroep: "senioren",
    spelvorm: "8-korfbal",
    isSelectie: true,
    selectieOwCode: null,
    kleur: null,
    aantalSpelers: 10,
    geboortejaarRange: [1995, 2005],
    sortOrder: 1,
  },
  {
    owCode: "OW-S2",
    naam: "Senioren 2",
    categorie: "a",
    leeftijdsgroep: "senioren",
    spelvorm: "8-korfbal",
    isSelectie: true,
    selectieOwCode: "OW-S1",
    kleur: null,
    aantalSpelers: 10,
    geboortejaarRange: [1995, 2005],
    sortOrder: 2,
  },
  {
    owCode: "OW-S3",
    naam: "Senioren 3",
    categorie: "a",
    leeftijdsgroep: "senioren",
    spelvorm: "8-korfbal",
    isSelectie: false,
    selectieOwCode: null,
    kleur: null,
    aantalSpelers: 9,
    geboortejaarRange: [1990, 2003],
    sortOrder: 3,
  },
  {
    owCode: "OW-S4",
    naam: "Senioren 4",
    categorie: "a",
    leeftijdsgroep: "senioren",
    spelvorm: "8-korfbal",
    isSelectie: false,
    selectieOwCode: null,
    kleur: null,
    aantalSpelers: 9,
    geboortejaarRange: [1990, 2003],
    sortOrder: 4,
  },
  {
    owCode: "OW-S5",
    naam: "Senioren 5",
    categorie: "a",
    leeftijdsgroep: "senioren",
    spelvorm: "8-korfbal",
    isSelectie: false,
    selectieOwCode: null,
    kleur: null,
    aantalSpelers: 8,
    geboortejaarRange: [1990, 2003],
    sortOrder: 5,
  },

  // ── U19 (A-categorie) ─────────────────────────────────────────────────
  {
    owCode: "OW-A1",
    naam: "A1",
    categorie: "a",
    leeftijdsgroep: "U19",
    spelvorm: "8-korfbal",
    isSelectie: true,
    selectieOwCode: null,
    kleur: "ROOD",
    aantalSpelers: 10,
    geboortejaarRange: [2007, 2008],
    sortOrder: 10,
  },
  {
    owCode: "OW-A2",
    naam: "A2",
    categorie: "a",
    leeftijdsgroep: "U19",
    spelvorm: "8-korfbal",
    isSelectie: false,
    selectieOwCode: "OW-A1",
    kleur: "ORANJE",
    aantalSpelers: 8,
    geboortejaarRange: [2007, 2008],
    sortOrder: 11,
  },
  {
    owCode: "OW-A3",
    naam: "A3",
    categorie: "a",
    leeftijdsgroep: "U19",
    spelvorm: "8-korfbal",
    isSelectie: false,
    selectieOwCode: null,
    kleur: "GROEN",
    aantalSpelers: 8,
    geboortejaarRange: [2007, 2008],
    sortOrder: 12,
  },

  // ── U17 (A-categorie) ─────────────────────────────────────────────────
  {
    owCode: "OW-B1",
    naam: "B1",
    categorie: "a",
    leeftijdsgroep: "U17",
    spelvorm: "8-korfbal",
    isSelectie: true,
    selectieOwCode: null,
    kleur: "ROOD",
    aantalSpelers: 10,
    geboortejaarRange: [2009, 2010],
    sortOrder: 20,
  },
  {
    owCode: "OW-B2",
    naam: "B2",
    categorie: "a",
    leeftijdsgroep: "U17",
    spelvorm: "8-korfbal",
    isSelectie: false,
    selectieOwCode: "OW-B1",
    kleur: "ORANJE",
    aantalSpelers: 8,
    geboortejaarRange: [2009, 2010],
    sortOrder: 21,
  },
  {
    owCode: "OW-B3",
    naam: "B3",
    categorie: "a",
    leeftijdsgroep: "U17",
    spelvorm: "8-korfbal",
    isSelectie: false,
    selectieOwCode: null,
    kleur: "GROEN",
    aantalSpelers: 8,
    geboortejaarRange: [2009, 2010],
    sortOrder: 22,
  },

  // ── U15 (B-categorie, viertallen) ─────────────────────────────────────
  {
    owCode: "OW-C1",
    naam: "C1",
    categorie: "b",
    leeftijdsgroep: "U15",
    spelvorm: "4-korfbal",
    isSelectie: true,
    selectieOwCode: null,
    kleur: "ROOD",
    aantalSpelers: 6,
    geboortejaarRange: [2011, 2012],
    sortOrder: 30,
  },
  {
    owCode: "OW-C2",
    naam: "C2",
    categorie: "b",
    leeftijdsgroep: "U15",
    spelvorm: "4-korfbal",
    isSelectie: false,
    selectieOwCode: "OW-C1",
    kleur: "ORANJE",
    aantalSpelers: 5,
    geboortejaarRange: [2011, 2012],
    sortOrder: 31,
  },
  {
    owCode: "OW-C3",
    naam: "C3",
    categorie: "b",
    leeftijdsgroep: "U15",
    spelvorm: "4-korfbal",
    isSelectie: false,
    selectieOwCode: null,
    kleur: "GROEN",
    aantalSpelers: 5,
    geboortejaarRange: [2011, 2012],
    sortOrder: 32,
  },
];

// Totaal spelers in teams
export const TOTAAL_SPELERS_IN_TEAMS = TEAMS.reduce((sum, t) => sum + t.aantalSpelers, 0);

// Extra leden zonder team (verloop-data)
export const AANTAL_TEAMLOOS = 15;
export const TEAMLOOS_GEBOORTEJAAR_RANGE: [number, number] = [1995, 2012];

// ── Voornamen voor deterministische seed ──────────────────────────────

export const VOORNAMEN_M = [
  "Daan",
  "Sem",
  "Liam",
  "Noah",
  "Finn",
  "Lucas",
  "Jesse",
  "Milan",
  "Luuk",
  "Bram",
  "Thijs",
  "Max",
  "Stijn",
  "Ruben",
  "Sander",
  "Tim",
  "Tom",
  "Bas",
  "Lars",
  "Niels",
  "Joris",
  "Rick",
  "Kevin",
  "Wouter",
  "Bart",
  "Koen",
  "Pieter",
  "Mark",
  "Stefan",
  "Dennis",
  "Robin",
  "Jeroen",
  "Matthijs",
  "Vincent",
  "Ramon",
  "Patrick",
  "Jasper",
  "Rik",
  "Hugo",
  "Casper",
];

export const VOORNAMEN_V = [
  "Emma",
  "Julia",
  "Sophie",
  "Tess",
  "Sara",
  "Lotte",
  "Anna",
  "Lisa",
  "Eva",
  "Noor",
  "Fleur",
  "Iris",
  "Mila",
  "Sanne",
  "Lynn",
  "Kim",
  "Laura",
  "Marloes",
  "Anouk",
  "Femke",
  "Roos",
  "Britt",
  "Daphne",
  "Naomi",
  "Esmee",
  "Nina",
  "Sharon",
  "Linda",
  "Diana",
  "Monique",
  "Petra",
  "Nicole",
  "Sandra",
  "Wendy",
  "Manon",
  "Ilse",
  "Rianne",
  "Ellen",
  "Marije",
  "Amber",
];

export const ACHTERNAMEN = [
  "de Jong",
  "Jansen",
  "de Vries",
  "van den Berg",
  "van Dijk",
  "Bakker",
  "Janssen",
  "Visser",
  "Smit",
  "Meijer",
  "de Boer",
  "Mulder",
  "de Groot",
  "Bos",
  "Vos",
  "Peters",
  "Hendriks",
  "van Leeuwen",
  "Dekker",
  "Brouwer",
  "de Wit",
  "Dijkstra",
  "Smits",
  "de Graaf",
  "van der Meer",
  "van den Heuvel",
  "van der Linden",
  "Molenaar",
  "de Haan",
  "Koster",
];

// ── TI-specifieke seed constanten ────────────────────────────────────

/** E2E test user — moet matchen met auth allowlist (antjanlaban@gmail.com = EDITOR) */
export const E2E_USER_EMAIL = "antjanlaban@gmail.com";
export const E2E_USER_NAAM = "E2E Tester";

/** Stafleden met TST-prefix IDs */
export interface StafDef {
  id: string;
  naam: string;
  rollen: string[];
  email?: string;
}

export const STAF: StafDef[] = [
  { id: "STAF-TST001", naam: "Jan de Trainer", rollen: ["trainer"], email: "trainer1@test.nl" },
  { id: "STAF-TST002", naam: "Petra Coach", rollen: ["trainer", "assistent"] },
  { id: "STAF-TST003", naam: "Kees Manager", rollen: ["manager"] },
  { id: "STAF-TST004", naam: "Lisa Coordinator", rollen: ["coordinator"] },
  { id: "STAF-TST005", naam: "Tom Begeleider", rollen: ["assistent", "manager"] },
];

/** TI Concept naam */
export const CONCEPT_NAAM = "E2E Basisconcept";

/** TI Scenario naam */
export const SCENARIO_NAAM = "E2E Basisscenario";

/** Mapping van dataset teams naar TI Team categorie/kleur */
export interface TITeamMapping {
  owCode: string;
  naam: string;
  categorie: "SENIOREN" | "A_CATEGORIE" | "B_CATEGORIE";
  kleur: "ROOD" | "ORANJE" | "GROEN" | "GEEL" | "BLAUW" | "PAARS" | null;
  teamType: "ACHTTAL" | "VIERTAL";
  volgorde: number;
}

export const TI_TEAM_MAPPINGS: TITeamMapping[] = TEAMS.map((t) => ({
  owCode: t.owCode,
  naam: t.naam,
  categorie: (t.leeftijdsgroep === "senioren"
    ? "SENIOREN"
    : t.leeftijdsgroep === "U15"
      ? "B_CATEGORIE"
      : "A_CATEGORIE") as TITeamMapping["categorie"],
  kleur: (t.kleur as TITeamMapping["kleur"]) ?? null,
  teamType: (t.spelvorm === "4-korfbal" ? "VIERTAL" : "ACHTTAL") as TITeamMapping["teamType"],
  volgorde: t.sortOrder,
}));
