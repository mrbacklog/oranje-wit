import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "@/test/mock-prisma";
import {
  getCohortRetentieMatrix,
  getEersteSeizoenRetentie,
  getInstroomPerSeizoenMVLeeftijd,
  getUitstroomPerSeizoenMVLeeftijd,
  getWaterfallData,
  getWaterfallDataLopend,
  getNettoGroei,
} from "./retentie";

describe("getCohortRetentieMatrix", () => {
  beforeEach(() => {
    mockPrisma.$queryRaw.mockReset();
  });

  it("retourneert lege array als er geen data is", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([]);
    const result = await getCohortRetentieMatrix();
    expect(result).toEqual([]);
  });

  it("groepeert rijen per instroom-seizoen met retentie-percentages", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      { instroom_seizoen: "2020-2021", cohort_grootte: 20, jaren_na_instroom: 0, actief: 20 },
      { instroom_seizoen: "2020-2021", cohort_grootte: 20, jaren_na_instroom: 1, actief: 16 },
      { instroom_seizoen: "2020-2021", cohort_grootte: 20, jaren_na_instroom: 2, actief: 12 },
      { instroom_seizoen: "2021-2022", cohort_grootte: 15, jaren_na_instroom: 0, actief: 15 },
      { instroom_seizoen: "2021-2022", cohort_grootte: 15, jaren_na_instroom: 1, actief: 10 },
    ]);

    const result = await getCohortRetentieMatrix();

    expect(result).toHaveLength(2);

    // Eerste cohort
    expect(result[0].instroomSeizoen).toBe("2020-2021");
    expect(result[0].cohortGrootte).toBe(20);
    expect(result[0].retentie).toHaveLength(3);
    expect(result[0].retentie[0]).toEqual({ jarenNaInstroom: 0, actief: 20, percentage: 100 });
    expect(result[0].retentie[1]).toEqual({ jarenNaInstroom: 1, actief: 16, percentage: 80 });
    expect(result[0].retentie[2]).toEqual({ jarenNaInstroom: 2, actief: 12, percentage: 60 });

    // Tweede cohort
    expect(result[1].instroomSeizoen).toBe("2021-2022");
    expect(result[1].cohortGrootte).toBe(15);
    expect(result[1].retentie).toHaveLength(2);
  });

  it("handelt cohort_grootte 0 af zonder deling door nul", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      { instroom_seizoen: "2023-2024", cohort_grootte: 0, jaren_na_instroom: 0, actief: 0 },
    ]);

    const result = await getCohortRetentieMatrix();

    expect(result[0].retentie[0].percentage).toBe(0);
  });
});

describe("getEersteSeizoenRetentie", () => {
  beforeEach(() => {
    mockPrisma.$queryRaw.mockReset();
  });

  it("retourneert lege array als er geen data is", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([]);
    const result = await getEersteSeizoenRetentie();
    expect(result).toEqual([]);
  });

  it("berekent retentiepercentages correct met M/V split", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      {
        seizoen: "2023-2024",
        totaal_nieuw: 30,
        terug: 20,
        nieuw_m: 15,
        terug_m: 10,
        nieuw_v: 15,
        terug_v: 10,
      },
    ]);

    const result = await getEersteSeizoenRetentie();

    expect(result).toHaveLength(1);
    expect(result[0].instroomSeizoen).toBe("2023-2024");
    expect(result[0].totaalNieuw).toBe(30);
    expect(result[0].terugSeizoen2).toBe(20);
    expect(result[0].retentiePct).toBe(66.7);
    expect(result[0].retentiePctM).toBe(66.7);
    expect(result[0].retentiePctV).toBe(66.7);
  });

  it("retourneert null voor geslacht zonder nieuwe leden", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      {
        seizoen: "2023-2024",
        totaal_nieuw: 10,
        terug: 5,
        nieuw_m: 10,
        terug_m: 5,
        nieuw_v: 0,
        terug_v: 0,
      },
    ]);

    const result = await getEersteSeizoenRetentie();

    expect(result[0].retentiePctM).toBe(50);
    expect(result[0].retentiePctV).toBeNull();
  });
});

