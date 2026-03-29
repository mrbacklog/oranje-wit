import { describe, it, expect } from "vitest";
import { berekenWhatIfDelta } from "./delta";
import type { WhatIfTeamData } from "./types";

function maakWerkTeam(id: string, naam: string, spelerIds: string[]) {
  return {
    id,
    naam,
    spelers: spelerIds.map((spelerId) => ({ spelerId })),
  };
}

function maakWhatIfTeam(
  overrides: Partial<WhatIfTeamData> & { naam: string; spelerIds?: string[] }
): WhatIfTeamData {
  const spelerIds = overrides.spelerIds ?? [];
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
    staf: overrides.staf ?? [],
  };
}

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
    const werkTeams: { id: string; naam: string; spelers: { spelerId: string }[] }[] = [];
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
});
