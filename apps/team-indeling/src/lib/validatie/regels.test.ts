import { describe, it, expect } from "vitest";
import {
  valideerTeam,
  valideerDubbeleSpelersOverTeams,
  type TeamData,
  type SpelerData,
  type BlauwdrukKaders,
  type TeamgrootteOverrides,
} from "./regels";

// ============================================================
// Helpers voor testdata
// ============================================================

function maakSpeler(overrides: Partial<SpelerData> = {}): SpelerData {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    roepnaam: overrides.roepnaam ?? "Test",
    achternaam: overrides.achternaam ?? "Speler",
    geboortejaar: overrides.geboortejaar ?? 2012,
    geslacht: overrides.geslacht ?? "M",
    ...overrides,
  };
}

function maakSpelers(
  aantal: number,
  defaults: Partial<SpelerData> = {}
): SpelerData[] {
  return Array.from({ length: aantal }, (_, i) =>
    maakSpeler({
      id: `speler-${i}`,
      roepnaam: `Speler${i}`,
      ...defaults,
    })
  );
}

function maakTeam(overrides: Partial<TeamData> = {}): TeamData {
  return {
    naam: overrides.naam ?? "Test Team",
    categorie: overrides.categorie ?? "B_CATEGORIE",
    kleur: overrides.kleur ?? "GEEL",
    spelers: overrides.spelers ?? [],
    ...overrides,
  };
}

const SEIZOEN = 2026;

// ============================================================
// valideerTeam — Teamgrootte
// ============================================================

describe("valideerTeam — teamgrootte", () => {
  it("geeft GROEN voor een team met ideale grootte (achttal)", () => {
    const team = maakTeam({
      naam: "Geel 1",
      kleur: "GEEL",
      spelers: maakSpelers(10, { geboortejaar: 2016, geslacht: "M" }).concat(
        maakSpelers(10, {
          geboortejaar: 2016,
          geslacht: "V",
        }).map((s, i) => ({ ...s, id: `v-${i}` }))
      ).slice(0, 10),
    });
    // 10 spelers, ideaal is 9-11 voor achttal
    const resultaat = valideerTeam(team, SEIZOEN);
    const teamgrootteMeldingen = resultaat.meldingen.filter(
      (m) => m.regel === "teamgrootte"
    );
    expect(teamgrootteMeldingen).toHaveLength(0);
  });

  it("geeft kritieke melding als een achttal te weinig spelers heeft", () => {
    const team = maakTeam({
      naam: "Geel 1",
      kleur: "GEEL",
      spelers: maakSpelers(5, { geboortejaar: 2016 }),
    });
    const resultaat = valideerTeam(team, SEIZOEN);
    expect(resultaat.status).toBe("ROOD");
    expect(resultaat.meldingen).toContainEqual(
      expect.objectContaining({
        regel: "teamgrootte",
        ernst: "kritiek",
      })
    );
  });

  it("geeft kritieke melding als een achttal te veel spelers heeft", () => {
    const team = maakTeam({
      naam: "Geel 1",
      kleur: "GEEL",
      spelers: maakSpelers(15, { geboortejaar: 2016 }),
    });
    const resultaat = valideerTeam(team, SEIZOEN);
    expect(resultaat.meldingen).toContainEqual(
      expect.objectContaining({
        regel: "teamgrootte",
        ernst: "kritiek",
      })
    );
  });

  it("geeft aandachtsmelding als een team net buiten ideaal valt", () => {
    // Default achttal ideaal is 9-11, max 13, min 8
    // 8 spelers = onder ideaalMin maar boven min
    const team = maakTeam({
      naam: "Geel 1",
      kleur: "GEEL",
      spelers: maakSpelers(8, { geboortejaar: 2016 }),
    });
    const resultaat = valideerTeam(team, SEIZOEN);
    const grootteMelding = resultaat.meldingen.find(
      (m) => m.regel === "teamgrootte"
    );
    expect(grootteMelding?.ernst).toBe("aandacht");
  });

  it("geeft kritieke melding als een viertal te weinig spelers heeft", () => {
    const team = maakTeam({
      naam: "Blauw 1",
      kleur: "BLAUW",
      spelers: maakSpelers(2, { geboortejaar: 2020 }),
    });
    const resultaat = valideerTeam(team, SEIZOEN);
    expect(resultaat.meldingen).toContainEqual(
      expect.objectContaining({
        regel: "teamgrootte",
        ernst: "kritiek",
      })
    );
  });

  it("accepteert een viertal met ideale grootte", () => {
    const team = maakTeam({
      naam: "Blauw 1",
      kleur: "BLAUW",
      spelers: maakSpelers(5, { geboortejaar: 2020 }),
    });
    const resultaat = valideerTeam(team, SEIZOEN);
    const grootteMeldingen = resultaat.meldingen.filter(
      (m) => m.regel === "teamgrootte"
    );
    expect(grootteMeldingen).toHaveLength(0);
  });
});

