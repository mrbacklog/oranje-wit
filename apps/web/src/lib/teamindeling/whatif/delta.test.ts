import { describe, it, expect } from "vitest";
import { berekenWhatIfDelta, berekenImpactSamenvatting } from "./delta";
import type { WhatIfTeamData } from "./types";
import type { WerkindelingTeamData } from "./delta";

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

// ============================================================
// berekenWhatIfDelta — speler-tests
// ============================================================

describe("berekenWhatIfDelta", () => {
  it("detecteert geen verschil als spelers identiek zijn", () => {
    const werkTeams = [maakWerkTeam("t1", "Senioren 1", ["s1", "s2", "s3"])];
    const whatIfTeams = [
      maakWhatIfTeam({
        naam: "Senioren 1",
        bronTeamId: "t1",
        spelerIds: ["s1", "s2", "s3"],
      }),
    ];

    const deltas = berekenWhatIfDelta(werkTeams, whatIfTeams);
    expect(deltas).toHaveLength(0);
  });

  it("detecteert spelers die erbij komen", () => {
    const werkTeams = [maakWerkTeam("t1", "Senioren 1", ["s1", "s2"])];
    const whatIfTeams = [
      maakWhatIfTeam({
        naam: "Senioren 1",
        bronTeamId: "t1",
        spelerIds: ["s1", "s2", "s3"],
      }),
    ];

    const deltas = berekenWhatIfDelta(werkTeams, whatIfTeams);
    expect(deltas).toHaveLength(1);
    expect(deltas[0].verschil).toBe(1);
    expect(deltas[0].spelersIn).toEqual(["s3"]);
    expect(deltas[0].spelersUit).toEqual([]);
    expect(deltas[0].isNieuw).toBe(false);
  });

  it("detecteert spelers die weggaan", () => {
    const werkTeams = [maakWerkTeam("t1", "Senioren 1", ["s1", "s2", "s3"])];
    const whatIfTeams = [
      maakWhatIfTeam({
        naam: "Senioren 1",
        bronTeamId: "t1",
        spelerIds: ["s1"],
      }),
    ];

    const deltas = berekenWhatIfDelta(werkTeams, whatIfTeams);
    expect(deltas).toHaveLength(1);
    expect(deltas[0].verschil).toBe(-2);
    expect(deltas[0].spelersIn).toEqual([]);
    expect(deltas[0].spelersUit).toEqual(expect.arrayContaining(["s2", "s3"]));
    expect(deltas[0].huidigAantal).toBe(3);
    expect(deltas[0].nieuwAantal).toBe(1);
  });

  it("rapporteert nieuw team zonder bronTeamId", () => {
    const werkTeams = [maakWerkTeam("t1", "Senioren 1", ["s1", "s2"])];
    const whatIfTeams = [
      maakWhatIfTeam({
        naam: "Senioren 3",
        bronTeamId: null,
        spelerIds: ["s3", "s4"],
      }),
    ];

    const deltas = berekenWhatIfDelta(werkTeams, whatIfTeams);
    expect(deltas).toHaveLength(1);
    expect(deltas[0].isNieuw).toBe(true);
    expect(deltas[0].huidigAantal).toBe(0);
    expect(deltas[0].nieuwAantal).toBe(2);
    expect(deltas[0].spelersIn).toEqual(["s3", "s4"]);
    expect(deltas[0].spelersUit).toEqual([]);
  });

  it("combineert meerdere teams correct", () => {
    const werkTeams = [
      maakWerkTeam("t1", "Senioren 1", ["s1", "s2", "s3"]),
      maakWerkTeam("t2", "Senioren 2", ["s4", "s5", "s6"]),
    ];
    const whatIfTeams = [
      maakWhatIfTeam({
        naam: "Senioren 1",
        bronTeamId: "t1",
        spelerIds: ["s1", "s2"], // s3 eruit
      }),
      maakWhatIfTeam({
        naam: "Senioren 2",
        bronTeamId: "t2",
        spelerIds: ["s3", "s4", "s5", "s6"], // s3 erbij
      }),
    ];

    const deltas = berekenWhatIfDelta(werkTeams, whatIfTeams);
    expect(deltas).toHaveLength(2);

    const delta1 = deltas.find((d) => d.teamNaam === "Senioren 1")!;
    expect(delta1.verschil).toBe(-1);
    expect(delta1.spelersUit).toEqual(["s3"]);

    const delta2 = deltas.find((d) => d.teamNaam === "Senioren 2")!;
    expect(delta2.verschil).toBe(1);
    expect(delta2.spelersIn).toEqual(["s3"]);
  });

  it("behandelt verwijderd bronteam als nieuw team", () => {
    const werkTeams: WerkindelingTeamData[] = [];
    const whatIfTeams = [
      maakWhatIfTeam({
        naam: "Verwijderd team",
        bronTeamId: "niet-bestaand",
        spelerIds: ["s1"],
      }),
    ];

    const deltas = berekenWhatIfDelta(werkTeams, whatIfTeams);
    expect(deltas).toHaveLength(1);
    expect(deltas[0].isNieuw).toBe(true);
  });

  it("retourneert lege array bij geen what-if teams", () => {
    const werkTeams = [maakWerkTeam("t1", "Senioren 1", ["s1"])];
    const deltas = berekenWhatIfDelta(werkTeams, []);
    expect(deltas).toHaveLength(0);
  });

  // ============================================================
  // Staf-delta tests
  // ============================================================

  it("detecteert staf die erbij komt", () => {
    const werkTeams = [maakWerkTeam("t1", "Senioren 1", ["s1"], ["coach1"])];
    const whatIfTeams = [
      maakWhatIfTeam({
        naam: "Senioren 1",
        bronTeamId: "t1",
        spelerIds: ["s1"],
        stafIds: ["coach1", "coach2"],
      }),
    ];

    const deltas = berekenWhatIfDelta(werkTeams, whatIfTeams);
    expect(deltas).toHaveLength(1);
    expect(deltas[0].stafIn).toEqual(["coach2"]);
    expect(deltas[0].stafUit).toEqual([]);
    expect(deltas[0].stafHuidig).toBe(1);
    expect(deltas[0].stafNieuw).toBe(2);
  });

  it("detecteert staf die weggaat", () => {
    const werkTeams = [maakWerkTeam("t1", "Senioren 1", ["s1"], ["coach1", "coach2"])];
    const whatIfTeams = [
      maakWhatIfTeam({
        naam: "Senioren 1",
        bronTeamId: "t1",
        spelerIds: ["s1"],
        stafIds: [],
      }),
    ];

    const deltas = berekenWhatIfDelta(werkTeams, whatIfTeams);
    expect(deltas).toHaveLength(1);
    expect(deltas[0].stafUit).toEqual(expect.arrayContaining(["coach1", "coach2"]));
    expect(deltas[0].stafHuidig).toBe(2);
    expect(deltas[0].stafNieuw).toBe(0);
  });

  it("rapporteert delta als alleen staf wijzigt (geen speler-wijziging)", () => {
    const werkTeams = [maakWerkTeam("t1", "Senioren 1", ["s1"], ["coach1"])];
    const whatIfTeams = [
      maakWhatIfTeam({
        naam: "Senioren 1",
        bronTeamId: "t1",
        spelerIds: ["s1"],
        stafIds: ["coach2"],
      }),
    ];

    const deltas = berekenWhatIfDelta(werkTeams, whatIfTeams);
    expect(deltas).toHaveLength(1);
    // Spelers ongewijzigd
    expect(deltas[0].spelersIn).toEqual([]);
    expect(deltas[0].spelersUit).toEqual([]);
    expect(deltas[0].verschil).toBe(0);
    // Staf wel gewijzigd
    expect(deltas[0].stafIn).toEqual(["coach2"]);
    expect(deltas[0].stafUit).toEqual(["coach1"]);
  });

  it("nieuw team rapporteert staf correct", () => {
    const werkTeams = [maakWerkTeam("t1", "Senioren 1", ["s1"])];
    const whatIfTeams = [
      maakWhatIfTeam({
        naam: "Senioren 3",
        bronTeamId: null,
        spelerIds: ["s2"],
        stafIds: ["coach1", "coach2"],
      }),
    ];

    const deltas = berekenWhatIfDelta(werkTeams, whatIfTeams);
    expect(deltas).toHaveLength(1);
    expect(deltas[0].isNieuw).toBe(true);
    expect(deltas[0].stafIn).toEqual(["coach1", "coach2"]);
    expect(deltas[0].stafUit).toEqual([]);
    expect(deltas[0].stafHuidig).toBe(0);
    expect(deltas[0].stafNieuw).toBe(2);
  });

  it("geen delta als spelers en staf identiek zijn", () => {
    const werkTeams = [maakWerkTeam("t1", "Senioren 1", ["s1", "s2"], ["coach1"])];
    const whatIfTeams = [
      maakWhatIfTeam({
        naam: "Senioren 1",
        bronTeamId: "t1",
        spelerIds: ["s1", "s2"],
        stafIds: ["coach1"],
      }),
    ];

    const deltas = berekenWhatIfDelta(werkTeams, whatIfTeams);
    expect(deltas).toHaveLength(0);
  });
});

