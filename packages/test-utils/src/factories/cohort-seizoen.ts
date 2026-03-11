export interface CohortSeizoenData {
  id: number;
  geboortejaar: number;
  geslacht: string;
  seizoen: string;
  leeftijd: number | null;
  band: string | null;
  actief: number | null;
  behouden: number | null;
  nieuw: number | null;
  herinschrijver: number | null;
  uitgestroomd: number | null;
  retentiePct: number | null;
}

let autoId = 400;

export function maakCohortSeizoen(overrides: Partial<CohortSeizoenData> = {}): CohortSeizoenData {
  return {
    id: overrides.id ?? autoId++,
    geboortejaar: overrides.geboortejaar ?? 2010,
    geslacht: overrides.geslacht ?? "M",
    seizoen: overrides.seizoen ?? "2025-2026",
    leeftijd: overrides.leeftijd ?? 15,
    band: overrides.band ?? "B",
    actief: overrides.actief ?? 5,
    behouden: overrides.behouden ?? 4,
    nieuw: overrides.nieuw ?? 1,
    herinschrijver: overrides.herinschrijver ?? 0,
    uitgestroomd: overrides.uitgestroomd ?? 1,
    retentiePct: overrides.retentiePct ?? 80,
    ...overrides,
  };
}
