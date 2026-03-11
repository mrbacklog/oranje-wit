import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "@/test/mock-prisma";
import { getPerGeboortejaar, getGroeiFactoren, getPijplijn } from "./samenstelling";

describe("getPerGeboortejaar", () => {
  beforeEach(() => {
    mockPrisma.$queryRaw.mockReset();
  });

  it("retourneert lege data als er geen spelers zijn", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([]);

    const result = await getPerGeboortejaar("2025-2026");

    expect(result.meta.seizoen).toBe("2025-2026");
    expect(result.meta.datum).toBeNull();
    expect(result.data).toEqual([]);
  });

  it("mapt rijen met geboortejaar, geslacht en categorie", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      { geboortejaar: 2012, geslacht: "M", aantal: 8, a_categorie: "U15", a_jaars: "1e-jaars" },
      { geboortejaar: 2012, geslacht: "V", aantal: 6, a_categorie: "U15", a_jaars: "1e-jaars" },
      { geboortejaar: 2015, geslacht: "M", aantal: 10, a_categorie: "D-jeugd", a_jaars: null },
    ]);

    const result = await getPerGeboortejaar("2025-2026");

    expect(result.data).toHaveLength(3);
    expect(result.data[0]).toEqual({
      geboortejaar: 2012,
      geslacht: "M",
      aantal: 8,
      a_categorie: "U15",
      a_jaars: "1e-jaars",
    });
    expect(result.data[2].a_jaars).toBeNull();
  });

  it("zet lege a_categorie om naar null", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      { geboortejaar: null, geslacht: "M", aantal: 1, a_categorie: "", a_jaars: "" },
    ]);

    const result = await getPerGeboortejaar("2025-2026");

    expect(result.data[0].a_categorie).toBeNull();
    expect(result.data[0].a_jaars).toBeNull();
  });
});

describe("getGroeiFactoren", () => {
  beforeEach(() => {
    mockPrisma.$queryRaw.mockReset();
  });

  it("retourneert lege factoren als er geen data is", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([]);

    const result = await getGroeiFactoren();

    expect(result).toEqual({ M: {}, V: {} });
  });

  it("parset groei-factoren per geslacht en leeftijd", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      { leeftijd: 10, geslacht: "M", groei_factor: "0.950" },
      { leeftijd: 10, geslacht: "V", groei_factor: "0.920" },
      { leeftijd: 15, geslacht: "M", groei_factor: "0.800" },
    ]);

    const result = await getGroeiFactoren();

    expect(result.M[10]).toBe(0.95);
    expect(result.V[10]).toBe(0.92);
    expect(result.M[15]).toBe(0.8);
    expect(result.V[15]).toBeUndefined();
  });
});

describe("getPijplijn", () => {
  beforeEach(() => {
    mockPrisma.$queryRaw.mockReset();
  });

  it("bouwt pijplijn met lege data", async () => {
    // getGroeiFactoren
    mockPrisma.$queryRaw.mockResolvedValueOnce([]);
    // getPerGeboortejaar
    mockPrisma.$queryRaw.mockResolvedValueOnce([]);

    const result = await getPijplijn("2025-2026");

    expect(result.doelPerCategorie).toBe(50); // 12*2 + 13*2
    expect(result.perLeeftijd).toHaveLength(17); // leeftijd 6-22
    expect(result.perLeeftijd[0].leeftijd).toBe(6);
    expect(result.perLeeftijd[16].leeftijd).toBe(22);

    // Alle huidig-waarden moeten 0 zijn
    for (const rij of result.perLeeftijd) {
      expect(rij.huidig_m).toBe(0);
      expect(rij.huidig_v).toBe(0);
    }
  });

  it("berekent vulgraad correct met huidige aantallen", async () => {
    // getGroeiFactoren — geeft lege factoren
    mockPrisma.$queryRaw.mockResolvedValueOnce([]);
    // getPerGeboortejaar — 1 geboortejaar met spelers
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      { geboortejaar: 2012, geslacht: "M", aantal: 12, a_categorie: "U15", a_jaars: "1e-jaars" },
      { geboortejaar: 2012, geslacht: "V", aantal: 13, a_categorie: "U15", a_jaars: "1e-jaars" },
    ]);

    const result = await getPijplijn("2025-2026");

    // Leeftijd 13 (2025 - 2012 = 13)
    const rij13 = result.perLeeftijd.find((r) => r.leeftijd === 13);
    expect(rij13).toBeDefined();
    expect(rij13!.huidig_m).toBe(12);
    expect(rij13!.huidig_v).toBe(13);
    // Doel bij 13 is 12M + 13V, dus vulgraad moet 100% zijn
    expect(rij13!.vulgraad_m).toBe(100);
    expect(rij13!.vulgraad_v).toBe(100);

    // Huidig per categorie: U15 = leeftijd 13+14
    expect(result.huidig.U15.m).toBe(12);
    expect(result.huidig.U15.v).toBe(13);
    expect(result.huidig.U15.totaal).toBe(25);
  });
});
