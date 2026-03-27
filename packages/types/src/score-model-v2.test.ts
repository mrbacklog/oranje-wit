import { describe, it, expect } from "vitest";
import {
  berekenPijlerscore,
  converteerCoachNaarUSS,
  converteerScoutNaarUSS,
  converteerVergelijkingNaarUSS,
  combineUSS,
  berekenUSSCoach,
  berekenUSSScout,
  berekenOverallUSS,
  valideerTeamUSS,
  berekenGroei,
} from "./score-model-v2";
import { berekenUSSBasislijn } from "./score-model";

// ============================================================
// 1. berekenPijlerscore
// ============================================================

describe("berekenPijlerscore", () => {
  it("berekent percentage voor ja/nogniet (blauw)", () => {
    // Ja=1, Nog niet=0 -> gemiddelde * 100
    // 2 van 3 items "Ja" -> 67%
    expect(berekenPijlerscore([1, 1, 0], "blauw")).toBe(67);
  });

  it("berekent percentage voor goed/oke/nogniet (groen)", () => {
    // Goed=1, Oke=0.5, Nog niet=0
    // [1, 0.5, 0] -> gemiddelde 0.5 -> 50%
    expect(berekenPijlerscore([1, 0.5, 0], "groen")).toBe(50);
  });

  it("berekent gemiddelde voor sterren (geel)", () => {
    // Scores: 4, 5 -> gemiddelde 4.5
    expect(berekenPijlerscore([4, 5], "geel")).toBe(4.5);
  });

  it("berekent gemiddelde voor slider (oranje)", () => {
    // Scores: 7.0, 8.5 -> gemiddelde 7.75
    expect(berekenPijlerscore([7.0, 8.5], "oranje")).toBe(7.75);
  });

  it("retourneert null voor lege array", () => {
    expect(berekenPijlerscore([], "geel")).toBeNull();
  });

  it("retourneert null voor paars (observatie)", () => {
    expect(berekenPijlerscore([1, 1, 1], "paars")).toBeNull();
  });

  it("berekent correct voor 100% ja (blauw)", () => {
    expect(berekenPijlerscore([1, 1], "blauw")).toBe(100);
  });

  it("berekent correct voor 0% ja (blauw)", () => {
    expect(berekenPijlerscore([0, 0], "blauw")).toBe(0);
  });
});

// ============================================================
// 2. converteerCoachNaarUSS — TEAM-methode
// ============================================================

