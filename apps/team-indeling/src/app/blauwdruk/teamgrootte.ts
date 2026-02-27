export interface TeamgrootteBereik {
  min: number;
  ideaal: number;
  max: number;
}

export interface TeamgrootteTargets {
  viertal: TeamgrootteBereik;          // Blauw + Groen (4-tallen)
  breedteAchttal: TeamgrootteBereik;   // Geel, Oranje, Rood (B-cat 8-tallen)
  aCatTeam: TeamgrootteBereik;         // U15/U17/U19 per team
  selectie: TeamgrootteBereik;         // A-cat selectie (2 teams samen)
  seniorenSelectie: TeamgrootteBereik; // Senioren A selectie
}

export const DEFAULT_TEAMGROOTTE: TeamgrootteTargets = {
  viertal:          { min: 5, ideaal: 6, max: 6 },
  breedteAchttal:   { min: 9, ideaal: 10, max: 11 },
  aCatTeam:         { min: 8, ideaal: 10, max: 11 },
  selectie:         { min: 18, ideaal: 20, max: 22 },
  seniorenSelectie: { min: 20, ideaal: 24, max: 26 },
};

/**
 * Haal teamgrootte-targets uit blauwdruk, met defaults als fallback.
 */
export function getTeamgrootteTargets(
  blauwdruk: { keuzes: unknown }
): TeamgrootteTargets {
  const keuzes = blauwdruk.keuzes as { teamgrootte?: Partial<TeamgrootteTargets> } | null;
  if (!keuzes?.teamgrootte) return DEFAULT_TEAMGROOTTE;

  return {
    viertal: keuzes.teamgrootte.viertal ?? DEFAULT_TEAMGROOTTE.viertal,
    breedteAchttal: keuzes.teamgrootte.breedteAchttal ?? DEFAULT_TEAMGROOTTE.breedteAchttal,
    aCatTeam: keuzes.teamgrootte.aCatTeam ?? DEFAULT_TEAMGROOTTE.aCatTeam,
    selectie: keuzes.teamgrootte.selectie ?? DEFAULT_TEAMGROOTTE.selectie,
    seniorenSelectie: keuzes.teamgrootte.seniorenSelectie ?? DEFAULT_TEAMGROOTTE.seniorenSelectie,
  };
}
