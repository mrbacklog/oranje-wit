import { describe, it, expect } from "vitest";
import { valideerWhatIf, whatIfTeamNaarTeamData } from "./validatie";
import type { SpelerLookup } from "./validatie";
import type { WhatIfTeamData } from "./types";
import type { WerkindelingTeamData } from "./delta";

const SEIZOEN = 2026;

// ============================================================
// Test helpers
// ============================================================

function maakSpelerLookup(
  entries: Array<{ id: string; geboortejaar?: number; geslacht?: "M" | "V" }>
): Map<string, SpelerLookup> {
  const map = new Map<string, SpelerLookup>();
  for (const e of entries) {
    map.set(e.id, {
      id: e.id,
      roepnaam: `Speler_${e.id}`,
      achternaam: "Test",
      geboortejaar: e.geboortejaar ?? 2010,
      geslacht: e.geslacht ?? "M",
    });
  }
  return map;
}

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
// whatIfTeamNaarTeamData
// ============================================================

describe("whatIfTeamNaarTeamData", () => {
  it("mapt WhatIfTeamData naar TeamData", () => {
    const lookup = maakSpelerLookup([
      { id: "s1", geboortejaar: 2010, geslacht: "M" },
      { id: "s2", geboortejaar: 2011, geslacht: "V" },
    ]);
    const wiTeam = maakWhatIfTeam({
      naam: "Geel 1",
      categorie: "B_CATEGORIE" as any,
      kleur: "GEEL" as any,
      spelerIds: ["s1", "s2"],
    });

    const result = whatIfTeamNaarTeamData(wiTeam, lookup);

    expect(result.naam).toBe("Geel 1");
    expect(result.categorie).toBe("B_CATEGORIE");
    expect(result.kleur).toBe("GEEL");
    expect(result.spelers).toHaveLength(2);
    expect(result.spelers[0].id).toBe("s1");
    expect(result.spelers[0].geslacht).toBe("M");
  });

  it("filtert spelers zonder lookup-entry", () => {
    const lookup = maakSpelerLookup([{ id: "s1" }]);
    const wiTeam = maakWhatIfTeam({
      naam: "Test",
      spelerIds: ["s1", "onbekend"],
    });

    const result = whatIfTeamNaarTeamData(wiTeam, lookup);
    expect(result.spelers).toHaveLength(1);
  });
});

// ============================================================
// valideerWhatIf — basis
// ============================================================

