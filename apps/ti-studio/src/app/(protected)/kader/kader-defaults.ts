// apps/web/src/app/(teamindeling-studio)/ti-studio/kader/kader-defaults.ts

export type TcKader = {
  teamMin: number;
  teamIdeaal: number;
  teamMax: number;
  damesMin: number;
  damesIdeaal: number;
  damesMax: number;
  herenMin: number;
  herenIdeaal: number;
  herenMax: number;
  gemLeeftijdMin?: number;
  gemLeeftijdMax?: number;
  /** Max leeftijdsspreiding in het team (korfballeeftijd, jaren). Alleen B-categorieën. */
  bandbreedteMax?: number;
  /** Max korfballeeftijd per individuele speler. Alleen U-teams. */
  maxLeeftijdPerSpeler?: number;
};

export const TC_DEFAULTS: Record<string, TcKader> = {
  SEN_A: {
    teamMin: 8,
    teamIdeaal: 10,
    teamMax: 12,
    damesMin: 4,
    damesIdeaal: 5,
    damesMax: 6,
    herenMin: 4,
    herenIdeaal: 5,
    herenMax: 6,
  },
  SEN_B: {
    teamMin: 10,
    teamIdeaal: 12,
    teamMax: 14,
    damesMin: 4,
    damesIdeaal: 6,
    damesMax: 8,
    herenMin: 4,
    herenIdeaal: 6,
    herenMax: 8,
  },
  U19: {
    teamMin: 8,
    teamIdeaal: 10,
    teamMax: 12,
    damesMin: 4,
    damesIdeaal: 5,
    damesMax: 6,
    herenMin: 4,
    herenIdeaal: 5,
    herenMax: 6,
    maxLeeftijdPerSpeler: 19.0,
  },
  U17: {
    teamMin: 8,
    teamIdeaal: 10,
    teamMax: 12,
    damesMin: 4,
    damesIdeaal: 5,
    damesMax: 6,
    herenMin: 4,
    herenIdeaal: 5,
    herenMax: 6,
    maxLeeftijdPerSpeler: 17.0,
  },
  U15: {
    teamMin: 8,
    teamIdeaal: 10,
    teamMax: 12,
    damesMin: 4,
    damesIdeaal: 5,
    damesMax: 6,
    herenMin: 4,
    herenIdeaal: 5,
    herenMax: 6,
    maxLeeftijdPerSpeler: 15.0,
  },
  ROOD: {
    teamMin: 9,
    teamIdeaal: 11,
    teamMax: 13,
    damesMin: 2,
    damesIdeaal: 5,
    damesMax: 8,
    herenMin: 2,
    herenIdeaal: 5,
    herenMax: 8,
    gemLeeftijdMin: 13.4,
    gemLeeftijdMax: 18.5,
    bandbreedteMax: 3,
  },
  ORANJE: {
    teamMin: 9,
    teamIdeaal: 11,
    teamMax: 13,
    damesMin: 2,
    damesIdeaal: 5,
    damesMax: 8,
    herenMin: 2,
    herenIdeaal: 5,
    herenMax: 8,
    gemLeeftijdMin: 11.3,
    gemLeeftijdMax: 14.4,
    bandbreedteMax: 3,
  },
  GEEL8: {
    teamMin: 9,
    teamIdeaal: 11,
    teamMax: 13,
    damesMin: 2,
    damesIdeaal: 5,
    damesMax: 8,
    herenMin: 2,
    herenIdeaal: 5,
    herenMax: 8,
    gemLeeftijdMin: 9.2,
    gemLeeftijdMax: 12.1,
    bandbreedteMax: 3,
  },
  GEEL4: {
    teamMin: 4,
    teamIdeaal: 5,
    teamMax: 5,
    damesMin: 2,
    damesIdeaal: 3,
    damesMax: 4,
    herenMin: 2,
    herenIdeaal: 3,
    herenMax: 4,
    gemLeeftijdMin: 9.2,
    gemLeeftijdMax: 12.1,
    bandbreedteMax: 3,
  },
  GROEN: {
    teamMin: 4,
    teamIdeaal: 5,
    teamMax: 6,
    damesMin: 2,
    damesIdeaal: 3,
    damesMax: 4,
    herenMin: 2,
    herenIdeaal: 3,
    herenMax: 4,
    gemLeeftijdMin: 7.5,
    gemLeeftijdMax: 9.7,
    bandbreedteMax: 2,
  },
  BLAUW: {
    teamMin: 4,
    teamIdeaal: 5,
    teamMax: 6,
    damesMin: 2,
    damesIdeaal: 3,
    damesMax: 4,
    herenMin: 2,
    herenIdeaal: 3,
    herenMax: 4,
    gemLeeftijdMin: 5.5,
    gemLeeftijdMax: 8.2,
    bandbreedteMax: 2,
  },
};

export function mergeMetDefaults(
  opgeslagen: Record<string, TcKader> | null
): Record<string, TcKader> {
  if (!opgeslagen) return { ...TC_DEFAULTS };
  const result: Record<string, TcKader> = { ...TC_DEFAULTS };
  for (const id of Object.keys(TC_DEFAULTS)) {
    if (opgeslagen[id]) {
      result[id] = { ...TC_DEFAULTS[id], ...opgeslagen[id] };
    }
  }
  return result;
}
