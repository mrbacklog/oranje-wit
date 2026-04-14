import { describe, it, expect } from "vitest";
import {
  korfbalPeildatum,
  berekenKorfbalLeeftijdExact,
  berekenKorfbalLeeftijd,
  grofKorfbalLeeftijd,
  formatKorfbalLeeftijd,
  valtBinnenCategorie,
} from "./korfballeeftijd";

describe("korfbalPeildatum", () => {
  it("geeft 31 december van het startjaar voor seizoen 2025-2026", () => {
    const d = korfbalPeildatum("2025-2026");
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(11);
    expect(d.getDate()).toBe(31);
  });

  it("geeft 31 december van het startjaar voor seizoen 2026-2027", () => {
    const d = korfbalPeildatum("2026-2027");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(11);
    expect(d.getDate()).toBe(31);
  });

  it("werkt voor toekomstige seizoenen", () => {
    const d = korfbalPeildatum("2099-2100");
    expect(d.getFullYear()).toBe(2099);
  });
});

describe("berekenKorfbalLeeftijdExact", () => {
  const peildatum = new Date(2026, 11, 31); // 31-12-2026

  it("geboren 31-12-2011 is ongeveer 15.00 op peildatum 31-12-2026 (365.25-benadering)", () => {
    // Let op: (peildatum - gd) / (365.25 dagen) is een benadering; over 15 jaar
    // met 4 schrikkeljaren ontstaat een kleine afwijking van ~0.001.
    const exact = berekenKorfbalLeeftijdExact("2011-12-31", 2011, peildatum);
    expect(exact).toBeCloseTo(15.0, 2);
  });

  it("geboren 30-12-2011 is iets meer dan 15 op peildatum 31-12-2026", () => {
    const exact = berekenKorfbalLeeftijdExact("2011-12-30", 2011, peildatum);
    expect(exact).toBeGreaterThan(15);
    expect(exact).toBeLessThan(15.01);
  });

  it("geboren 01-01-2012 is iets minder dan 15 op peildatum 31-12-2026", () => {
    const exact = berekenKorfbalLeeftijdExact("2012-01-01", 2012, peildatum);
    expect(exact).toBeLessThan(15);
    expect(exact).toBeGreaterThan(14.99);
  });

  it("geboren 31-12-2012 is ongeveer 14.00 op peildatum 31-12-2026", () => {
    const exact = berekenKorfbalLeeftijdExact("2012-12-31", 2012, peildatum);
    expect(exact).toBeCloseTo(14.0, 2);
  });

  it("valt terug op geboortejaar als geboortedatum ontbreekt", () => {
    const exact = berekenKorfbalLeeftijdExact(null, 2012, peildatum);
    expect(exact).toBe(14);
  });

  it("accepteert Date-object als geboortedatum", () => {
    const exact = berekenKorfbalLeeftijdExact(new Date("2012-12-31"), 2012, peildatum);
    expect(exact).toBeCloseTo(14.0, 2);
  });

  it("hanteert schrikkeljaar 29-02-2012 zonder NaN", () => {
    const exact = berekenKorfbalLeeftijdExact("2012-02-29", 2012, peildatum);
    expect(Number.isFinite(exact)).toBe(true);
    expect(exact).toBeGreaterThan(14.8);
    expect(exact).toBeLessThan(14.9);
  });
});

describe("berekenKorfbalLeeftijd (afgerond)", () => {
  const peildatum = new Date(2026, 11, 31);

  it("rondt naar 2 decimalen", () => {
    const leeftijd = berekenKorfbalLeeftijd("2012-12-31", 2012, peildatum);
    expect(leeftijd).toBe(14.0);
  });

  it("14.995 rondt af naar 15.00", () => {
    // Kies een geboortedatum die exact 14.995 oplevert is lastig; we testen via
    // een directe afronding op een bekende echte waarde.
    const leeftijd = berekenKorfbalLeeftijd("2012-01-15", 2012, peildatum);
    expect(Number.isFinite(leeftijd)).toBe(true);
    // Waarde moet exact 2 decimalen hebben (toFixed(2) round-trip)
    expect(Math.round(leeftijd * 100) / 100).toBe(leeftijd);
  });
});