describe("valideerWhatIf", () => {
  it("geeft GROEN voor een valide what-if", () => {
    // 10 spelers (5M+5V) in een senioren-team is prima
    const spelers = [
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `m${i}`,
        geboortejaar: 2000,
        geslacht: "M" as const,
      })),
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `v${i}`,
        geboortejaar: 2000,
        geslacht: "V" as const,
      })),
    ];
    const lookup = maakSpelerLookup(spelers);

    const werkTeams = [
      maakWerkTeam(
        "t1",
        "Senioren 1",
        spelers.map((s) => s.id)
      ),
    ];
    const whatIfTeams = [
      maakWhatIfTeam({
        naam: "Senioren 1",
        bronTeamId: "t1",
        spelerIds: spelers.map((s) => s.id),
      }),
    ];

    const result = valideerWhatIf(whatIfTeams, werkTeams, lookup, SEIZOEN);

    expect(result.heeftHardefouten).toBe(false);
    expect(result.heeftAfwijkingen).toBe(false);
    expect(result.pinSchendingen).toHaveLength(0);
    expect(result.kaderAfwijkingen).toHaveLength(0);
    expect(result.crossTeamMeldingen).toHaveLength(0);
  });

  it("detecteert teamgrootte-schending in what-if team", () => {
    // Senioren-team met maar 3 spelers -> onder minimum (8)
    const lookup = maakSpelerLookup([{ id: "s1" }, { id: "s2" }, { id: "s3" }]);

    const werkTeams = [maakWerkTeam("t1", "Senioren 1", ["s1", "s2", "s3"])];
    const whatIfTeams = [
      maakWhatIfTeam({
        naam: "Senioren 1",
        bronTeamId: "t1",
        spelerIds: ["s1", "s2", "s3"],
      }),
    ];

    const result = valideerWhatIf(whatIfTeams, werkTeams, lookup, SEIZOEN);

    expect(result.heeftHardefouten).toBe(true);
    const teamVal = result.teamValidaties.get("wi-Senioren 1");
    expect(teamVal).toBeDefined();
    expect(teamVal!.status).toBe("ROOD");
  });

  it("detecteert dubbele plaatsing cross-team", () => {
    const lookup = maakSpelerLookup([{ id: "s1" }, { id: "s2" }]);

    // s1 zit in zowel werkindeling-team als what-if team
    const werkTeams = [
      maakWerkTeam("t1", "Senioren 1", ["s1"]),
      maakWerkTeam("t2", "Senioren 2", ["s2"]),
    ];
    const whatIfTeams = [
      maakWhatIfTeam({
        naam: "Senioren 2",
        bronTeamId: "t2",
        spelerIds: ["s1", "s2"], // s1 nu ook in Senioren 2
      }),
    ];

    const result = valideerWhatIf(whatIfTeams, werkTeams, lookup, SEIZOEN);

    expect(result.heeftHardefouten).toBe(true);
    expect(result.crossTeamMeldingen.length).toBeGreaterThan(0);
    expect(result.crossTeamMeldingen[0].regel).toBe("dubbele_plaatsing");
  });

  it("detecteert pin-schendingen", () => {
    const lookup = maakSpelerLookup([{ id: "s1" }]);

    const werkTeams = [
      maakWerkTeam("t1", "Senioren 1", ["s1"]),
      maakWerkTeam("t2", "Senioren 2", []),
    ];
    const whatIfTeams = [
      maakWhatIfTeam({
        naam: "Senioren 2",
        bronTeamId: "t2",
        spelerIds: ["s1"], // s1 verplaatst naar Sen 2
      }),
      maakWhatIfTeam({
        naam: "Senioren 1",
        bronTeamId: "t1",
        spelerIds: [], // s1 weg uit Sen 1
      }),
    ];

    const pins = [
      {
        id: "pin1",
        type: "SPELER_POSITIE" as const,
        spelerId: "s1",
        stafId: null,
        waarde: { teamNaam: "Senioren 1", teamId: "t1" },
      },
    ];

    const result = valideerWhatIf(whatIfTeams, werkTeams, lookup, SEIZOEN, { pins });

    expect(result.heeftHardefouten).toBe(true);
    expect(result.pinSchendingen).toHaveLength(1);
    expect(result.pinSchendingen[0].type).toBe("SPELER_POSITIE");
    expect(result.pinSchendingen[0].verwachtTeam).toBe("Senioren 1");
    expect(result.pinSchendingen[0].huidigTeam).toBe("Senioren 2");
  });

  it("detecteert kader-afwijkingen", () => {
    const lookup = maakSpelerLookup([...Array.from({ length: 10 }, (_, i) => ({ id: `s${i}` }))]);

    const werkTeams = [maakWerkTeam("t1", "Senioren 1", ["s0", "s1", "s2", "s3", "s4"])];
    // What-if voegt een nieuw senioren-team toe
    const whatIfTeams = [
      maakWhatIfTeam({
        naam: "Senioren 1",
        bronTeamId: "t1",
        spelerIds: ["s0", "s1", "s2", "s3", "s4"],
      }),
      maakWhatIfTeam({
        naam: "Senioren 2",
        bronTeamId: null,
        spelerIds: ["s5", "s6", "s7", "s8", "s9"],
      }),
    ];

    // Blauwdruk zegt: 1 senioren-A team
    const teamAantalKaders = { SENIOREN_A: 1 };

    const result = valideerWhatIf(whatIfTeams, werkTeams, lookup, SEIZOEN, { teamAantalKaders });

    expect(result.heeftAfwijkingen).toBe(true);
    expect(result.kaderAfwijkingen.length).toBeGreaterThan(0);
    expect(result.kaderAfwijkingen[0].verschil).toBeGreaterThan(0);
  });

  it("geen afwijkingen als what-if binnen kaders past", () => {
    const lookup = maakSpelerLookup([...Array.from({ length: 10 }, (_, i) => ({ id: `s${i}` }))]);

    const werkTeams = [maakWerkTeam("t1", "Senioren 1", ["s0", "s1", "s2", "s3", "s4"])];
    const whatIfTeams = [
      maakWhatIfTeam({
        naam: "Senioren 1",
        bronTeamId: "t1",
        spelerIds: ["s0", "s1", "s2", "s3", "s4", "s5"],
      }),
    ];

    // Blauwdruk zegt: 1 senioren-A team — en we hebben er precies 1
    const teamAantalKaders = { SENIOREN_A: 1 };

    const result = valideerWhatIf(whatIfTeams, werkTeams, lookup, SEIZOEN, { teamAantalKaders });

    expect(result.heeftAfwijkingen).toBe(false);
    expect(result.kaderAfwijkingen).toHaveLength(0);
  });
});
