import { describe, it, expect } from "vitest";
import { valideerPinsInWhatIf, type PinDataVoorValidatie } from "./pin-validatie";
import type { WhatIfTeamData } from "./types";
import type { WerkindelingTeamData } from "./delta";

// ============================================================
// Test helpers
// ============================================================

function maakWerkTeam(
  id: string,
  naam: string,
  spelerIds: string[],
  stafIds: string[] = []
): WerkindelingTeamData {
  return {
    id,
    naam,
    spelers: spelerIds.map((spelerId) => ({ spelerId })),
    staf: stafIds.map((stafId) => ({ stafId })),
  };
}

function maakWhatIfTeam(
  overrides: Partial<WhatIfTeamData> & {
    naam: string;
    spelerIds?: string[];
    stafIds?: string[];
  }
): WhatIfTeamData {
  const spelerIds = overrides.spelerIds ?? [];
  const stafIds = overrides.stafIds ?? [];
  return {
    id: overrides.id ?? `wi-${overrides.naam}`,
    bronTeamId: overrides.bronTeamId ?? null,
    naam: overrides.naam,
    categorie: overrides.categorie ?? ("SENIOREN" as any),
    kleur: overrides.kleur ?? null,
    teamType: overrides.teamType ?? null,
    volgorde: overrides.volgorde ?? 0,
    spelers: spelerIds.map((spelerId) => ({
      id: `wis-${spelerId}`,
      spelerId,
      statusOverride: null,
      notitie: null,
    })),
    staf: stafIds.map((stafId) => ({
      id: `wist-${stafId}`,
      stafId,
      rol: null,
    })),
  };
}

function maakPin(overrides: Partial<PinDataVoorValidatie>): PinDataVoorValidatie {
  return {
    id: overrides.id ?? "pin-1",
    type: overrides.type ?? "SPELER_POSITIE",
    spelerId: overrides.spelerId ?? null,
    stafId: overrides.stafId ?? null,
    waarde: overrides.waarde ?? { teamNaam: "Senioren 1", teamId: "t1" },
  };
}

// ============================================================
// SPELER_POSITIE
// ============================================================

describe("valideerPinsInWhatIf — SPELER_POSITIE", () => {
  it("geen schending als speler in het juiste team staat", () => {
    const werkTeams = [maakWerkTeam("t1", "Senioren 1", ["s1"])];
    const whatIfTeams = [
      maakWhatIfTeam({
        naam: "Senioren 1",
        bronTeamId: "t1",
        spelerIds: ["s1"],
      }),
    ];
    const pins = [
      maakPin({
        spelerId: "s1",
        waarde: { teamNaam: "Senioren 1", teamId: "t1" },
      }),
    ];

    const schendingen = valideerPinsInWhatIf(whatIfTeams, werkTeams, pins);
    expect(schendingen).toHaveLength(0);
  });

  it("schending als speler verplaatst is naar ander team", () => {
    const werkTeams = [
      maakWerkTeam("t1", "Senioren 1", []),
      maakWerkTeam("t2", "Senioren 2", ["s1"]),
    ];
    const whatIfTeams = [
      maakWhatIfTeam({
        naam: "Senioren 1",
        bronTeamId: "t1",
        spelerIds: [],
      }),
      maakWhatIfTeam({
        naam: "Senioren 2",
        bronTeamId: "t2",
        spelerIds: ["s1"],
      }),
    ];
    const pins = [
      maakPin({
        spelerId: "s1",
        waarde: { teamNaam: "Senioren 1", teamId: "t1" },
      }),
    ];

    const schendingen = valideerPinsInWhatIf(whatIfTeams, werkTeams, pins);
    expect(schendingen).toHaveLength(1);
    expect(schendingen[0].type).toBe("SPELER_POSITIE");
    expect(schendingen[0].huidigTeam).toBe("Senioren 2");
    expect(schendingen[0].verwachtTeam).toBe("Senioren 1");
  });

  it("schending als speler niet ingedeeld is", () => {
    const werkTeams = [maakWerkTeam("t1", "Senioren 1", [])];
    const whatIfTeams = [
      maakWhatIfTeam({
        naam: "Senioren 1",
        bronTeamId: "t1",
        spelerIds: [],
      }),
    ];
    const pins = [
      maakPin({
        spelerId: "s1",
        waarde: { teamNaam: "Senioren 1", teamId: "t1" },
      }),
    ];

    const schendingen = valideerPinsInWhatIf(whatIfTeams, werkTeams, pins);
    expect(schendingen).toHaveLength(1);
    expect(schendingen[0].huidigTeam).toBeNull();
  });

  it("geen schending als speler in niet-overschreven werkindeling-team staat", () => {
    // Speler zit in werkindeling-team dat niet in de what-if zit
    const werkTeams = [
      maakWerkTeam("t1", "Senioren 1", ["s1"]),
      maakWerkTeam("t2", "Senioren 2", ["s2"]),
    ];
    const whatIfTeams = [
      maakWhatIfTeam({
        naam: "Senioren 2",
        bronTeamId: "t2",
        spelerIds: ["s2"],
      }),
    ];
    const pins = [
      maakPin({
        spelerId: "s1",
        waarde: { teamNaam: "Senioren 1", teamId: "t1" },
      }),
    ];

    const schendingen = valideerPinsInWhatIf(whatIfTeams, werkTeams, pins);
    expect(schendingen).toHaveLength(0);
  });
});