// ============================================================
// berekenImpactSamenvatting
// ============================================================

describe("berekenImpactSamenvatting", () => {
  it("identificeert impact-teams die spelers kwijtraken", () => {
    const werkTeams = [
      maakWerkTeam("t1", "Senioren 1", ["s1", "s2", "s3"]),
      maakWerkTeam("t2", "Senioren 2", ["s4", "s5", "s6"]),
      maakWerkTeam("t3", "U17", ["s7", "s8", "s9", "s10"]),
    ];

    // What-if: alleen Senioren 1, maar s7 uit U17 erbij gepakt
    const whatIfTeams = [
      maakWhatIfTeam({
        naam: "Senioren 1",
        bronTeamId: "t1",
        spelerIds: ["s1", "s2", "s3", "s7"],
      }),
    ];

    const impact = berekenImpactSamenvatting(werkTeams, whatIfTeams);

    // Senioren 1 is gewijzigd (s7 erbij)
    expect(impact.gewijzigdeTeams).toHaveLength(1);
    expect(impact.gewijzigdeTeams[0].teamNaam).toBe("Senioren 1");
    expect(impact.gewijzigdeTeams[0].spelersIn).toEqual(["s7"]);

    // U17 is impact-team (verliest s7)
    expect(impact.impactTeams).toHaveLength(1);
    expect(impact.impactTeams[0].teamNaam).toBe("U17");
    expect(impact.impactTeams[0].spelersUit).toEqual(["s7"]);
    expect(impact.impactTeams[0].huidigAantal).toBe(4);
    expect(impact.impactTeams[0].nieuwAantal).toBe(3);

    // Senioren 2 is niet geraakt
    const sen2 = impact.impactTeams.find((t) => t.teamNaam === "Senioren 2");
    expect(sen2).toBeUndefined();
  });

  it("identificeert impact-teams die staf kwijtraken", () => {
    const werkTeams = [
      maakWerkTeam("t1", "Senioren 1", ["s1"], ["coach1"]),
      maakWerkTeam("t2", "U17", ["s2"], ["coach2"]),
    ];

    const whatIfTeams = [
      maakWhatIfTeam({
        naam: "Senioren 1",
        bronTeamId: "t1",
        spelerIds: ["s1"],
        stafIds: ["coach1", "coach2"],
      }),
    ];

    const impact = berekenImpactSamenvatting(werkTeams, whatIfTeams);

    expect(impact.impactTeams).toHaveLength(1);
    expect(impact.impactTeams[0].teamNaam).toBe("U17");
    expect(impact.impactTeams[0].stafUit).toEqual(["coach2"]);
    expect(impact.impactTeams[0].stafHuidig).toBe(1);
    expect(impact.impactTeams[0].stafNieuw).toBe(0);
    expect(impact.totaalStafVerplaatst).toBe(1);
  });

  it("telt totalen correct", () => {
    const werkTeams = [
      maakWerkTeam("t1", "Senioren 1", ["s1", "s2", "s3"], ["coach1"]),
      maakWerkTeam("t2", "Senioren 2", ["s4", "s5"], []),
      maakWerkTeam("t3", "U17", ["s6", "s7"], ["coach2"]),
    ];

    const whatIfTeams = [
      maakWhatIfTeam({
        naam: "Senioren 1",
        bronTeamId: "t1",
        spelerIds: ["s1", "s2"],
        stafIds: ["coach1"],
      }),
      maakWhatIfTeam({
        naam: "Senioren 3",
        bronTeamId: null,
        spelerIds: ["s3", "s6"],
        stafIds: ["coach2"],
      }),
    ];

    const impact = berekenImpactSamenvatting(werkTeams, whatIfTeams);

    expect(impact.gewijzigdeTeams).toHaveLength(2);
    expect(impact.nieuwTeams).toBe(1);

    expect(impact.impactTeams).toHaveLength(1);
    expect(impact.impactTeams[0].teamNaam).toBe("U17");
    expect(impact.impactTeams[0].spelersUit).toEqual(["s6"]);
    expect(impact.impactTeams[0].stafUit).toEqual(["coach2"]);

    // Unieke spelers: s3 (uit Sen1 + in Sen3), s6 (in Sen3, uit U17)
    expect(impact.totaalSpelersVerplaatst).toBe(2);
    expect(impact.totaalStafVerplaatst).toBe(1);
  });

  it("retourneert lege impact als geen teams geraakt worden", () => {
    const werkTeams = [
      maakWerkTeam("t1", "Senioren 1", ["s1", "s2"]),
      maakWerkTeam("t2", "Senioren 2", ["s3", "s4"]),
    ];

    const whatIfTeams = [
      maakWhatIfTeam({
        naam: "Senioren 1",
        bronTeamId: "t1",
        spelerIds: ["s1"],
      }),
      maakWhatIfTeam({
        naam: "Senioren 2",
        bronTeamId: "t2",
        spelerIds: ["s2", "s3", "s4"],
      }),
    ];

    const impact = berekenImpactSamenvatting(werkTeams, whatIfTeams);

    expect(impact.impactTeams).toHaveLength(0);
    expect(impact.gewijzigdeTeams).toHaveLength(2);
  });

  it("retourneert lege samenvatting bij geen what-if teams", () => {
    const werkTeams = [maakWerkTeam("t1", "Senioren 1", ["s1"])];
    const impact = berekenImpactSamenvatting(werkTeams, []);

    expect(impact.gewijzigdeTeams).toHaveLength(0);
    expect(impact.impactTeams).toHaveLength(0);
    expect(impact.totaalSpelersVerplaatst).toBe(0);
    expect(impact.totaalStafVerplaatst).toBe(0);
    expect(impact.nieuwTeams).toBe(0);
  });

  it("domino-effect: meerdere impact-teams in een keten", () => {
    const werkTeams = [
      maakWerkTeam("t1", "Senioren 1", ["s1", "s2"], ["coach1"]),
      maakWerkTeam("t2", "Senioren 2", ["s3", "s4"], []),
      maakWerkTeam("t3", "U17", ["s5", "s6"], ["coach2"]),
      maakWerkTeam("t4", "U15", ["s7", "s8"], []),
    ];

    const whatIfTeams = [
      maakWhatIfTeam({
        naam: "Senioren 1",
        bronTeamId: "t1",
        spelerIds: ["s1", "s2", "s3"],
        stafIds: ["coach1"],
      }),
      maakWhatIfTeam({
        naam: "Senioren 3",
        bronTeamId: null,
        spelerIds: ["s5", "s7"],
        stafIds: ["coach2"],
      }),
    ];

    const impact = berekenImpactSamenvatting(werkTeams, whatIfTeams);

    // 3 impact-teams: Sen2 (-s3), U17 (-s5, -coach2), U15 (-s7)
    expect(impact.impactTeams).toHaveLength(3);
    const impactNames = impact.impactTeams.map((t) => t.teamNaam).sort();
    expect(impactNames).toEqual(["Senioren 2", "U15", "U17"]);

    expect(impact.totaalSpelersVerplaatst).toBe(3); // s3, s5, s7
    expect(impact.totaalStafVerplaatst).toBe(1); // coach2
    expect(impact.nieuwTeams).toBe(1); // Senioren 3
  });
});
