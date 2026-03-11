export interface LedenverloopData {
  id: number;
  seizoen: string;
  relCode: string;
  status: string;
  geboortejaar: number | null;
  geslacht: string | null;
  leeftijdVorig: number | null;
  leeftijdNieuw: number | null;
  teamVorig: string | null;
  teamNieuw: string | null;
}

let autoId = 300;

export function maakLedenverloop(overrides: Partial<LedenverloopData> = {}): LedenverloopData {
  return {
    id: overrides.id ?? autoId++,
    seizoen: overrides.seizoen ?? "2025-2026",
    relCode: overrides.relCode ?? "TSTN001",
    status: overrides.status ?? "behouden",
    geboortejaar: overrides.geboortejaar ?? 2000,
    geslacht: overrides.geslacht ?? "M",
    leeftijdVorig: overrides.leeftijdVorig ?? null,
    leeftijdNieuw: overrides.leeftijdNieuw ?? null,
    teamVorig: overrides.teamVorig ?? null,
    teamNieuw: overrides.teamNieuw ?? null,
    ...overrides,
  };
}
