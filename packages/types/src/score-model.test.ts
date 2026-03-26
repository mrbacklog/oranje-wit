import { describe, it, expect } from "vitest";
import {
  berekenExacteLeeftijd,
  isSpeelgerechtigd,
  berekenUSSBasislijn,
  knkvNaarUSS,
  aCategorieUSS,
  parseACatKey,
  scoutingNaarUSS,
  coachNaarUSS,
  berekenSpelerUSS,
  USS_CONFIG,
  A_CATEGORIE_USS,
} from "./score-model";

// ============================================================
// Leeftijdsberekening
// ============================================================

describe("berekenExacteLeeftijd", () => {
  const peildatum = new Date(2026, 11, 31); // 31-12-2026

  it("berekent exacte leeftijd met 2 decimalen", () => {
    // Geboren 15-03-2012
    const leeftijd = berekenExacteLeeftijd(new Date(2012, 2, 15), peildatum);
    expect(leeftijd).toBeCloseTo(14.79, 1);
  });

  it("iemand geboren op 31-12-2008 is exact 18.00", () => {
    const leeftijd = berekenExacteLeeftijd(new Date(2008, 11, 31), peildatum);
    expect(leeftijd).toBeCloseTo(18.0, 1);
  });

  it("iemand geboren op 01-01-2010 rondt af op 17.00 (afgerond)", () => {
    const leeftijd = berekenExacteLeeftijd(new Date(2010, 0, 1), peildatum);
    // 6939 dagen / 365.25 = 16.9959... → afgerond 17.00
    expect(leeftijd).toBe(17.0);
  });

  it("iemand geboren op 15-06-2010 is duidelijk 16.xx", () => {
    const leeftijd = berekenExacteLeeftijd(new Date(2010, 5, 15), peildatum);
    expect(leeftijd).toBeLessThan(17.0);
    expect(leeftijd).toBeGreaterThan(16.0);
  });
});

describe("isSpeelgerechtigd", () => {
  const peildatum = new Date(2026, 11, 31);

  it("14.79 jarige is speelgerechtigd voor U15", () => {
    // Geboren 23-06-2012 → 14.52
    expect(isSpeelgerechtigd(new Date(2012, 5, 23), "U15", peildatum)).toBe(true);
  });

  it("iemand geboren 31-12-2011 is exact 15.00 → NIET speelgerechtigd voor U15", () => {
    expect(isSpeelgerechtigd(new Date(2011, 11, 31), "U15", peildatum)).toBe(false);
  });

  it("iemand geboren 01-01-2012 is 14.99 → WEL speelgerechtigd voor U15", () => {
    expect(isSpeelgerechtigd(new Date(2012, 0, 1), "U15", peildatum)).toBe(true);
  });

  it("iemand geboren 31-12-2007 is exact 19.00 → NIET speelgerechtigd voor U19", () => {
    expect(isSpeelgerechtigd(new Date(2007, 11, 31), "U19", peildatum)).toBe(false);
  });

  it("iemand geboren 15-06-2008 is ~18.54 → WEL speelgerechtigd voor U19", () => {
    expect(isSpeelgerechtigd(new Date(2008, 5, 15), "U19", peildatum)).toBe(true);
  });
});

// ============================================================
// Basislijn
// ============================================================

describe("berekenUSSBasislijn", () => {
  it("stijgt monotoon met leeftijd", () => {
    let vorige = 0;
    for (let l = 5; l <= 20; l++) {
      const uss = berekenUSSBasislijn(l);
      expect(uss).toBeGreaterThan(vorige);
      vorige = uss;
    }
  });

  it("geeft bekende waarden uit de formule", () => {
    // Waarden berekend met S(l) = 180 / (1 + e^(-0.35*(l-12.5)))
    expect(berekenUSSBasislijn(6)).toBe(17);
    expect(berekenUSSBasislijn(11)).toBe(67);
    expect(berekenUSSBasislijn(14)).toBe(113);
    expect(berekenUSSBasislijn(18)).toBe(157);
  });

  it("nadert S_max bij hoge leeftijd", () => {
    const uss = berekenUSSBasislijn(30);
    expect(uss).toBeGreaterThan(170);
    expect(uss).toBeLessThanOrEqual(USS_CONFIG.sMax);
  });

  it("is laag bij jonge leeftijd", () => {
    expect(berekenUSSBasislijn(5)).toBeLessThan(20);
  });
});