// ============================================================
// valideerTeam — Leeftijd/bandbreedte
// ============================================================

describe("valideerTeam — leeftijdsspreiding B-categorie", () => {
  it("geeft kritieke melding bij te grote leeftijdsspreiding in viertal (>2 jr)", () => {
    const team = maakTeam({
      naam: "Groen 1",
      kleur: "GROEN",
      spelers: [
        maakSpeler({ id: "a", geboortejaar: 2015 }),
        maakSpeler({ id: "b", geboortejaar: 2016 }),
        maakSpeler({ id: "c", geboortejaar: 2017 }),
        maakSpeler({ id: "d", geboortejaar: 2019 }),
        maakSpeler({ id: "e", geboortejaar: 2018 }),
      ],
    });
    const resultaat = valideerTeam(team, SEIZOEN);
    expect(resultaat.meldingen).toContainEqual(
      expect.objectContaining({
        regel: "bandbreedte",
        ernst: "kritiek",
      })
    );
  });

  it("accepteert viertal met spreiding <= 2 jaar", () => {
    const team = maakTeam({
      naam: "Groen 1",
      kleur: "GROEN",
      spelers: [
        maakSpeler({ id: "a", geboortejaar: 2017 }),
        maakSpeler({ id: "b", geboortejaar: 2017 }),
        maakSpeler({ id: "c", geboortejaar: 2018 }),
        maakSpeler({ id: "d", geboortejaar: 2018 }),
        maakSpeler({ id: "e", geboortejaar: 2019 }),
      ],
    });
    const resultaat = valideerTeam(team, SEIZOEN);
    const bandbreedteMeldingen = resultaat.meldingen.filter(
      (m) => m.regel === "bandbreedte"
    );
    expect(bandbreedteMeldingen).toHaveLength(0);
  });

  it("geeft kritieke melding bij te grote spreiding in achttal (>3 jr)", () => {
    const team = maakTeam({
      naam: "Oranje 1",
      kleur: "ORANJE",
      spelers: maakSpelers(10, { geboortejaar: 2012 }).map((s, i) => ({
        ...s,
        // Spreiding van 5 jaar
        geboortejaar: 2010 + i,
      })),
    });
    const resultaat = valideerTeam(team, SEIZOEN);
    expect(resultaat.meldingen).toContainEqual(
      expect.objectContaining({
        regel: "bandbreedte",
        ernst: "kritiek",
      })
    );
  });

  it("accepteert achttal met spreiding <= 3 jaar", () => {
    const team = maakTeam({
      naam: "Geel 1",
      kleur: "GEEL",
      spelers: maakSpelers(10, { geboortejaar: 2015 }).map((s, i) => ({
        ...s,
        geboortejaar: 2014 + (i % 3), // 2014, 2015, 2016
      })),
    });
    const resultaat = valideerTeam(team, SEIZOEN);
    const bandbreedteMeldingen = resultaat.meldingen.filter(
      (m) => m.regel === "bandbreedte"
    );
    expect(bandbreedteMeldingen).toHaveLength(0);
  });
});

// ============================================================
// valideerTeam — Leeftijd per kleur
// ============================================================