describe("converteerCoachNaarUSS", () => {
  it("mediaan score geeft USS = USS_team (geel, mediaan=3.0)", () => {
    // Score 3.0 = mediaan -> offset = 0 -> USS = ussTeam
    expect(converteerCoachNaarUSS(3.0, "geel", 106)).toBe(106);
  });

  it("boven mediaan geeft hogere USS (geel, score 4.5)", () => {
    // Voorbeeld 1 uit tech spec: Lisa, AANVALLEN = 4.5
    // USS = 106 + ((4.5 - 3.0) / 2.0) * 20 = 106 + 15 = 121
    expect(converteerCoachNaarUSS(4.5, "geel", 106)).toBe(121);
  });

  it("maximum score geeft maximale offset (geel, score 5.0)", () => {
    // USS = 106 + ((5.0 - 3.0) / 2.0) * 20 = 106 + 20 = 126
    expect(converteerCoachNaarUSS(5.0, "geel", 106)).toBe(126);
  });

  it("minimum score geeft negatieve offset (geel, score 1.0)", () => {
    // USS = 106 + ((1.0 - 3.0) / 2.0) * 20 = 106 - 20 = 86
    expect(converteerCoachNaarUSS(1.0, "geel", 106)).toBe(86);
  });

  it("rood-speler met score 7.0, team USS 118", () => {
    // Voorbeeld 2: Thijs, AANVALLEN score 7.0
    // USS = 118 + ((7.0 - 5.5) / 4.5) * 25 = 118 + 8.33 = 126
    expect(converteerCoachNaarUSS(7.0, "rood", 118)).toBe(126);
  });

  it("rood-speler maximale mentaal score 9.0, team USS 118", () => {
    // USS = 118 + ((9.0 - 5.5) / 4.5) * 25 = 118 + 19.44 = 137
    expect(converteerCoachNaarUSS(9.0, "rood", 118)).toBe(137);
  });

  it("blauw: 100% score geeft USS_team + B", () => {
    // USS = 50 + ((100 - 50) / 50) * 15 = 50 + 15 = 65
    expect(converteerCoachNaarUSS(100, "blauw", 50)).toBe(65);
  });

  it("clampt op 0-200", () => {
    expect(converteerCoachNaarUSS(10.0, "rood", 190)).toBeLessThanOrEqual(200);
    expect(converteerCoachNaarUSS(1.0, "rood", 5)).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================
// 3. converteerScoutNaarUSS — INDIVIDUEEL-methode
// ============================================================

describe("converteerScoutNaarUSS", () => {
  it("mediaan score geeft USS = basislijn (rood, 17 jaar)", () => {
    // Score 5.5 = mediaan -> offset = 0 -> USS = basislijn(17)
    const basislijn = berekenUSSBasislijn(17);
    expect(converteerScoutNaarUSS(5.5, "rood", 17)).toBe(basislijn);
  });

  it("rood-speler met score 8.0 op verdedigen, leeftijd 17", () => {
    // Voorbeeld 2: Thijs, VERDEDIGEN score 8.0
    // basislijn(17) = 149
    // USS = 149 + ((8.0 - 5.5) / 4.5) * 32 = 149 + 17.78 = 167
    expect(converteerScoutNaarUSS(8.0, "rood", 17)).toBe(167);
  });

  it("rood-speler met score 5.0 (onder mediaan), leeftijd 17", () => {
    // USS = 149 + ((5.0 - 5.5) / 4.5) * 32 = 149 + (-3.56) = 145
    expect(converteerScoutNaarUSS(5.0, "rood", 17)).toBe(145);
  });

  it("geel-speler met score 3.8, leeftijd 11", () => {
    // basislijn(11) = 67
    // USS = 67 + ((3.8 - 3.0) / 2.0) * 28 = 67 + 11.2 = 78
    expect(converteerScoutNaarUSS(3.8, "geel", 11)).toBe(78);
  });

  it("scouting-bandbreedte is groter dan coach-bandbreedte", () => {
    // Dezelfde boven-mediaan score geeft een groter USS-verschil bij scouting dan bij coach
    const scoutUSS = converteerScoutNaarUSS(4.5, "geel", 11);
    const basislijn = berekenUSSBasislijn(11);
    const offsetScout = scoutUSS - basislijn;

    const coachUSS = converteerCoachNaarUSS(4.5, "geel", basislijn);
    const offsetCoach = coachUSS - basislijn;

    // B_scout(geel) = 28, B_coach(geel) = 20 -> scout offset > coach offset
    expect(offsetScout).toBeGreaterThan(offsetCoach);
  });
});

// ============================================================
// 4. berekenUSSCoach — volledige coach-berekening
// ============================================================

describe("berekenUSSCoach", () => {
  it("berekent Voorbeeld 1: Lisa (Geel, USS_team=106)", () => {
    // Uit scoremodel-v2-concept.md, sectie 12
    const pijlerScores: Record<string, number> = {
      AANVALLEN: 4.5,
      VERDEDIGEN: 3.0,
      TECHNIEK: 4.0,
      TACTIEK: 4.0,
      MENTAAL: 5.0,
      FYSIEK: 3.0,
    };

    const result = berekenUSSCoach(pijlerScores, "geel", 106);

    // Individuele pijler-USS:
    expect(result.pijlers["AANVALLEN"]).toBe(121);
    expect(result.pijlers["VERDEDIGEN"]).toBe(106);
    expect(result.pijlers["TECHNIEK"]).toBe(116);
    expect(result.pijlers["TACTIEK"]).toBe(116);
    expect(result.pijlers["MENTAAL"]).toBe(126);
    expect(result.pijlers["FYSIEK"]).toBe(106);

    // Overall USS_coach (gewogen: 18/18/18/18/14/14%):
    // = 0.18*121 + 0.18*106 + 0.18*116 + 0.18*116 + 0.14*126 + 0.14*106
    // = 21.78 + 19.08 + 20.88 + 20.88 + 17.64 + 14.84 = 115.1 -> 115
    expect(result.overall).toBe(115);
  });
});

// ============================================================
// 5. berekenUSSScout — volledige scout-berekening
// ============================================================

describe("berekenUSSScout", () => {
  it("berekent Voorbeeld 2: Thijs scout-evaluatie (Rood, 17 jaar)", () => {
    // Uit scoremodel-v2-concept.md, sectie 12
    const pijlerScores: Record<string, number> = {
      AANVALLEN: 6.5,
      VERDEDIGEN: 8.0,
      SCOREN: 5.0,
      TECHNIEK: 7.0,
      TACTIEK: 6.0,
      SPELINTELLIGENTIE: 7.5,
      MENTAAL: 8.5,
      SOCIAAL: 6.5,
      FYSIEK: 7.0,
    };

    const result = berekenUSSScout(pijlerScores, "rood", 17);

    // basislijn(17) = 149
    expect(result.pijlers["AANVALLEN"]).toBe(156);
    expect(result.pijlers["VERDEDIGEN"]).toBe(167);
    expect(result.pijlers["SCOREN"]).toBe(145);
    expect(result.pijlers["TECHNIEK"]).toBe(160);
    expect(result.pijlers["TACTIEK"]).toBe(153);
    expect(result.pijlers["SPELINTELLIGENTIE"]).toBe(163);
    expect(result.pijlers["MENTAAL"]).toBe(170);
    expect(result.pijlers["SOCIAAL"]).toBe(156);
    expect(result.pijlers["FYSIEK"]).toBe(160);

    // Overall: gewogen met rood-gewichten
    // = 0.12*156 + 0.12*167 + 0.12*145 + 0.12*160 + 0.10*153
    //   + 0.10*163 + 0.10*170 + 0.10*156 + 0.12*160
    // = 18.72 + 20.04 + 17.4 + 19.2 + 15.3 + 16.3 + 17.0 + 15.6 + 19.2
    // = 158.76 -> 159
    expect(result.overall).toBe(159);
  });
});

// ============================================================
// 6. converteerVergelijkingNaarUSS — VERGELIJKING-methode
// ============================================================

describe("converteerVergelijkingNaarUSS", () => {
  it("lineaire interpolatie met twee ankers", () => {
    // Voorbeeld uit scoremodel-v2-concept.md, sectie 7
    // Mila: pos=52, USS=105; Thijs: pos=71, USS=115
    const posities = [
      { spelerId: "lisa", balkPositie: 30 },
      { spelerId: "mila", balkPositie: 52, bekendeUSS: 105 },
      { spelerId: "thijs", balkPositie: 71, bekendeUSS: 115 },
      { spelerId: "daan", balkPositie: 88 },
    ];

    const result = converteerVergelijkingNaarUSS(posities, "geel", 100);

    // USS_per_punt = (115 - 105) / (71 - 52) = 10/19 = 0.5263
    // Lisa = 105 + (30 - 52) * 0.5263 = 105 + (-11.58) = 93
    // Daan = 105 + (88 - 52) * 0.5263 = 105 + 18.95 = 124
    expect(result["lisa"]).toBe(93);
    expect(result["mila"]).toBe(105);
    expect(result["thijs"]).toBe(115);
    expect(result["daan"]).toBe(124);
  });

  it("fallback naar team-USS zonder ankers", () => {
    const posities = [
      { spelerId: "a", balkPositie: 25 },
      { spelerId: "b", balkPositie: 75 },
    ];

    const result = converteerVergelijkingNaarUSS(posities, "geel", 100);

    // B_coach(geel) = 20
    // a: 100 + ((25-50)/50)*20 = 100 - 10 = 90
    // b: 100 + ((75-50)/50)*20 = 100 + 10 = 110
    expect(result["a"]).toBe(90);
    expect(result["b"]).toBe(110);
  });

  it("een anker: extrapolatie met bandbreedte", () => {
    const posities = [
      { spelerId: "a", balkPositie: 30 },
      { spelerId: "b", balkPositie: 70, bekendeUSS: 120 },
    ];

    const result = converteerVergelijkingNaarUSS(posities, "geel", 100);

    // B_coach(geel) = 20
    // a: 120 + ((30-70)/50)*20 = 120 - 16 = 104
    expect(result["a"]).toBe(104);
    expect(result["b"]).toBe(120);
  });
});

// ============================================================
// 7. combineUSS — bronnen combineren
// ============================================================

describe("combineUSS", () => {
  it("retourneert null zonder bronnen", () => {
    expect(
      combineUSS({
        ussCoach: null,
        ussScout: null,
        ussVergelijking: null,
        aantalScoutSessies: 0,
      })
    ).toBeNull();
  });

  it("alleen coach (0 scout sessies): 100% coach", () => {
    const result = combineUSS({
      ussCoach: 120,
      ussScout: null,
      ussVergelijking: null,
      aantalScoutSessies: 0,
    });
    // w_coach = 0.85, w_verg = 0.15, maar vergelijking is null
    // Hernormaliseer: coach = 0.85/0.85 = 1.0
    expect(result).toBe(120);
  });

  it("coach + scout, 2 sessies: gewogen combinatie", () => {
    const result = combineUSS({
      ussCoach: 128,
      ussScout: 159,
      ussVergelijking: null,
      aantalScoutSessies: 2,
    });

    // Bij 2 sessies: w_scout=0.45, w_coach=0.40, w_verg=0.15
    // Geen vergelijking, hernormaliseer: w_scout=0.45/(0.45+0.40)=0.529, w_coach=0.471
    // USS = 0.529 * 159 + 0.471 * 128 = 84.1 + 60.3 = 144.4 -> 144
    expect(result).toBe(144);
  });

  it("recentheidscorrectie: oude score weegt minder", () => {
    // Recente coach vs oude scout
    const recent = combineUSS({
      ussCoach: 120,
      ussScout: 140,
      ussVergelijking: null,
      aantalScoutSessies: 3,
      maandenOudCoach: 1,
      maandenOudScout: 1,
    });

    const oud = combineUSS({
      ussCoach: 120,
      ussScout: 140,
      ussVergelijking: null,
      aantalScoutSessies: 3,
      maandenOudCoach: 1,
      maandenOudScout: 14, // zeer oud
    });

    // Met een zeer oude scout-score zou het resultaat meer naar de coach neigen
    expect(oud!).toBeLessThan(recent!);
  });

  it("alle drie bronnen beschikbaar", () => {
    const result = combineUSS({
      ussCoach: 120,
      ussScout: 140,
      ussVergelijking: 130,
      aantalScoutSessies: 5,
    });

    // Bij 4+ sessies: w_scout=0.55, w_coach=0.30, w_verg=0.15
    // USS = (0.55*140 + 0.30*120 + 0.15*130) / 1.0
    //     = 77 + 36 + 19.5 = 132.5 -> 133
    expect(result).toBe(133);
  });
});

// ============================================================
// 8. berekenOverallUSS — volledige berekening
// ============================================================

describe("berekenOverallUSS", () => {
  it("Voorbeeld 2 volledig: Thijs (Rood, coach + scout, 2 sessies)", () => {
    // Uit scoremodel-v2-concept.md, sectie 12
    const result = berekenOverallUSS({
      band: "rood",
      ussTeam: 118,
      leeftijd: 17,
      coachPijlerScores: {
        AANVALLEN: 7.0,
        VERDEDIGEN: 8.5,
        SCOREN: 6.0,
        TECHNIEK: 7.5,
        TACTIEK: 6.5,
        SPELINTELLIGENTIE: 8.0,
        MENTAAL: 9.0,
        SOCIAAL: 7.0,
        FYSIEK: 7.0,
      },
      scoutPijlerScores: {
        AANVALLEN: 6.5,
        VERDEDIGEN: 8.0,
        SCOREN: 5.0,
        TECHNIEK: 7.0,
        TACTIEK: 6.0,
        SPELINTELLIGENTIE: 7.5,
        MENTAAL: 8.5,
        SOCIAAL: 6.5,
        FYSIEK: 7.0,
      },
      vergelijkingPijlerUSS: null,
      aantalScoutSessies: 2,
    });

    // Het resultaat moet ergens tussen coach (128) en scout (159) liggen
    expect(result.ussOverall).toBeGreaterThan(120);
    expect(result.ussOverall).toBeLessThan(165);

    // Alle pijlers moeten aanwezig zijn
    expect(Object.keys(result.ussPijlers).length).toBe(9);
  });

  it("alleen coach-evaluatie (geen scouting)", () => {
    const result = berekenOverallUSS({
      band: "geel",
      ussTeam: 106,
      leeftijd: 11,
      coachPijlerScores: {
        AANVALLEN: 4.5,
        VERDEDIGEN: 3.0,
        TECHNIEK: 4.0,
        TACTIEK: 4.0,
        MENTAAL: 5.0,
        FYSIEK: 3.0,
      },
      scoutPijlerScores: null,
      vergelijkingPijlerUSS: null,
      aantalScoutSessies: 0,
    });

    // Zonder scouting: 100% coach = USS 115
    expect(result.ussOverall).toBe(115);
    expect(result.ussPijlers["AANVALLEN"]).toBe(121);
    expect(result.ussPijlers["MENTAAL"]).toBe(126);
  });

  it("fallback naar basislijn als geen ussTeam", () => {
    const result = berekenOverallUSS({
      band: "geel",
      ussTeam: null,
      leeftijd: 11,
      coachPijlerScores: {
        AANVALLEN: 3.0,
        VERDEDIGEN: 3.0,
        TECHNIEK: 3.0,
        TACTIEK: 3.0,
        MENTAAL: 3.0,
        FYSIEK: 3.0,
      },
      scoutPijlerScores: null,
      vergelijkingPijlerUSS: null,
      aantalScoutSessies: 0,
    });

    // Alle scores op mediaan, team = basislijn(11) = 67
    const basislijn = berekenUSSBasislijn(11);
    expect(result.ussOverall).toBe(basislijn);
  });
});

// ============================================================
// 9. valideerTeamUSS
// ============================================================

describe("valideerTeamUSS", () => {
  it("ok bij klein verschil", () => {
    const resultaten = valideerTeamUSS(100, [98, 102, 100, 101, 99]);
    expect(resultaten[0].signaal).toBe("ok");
  });

  it("aandacht bij matig verschil (8-15 punten)", () => {
    const resultaten = valideerTeamUSS(100, [110, 112, 108, 114, 111]);
    expect(resultaten[0].signaal).toBe("aandacht");
  });

  it("afwijking bij groot verschil (>15 punten)", () => {
    const resultaten = valideerTeamUSS(100, [120, 125, 118, 122, 120]);
    expect(resultaten[0].signaal).toBe("afwijking");
    expect(resultaten[0].mogelijkeOorzaak).toContain("Spelers sterker dan resultaten");
  });

  it("per-pijler validatie", () => {
    const resultaten = valideerTeamUSS(100, [100], {
      AANVALLEN: [130, 125, 128],
      VERDEDIGEN: [95, 100, 98],
    });

    // Overall ok
    expect(resultaten[0].signaal).toBe("ok");

    // AANVALLEN: gem ~128, verschil 28 -> afwijking
    const aanvallenCheck = resultaten.find((r) => r.pijler === "AANVALLEN");
    expect(aanvallenCheck?.signaal).toBe("afwijking");

    // VERDEDIGEN: gem ~98, verschil -2 -> ok
    const verdedigenCheck = resultaten.find((r) => r.pijler === "VERDEDIGEN");
    expect(verdedigenCheck?.signaal).toBe("ok");
  });
});

// ============================================================
// 10. berekenGroei
// ============================================================

describe("berekenGroei", () => {
  it("sterke groei bij +10 of meer", () => {
    const result = berekenGroei(120, 108);
    expect(result.label).toBe("sterke_groei");
    expect(result.verschil).toBe(12);
  });

  it("groei bij +3 tot +9", () => {
    const result = berekenGroei(115, 110);
    expect(result.label).toBe("groei");
    expect(result.verschil).toBe(5);
  });

  it("stabiel bij -3 tot +2", () => {
    const result = berekenGroei(110, 111);
    expect(result.label).toBe("stabiel");
    expect(result.verschil).toBe(-1);
  });

  it("achteruitgang bij -4 of meer", () => {
    const result = berekenGroei(100, 112);
    expect(result.label).toBe("achteruitgang");
    expect(result.verschil).toBe(-12);
  });

  it("percentage is correct", () => {
    const result = berekenGroei(120, 100);
    expect(result.percentage).toBe(20); // +20%
  });
});
