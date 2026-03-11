import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "@/test/mock-prisma";
import {
  getInstroomPerLeeftijd,
  getUitstroomPerLeeftijd,
  getRetentiePerLeeftijd,
  getSeizoenVerloop,
  getInstroomPerLeeftijdRecent,
  getUitstroomPerLeeftijdRecent,
  getInstroomUitstroom,
  getInstroomPerSeizoenMV,
  getUitstroomPerSeizoenMV,
  getAankomstigeUitstroom,
  getIntraSeizoenFlow,
} from "./verloop";

describe("getInstroomPerLeeftijd", () => {
  beforeEach(() => {
    mockPrisma.$queryRaw.mockReset();
  });

  it("retourneert lege array als er geen data is", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([]);
    const result = await getInstroomPerLeeftijd();
    expect(result).toEqual([]);
  });

  it("mapt rijen naar het juiste formaat", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      { leeftijd: 6, m: 5, v: 8, totaal: 13 },
      { leeftijd: 10, m: 3, v: 4, totaal: 7 },
    ]);

    const result = await getInstroomPerLeeftijd();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ leeftijd: 6, M: 5, V: 8, totaal: 13 });
    expect(result[1]).toEqual({ leeftijd: 10, M: 3, V: 4, totaal: 7 });
  });
});

describe("getUitstroomPerLeeftijd", () => {
  beforeEach(() => {
    mockPrisma.$queryRaw.mockReset();
  });

  it("retourneert lege array als er geen data is", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([]);
    const result = await getUitstroomPerLeeftijd();
    expect(result).toEqual([]);
  });

  it("mapt rijen correct", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([{ leeftijd: 14, m: 2, v: 3, totaal: 5 }]);

    const result = await getUitstroomPerLeeftijd();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ leeftijd: 14, M: 2, V: 3, totaal: 5 });
  });
});

describe("getRetentiePerLeeftijd", () => {
  beforeEach(() => {
    mockPrisma.$queryRaw.mockReset();
  });

  it("retourneert lege array als er geen data is", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([]);
    const result = await getRetentiePerLeeftijd();
    expect(result).toEqual([]);
  });

  it("mapt retentie-rijen met null handling", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      {
        leeftijd: 10,
        aanwezig_totaal: 50,
        terug_totaal: 45,
        retentie_totaal: 0.9,
        aanwezig_m: 25,
        terug_m: 23,
        retentie_m: 0.92,
        aanwezig_v: 25,
        terug_v: 22,
        retentie_v: 0.88,
      },
      {
        leeftijd: 18,
        aanwezig_totaal: 10,
        terug_totaal: 5,
        retentie_totaal: 0.5,
        aanwezig_m: 5,
        terug_m: 3,
        retentie_m: 0.6,
        aanwezig_v: 0,
        terug_v: 0,
        retentie_v: null,
      },
    ]);

    const result = await getRetentiePerLeeftijd();

    expect(result).toHaveLength(2);
    expect(result[0].retentie_totaal).toBe(0.9);
    expect(result[0].retentie_M).toBe(0.92);
    expect(result[0].retentie_V).toBe(0.88);
    expect(result[1].retentie_V).toBeNull();
  });
});