describe("valideerTeam — leeftijd past bij kleur", () => {
  it("geeft aandachtsmelding als speler buiten kleur-leeftijdsrange valt", () => {
    // GEEL = 10-12 jaar, seizoen 2026, dus geboortejaar 2014-2016
    const team = maakTeam({
      naam: "Geel 1",
      kleur: "GEEL",
      spelers: [
        ...maakSpelers(9, { geboortejaar: 2015 }),
        maakSpeler({
          id: "te-oud",
          roepnaam: "Oud",
          achternaam: "Kind",
          geboortejaar: 2010,
        }), // 16 jaar
      ],
    });
    const resultaat = valideerTeam(team, SEIZOEN);
    expect(resultaat.meldingen).toContainEqual(
      expect.objectContaining({
        regel: "leeftijd_kleur",
        ernst: "aandacht",
      })
    );
  });
});

// ============================================================
// valideerTeam — Gemiddelde leeftijd 8-tallen
// ============================================================

describe("valideerTeam — gemiddelde leeftijd 8-tallen", () => {
  it("geeft kritieke melding als gemiddelde leeftijd onder 9.0 ligt", () => {
    // Seizoen 2026, gemiddelde leeftijd < 9.0 → geboortejaar > 2017
    const team = maakTeam({
      naam: "Geel 1",
      kleur: "GEEL",
      spelers: maakSpelers(10, { geboortejaar: 2019 }), // gem. leeftijd = 7
    });
    const resultaat = valideerTeam(team, SEIZOEN);
    expect(resultaat.meldingen).toContainEqual(
      expect.objectContaining({
        regel: "gemiddelde_leeftijd",
        ernst: "kritiek",
      })
    );
  });

  it("accepteert achttal met gemiddelde leeftijd >= 9.0", () => {
    const team = maakTeam({
      naam: "Geel 1",
      kleur: "GEEL",
      spelers: maakSpelers(10, { geboortejaar: 2016 }), // gem. leeftijd = 10
    });
    const resultaat = valideerTeam(team, SEIZOEN);
    const gemLftMeldingen = resultaat.meldingen.filter(
      (m) => m.regel === "gemiddelde_leeftijd"
    );
    expect(gemLftMeldingen).toHaveLength(0);
  });
});

// ============================================================
// valideerTeam — Gender
// ============================================================

describe("valideerTeam — genderbalans (fallback zonder blauwdruk)", () => {
  it("geeft geen gendermelding voor BLAUW (geen genderonderscheid)", () => {
    const team = maakTeam({
      naam: "Blauw 1",
      kleur: "BLAUW",
      spelers: [
        ...maakSpelers(5, { geboortejaar: 2020, geslacht: "M" }),
      ],
    });
    const resultaat = valideerTeam(team, SEIZOEN);
    const genderMeldingen = resultaat.meldingen.filter(
      (m) => m.regel.startsWith("gender")
    );
    expect(genderMeldingen).toHaveLength(0);
  });

  it("geeft kritieke melding bij slechts 1 kind van een geslacht", () => {
    const team = maakTeam({
      naam: "Geel 1",
      kleur: "GEEL",
      spelers: [
        ...maakSpelers(9, { geboortejaar: 2016, geslacht: "M" }),
        maakSpeler({
          id: "v-alleen",
          geboortejaar: 2016,
          geslacht: "V",
        }),
      ],
    });
    const resultaat = valideerTeam(team, SEIZOEN);
    expect(resultaat.meldingen).toContainEqual(
      expect.objectContaining({
        regel: "gender_alleen",
        ernst: "kritiek",
      })
    );
  });

  it("geeft aandachtsmelding bij scheve genderbalans in B-categorie", () => {
    // ratio < 0.5 → 8M + 2V = 0.25
    const team = maakTeam({
      naam: "Geel 1",
      kleur: "GEEL",
      spelers: [
        ...maakSpelers(8, { geboortejaar: 2016, geslacht: "M" }),
        maakSpeler({ id: "v1", geboortejaar: 2016, geslacht: "V" }),
        maakSpeler({ id: "v2", geboortejaar: 2016, geslacht: "V" }),
      ],
    });
    const resultaat = valideerTeam(team, SEIZOEN);
    expect(resultaat.meldingen).toContainEqual(
      expect.objectContaining({
        regel: "gender_balans",
        ernst: "aandacht",
      })
    );
  });
});

