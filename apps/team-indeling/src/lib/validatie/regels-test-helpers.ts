import type { SpelerData, TeamData } from "./regels";

export function maakSpeler(overrides: Partial<SpelerData> = {}): SpelerData {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    roepnaam: overrides.roepnaam ?? "Test",
    achternaam: overrides.achternaam ?? "Speler",
    geboortejaar: overrides.geboortejaar ?? 2012,
    geslacht: overrides.geslacht ?? "M",
    ...overrides,
  };
}

export function maakSpelers(aantal: number, defaults: Partial<SpelerData> = {}): SpelerData[] {
  return Array.from({ length: aantal }, (_, i) =>
    maakSpeler({
      id: `speler-${i}`,
      roepnaam: `Speler${i}`,
      ...defaults,
    })
  );
}

export function maakTeam(overrides: Partial<TeamData> = {}): TeamData {
  return {
    naam: overrides.naam ?? "Test Team",
    categorie: overrides.categorie ?? "B_CATEGORIE",
    kleur: overrides.kleur ?? "GEEL",
    spelers: overrides.spelers ?? [],
    ...overrides,
  };
}

export const SEIZOEN = 2026;
