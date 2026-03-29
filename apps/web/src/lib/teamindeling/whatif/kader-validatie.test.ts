import { describe, it, expect } from "vitest";
import { valideerBlauwdrukKaders, type TeamAantalKaders } from "./kader-validatie";
import type { TeamData } from "../validatie/types";

// ============================================================
// Test helpers
// ============================================================

function maakTeam(overrides: Partial<TeamData>): TeamData {
  return {
    naam: overrides.naam ?? "Test Team",
    categorie: overrides.categorie ?? "SENIOREN",
    kleur: overrides.kleur ?? null,
    spelers: overrides.spelers ?? [
      {
        id: "s1",
        roepnaam: "Test",
        achternaam: "Speler",
        geboortejaar: 2000,
        geslacht: "M",
      },
    ],
  };
}

// ============================================================
// valideerBlauwdrukKaders
// ============================================================

describe("valideerBlauwdrukKaders", () => {
  it("geen afwijkingen als aantallen kloppen", () => {
    const teams: TeamData[] = [
      maakTeam({ naam: "Senioren 1", categorie: "SENIOREN" }),
      maakTeam({ naam: "Senioren 2", categorie: "SENIOREN" }),
    ];
    const kaders: TeamAantalKaders = { SENIOREN_A: 2 };

    const afwijkingen = valideerBlauwdrukKaders(teams, kaders);
    expect(afwijkingen).toHaveLength(0);
  });

  it("detecteert meer teams dan verwacht", () => {
    const teams: TeamData[] = [
      maakTeam({ naam: "Senioren 1", categorie: "SENIOREN" }),
      maakTeam({ naam: "Senioren 2", categorie: "SENIOREN" }),
      maakTeam({ naam: "Senioren 3", categorie: "SENIOREN" }),
    ];
    const kaders: TeamAantalKaders = { SENIOREN_A: 2 };

    const afwijkingen = valideerBlauwdrukKaders(teams, kaders);
    expect(afwijkingen).toHaveLength(1);
    expect(afwijkingen[0].categorie).toBe("SENIOREN_A");
    expect(afwijkingen[0].verwachtAantal).toBe(2);
    expect(afwijkingen[0].werkelijkAantal).toBe(3);
    expect(afwijkingen[0].verschil).toBe(1);
  });

  it("detecteert minder teams dan verwacht", () => {
    const teams: TeamData[] = [maakTeam({ naam: "Senioren 1", categorie: "SENIOREN" })];
    const kaders: TeamAantalKaders = { SENIOREN_A: 2 };

    const afwijkingen = valideerBlauwdrukKaders(teams, kaders);
    expect(afwijkingen).toHaveLength(1);
    expect(afwijkingen[0].verschil).toBe(-1);
  });

  it("werkt met meerdere categorieen", () => {
    const teams: TeamData[] = [
      maakTeam({ naam: "Senioren 1", categorie: "SENIOREN" }),
      maakTeam({ naam: "U15 1", categorie: "A_CATEGORIE" }),
      maakTeam({ naam: "Geel 1", categorie: "B_CATEGORIE", kleur: "GEEL" }),
      maakTeam({ naam: "Geel 2", categorie: "B_CATEGORIE", kleur: "GEEL" }),
    ];
    const kaders: TeamAantalKaders = {
      SENIOREN_A: 1,
      U15: 1,
      GEEL: 3, // verwacht 3, hebben er 2
    };

    const afwijkingen = valideerBlauwdrukKaders(teams, kaders);
    // Alleen GEEL wijkt af (2 i.p.v. 3)
    expect(afwijkingen).toHaveLength(1);
    expect(afwijkingen[0].categorie).toBe("GEEL");
    expect(afwijkingen[0].verschil).toBe(-1);
  });

  it("telt lege teams niet mee", () => {
    const teams: TeamData[] = [
      maakTeam({ naam: "Senioren 1", categorie: "SENIOREN" }),
      maakTeam({ naam: "Senioren 2", categorie: "SENIOREN", spelers: [] }),
    ];
    const kaders: TeamAantalKaders = { SENIOREN_A: 1 };

    const afwijkingen = valideerBlauwdrukKaders(teams, kaders);
    // Senioren 2 heeft geen spelers, telt niet mee -> 1 = 1, ok
    expect(afwijkingen).toHaveLength(0);
  });

  it("retourneert leeg bij lege kaders", () => {
    const teams: TeamData[] = [maakTeam({ naam: "Senioren 1", categorie: "SENIOREN" })];

    const afwijkingen = valideerBlauwdrukKaders(teams, {});
    expect(afwijkingen).toHaveLength(0);
  });

  it("rapporteert ontbrekende categorie als teams 0", () => {
    // Kaders zeggen 2 ORANJE teams, maar we hebben er 0
    const teams: TeamData[] = [maakTeam({ naam: "Senioren 1", categorie: "SENIOREN" })];
    const kaders: TeamAantalKaders = { ORANJE: 2 };

    const afwijkingen = valideerBlauwdrukKaders(teams, kaders);
    expect(afwijkingen).toHaveLength(1);
    expect(afwijkingen[0].werkelijkAantal).toBe(0);
    expect(afwijkingen[0].verschil).toBe(-2);
  });
});
