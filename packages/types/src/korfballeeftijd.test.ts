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

describe("berekenKorfbalLeeftijdExact — kalenderjaar-aware", () => {
  const peildatum = new Date(2026, 11, 31); // 31-12-2026

  it("geboren 31-12-2011 is EXACT 15.00 op peildatum 31-12-2026", () => {
    // Precieze verjaardag op de peildatum → geen drift.
    const exact = berekenKorfbalLeeftijdExact("2011-12-31", 2011, peildatum);
    expect(exact).toBe(15);
  });

  it("geboren 30-12-2011 is 15 + 1/365.25 op peildatum 31-12-2026", () => {
    const exact = berekenKorfbalLeeftijdExact("2011-12-30", 2011, peildatum);
    expect(exact).toBe(15 + 1 / 365.25);
  });

  it("geboren 01-01-2012 is 14 + 364/365.25 op peildatum 31-12-2026", () => {
    const exact = berekenKorfbalLeeftijdExact("2012-01-01", 2012, peildatum);
    expect(exact).toBe(14 + 364 / 365.25);
  });

  it("geboren 31-12-2012 is EXACT 14.00 op peildatum 31-12-2026", () => {
    const exact = berekenKorfbalLeeftijdExact("2012-12-31", 2012, peildatum);
    expect(exact).toBe(14);
  });

  it("geboren 15-06-2014 is 12 + dagen-sinds-15-juni-2026 / 365.25", () => {
    // 15 juni 2026 → 31 december 2026 = 199 dagen
    // (juni heeft 30 dagen: 30-15=15, juli 31, aug 31, sep 30, okt 31, nov 30, dec 31 = 15+31+31+30+31+30+31 = 199)
    const exact = berekenKorfbalLeeftijdExact("2014-06-15", 2014, peildatum);
    expect(exact).toBe(12 + 199 / 365.25);
  });

  it("valt terug op geboortejaar als geboortedatum ontbreekt", () => {
    const exact = berekenKorfbalLeeftijdExact(null, 2012, peildatum);
    expect(exact).toBe(14);
  });

  it("accepteert Date-object als geboortedatum", () => {
    const exact = berekenKorfbalLeeftijdExact(new Date("2012-12-31"), 2012, peildatum);
    expect(exact).toBe(14);
  });

  it("hanteert schrikkeljaar 29-02-2012 zonder NaN", () => {
    const exact = berekenKorfbalLeeftijdExact("2012-02-29", 2012, peildatum);
    expect(Number.isFinite(exact)).toBe(true);
    // Van 29-02-2012 → 31-12-2026: kalenderjaar-verschil 14 (verjaardag 29-02-2026 bestaat niet,
    // dus de verjaardag wordt beschouwd als gepasseerd op 1 maart). Op 31-12-2026:
    // kalenderjaar-verschil = 14, verjaardag is gepasseerd (maand 12 > maand 2).
    // Laatste "verjaardag" = 29-02-2026 (niet-bestaand → Date.UTC normaliseert naar 01-03-2026).
    // Dagen van 01-03-2026 tot 31-12-2026 = 305.
    expect(exact).toBe(14 + 305 / 365.25);
  });
});