describe("getSeizoenVerloop", () => {
  beforeEach(() => {
    mockPrisma.$queryRaw.mockReset();
  });

  it("retourneert leeg resultaat als er geen data is", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([]);

    const result = await getSeizoenVerloop("2024-2025");

    expect(result.seizoen).toBe("2024-2025");
    expect(result.instroom).toEqual([]);
    expect(result.uitstroom).toEqual([]);
    expect(result.behouden).toBe(0);
    expect(result.totaalVorig).toBe(0);
    expect(result.totaalNieuw).toBe(0);
  });

  it("splitst instroom, uitstroom en behouden correct", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      {
        rel_code: "A001",
        roepnaam: "Daan",
        achternaam: "Jong",
        tussenvoegsel: "de",
        geslacht: "M",
        geboortejaar: 2010,
        status: "behouden",
        team_vorig: "C1",
        team_nieuw: "B1",
      },
      {
        rel_code: "A002",
        roepnaam: "Emma",
        achternaam: "Jansen",
        tussenvoegsel: null,
        geslacht: "V",
        geboortejaar: 2012,
        status: "nieuw",
        team_vorig: null,
        team_nieuw: "D1",
      },
      {
        rel_code: "A003",
        roepnaam: "Tim",
        achternaam: "Bakker",
        tussenvoegsel: null,
        geslacht: "M",
        geboortejaar: 2009,
        status: "uitgestroomd",
        team_vorig: "B1",
        team_nieuw: null,
      },
    ]);

    const result = await getSeizoenVerloop("2024-2025");

    expect(result.instroom).toHaveLength(1);
    expect(result.instroom[0].relCode).toBe("A002");
    expect(result.uitstroom).toHaveLength(1);
    expect(result.uitstroom[0].relCode).toBe("A003");
    expect(result.behouden).toBe(1);
    expect(result.totaalVorig).toBe(2); // behouden + uitstroom
    expect(result.totaalNieuw).toBe(2); // behouden + instroom
  });
});

describe("getInstroomPerLeeftijdRecent", () => {
  beforeEach(() => {
    mockPrisma.$queryRaw.mockReset();
  });

  it("retourneert lege array als er geen data is", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([]);
    const result = await getInstroomPerLeeftijdRecent();
    expect(result).toEqual([]);
  });

  it("converteert string-waarden naar numbers", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      { leeftijd: 8, m: "2.4", v: "3.2", totaal: "5.6" },
    ]);

    const result = await getInstroomPerLeeftijdRecent();

    expect(result[0].M).toBe(2.4);
    expect(result[0].V).toBe(3.2);
    expect(result[0].totaal).toBe(5.6);
  });
});

describe("getUitstroomPerLeeftijdRecent", () => {
  beforeEach(() => {
    mockPrisma.$queryRaw.mockReset();
  });

  it("converteert string-waarden naar numbers", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      { leeftijd: 15, m: "1.0", v: "1.8", totaal: "2.8" },
    ]);

    const result = await getUitstroomPerLeeftijdRecent();

    expect(result[0].M).toBe(1);
    expect(result[0].V).toBe(1.8);
  });
});

describe("getInstroomUitstroom", () => {
  beforeEach(() => {
    mockPrisma.$queryRaw.mockReset();
  });

  it("combineert instroom, uitstroom en retentie", async () => {
    // getInstroomPerLeeftijdRecent
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      { leeftijd: 6, m: "3.0", v: "4.0", totaal: "7.0" },
    ]);
    // getUitstroomPerLeeftijdRecent
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      { leeftijd: 14, m: "1.0", v: "2.0", totaal: "3.0" },
    ]);
    // getRetentiePerLeeftijd
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      {
        leeftijd: 10,
        aanwezig_totaal: 40,
        terug_totaal: 36,
        retentie_totaal: 0.9,
        aanwezig_m: 20,
        terug_m: 18,
        retentie_m: 0.9,
        aanwezig_v: 20,
        terug_v: 18,
        retentie_v: 0.9,
      },
    ]);

    const result = await getInstroomUitstroom();

    expect(result.instroom_per_leeftijd).toHaveLength(1);
    expect(result.uitstroom_per_leeftijd).toHaveLength(1);
    expect(result.retentie_alle_seizoenen).toHaveLength(1);
  });
});

