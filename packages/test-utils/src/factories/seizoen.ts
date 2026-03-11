export interface SeizoenData {
  seizoen: string;
  startJaar: number;
  eindJaar: number;
  startDatum: Date;
  eindDatum: Date;
  peildatum: Date;
}

export function maakSeizoen(overrides: Partial<SeizoenData> = {}): SeizoenData {
  const startJaar = overrides.startJaar ?? 2025;
  const eindJaar = overrides.eindJaar ?? startJaar + 1;
  const seizoen = overrides.seizoen ?? `${startJaar}-${eindJaar}`;

  return {
    seizoen,
    startJaar,
    eindJaar,
    startDatum: new Date(startJaar, 7, 1), // 1 augustus
    eindDatum: new Date(eindJaar, 5, 30), // 30 juni
    peildatum: new Date(startJaar, 11, 31), // 31 december
    ...overrides,
  };
}
