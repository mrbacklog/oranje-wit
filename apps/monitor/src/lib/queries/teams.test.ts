import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "@/test/mock-prisma";
import { getTeamsRegister } from "./teams";

describe("getTeamsRegister", () => {
  beforeEach(() => {
    mockPrisma.$queryRaw.mockReset();
  });

  it("groepeert team-rows per ow_code met periodes", async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      {
        id: 1,
        ow_code: "OW-A1",
        categorie: "A-jeugd",
        kleur: "oranje",
        leeftijdsgroep: "15-17",
        spelvorm: "8-tal",
        periode: "veld_najaar",
        j_nummer: "J001",
        pool: "A",
        sterkte: 85,
        gem_leeftijd: "16.2",
        aantal_spelers: 12,
      },
      {
        id: 1,
        ow_code: "OW-A1",
        categorie: "A-jeugd",
        kleur: "oranje",
        leeftijdsgroep: "15-17",
        spelvorm: "8-tal",
        periode: "zaal_deel1",
        j_nummer: "J001",
        pool: "A",
        sterkte: 82,
        gem_leeftijd: "16.2",
        aantal_spelers: 11,
      },
      {
        id: 2,
        ow_code: "OW-B1",
        categorie: "B-jeugd",
        kleur: "wit",
        leeftijdsgroep: "13-15",
        spelvorm: "8-tal",
        periode: "veld_najaar",
        j_nummer: "J010",
        pool: "B",
        sterkte: 70,
        gem_leeftijd: "14.1",
        aantal_spelers: 10,
      },
    ]);

    const result = await getTeamsRegister("2024-2025");

    expect(result.seizoen).toBe("2024-2025");
    expect(result.teams).toHaveLength(2);

    const a1 = result.teams.find((t) => t.ow_code === "OW-A1");
    expect(a1).toBeDefined();
    expect(a1!.categorie).toBe("A-jeugd");
    expect(a1!.kleur).toBe("oranje");
    expect(a1!.periodes.veld_najaar).toEqual({
      j_nummer: "J001",
      pool: "A",
      sterkte: 85,
      gem_leeftijd: 16.2,
      aantal_spelers: 12,
    });
    expect(a1!.periodes.zaal_deel1).toEqual({
      j_nummer: "J001",
      pool: "A",
      sterkte: 82,
      gem_leeftijd: 16.2,
      aantal_spelers: 11,
    });
    expect(a1!.periodes.zaal_deel2).toBeNull();
    expect(a1!.periodes.veld_voorjaar).toBeNull();

    const b1 = result.teams.find((t) => t.ow_code === "OW-B1");
    expect(b1!.periodes.veld_najaar!.sterkte).toBe(70);
  });

  it("handelt teams zonder periodes af", async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      {
        id: 1,
        ow_code: "OW-C1",
        categorie: "C-jeugd",
        kleur: null,
        leeftijdsgroep: "11-13",
        spelvorm: "4-tal",
        periode: null,
        j_nummer: null,
        pool: null,
        sterkte: null,
        gem_leeftijd: null,
        aantal_spelers: null,
      },
    ]);

    const result = await getTeamsRegister("2024-2025");

    expect(result.teams).toHaveLength(1);
    expect(result.teams[0].periodes).toEqual({
      veld_najaar: null,
      zaal_deel1: null,
      zaal_deel2: null,
      veld_voorjaar: null,
    });
  });

  it("converteert gem_leeftijd string naar number", async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      {
        id: 1,
        ow_code: "OW-S1",
        categorie: "Senioren",
        kleur: "oranje",
        leeftijdsgroep: null,
        spelvorm: "8-tal",
        periode: "veld_najaar",
        j_nummer: null,
        pool: "Hoofdklasse",
        sterkte: 95,
        gem_leeftijd: "25.7",
        aantal_spelers: 14,
      },
    ]);

    const result = await getTeamsRegister("2024-2025");
    expect(result.teams[0].periodes.veld_najaar!.gem_leeftijd).toBe(25.7);
  });

  it("geeft lege teams array bij geen data", async () => {
    mockPrisma.$queryRaw.mockResolvedValue([]);

    const result = await getTeamsRegister("2024-2025");
    expect(result.seizoen).toBe("2024-2025");
    expect(result.teams).toEqual([]);
  });
});
