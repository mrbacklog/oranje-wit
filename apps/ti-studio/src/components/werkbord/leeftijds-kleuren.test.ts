import { describe, it, expect } from "vitest";
import { leeftijdsGradient, leeftijdsKleur } from "./leeftijds-kleuren";

describe("leeftijdsGradient", () => {
  it("geeft paars voor leeftijd 4", () => {
    expect(leeftijdsGradient(4)).toBe("linear-gradient(135deg, #6b21a8 0%, #9333ea 100%)");
  });

  it("geeft blauw voor leeftijd 7", () => {
    expect(leeftijdsGradient(7)).toBe("linear-gradient(135deg, #2563eb 0%, #0369a1 100%)");
  });

  it("geeft groen voor leeftijd 10", () => {
    expect(leeftijdsGradient(10)).toBe("linear-gradient(135deg, #16a34a 0%, #22c55e 100%)");
  });

  it("geeft rood voor leeftijd 16", () => {
    expect(leeftijdsGradient(16)).toBe("linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)");
  });

  it("geeft senior grijs voor leeftijd 19", () => {
    expect(leeftijdsGradient(19)).toBe("linear-gradient(135deg, #374151 0%, #1f2937 100%)");
  });

  it("geeft zelfde als floor voor decimale leeftijd 7.4", () => {
    expect(leeftijdsGradient(7.4)).toBe(leeftijdsGradient(7));
  });
});

describe("leeftijdsKleur", () => {
  it("geeft paars voor leeftijd 4", () => {
    expect(leeftijdsKleur(4)).toBe("#9333ea");
  });

  it("geeft blauw voor leeftijd 7", () => {
    expect(leeftijdsKleur(7)).toBe("#2563eb");
  });

  it("geeft grijs voor leeftijd 20", () => {
    expect(leeftijdsKleur(20)).toBe("#475569");
  });
});