// ============================================================
// KNKV → USS
// ============================================================

describe("knkvNaarUSS", () => {
  it("mapt KNKV-rating direct naar USS", () => {
    expect(knkvNaarUSS(106)).toBe(106);
    expect(knkvNaarUSS(12)).toBe(12);
    expect(knkvNaarUSS(165)).toBe(165);
  });

  it("clampt op 0-200", () => {
    expect(knkvNaarUSS(-5)).toBe(0);
    expect(knkvNaarUSS(250)).toBe(200);
  });
});

describe("aCategorieUSS", () => {
  it("geeft correcte USS per combinatie", () => {
    expect(aCategorieUSS("U19", "HK")).toBe(175);
    expect(aCategorieUSS("U17", "1")).toBe(147);
    expect(aCategorieUSS("U15", "HK")).toBe(143);
  });

  it("U15-HK < U17-1 (gebruikersfeedback)", () => {
    expect(aCategorieUSS("U15", "HK")!).toBeLessThan(aCategorieUSS("U17", "1")!);
  });

  it("volledige hierarchie klopt", () => {
    const hierarchie = [
      A_CATEGORIE_USS["U15-1"],
      A_CATEGORIE_USS["U17-2"],
      A_CATEGORIE_USS["U19-2"],
      A_CATEGORIE_USS["U15-HK"],
      A_CATEGORIE_USS["U17-1"],
      A_CATEGORIE_USS["U19-1"],
      A_CATEGORIE_USS["U17-HK"],
      A_CATEGORIE_USS["U19-OK"],
      A_CATEGORIE_USS["U19-HK"],
    ];
    for (let i = 1; i < hierarchie.length; i++) {
      expect(hierarchie[i]).toBeGreaterThan(hierarchie[i - 1]);
    }
  });

  it("retourneert null voor onbekende combinatie", () => {
    expect(aCategorieUSS("U13", "HK")).toBeNull();
  });
});

describe("parseACatKey", () => {
  it("parst poolVeld namen correct", () => {
    expect(parseACatKey("U17-HK-07")).toBe("U17-HK");
    expect(parseACatKey("U19-2-08")).toBe("U19-2");
    expect(parseACatKey("U15-HK-08")).toBe("U15-HK");
    expect(parseACatKey("U19-OK-07")).toBe("U19-OK");
  });

  it("retourneert null voor B-categorie pools", () => {
    expect(parseACatKey("Ro-135")).toBeNull();
    expect(parseACatKey("Ge-117")).toBeNull();
    expect(parseACatKey("HK-08")).toBeNull();
  });
});

// ============================================================
// Scouting → USS
// ============================================================

