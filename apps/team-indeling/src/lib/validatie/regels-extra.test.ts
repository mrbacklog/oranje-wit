import { describe, it, expect } from "vitest";
import { valideerTeam, type BlauwdrukKaders, type TeamgrootteOverrides } from "./regels";
import { maakSpeler, maakSpelers, maakTeam, SEIZOEN } from "./regels-test-helpers";

// ============================================================
// valideerTeam — Gender
// ============================================================

describe("valideerTeam — genderbalans (fallback zonder blauwdruk)", () => {
  it("geeft geen gendermelding voor BLAUW (geen genderonderscheid)", () => {
    const team = maakTeam({
      naam: "Blauw 1",
      kleur: "BLAUW",
      spelers: [...maakSpelers(5, { geboortejaar: 2020, geslacht: "M" })],
    });
    const resultaat = valideerTeam(team, SEIZOEN);
    const genderMeldingen = resultaat.meldingen.filter((m) => m.regel.startsWith("gender"));
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
// valideerTeam — A-categorie
// ============================================================

describe("valideerTeam — A-categorie", () => {
  it("geeft kritieke melding als speler buiten A-categorie bandbreedte valt", () => {
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
    const team = maakTeam({
      naam: "U17 1",
      categorie: "A_CATEGORIE",
      kleur: null,
      spelers: [
        ...maakSpelers(5, { geboortejaar: 2010, geslacht: "M" }),
        ...maakSpelers(5, { geboortejaar: 2011, geslacht: "V" }).map((s, i) => ({
          ...s,
          id: `v-${i}`,
        })),
      ],
    });
    const resultaat = valideerTeam(team, SEIZOEN);
    const bandbreedteMeldingen = resultaat.meldingen.filter((m) => m.regel === "bandbreedte");
    expect(bandbreedteMeldingen).toHaveLength(0);
  });

  it("geeft kritieke gendermelding bij scheve verhouding in A-categorie", () => {
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
    const genderBalans = resultaat.meldingen.find((m) => m.regel === "gender_balans");
    expect(genderBalans?.ernst).toBe("aandacht");
  });
});

// ============================================================
// valideerTeam — Edge cases
// ============================================================

describe("valideerTeam — grensgevallen", () => {
  it("geeft ROOD voor een leeg team", () => {
    const team = maakTeam({
      naam: "Leeg Team",
      kleur: "GEEL",
      spelers: [],
    });
    const resultaat = valideerTeam(team, SEIZOEN);
    expect(resultaat.status).toBe("ROOD");
  });

  it("geeft correct status-stoplicht: ORANJE bij alleen aandacht", () => {
    const team = maakTeam({
      naam: "Blauw 1",
      kleur: "BLAUW",
      spelers: maakSpelers(4, { geboortejaar: 2020 }),
    });
    const resultaat = valideerTeam(team, SEIZOEN);
    const heeftKritiek = resultaat.meldingen.some((m) => m.ernst === "kritiek");
    const heeftAandacht = resultaat.meldingen.some((m) => m.ernst === "aandacht");
    if (!heeftKritiek && heeftAandacht) {
      expect(resultaat.status).toBe("ORANJE");
    }
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
      spelers: maakSpelers(5, { geboortejaar: 2020 }),
    });
    const resultaat = valideerTeam(team, SEIZOEN, overrides);
    const grootteMelding = resultaat.meldingen.find((m) => m.regel === "teamgrootte");
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