// ============================================================
// SPELER_STATUS
// ============================================================

describe("valideerPinsInWhatIf — SPELER_STATUS", () => {
  it("schending als speler verplaatst is", () => {
    const werkTeams = [maakWerkTeam("t1", "Senioren 1", []), maakWerkTeam("t2", "Senioren 2", [])];
    const whatIfTeams = [
      maakWhatIfTeam({
        naam: "Senioren 1",
        bronTeamId: "t1",
        spelerIds: [],
      }),
      maakWhatIfTeam({
        naam: "Senioren 2",
        bronTeamId: "t2",
        spelerIds: ["s1"],
      }),
    ];
    const pins = [
      maakPin({
        type: "SPELER_STATUS",
        spelerId: "s1",
        waarde: { teamNaam: "Senioren 1", teamId: "t1" },
      }),
    ];

    const schendingen = valideerPinsInWhatIf(whatIfTeams, werkTeams, pins);
    expect(schendingen).toHaveLength(1);
    expect(schendingen[0].type).toBe("SPELER_STATUS");
  });
});

// ============================================================
// STAF_POSITIE
// ============================================================

describe("valideerPinsInWhatIf — STAF_POSITIE", () => {
  it("geen schending als staf in het juiste team staat", () => {
    const werkTeams = [maakWerkTeam("t1", "Senioren 1", [], ["coach1"])];
    const whatIfTeams = [
      maakWhatIfTeam({
        naam: "Senioren 1",
        bronTeamId: "t1",
        stafIds: ["coach1"],
      }),
    ];
    const pins = [
      maakPin({
        type: "STAF_POSITIE",
        stafId: "coach1",
        waarde: { teamNaam: "Senioren 1", teamId: "t1" },
      }),
    ];

    const schendingen = valideerPinsInWhatIf(whatIfTeams, werkTeams, pins);
    expect(schendingen).toHaveLength(0);
  });

  it("schending als staf verplaatst is", () => {
    const werkTeams = [
      maakWerkTeam("t1", "Senioren 1", [], []),
      maakWerkTeam("t2", "Senioren 2", [], []),
    ];
    const whatIfTeams = [
      maakWhatIfTeam({
        naam: "Senioren 1",
        bronTeamId: "t1",
        stafIds: [],
      }),
      maakWhatIfTeam({
        naam: "Senioren 2",
        bronTeamId: "t2",
        stafIds: ["coach1"],
      }),
    ];
    const pins = [
      maakPin({
        type: "STAF_POSITIE",
        stafId: "coach1",
        waarde: { teamNaam: "Senioren 1", teamId: "t1" },
      }),
    ];

    const schendingen = valideerPinsInWhatIf(whatIfTeams, werkTeams, pins);
    expect(schendingen).toHaveLength(1);
    expect(schendingen[0].type).toBe("STAF_POSITIE");
    expect(schendingen[0].huidigTeam).toBe("Senioren 2");
  });
});

// ============================================================
// Edge cases
// ============================================================

describe("valideerPinsInWhatIf — edge cases", () => {
  it("retourneert lege array als er geen pins zijn", () => {
    const werkTeams = [maakWerkTeam("t1", "Senioren 1", ["s1"])];
    const whatIfTeams = [
      maakWhatIfTeam({
        naam: "Senioren 1",
        bronTeamId: "t1",
        spelerIds: ["s1"],
      }),
    ];

    const schendingen = valideerPinsInWhatIf(whatIfTeams, werkTeams, []);
    expect(schendingen).toHaveLength(0);
  });

  it("meerdere schendingen worden allemaal gerapporteerd", () => {
    const werkTeams = [
      maakWerkTeam("t1", "Senioren 1", [], []),
      maakWerkTeam("t2", "Senioren 2", [], []),
    ];
    const whatIfTeams = [
      maakWhatIfTeam({
        naam: "Senioren 1",
        bronTeamId: "t1",
        spelerIds: [],
        stafIds: [],
      }),
      maakWhatIfTeam({
        naam: "Senioren 2",
        bronTeamId: "t2",
        spelerIds: ["s1"],
        stafIds: ["coach1"],
      }),
    ];
    const pins = [
      maakPin({
        id: "pin1",
        type: "SPELER_POSITIE",
        spelerId: "s1",
        waarde: { teamNaam: "Senioren 1", teamId: "t1" },
      }),
      maakPin({
        id: "pin2",
        type: "STAF_POSITIE",
        stafId: "coach1",
        waarde: { teamNaam: "Senioren 1", teamId: "t1" },
      }),
    ];

    const schendingen = valideerPinsInWhatIf(whatIfTeams, werkTeams, pins);
    expect(schendingen).toHaveLength(2);
  });
});