describe("scoutingNaarUSS", () => {
  it("mediaan score geeft USS_basis", () => {
    // Score op mediaan → USS = ussBasis (midpoint van KNKV range)
    expect(scoutingNaarUSS(20, "blauw")).toBe(34);
    expect(scoutingNaarUSS(42.5, "geel")).toBe(90);
    expect(scoutingNaarUSS(67, "rood")).toBe(103);
  });

  it("Geel score 60 → USS ~109 (sterk Geel, vergelijkbaar met J8 team USS 106)", () => {
    const uss = scoutingNaarUSS(60, "geel");
    // USS = 90 + ((60-42.5)/27.5)*30 = 90 + 19.1 = 109
    expect(uss).toBe(109);
  });

  it("Rood score 85 → USS ~116 (sterke Rood-speler)", () => {
    const uss = scoutingNaarUSS(85, "rood");
    // USS = 103 + ((85-67)/32)*23 = 103 + 12.9 = 116
    expect(uss).toBe(116);
  });

  it("overlapping: top Geel overlapt met gemiddeld Oranje", () => {
    const topGeel = scoutingNaarUSS(70, "geel"); // max geel → USS 120
    const gemOranje = scoutingNaarUSS(55, "oranje"); // mediaan oranje → USS 99
    expect(topGeel).toBeGreaterThan(gemOranje);
  });

  it("clampt op 0-200", () => {
    expect(scoutingNaarUSS(0, "blauw")).toBeGreaterThanOrEqual(0);
    expect(scoutingNaarUSS(99, "rood")).toBeLessThanOrEqual(200);
  });
});

// ============================================================
// Coach-evaluatie → USS
// ============================================================

describe("coachNaarUSS", () => {
  it("niveau 3 = geen offset", () => {
    expect(coachNaarUSS(100, 3)).toBe(100);
  });

  it("niveau 5 = +20", () => {
    expect(coachNaarUSS(100, 5)).toBe(120);
  });

  it("niveau 1 = -20", () => {
    expect(coachNaarUSS(100, 1)).toBe(80);
  });

  it("voorbeeld 2: team USS 106, niveau 4 → 116", () => {
    expect(coachNaarUSS(106, 4)).toBe(116);
  });

  it("clampt op 0-200", () => {
    expect(coachNaarUSS(10, 1)).toBeGreaterThanOrEqual(0);
    expect(coachNaarUSS(195, 5)).toBeLessThanOrEqual(200);
  });
});

// ============================================================
// Gecombineerde speler-USS
// ============================================================

describe("berekenSpelerUSS", () => {
  it("retourneert null als beide bronnen ontbreken", () => {
    expect(berekenSpelerUSS(null, null, 0)).toBeNull();
  });

  it("retourneert coach als scouting ontbreekt", () => {
    expect(berekenSpelerUSS(null, 120, 0)).toBe(120);
  });

  it("retourneert scouting als coach ontbreekt", () => {
    expect(berekenSpelerUSS(110, null, 5)).toBe(110);
  });

  it("bij 0 rapporten: 100% coach", () => {
    expect(berekenSpelerUSS(110, 120, 0)).toBe(120);
  });

  it("bij 1-2 rapporten: 40% scout / 60% coach", () => {
    const uss = berekenSpelerUSS(110, 120, 2);
    expect(uss).toBe(Math.round(0.4 * 110 + 0.6 * 120)); // 116
  });

  it("bij 3-4 rapporten: 60% scout / 40% coach", () => {
    const uss = berekenSpelerUSS(110, 120, 3);
    expect(uss).toBe(Math.round(0.6 * 110 + 0.4 * 120)); // 114
  });

  it("bij 5-9 rapporten: 80% scout / 20% coach", () => {
    const uss = berekenSpelerUSS(110, 120, 6);
    expect(uss).toBe(Math.round(0.8 * 110 + 0.2 * 120)); // 112
  });

  it("bij 10+ rapporten: 90% scout / 10% coach", () => {
    const uss = berekenSpelerUSS(110, 120, 15);
    expect(uss).toBe(Math.round(0.9 * 110 + 0.1 * 120)); // 111
  });

  it("voorbeeld: scouting 109, coach 116, 3 rapporten", () => {
    const uss = berekenSpelerUSS(109, 116, 3);
    expect(uss).toBe(Math.round(0.6 * 109 + 0.4 * 116)); // 112
  });

  it("voorbeeld: scouting 116, coach 138, 6 rapporten", () => {
    const uss = berekenSpelerUSS(116, 138, 6);
    expect(uss).toBe(Math.round(0.8 * 116 + 0.2 * 138)); // 120
  });
});
