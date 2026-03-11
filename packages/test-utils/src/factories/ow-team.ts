export interface OWTeamData {
  id: number;
  seizoen: string;
  owCode: string;
  naam: string | null;
  categorie: string;
  kleur: string | null;
  leeftijdsgroep: string | null;
  spelvorm: string | null;
  isSelectie: boolean;
  selectieOwCode: string | null;
  sortOrder: number | null;
}

let autoId = 100;

export function maakOWTeam(overrides: Partial<OWTeamData> = {}): OWTeamData {
  return {
    id: overrides.id ?? autoId++,
    seizoen: overrides.seizoen ?? "2025-2026",
    owCode: overrides.owCode ?? "OW-S1",
    naam: overrides.naam ?? "Senioren 1",
    categorie: overrides.categorie ?? "a",
    kleur: overrides.kleur ?? null,
    leeftijdsgroep: overrides.leeftijdsgroep ?? null,
    spelvorm: overrides.spelvorm ?? "8-korfbal",
    isSelectie: overrides.isSelectie ?? false,
    selectieOwCode: overrides.selectieOwCode ?? null,
    sortOrder: overrides.sortOrder ?? null,
    ...overrides,
  };
}