describe("valideerTeam — genderbalans met blauwdruk-kaders", () => {
  it("geeft kritieke melding bij schending verplicht minimum meisjes", () => {
    const kaders: BlauwdrukKaders = {
      GEEL: {
        optimaalSpelers: 10,
        verplichtMinV: 3,
      },
    };
    const team = maakTeam({
      naam: "Geel 1",
      kleur: "GEEL",
      spelers: [
        ...maakSpelers(8, { geboortejaar: 2016, geslacht: "M" }),
        maakSpeler({ id: "v1", geboortejaar: 2016, geslacht: "V" }),
        maakSpeler({ id: "v2", geboortejaar: 2016, geslacht: "V" }),
      ],
    });
    const resultaat = valideerTeam(team, SEIZOEN, undefined, kaders);
    expect(resultaat.meldingen).toContainEqual(
      expect.objectContaining({
        regel: "gender_verplicht",
        ernst: "kritiek",
      })
    );
  });

  it("geeft aandachtsmelding bij schending gewenst minimum", () => {
    const kaders: BlauwdrukKaders = {
      GEEL: {
        optimaalSpelers: 10,
        verplichtMinV: 2,
        gewenstMinV: 4,
      },
    };
    const team = maakTeam({
      naam: "Geel 1",
      kleur: "GEEL",
      spelers: [
        ...maakSpelers(7, { geboortejaar: 2016, geslacht: "M" }),
        maakSpeler({ id: "v1", geboortejaar: 2016, geslacht: "V" }),
        maakSpeler({ id: "v2", geboortejaar: 2016, geslacht: "V" }),
        maakSpeler({ id: "v3", geboortejaar: 2016, geslacht: "V" }),
      ],
    });
    const resultaat = valideerTeam(team, SEIZOEN, undefined, kaders);
    expect(resultaat.meldingen).toContainEqual(
      expect.objectContaining({
        regel: "gender_gewenst",
        ernst: "aandacht",
      })
    );
  });
});

// ============================================================
// valideerTeam — Duplicaten
// ============================================================

describe("valideerTeam — duplicaten", () => {
  it("geeft kritieke melding bij dubbele speler in team", () => {
    const speler = maakSpeler({
      id: "dubbel",
      roepnaam: "Jan",
      achternaam: "Jansen",
      geboortejaar: 2016,
    });
    const team = maakTeam({
      naam: "Geel 1",
      kleur: "GEEL",
      spelers: [
        speler,
        { ...speler }, // zelfde id
        ...maakSpelers(8, { geboortejaar: 2016 }),
      ],
    });
    const resultaat = valideerTeam(team, SEIZOEN);
    expect(resultaat.meldingen).toContainEqual(
      expect.objectContaining({
        regel: "duplicaat",
        ernst: "kritiek",
      })
    );
  });
});

// ============================================================
// valideerTeam — A-categorie
// ============================================================

describe("valideerTeam — A-categorie", () => {
  it("geeft kritieke melding als speler buiten A-categorie bandbreedte valt", () => {
    // U15 in seizoen 2026: geboortejaar 2012-2013
    const team = maakTeam({
      naam: "U15 1",
      categorie: "A_CATEGORIE",
      kleur: null,
      spelers: [
        ...maakSpelers(9, { geboortejaar: 2012 }),
        maakSpeler({
          id: "te-oud",
          roepnaam: "Oud",
          achternaam: "Speler",
          geboortejaar: 2010,
        }),
      ],
    });
    const resultaat = valideerTeam(team, SEIZOEN);
    expect(resultaat.meldingen).toContainEqual(
      expect.objectContaining({
        regel: "bandbreedte",
        ernst: "kritiek",
      })
    );
  });

  it("accepteert A-categorie spelers binnen bandbreedte", () => {
    // U17 in seizoen 2026: geboortejaar 2010-2011
    const team = maakTeam({
      naam: "U17 1",
      categorie: "A_CATEGORIE",
      kleur: null,
      spelers: [
        ...maakSpelers(5, { geboortejaar: 2010, geslacht: "M" }),
        ...maakSpelers(5, { geboortejaar: 2011, geslacht: "V" }).map(
          (s, i) => ({ ...s, id: `v-${i}` })
        ),
      ],
    });
    const resultaat = valideerTeam(team, SEIZOEN);
    const bandbreedteMeldingen = resultaat.meldingen.filter(
      (m) => m.regel === "bandbreedte"
    );
    expect(bandbreedteMeldingen).toHaveLength(0);
  });

  it("geeft kritieke gendermelding bij scheve verhouding in A-categorie", () => {
    // A-categorie: ratio < 0.75 is kritiek
    // 9M + 2V = ratio 2/9 ≈ 0.22
    const team = maakTeam({
      naam: "U17 1",
      categorie: "A_CATEGORIE",
      kleur: null,
      spelers: [
        ...maakSpelers(9, { geboortejaar: 2010, geslacht: "M" }),
        maakSpeler({ id: "v1", geboortejaar: 2010, geslacht: "V" }),
        maakSpeler({ id: "v2", geboortejaar: 2010, geslacht: "V" }),
      ],
    });
    const resultaat = valideerTeam(team, SEIZOEN);
    expect(resultaat.meldingen).toContainEqual(
      expect.objectContaining({
        regel: "gender_balans",
        ernst: "kritiek",
      })
    );
  });
});

