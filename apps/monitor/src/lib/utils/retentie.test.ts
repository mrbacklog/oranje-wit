import { describe, it, expect } from "vitest";
import { detecteerKritiekeMomenten, detecteerPatronen, berekenWaterfall } from "./retentie";

describe("berekenWaterfall", () => {
  it("berekent correcte waterfall items", () => {
    const result = berekenWaterfall(150, 25, 3, 30);
    expect(result).toHaveLength(5);
    expect(result[0]).toEqual({ label: "Begin", waarde: 180, type: "start" });
    expect(result[1]).toEqual({ label: "Nieuw", waarde: 25, type: "instroom" });
    expect(result[2]).toEqual({ label: "Terug", waarde: 3, type: "instroom" });
    expect(result[3]).toEqual({ label: "Uitstroom", waarde: -30, type: "uitstroom" });
    expect(result[4]).toEqual({ label: "Eind", waarde: 178, type: "eind" });
  });

  it("werkt met nul uitstroom", () => {
    const result = berekenWaterfall(100, 10, 0, 0);
    expect(result[0].waarde).toBe(100); // begin
    expect(result[4].waarde).toBe(110); // eind
  });

  it("werkt met alleen uitstroom", () => {
    const result = berekenWaterfall(80, 0, 0, 20);
    expect(result[0].waarde).toBe(100); // begin = behouden + uitstroom
    expect(result[4].waarde).toBe(80); // eind
  });
});

describe("detecteerKritiekeMomenten", () => {
  it("detecteert daling groter dan 3pp", () => {
    const data = [
      { leeftijd: 11, retentie: 90 },
      { leeftijd: 12, retentie: 85 },
      { leeftijd: 13, retentie: 75 }, // -10pp daling
    ];
    const result = detecteerKritiekeMomenten(data);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].leeftijd).toBe(13);
    expect(result[0].daling).toBeCloseTo(-10, 0);
  });

  it("retourneert leeg bij onvoldoende data", () => {
    expect(detecteerKritiekeMomenten([])).toEqual([]);
    expect(detecteerKritiekeMomenten([{ leeftijd: 6, retentie: 90 }])).toEqual([]);
  });

  it("negeert kleine dalingen (<=3pp)", () => {
    const data = [
      { leeftijd: 10, retentie: 90 },
      { leeftijd: 11, retentie: 88 }, // -2pp, te klein
    ];
    expect(detecteerKritiekeMomenten(data)).toEqual([]);
  });

  it("detecteert M/V verschil signaal", () => {
    const data = [
      { leeftijd: 12, retentie: 90, retentie_m: 88, retentie_v: 92 },
      { leeftijd: 13, retentie: 75, retentie_m: 65, retentie_v: 85 }, // M 20pp lager
    ];
    const result = detecteerKritiekeMomenten(data);
    expect(result[0].signaal).toContain("Jongens");
  });

  it("detecteert meisjes signaal als V lager is", () => {
    const data = [
      { leeftijd: 14, retentie: 90, retentie_m: 88, retentie_v: 92 },
      { leeftijd: 15, retentie: 75, retentie_m: 85, retentie_v: 65 },
    ];
    const result = detecteerKritiekeMomenten(data);
    expect(result[0].signaal).toContain("Meisjes");
  });
});

describe("detecteerPatronen", () => {
  it("detecteert piekleeftijd", () => {
    const data = [
      { leeftijd: 5, M: 2, V: 3 },
      { leeftijd: 6, M: 8, V: 10 }, // piek
      { leeftijd: 7, M: 3, V: 4 },
    ];
    const patronen = detecteerPatronen(data, "instroom");
    expect(patronen[0]).toContain("6");
    expect(patronen[0]).toContain("Piek");
  });

  it("retourneert leeg bij lege data", () => {
    expect(detecteerPatronen([], "instroom")).toEqual([]);
  });

  it("werkt voor uitstroom type", () => {
    const data = [
      { leeftijd: 12, M: 5, V: 3 },
      { leeftijd: 13, M: 8, V: 7 }, // piek
      { leeftijd: 14, M: 2, V: 1 },
    ];
    const patronen = detecteerPatronen(data, "uitstroom");
    expect(patronen[0]).toContain("uitstroom");
    expect(patronen[0]).toContain("13");
  });
});
