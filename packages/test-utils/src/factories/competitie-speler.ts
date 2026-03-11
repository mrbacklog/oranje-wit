export interface CompetitieSpelerData {
  id: number;
  relCode: string;
  seizoen: string;
  competitie: string;
  team: string;
  geslacht: string | null;
  bron: string;
  betrouwbaar: boolean;
}

let autoId = 1000;

export function maakCompetitieSpeler(
  overrides: Partial<CompetitieSpelerData> = {}
): CompetitieSpelerData {
  return {
    id: overrides.id ?? autoId++,
    relCode: overrides.relCode ?? "TSTN001",
    seizoen: overrides.seizoen ?? "2025-2026",
    competitie: overrides.competitie ?? "veld_najaar",
    team: overrides.team ?? "OW S1",
    geslacht: overrides.geslacht ?? "M",
    bron: "seed",
    betrouwbaar: true,
    ...overrides,
  };
}
