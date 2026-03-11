export interface SignaleringData {
  id: number;
  seizoen: string;
  type: string;
  ernst: string;
  leeftijdsgroep: string | null;
  geslacht: string | null;
  waarde: number | null;
  drempel: number | null;
  streef: number | null;
  beschrijving: string | null;
  advies: string | null;
}

let autoId = 200;

export function maakSignalering(overrides: Partial<SignaleringData> = {}): SignaleringData {
  return {
    id: overrides.id ?? autoId++,
    seizoen: overrides.seizoen ?? "2025-2026",
    type: overrides.type ?? "retentie",
    ernst: overrides.ernst ?? "aandacht",
    leeftijdsgroep: overrides.leeftijdsgroep ?? null,
    geslacht: overrides.geslacht ?? null,
    waarde: overrides.waarde ?? null,
    drempel: overrides.drempel ?? null,
    streef: overrides.streef ?? null,
    beschrijving: overrides.beschrijving ?? "Test signalering",
    advies: overrides.advies ?? null,
    ...overrides,
  };
}
