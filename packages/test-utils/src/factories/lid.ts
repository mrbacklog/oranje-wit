import { nextRelCode } from "./rel-code";

export interface LidData {
  relCode: string;
  roepnaam: string;
  achternaam: string;
  tussenvoegsel: string | null;
  voorletters: string | null;
  geslacht: string;
  geboortejaar: number | null;
  geboortedatum: Date | null;
  lidSinds: Date | null;
  afmelddatum: Date | null;
  lidsoort: string | null;
  email: string | null;
  registratieDatum: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

const VOORNAMEN_M = [
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
];

const VOORNAMEN_V = [
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
];

const ACHTERNAMEN = [
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
];

let nameIndex = 0;

export function resetNameIndex() {
  nameIndex = 0;
}

export function maakLid(overrides: Partial<LidData> = {}): LidData {
  const geslacht = overrides.geslacht ?? (nameIndex % 2 === 0 ? "M" : "V");
  const namen = geslacht === "M" ? VOORNAMEN_M : VOORNAMEN_V;
  const roepnaam = overrides.roepnaam ?? namen[nameIndex % namen.length];
  const achternaam = overrides.achternaam ?? ACHTERNAMEN[nameIndex % ACHTERNAMEN.length];

  nameIndex++;

  return {
    relCode: overrides.relCode ?? nextRelCode(),
    roepnaam,
    achternaam,
    tussenvoegsel: null,
    voorletters: null,
    geslacht,
    geboortejaar: overrides.geboortejaar ?? 2000,
    geboortedatum: overrides.geboortedatum ?? new Date(2000, 5, 15),
    lidSinds: overrides.lidSinds ?? new Date(2020, 8, 1),
    afmelddatum: null,
    lidsoort: "Spelend lid",
    email: null,
    registratieDatum: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function maakLeden(aantal: number, defaults: Partial<LidData> = {}): LidData[] {
  return Array.from({ length: aantal }, () => maakLid(defaults));
}