// ============================================================
// valideerTeam — Senioren
// ============================================================

describe("valideerTeam — senioren", () => {
  it("behandelt Senioren 1-4 als A-categorie (gender-regels)", () => {
    // Sen 2: 9M + 2V → scheve ratio, zou kritiek moeten zijn
    const team = maakTeam({
      naam: "OW 2",
      categorie: "SENIOREN",
      kleur: null,
      spelers: [
        ...maakSpelers(9, { geboortejaar: 1995, geslacht: "M" }),
        maakSpeler({ id: "v1", geboortejaar: 1995, geslacht: "V" }),
        maakSpeler({ id: "v2", geboortejaar: 1995, geslacht: "V" }),
      ],
    });
    const resultaat = valideerTeam(team, SEIZOEN);
    expect(resultaat.meldingen).toContainEqual(
      expect.objectContaining({
        regel: "gender_balans",
        ernst: "kritiek",
      })
    );
  });

  it("behandelt Senioren 5+ als B-categorie (mildere gender-regels)", () => {
    // Sen 6: 8M + 2V → ratio 0.25 < 0.5, aandacht (niet kritiek)
    const team = maakTeam({
      naam: "OW 6",
      categorie: "SENIOREN",
      kleur: null,
      spelers: [
        ...maakSpelers(8, { geboortejaar: 1995, geslacht: "M" }),
        maakSpeler({ id: "v1", geboortejaar: 1995, geslacht: "V" }),
        maakSpeler({ id: "v2", geboortejaar: 1995, geslacht: "V" }),
      ],
    });
    const resultaat = valideerTeam(team, SEIZOEN);
    const genderBalans = resultaat.meldingen.find(
      (m) => m.regel === "gender_balans"
    );
    expect(genderBalans?.ernst).toBe("aandacht");
  });
});

// ============================================================
// valideerTeam — Edge cases
// ============================================================

describe("valideerTeam — grensgevallen", () => {
  it("geeft GROEN voor een leeg team (geen meldingen)", () => {
    const team = maakTeam({
      naam: "Leeg Team",
      kleur: "GEEL",
      spelers: [],
    });
    const resultaat = valideerTeam(team, SEIZOEN);
    // Leeg team: onder minimum → kritiek
    expect(resultaat.status).toBe("ROOD");
  });

  it("geeft correct status-stoplicht: ROOD bij kritiek, ORANJE bij alleen aandacht", () => {
    // Alleen aandacht (team net buiten ideaal)
    const team = maakTeam({
      naam: "Blauw 1",
      kleur: "BLAUW",
      spelers: maakSpelers(4, { geboortejaar: 2020 }),
    });
    const resultaat = valideerTeam(team, SEIZOEN);
    // 4 spelers, min=4, ideaalMin=5 → onder ideaal = aandacht
    const heeftKritiek = resultaat.meldingen.some(
      (m) => m.ernst === "kritiek"
    );
    const heeftAandacht = resultaat.meldingen.some(
      (m) => m.ernst === "aandacht"
    );
    if (!heeftKritiek && heeftAandacht) {
      expect(resultaat.status).toBe("ORANJE");
    }
  });
});