describe("getInstroomPerSeizoenMVLeeftijd", () => {
  beforeEach(() => {
    mockPrisma.$queryRaw.mockReset();
  });

  it("retourneert lege array als er geen data is", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([]);
    const result = await getInstroomPerSeizoenMVLeeftijd();
    expect(result).toEqual([]);
  });

  it("mapt rijen naar het juiste formaat met isLopend vlag", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      {
        seizoen: "2023-2024",
        m: 5,
        v: 8,
        totaal: 13,
        jeugd_m: 4,
        jeugd_v: 6,
        jeugd_totaal: 10,
        senioren_m: 1,
        senioren_v: 2,
        senioren_totaal: 3,
      },
    ]);

    const result = await getInstroomPerSeizoenMVLeeftijd();

    expect(result).toHaveLength(1);
    expect(result[0].seizoen).toBe("2023-2024");
    expect(result[0].M).toBe(5);
    expect(result[0].V).toBe(8);
    expect(result[0].totaal).toBe(13);
    expect(result[0].jeugdM).toBe(4);
    expect(result[0].jeugdV).toBe(6);
    expect(result[0].seniorenM).toBe(1);
    expect(typeof result[0].isLopend).toBe("boolean");
  });
});

describe("getUitstroomPerSeizoenMVLeeftijd", () => {
  beforeEach(() => {
    mockPrisma.$queryRaw.mockReset();
  });

  it("retourneert lege array als er geen data is", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([]);
    const result = await getUitstroomPerSeizoenMVLeeftijd();
    expect(result).toEqual([]);
  });

  it("mapt rijen correct", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      {
        seizoen: "2022-2023",
        m: 3,
        v: 4,
        totaal: 7,
        jeugd_m: 2,
        jeugd_v: 3,
        jeugd_totaal: 5,
        senioren_m: 1,
        senioren_v: 1,
        senioren_totaal: 2,
      },
    ]);

    const result = await getUitstroomPerSeizoenMVLeeftijd();

    expect(result).toHaveLength(1);
    expect(result[0].M).toBe(3);
    expect(result[0].V).toBe(4);
    expect(result[0].seniorenTotaal).toBe(2);
  });
});

describe("getWaterfallData", () => {
  beforeEach(() => {
    mockPrisma.$queryRaw.mockReset();
  });

  it("retourneert null als er geen seizoen is", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([]);
    const result = await getWaterfallData();
    expect(result).toBeNull();
  });

  it("berekent waterfall-getallen correct", async () => {
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([{ seizoen: "2024-2025" }]) // seizoenRow
      .mockResolvedValueOnce([
        { status: "behouden", aantal: 80 },
        { status: "nieuw", aantal: 15 },
        { status: "herinschrijver", aantal: 5 },
        { status: "uitgestroomd", aantal: 10 },
        { status: "niet_spelend_geworden", aantal: 3 },
      ]);

    const result = await getWaterfallData();

    expect(result).not.toBeNull();
    expect(result!.seizoen).toBe("2024-2025");
    expect(result!.behouden).toBe(80);
    expect(result!.instroomNieuw).toBe(15);
    expect(result!.instroomTerug).toBe(5);
    expect(result!.uitstroom).toBe(13); // 10 + 3
  });
});

describe("getWaterfallDataLopend", () => {
  beforeEach(() => {
    mockPrisma.$queryRaw.mockReset();
  });

  it("retourneert null als er geen data is voor het lopende seizoen", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([]);
    const result = await getWaterfallDataLopend();
    expect(result).toBeNull();
  });

  it("berekent waterfall-getallen voor lopend seizoen", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      { status: "behouden", aantal: 90 },
      { status: "nieuw", aantal: 20 },
    ]);

    const result = await getWaterfallDataLopend();

    expect(result).not.toBeNull();
    expect(result!.behouden).toBe(90);
    expect(result!.instroomNieuw).toBe(20);
    expect(result!.instroomTerug).toBe(0);
    expect(result!.uitstroom).toBe(0);
  });
});

describe("getNettoGroei", () => {
  beforeEach(() => {
    mockPrisma.$queryRaw.mockReset();
  });

  it("berekent netto groei correct", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([{ instroom: 25, uitstroom: 10 }]);

    const result = await getNettoGroei("2024-2025");

    expect(result.seizoen).toBe("2024-2025");
    expect(result.instroom).toBe(25);
    expect(result.uitstroom).toBe(10);
    expect(result.netto).toBe(15);
    expect(typeof result.isLopend).toBe("boolean");
  });

  it("retourneert nul-waarden als er geen data is", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([]);

    const result = await getNettoGroei("2020-2021");

    expect(result.instroom).toBe(0);
    expect(result.uitstroom).toBe(0);
    expect(result.netto).toBe(0);
  });
});