describe("berekenKorfbalLeeftijd (afgerond)", () => {
  const peildatum = new Date(2026, 11, 31);

  it("rondt naar 2 decimalen", () => {
    const leeftijd = berekenKorfbalLeeftijd("2012-12-31", 2012, peildatum);
    expect(leeftijd).toBe(14.0);
  });

  it("geboren 31-12-2011 weergeeft als 15.00", () => {
    const leeftijd = berekenKorfbalLeeftijd("2011-12-31", 2011, peildatum);
    expect(leeftijd).toBe(15.0);
  });

  it("geboren 01-01-2012 weergeeft als 15.00 (14.9966 afgerond)", () => {
    const leeftijd = berekenKorfbalLeeftijd("2012-01-01", 2012, peildatum);
    expect(leeftijd).toBe(15.0);
  });

  it("produceert altijd een 2-decimalen waarde (round-trip stabiel)", () => {
    const leeftijd = berekenKorfbalLeeftijd("2012-01-15", 2012, peildatum);
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

describe("valtBinnenCategorie — strikt kleiner dan", () => {
  it("exact 15.00 valt NIET meer in U15 (strikt <)", () => {
    expect(valtBinnenCategorie(15.0, "U15")).toBe(false);
  });

  it("14.9999 valt wel in U15", () => {
    expect(valtBinnenCategorie(14.9999, "U15")).toBe(true);
  });

  it("15.001 valt NIET in U15", () => {
    expect(valtBinnenCategorie(15.001, "U15")).toBe(false);
  });

  it("14.997 valt in U15", () => {
    expect(valtBinnenCategorie(14.997, "U15")).toBe(true);
  });

  it("U17 grens op 17.00 strikt", () => {
    expect(valtBinnenCategorie(17.0, "U17")).toBe(false);
    expect(valtBinnenCategorie(16.9999, "U17")).toBe(true);
    expect(valtBinnenCategorie(17.001, "U17")).toBe(false);
  });

  it("U19 grens op 19.00 strikt", () => {
    expect(valtBinnenCategorie(19.0, "U19")).toBe(false);
    expect(valtBinnenCategorie(18.9999, "U19")).toBe(true);
    expect(valtBinnenCategorie(19.001, "U19")).toBe(false);
  });
});

describe("integratie — speelgerechtigdheid op exacte verjaardagen", () => {
  const peildatum = new Date(2026, 11, 31);

  it("kind dat op peildatum exact 15 wordt valt uit U15", () => {
    const exact = berekenKorfbalLeeftijdExact("2011-12-31", 2011, peildatum);
    expect(valtBinnenCategorie(exact, "U15")).toBe(false);
  });

  it("kind geboren 1 dag later (01-01-2012) valt nog wel in U15", () => {
    const exact = berekenKorfbalLeeftijdExact("2012-01-01", 2012, peildatum);
    expect(valtBinnenCategorie(exact, "U15")).toBe(true);
  });

  it("kind dat op peildatum exact 14 wordt valt ruim in U15", () => {
    const exact = berekenKorfbalLeeftijdExact("2012-12-31", 2012, peildatum);
    expect(valtBinnenCategorie(exact, "U15")).toBe(true);
    expect(exact).toBe(14);
  });
});

describe("bandbreedte-edge (integratie)", () => {
  const peildatum = new Date(2026, 11, 31);

  it("twee spelers op dezelfde dag → spreiding 0", () => {
    const a = berekenKorfbalLeeftijdExact("2014-06-15", 2014, peildatum);
    const b = berekenKorfbalLeeftijdExact("2014-06-15", 2014, peildatum);
    expect(a - b).toBe(0);
  });

  it("oudste 2012-01-01 en jongste 2014-01-03 → spreiding > 2", () => {
    const oud = berekenKorfbalLeeftijdExact("2012-01-01", 2012, peildatum);
    const jong = berekenKorfbalLeeftijdExact("2014-01-03", 2014, peildatum);
    expect(oud - jong).toBeGreaterThan(2);
  });

  it("oudste 2013-01-01 en jongste 2015-01-01 → spreiding < 2", () => {
    // Kalenderjaar-aware: beide worden op 1 januari van hun jaar,
    // op 31-12-2026 is de ene 13 + 364/365.25 en de andere 11 + 364/365.25,
    // dus verschil is exact 2 — NIET > 2.
    const oud = berekenKorfbalLeeftijdExact("2013-01-01", 2013, peildatum);
    const jong = berekenKorfbalLeeftijdExact("2015-01-01", 2015, peildatum);
    const spreiding = oud - jong;
    expect(spreiding).toBe(2);
  });

  it("oudste precies 2 jaar ouder dan jongste → spreiding exact 2 (binnen bandbreedte 2)", () => {
    const oud = berekenKorfbalLeeftijdExact("2012-06-15", 2012, peildatum);
    const jong = berekenKorfbalLeeftijdExact("2014-06-15", 2014, peildatum);
    expect(oud - jong).toBe(2);
  });
});