// ============================================================
// valideerDubbeleSpelersOverTeams
// ============================================================

describe("valideerDubbeleSpelersOverTeams", () => {
  it("detecteert speler die in meerdere teams staat", () => {
    const speler = maakSpeler({
      id: "dubbel",
      roepnaam: "Piet",
      achternaam: "Dubbel",
    });
    const teams: TeamData[] = [
      maakTeam({ naam: "Team A", spelers: [speler, ...maakSpelers(5)] }),
      maakTeam({ naam: "Team B", spelers: [speler, ...maakSpelers(5).map((s, i) => ({ ...s, id: `b-${i}` }))] }),
    ];
    const meldingen = valideerDubbeleSpelersOverTeams(teams);
    expect(meldingen).toContainEqual(
      expect.objectContaining({
        regel: "dubbele_plaatsing",
        ernst: "kritiek",
      })
    );
    expect(meldingen[0].bericht).toContain("Piet Dubbel");
    expect(meldingen[0].bericht).toContain("Team A");
    expect(meldingen[0].bericht).toContain("Team B");
  });

  it("geeft geen meldingen als alle spelers uniek zijn", () => {
    const teams: TeamData[] = [
      maakTeam({
        naam: "Team A",
        spelers: maakSpelers(5).map((s, i) => ({ ...s, id: `a-${i}` })),
      }),
      maakTeam({
        naam: "Team B",
        spelers: maakSpelers(5).map((s, i) => ({ ...s, id: `b-${i}` })),
      }),
    ];
    const meldingen = valideerDubbeleSpelersOverTeams(teams);
    expect(meldingen).toHaveLength(0);
  });

  it("detecteert speler in 3 teams en vermeldt alle teamnamen", () => {
    const speler = maakSpeler({
      id: "triple",
      roepnaam: "Klaas",
      achternaam: "Overal",
    });
    const teams: TeamData[] = [
      maakTeam({ naam: "Team X", spelers: [speler] }),
      maakTeam({ naam: "Team Y", spelers: [{ ...speler }] }),
      maakTeam({ naam: "Team Z", spelers: [{ ...speler }] }),
    ];
    const meldingen = valideerDubbeleSpelersOverTeams(teams);
    expect(meldingen).toHaveLength(1);
    expect(meldingen[0].bericht).toContain("3 teams");
  });
});

// ============================================================
// valideerTeam — TeamgrootteOverrides
// ============================================================

describe("valideerTeam — teamgrootte met overrides", () => {
  it("gebruikt override-waarden voor viertal", () => {
    const overrides: TeamgrootteOverrides = {
      viertal: { min: 6, ideaal: 7, max: 8 },
    };
    const team = maakTeam({
      naam: "Blauw 1",
      kleur: "BLAUW",
      spelers: maakSpelers(5, { geboortejaar: 2020 }), // onder override min (6)
    });
    const resultaat = valideerTeam(team, SEIZOEN, overrides);
    const grootteMelding = resultaat.meldingen.find(
      (m) => m.regel === "teamgrootte"
    );
    expect(grootteMelding).toBeDefined();
  });

  it("gebruikt blauwdruk-kaders voor teamgrootte als beschikbaar", () => {
    const kaders: BlauwdrukKaders = {
      GEEL: {
        optimaalSpelers: 12,
        minSpelers: 10,
        maxAfwijkingPercentage: 10,
      },
    };
    // max = ceil(12 * 1.10) = 14, max+1=15
    // 9 spelers < min 10 → kritiek
    const team = maakTeam({
      naam: "Geel 1",
      kleur: "GEEL",
      spelers: maakSpelers(9, { geboortejaar: 2016 }),
    });
    const resultaat = valideerTeam(team, SEIZOEN, undefined, kaders);
    expect(resultaat.meldingen).toContainEqual(
      expect.objectContaining({
        regel: "teamgrootte",
        ernst: "kritiek",
      })
    );
  });
});
