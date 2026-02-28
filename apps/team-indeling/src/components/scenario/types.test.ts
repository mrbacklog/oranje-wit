import { describe, it, expect } from "vitest";
import { korfbalLeeftijd, kleurIndicatie, PEILJAAR } from "./types";

describe("korfbalLeeftijd", () => {
  it("berekent leeftijd op basis van geboortejaar als er geen geboortedatum is", () => {
    // PEILJAAR = 2026, dus 2026 - 2014 = 12
    expect(korfbalLeeftijd(null, 2014)).toBe(12);
    expect(korfbalLeeftijd(undefined, 2014)).toBe(12);
  });

  it("berekent leeftijd op basis van geboortejaar voor verschillende jaren", () => {
    expect(korfbalLeeftijd(null, 2020)).toBe(PEILJAAR - 2020);
    expect(korfbalLeeftijd(null, 2010)).toBe(PEILJAAR - 2010);
    expect(korfbalLeeftijd(null, 2000)).toBe(PEILJAAR - 2000);
  });

  it("berekent precieze leeftijd op basis van geboortedatum (Date object)", () => {
    // Geboren op 31 december 2014 → precies 12 op peildatum
    const resultaat = korfbalLeeftijd(new Date(2014, 11, 31), 2014);
    expect(resultaat).toBeCloseTo(12.0, 1);
  });

  it("berekent precieze leeftijd op basis van geboortedatum (string)", () => {
    // Geboren 1 juli 2014 → bijna 12.5 op 31-12-2026
    const resultaat = korfbalLeeftijd("2014-07-01", 2014);
    expect(resultaat).toBeGreaterThan(12);
    expect(resultaat).toBeLessThan(13);
  });

  it("geeft een hogere leeftijd voor geboortedatum eerder in het jaar", () => {
    const januariKind = korfbalLeeftijd("2014-01-15", 2014);
    const decemberKind = korfbalLeeftijd("2014-12-15", 2014);
    expect(januariKind).toBeGreaterThan(decemberKind);
  });

  it("geeft het resultaat afgerond op 2 decimalen bij geboortedatum", () => {
    const resultaat = korfbalLeeftijd("2014-06-15", 2014);
    // Controleer dat het afgerond is op 2 decimalen
    const decimalen = resultaat.toString().split(".")[1];
    expect(decimalen ? decimalen.length : 0).toBeLessThanOrEqual(2);
  });

  it("prefereert geboortedatum boven geboortejaar als beide beschikbaar", () => {
    // Met geboortedatum 1 juli krijg je een preciezere waarde dan een heel getal
    const resultaat = korfbalLeeftijd("2014-07-01", 2014);
    // Moet NIET exact 12 zijn (dat zou de geboortejaar-fallback zijn)
    expect(resultaat).not.toBe(12);
  });
});

describe("kleurIndicatie", () => {
  it("retourneert BLAUW voor leeftijd 5 t/m 8", () => {
    expect(kleurIndicatie(5)).toBe("BLAUW");
    expect(kleurIndicatie(7)).toBe("BLAUW");
    expect(kleurIndicatie(8)).toBe("BLAUW");
  });

  it("retourneert GROEN voor leeftijd 9 en 10", () => {
    expect(kleurIndicatie(9)).toBe("GROEN");
    expect(kleurIndicatie(10)).toBe("GROEN");
  });

  it("retourneert GEEL voor leeftijd 11 en 12", () => {
    expect(kleurIndicatie(11)).toBe("GEEL");
    expect(kleurIndicatie(12)).toBe("GEEL");
  });

  it("retourneert ORANJE voor leeftijd 13 en 14", () => {
    expect(kleurIndicatie(13)).toBe("ORANJE");
    expect(kleurIndicatie(14)).toBe("ORANJE");
  });

  it("retourneert ROOD voor leeftijd 15 t/m 18", () => {
    expect(kleurIndicatie(15)).toBe("ROOD");
    expect(kleurIndicatie(16)).toBe("ROOD");
    expect(kleurIndicatie(18)).toBe("ROOD");
  });

  it("retourneert null voor senioren (leeftijd > 18)", () => {
    expect(kleurIndicatie(19)).toBeNull();
    expect(kleurIndicatie(25)).toBeNull();
    expect(kleurIndicatie(40)).toBeNull();
  });

  it("retourneert BLAUW voor zeer jonge spelers (leeftijd <= 8)", () => {
    expect(kleurIndicatie(4)).toBe("BLAUW");
    expect(kleurIndicatie(1)).toBe("BLAUW");
  });

  it("test grenswaarden tussen kleuren", () => {
    // Grens BLAUW → GROEN
    expect(kleurIndicatie(8)).toBe("BLAUW");
    expect(kleurIndicatie(9)).toBe("GROEN");

    // Grens GROEN → GEEL
    expect(kleurIndicatie(10)).toBe("GROEN");
    expect(kleurIndicatie(11)).toBe("GEEL");

    // Grens GEEL → ORANJE
    expect(kleurIndicatie(12)).toBe("GEEL");
    expect(kleurIndicatie(13)).toBe("ORANJE");

    // Grens ORANJE → ROOD
    expect(kleurIndicatie(14)).toBe("ORANJE");
    expect(kleurIndicatie(15)).toBe("ROOD");

    // Grens ROOD → null (senioren)
    expect(kleurIndicatie(18)).toBe("ROOD");
    expect(kleurIndicatie(19)).toBeNull();
  });
});