describe("getInstroomPerSeizoenMV", () => {
  beforeEach(() => {
    mockPrisma.$queryRaw.mockReset();
  });

  it("retourneert lege array als er geen data is", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([]);
    const result = await getInstroomPerSeizoenMV();
    expect(result).toEqual([]);
  });

  it("mapt seizoen-instroom met M/V split", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      { seizoen: "2023-2024", m: 10, v: 12, totaal: 22 },
      { seizoen: "2024-2025", m: 8, v: 9, totaal: 17 },
    ]);

    const result = await getInstroomPerSeizoenMV();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ seizoen: "2023-2024", M: 10, V: 12, totaal: 22 });
  });
});

describe("getUitstroomPerSeizoenMV", () => {
  beforeEach(() => {
    mockPrisma.$queryRaw.mockReset();
  });

  it("mapt seizoen-uitstroom met M/V split", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([{ seizoen: "2023-2024", m: 5, v: 7, totaal: 12 }]);

    const result = await getUitstroomPerSeizoenMV();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ seizoen: "2023-2024", M: 5, V: 7, totaal: 12 });
  });
});

describe("getAankomstigeUitstroom", () => {
  beforeEach(() => {
    mockPrisma.$queryRaw.mockReset();
  });

  it("retourneert lege array als er niemand een afmelddatum heeft", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([]);
    const result = await getAankomstigeUitstroom();
    expect(result).toEqual([]);
  });

  it("mapt rijen correct met afmelddatum", async () => {
    const afmelddatum = new Date("2026-06-30");
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      {
        rel_code: "XY123",
        roepnaam: "Lisa",
        achternaam: "Smit",
        tussenvoegsel: null,
        geslacht: "V",
        geboortejaar: 2008,
        afmelddatum,
        team: "A1",
      },
    ]);

    const result = await getAankomstigeUitstroom();

    expect(result).toHaveLength(1);
    expect(result[0].relCode).toBe("XY123");
    expect(result[0].afmelddatum).toEqual(afmelddatum);
    expect(result[0].team).toBe("A1");
  });

  it("handelt null geboortejaar correct af", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      {
        rel_code: "AB456",
        roepnaam: "Piet",
        achternaam: "Groot",
        tussenvoegsel: "de",
        geslacht: "M",
        geboortejaar: null,
        afmelddatum: new Date("2026-08-01"),
        team: null,
      },
    ]);

    const result = await getAankomstigeUitstroom();

    expect(result[0].geboortejaar).toBeNull();
    expect(result[0].team).toBeNull();
  });
});

describe("getIntraSeizoenFlow", () => {
  beforeEach(() => {
    mockPrisma.$queryRaw.mockReset();
  });

  it("retourneert standaardwaarden als er geen data is", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([]);

    const result = await getIntraSeizoenFlow("2024-2025");

    expect(result.seizoen).toBe("2024-2025");
    expect(result.najaarTotaal).toBe(0);
    expect(result.zaalTotaal).toBeNull();
    expect(result.voorjaarTotaal).toBeNull();
  });

  it("mapt alle tellingen correct", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      {
        najaar: 120,
        zaal: 110,
        voorjaar: 105,
        stopte_voor_zaal: 8,
        stopte_voor_voorjaar: 12,
      },
    ]);

    const result = await getIntraSeizoenFlow("2024-2025");

    expect(result.najaarTotaal).toBe(120);
    expect(result.zaalTotaal).toBe(110);
    expect(result.voorjaarTotaal).toBe(105);
    expect(result.stopteVoorZaal).toBe(8);
    expect(result.stopteVoorVoorjaar).toBe(12);
  });

  it("handelt null zaal/voorjaar correct af", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      {
        najaar: 80,
        zaal: null,
        voorjaar: null,
        stopte_voor_zaal: null,
        stopte_voor_voorjaar: null,
      },
    ]);

    const result = await getIntraSeizoenFlow("2024-2025");

    expect(result.zaalTotaal).toBeNull();
    expect(result.voorjaarTotaal).toBeNull();
    expect(result.stopteVoorZaal).toBeNull();
    expect(result.stopteVoorVoorjaar).toBeNull();
  });
});
