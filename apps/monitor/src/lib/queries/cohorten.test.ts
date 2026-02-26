import { describe, it, expect } from "vitest";
import {
  groepeerCohortRows,
  berekenSeizoenTotalen,
  aggregeerLeeftijdsgroepen,
  instroomBucket,
  groepeerInstroom,
  type CohortRow,
  type SeizoenTotaalRow,
  type LeeftijdRow,
  type InstroomRow,
} from "./cohorten";

// ---------------------------------------------------------------------------
// groepeerCohortRows
// ---------------------------------------------------------------------------

describe("groepeerCohortRows", () => {
  it("groepeert rows per (geboortejaar, geslacht)", () => {
    const rows: CohortRow[] = [
      {
        geboortejaar: 2010,
        geslacht: "M",
        seizoen: "2023-2024",
        leeftijd: 13,
        band: "jeugd",
        actief: 5,
        behouden: 4,
        nieuw: 1,
        herinschrijver: 0,
        uitgestroomd: 1,
        retentie_pct: "80.0",
      },
      {
        geboortejaar: 2010,
        geslacht: "M",
        seizoen: "2024-2025",
        leeftijd: 14,
        band: "jeugd",
        actief: 6,
        behouden: 5,
        nieuw: 1,
        herinschrijver: 0,
        uitgestroomd: 0,
        retentie_pct: "100.0",
      },
      {
        geboortejaar: 2010,
        geslacht: "V",
        seizoen: "2023-2024",
        leeftijd: 13,
        band: "jeugd",
        actief: 3,
        behouden: 2,
        nieuw: 1,
        herinschrijver: 0,
        uitgestroomd: 1,
        retentie_pct: "66.7",
      },
    ];

    const result = groepeerCohortRows(rows);

    expect(result).toHaveLength(2);

    const m2010 = result.find(
      (c) => c.geboortejaar === 2010 && c.geslacht === "M"
    );
    expect(m2010).toBeDefined();
    expect(Object.keys(m2010!.seizoenen)).toEqual(["2023-2024", "2024-2025"]);
    expect(m2010!.seizoenen["2023-2024"].retentie_pct).toBe(80.0);
    expect(m2010!.seizoenen["2024-2025"].actief).toBe(6);

    const v2010 = result.find(
      (c) => c.geboortejaar === 2010 && c.geslacht === "V"
    );
    expect(v2010).toBeDefined();
    expect(Object.keys(v2010!.seizoenen)).toEqual(["2023-2024"]);
  });

  it("geeft lege array bij geen input", () => {
    expect(groepeerCohortRows([])).toEqual([]);
  });

  it("parst retentie_pct null correct", () => {
    const rows: CohortRow[] = [
      {
        geboortejaar: 2015,
        geslacht: "M",
        seizoen: "2023-2024",
        leeftijd: 8,
        band: null,
        actief: 2,
        behouden: 0,
        nieuw: 2,
        herinschrijver: 0,
        uitgestroomd: 0,
        retentie_pct: null,
      },
    ];

    const result = groepeerCohortRows(rows);
    expect(result[0].seizoenen["2023-2024"].retentie_pct).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// berekenSeizoenTotalen
// ---------------------------------------------------------------------------

describe("berekenSeizoenTotalen", () => {
  it("berekent retentie en groei voor opeenvolgende seizoenen", () => {
    const rows: SeizoenTotaalRow[] = [
      {
        seizoen: "2022-2023",
        totaal: 100,
        behouden: 0,
        nieuw: 100,
        herinschrijver: 0,
        uitgestroomd: 0,
      },
      {
        seizoen: "2023-2024",
        totaal: 110,
        behouden: 90,
        nieuw: 15,
        herinschrijver: 5,
        uitgestroomd: 10,
      },
    ];

    const result = berekenSeizoenTotalen(rows);

    // Eerste seizoen: geen vorig
    expect(result[0].retentie_pct).toBeNull();
    expect(result[0].netto_groei).toBeNull();
    expect(result[0].netto_groei_pct).toBeNull();
    expect(result[0].totaal_vorig).toBeNull();

    // Tweede seizoen: retentie = 90/100 = 90%, groei = +10 = +10%
    expect(result[1].totaal_vorig).toBe(100);
    expect(result[1].retentie_pct).toBe(90.0);
    expect(result[1].netto_groei).toBe(10);
    expect(result[1].netto_groei_pct).toBe(10.0);
  });

  it("handelt vorig = 0 correct af (geen deling door 0)", () => {
    const rows: SeizoenTotaalRow[] = [
      {
        seizoen: "2022-2023",
        totaal: 0,
        behouden: 0,
        nieuw: 0,
        herinschrijver: 0,
        uitgestroomd: 0,
      },
      {
        seizoen: "2023-2024",
        totaal: 5,
        behouden: 0,
        nieuw: 5,
        herinschrijver: 0,
        uitgestroomd: 0,
      },
    ];

    const result = berekenSeizoenTotalen(rows);
    expect(result[1].retentie_pct).toBeNull();
    expect(result[1].netto_groei_pct).toBeNull();
    expect(result[1].netto_groei).toBe(5);
  });

  it("berekent negatieve groei correct", () => {
    const rows: SeizoenTotaalRow[] = [
      {
        seizoen: "2022-2023",
        totaal: 100,
        behouden: 0,
        nieuw: 100,
        herinschrijver: 0,
        uitgestroomd: 0,
      },
      {
        seizoen: "2023-2024",
        totaal: 80,
        behouden: 70,
        nieuw: 5,
        herinschrijver: 5,
        uitgestroomd: 30,
      },
    ];

    const result = berekenSeizoenTotalen(rows);
    expect(result[1].netto_groei).toBe(-20);
    expect(result[1].netto_groei_pct).toBe(-20.0);
    expect(result[1].retentie_pct).toBe(70.0);
  });

  it("geeft lege array bij geen input", () => {
    expect(berekenSeizoenTotalen([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// aggregeerLeeftijdsgroepen
// ---------------------------------------------------------------------------

describe("aggregeerLeeftijdsgroepen", () => {
  it("groepeert leeftijden in 6-12, 13-18, 19+", () => {
    const rows: LeeftijdRow[] = [
      {
        seizoen: "2023-2024",
        leeftijd: 8,
        behouden: 5,
        actief: 6,
        instroom: 2,
        uitstroom: 1,
      },
      {
        seizoen: "2023-2024",
        leeftijd: 11,
        behouden: 3,
        actief: 4,
        instroom: 1,
        uitstroom: 2,
      },
      {
        seizoen: "2023-2024",
        leeftijd: 15,
        behouden: 10,
        actief: 12,
        instroom: 3,
        uitstroom: 2,
      },
      {
        seizoen: "2023-2024",
        leeftijd: 25,
        behouden: 8,
        actief: 9,
        instroom: 1,
        uitstroom: 3,
      },
    ];

    const result = aggregeerLeeftijdsgroepen(rows);

    expect(result).toHaveLength(3);
    expect(result[0].groep).toBe("6-12");
    expect(result[1].groep).toBe("13-18");
    expect(result[2].groep).toBe("19+");

    // 6-12: behouden=8, uitstroom=3 → vorigSeizoen=11 → retentie = 8/11*100 = 72.7%
    const groep612 = result[0].per_seizoen["2023-2024"];
    expect(groep612.instroom).toBe(3);
    expect(groep612.uitstroom).toBe(3);
    expect(groep612.retentie_pct).toBeCloseTo(72.7, 1);

    // 13-18: behouden=10, uitstroom=2 → vorigSeizoen=12 → retentie = 10/12*100 = 83.3%
    const groep1318 = result[1].per_seizoen["2023-2024"];
    expect(groep1318.retentie_pct).toBeCloseTo(83.3, 1);

    // 19+: behouden=8, uitstroom=3 → vorigSeizoen=11 → retentie = 8/11*100 = 72.7%
    const groep19 = result[2].per_seizoen["2023-2024"];
    expect(groep19.retentie_pct).toBeCloseTo(72.7, 1);
  });

  it("retourneert null retentie als vorigSeizoen=0", () => {
    const rows: LeeftijdRow[] = [
      {
        seizoen: "2023-2024",
        leeftijd: 10,
        behouden: 0,
        actief: 3,
        instroom: 3,
        uitstroom: 0,
      },
    ];

    const result = aggregeerLeeftijdsgroepen(rows);
    expect(result[0].per_seizoen["2023-2024"].retentie_pct).toBeNull();
  });

  it("geeft lege per_seizoen bij geen matching rows", () => {
    const result = aggregeerLeeftijdsgroepen([]);
    expect(result).toHaveLength(3);
    expect(Object.keys(result[0].per_seizoen)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// instroomBucket
// ---------------------------------------------------------------------------

describe("instroomBucket", () => {
  it('geeft "<5" voor leeftijd < 5', () => {
    expect(instroomBucket("2023-2024", 2020)).toBe("<5");
    expect(instroomBucket("2023-2024", 2019)).toBe("<5");
  });

  it('geeft "15+" voor leeftijd >= 15', () => {
    expect(instroomBucket("2023-2024", 2008)).toBe("15+");
    expect(instroomBucket("2023-2024", 2000)).toBe("15+");
  });

  it("geeft exacte leeftijd als string voor 5-14", () => {
    expect(instroomBucket("2023-2024", 2018)).toBe("5");
    expect(instroomBucket("2023-2024", 2013)).toBe("10");
    expect(instroomBucket("2023-2024", 2009)).toBe("14");
  });
});

// ---------------------------------------------------------------------------
// groepeerInstroom
// ---------------------------------------------------------------------------

describe("groepeerInstroom", () => {
  it("groepeert instroom per seizoen met buckets", () => {
    const rows: InstroomRow[] = [
      { seizoen: "2023-2024", geboortejaar: 2017, instroom: 3 },
      { seizoen: "2023-2024", geboortejaar: 2015, instroom: 2 },
      { seizoen: "2024-2025", geboortejaar: 2020, instroom: 4 },
    ];

    const result = groepeerInstroom(rows);

    expect(result).toHaveLength(2);
    // Gesorteerd op seizoen
    expect(result[0].seizoen).toBe("2023-2024");
    expect(result[1].seizoen).toBe("2024-2025");

    // 2023-2024: geb 2017 → leeftijd 6, geb 2015 → leeftijd 8
    expect(result[0].totaal_instroom).toBe(5);
    expect(result[0].verdeling["6"]).toBe(3);
    expect(result[0].verdeling["8"]).toBe(2);

    // 2024-2025: geb 2020 → leeftijd 4 → "<5"
    expect(result[1].totaal_instroom).toBe(4);
    expect(result[1].verdeling["<5"]).toBe(4);
  });

  it("combineert instroom in dezelfde bucket", () => {
    const rows: InstroomRow[] = [
      { seizoen: "2023-2024", geboortejaar: 2017, instroom: 2 },
      { seizoen: "2023-2024", geboortejaar: 2017, instroom: 3 },
    ];

    const result = groepeerInstroom(rows);
    expect(result[0].verdeling["6"]).toBe(5);
    expect(result[0].totaal_instroom).toBe(5);
  });

  it("geeft lege array bij geen input", () => {
    expect(groepeerInstroom([])).toEqual([]);
  });
});