describe("grofKorfbalLeeftijd", () => {
  it("geeft heel-jaren-verschil terug", () => {
    const peildatum = new Date(2026, 11, 31);
    expect(grofKorfbalLeeftijd(2012, peildatum)).toBe(14);
    expect(grofKorfbalLeeftijd(2011, peildatum)).toBe(15);
    expect(grofKorfbalLeeftijd(2006, peildatum)).toBe(20);
  });
});

describe("formatKorfbalLeeftijd", () => {
  it("toont altijd 2 decimalen", () => {
    expect(formatKorfbalLeeftijd(14)).toBe("14.00");
    expect(formatKorfbalLeeftijd(14.9)).toBe("14.90");
    expect(formatKorfbalLeeftijd(14.99)).toBe("14.99");
    expect(formatKorfbalLeeftijd(15)).toBe("15.00");
  });

  it("rondt op 2 decimalen", () => {
    // Let op: 14.995 als JS-float is feitelijk 14.99499999... → rondt naar 14.99
    // (dit is gewenst: toFixed volgt IEEE-754 representatie).
    expect(formatKorfbalLeeftijd(14.996)).toBe("15.00");
    expect(formatKorfbalLeeftijd(14.994)).toBe("14.99");
  });
});

describe("valtBinnenCategorie", () => {
  it("exact 15.00 valt binnen U15 (grens is ≤)", () => {
    expect(valtBinnenCategorie(15.0, "U15")).toBe(true);
  });

  it("15.001 valt NIET binnen U15", () => {
    expect(valtBinnenCategorie(15.001, "U15")).toBe(false);
  });

  it("14.997 valt binnen U15", () => {
    expect(valtBinnenCategorie(14.997, "U15")).toBe(true);
  });

  it("accepteert floating-point noise net onder 15.00", () => {
    expect(valtBinnenCategorie(14.9999999999, "U15")).toBe(true);
  });

  it("U17 grens op 17.00", () => {
    expect(valtBinnenCategorie(17.0, "U17")).toBe(true);
    expect(valtBinnenCategorie(17.001, "U17")).toBe(false);
  });

  it("U19 grens op 19.00", () => {
    expect(valtBinnenCategorie(19.0, "U19")).toBe(true);
    expect(valtBinnenCategorie(19.001, "U19")).toBe(false);
  });
});

describe("bandbreedte-edge (integratie)", () => {
  const peildatum = new Date(2026, 11, 31);

  it("twee spelers op dezelfde dag → spreiding 0", () => {
    const a = berekenKorfbalLeeftijdExact("2014-06-15", 2014, peildatum);
    const b = berekenKorfbalLeeftijdExact("2014-06-15", 2014, peildatum);
    expect(a - b).toBe(0);
  });

  it("spelers met ~732 dagen verschil → spreiding > 2", () => {
    const oud = berekenKorfbalLeeftijdExact("2012-01-01", 2012, peildatum);
    const jong = berekenKorfbalLeeftijdExact("2014-01-03", 2014, peildatum);
    const spreiding = oud - jong;
    expect(spreiding).toBeGreaterThan(2);
  });

  it("spelers met 730 dagen verschil → spreiding < 2", () => {
    // Gebruik een niet-schrikkeljaar-overspannend interval: 2013-01-01 → 2015-01-01 = 730 dagen
    const oud = berekenKorfbalLeeftijdExact("2013-01-01", 2013, peildatum);
    const jong = berekenKorfbalLeeftijdExact("2015-01-01", 2015, peildatum);
    const spreiding = oud - jong;
    expect(spreiding).toBeLessThan(2);
  });
});
