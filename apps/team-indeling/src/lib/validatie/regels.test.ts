import { describe, it, expect } from "vitest";
import { valideerTeam, valideerDubbeleSpelersOverTeams, type TeamData } from "./regels";
import { maakSpeler, maakSpelers, maakTeam, SEIZOEN } from "./regels-test-helpers";

// ============================================================
// valideerTeam — Teamgrootte
// ============================================================

describe("valideerTeam — teamgrootte", () => {
  it("geeft GROEN voor een team met ideale grootte (achttal)", () => {
    const team = maakTeam({
      naam: "Geel 1",
      kleur: "GEEL",
      spelers: maakSpelers(10, { geboortejaar: 2016, geslacht: "M" })
        .concat(
          maakSpelers(10, {
            geboortejaar: 2016,
            geslacht: "V",
          }).map((s, i) => ({ ...s, id: `v-${i}` }))
        )
        .slice(0, 10),
    });
    const resultaat = valideerTeam(team, SEIZOEN);
    const teamgrootteMeldingen = resultaat.meldingen.filter((m) => m.regel === "teamgrootte");
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
    const team = maakTeam({
      naam: "Geel 1",
      kleur: "GEEL",
      spelers: maakSpelers(8, { geboortejaar: 2016 }),
    });
    const resultaat = valideerTeam(team, SEIZOEN);
    const grootteMelding = resultaat.meldingen.find((m) => m.regel === "teamgrootte");
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
    const grootteMeldingen = resultaat.meldingen.filter((m) => m.regel === "teamgrootte");
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
    const bandbreedteMeldingen = resultaat.meldingen.filter((m) => m.regel === "bandbreedte");
    expect(bandbreedteMeldingen).toHaveLength(0);
  });

  it("geeft kritieke melding bij te grote spreiding in achttal (>3 jr)", () => {
    const team = maakTeam({
      naam: "Oranje 1",
      kleur: "ORANJE",
      spelers: maakSpelers(10, { geboortejaar: 2012 }).map((s, i) => ({
        ...s,
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
        geboortejaar: 2014 + (i % 3),
      })),
    });
    const resultaat = valideerTeam(team, SEIZOEN);
    const bandbreedteMeldingen = resultaat.meldingen.filter((m) => m.regel === "bandbreedte");
    expect(bandbreedteMeldingen).toHaveLength(0);
  });
});

// ============================================================
// valideerTeam — Leeftijd per kleur
// ============================================================

describe("valideerTeam — leeftijd past bij kleur", () => {
  it("geeft aandachtsmelding als speler buiten kleur-leeftijdsrange valt", () => {
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
        }),
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
    const team = maakTeam({
      naam: "Geel 1",
      kleur: "GEEL",
      spelers: maakSpelers(10, { geboortejaar: 2019 }),
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
      spelers: maakSpelers(10, { geboortejaar: 2016 }),
    });
    const resultaat = valideerTeam(team, SEIZOEN);
    const gemLftMeldingen = resultaat.meldingen.filter((m) => m.regel === "gemiddelde_leeftijd");
    expect(gemLftMeldingen).toHaveLength(0);
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
      spelers: [speler, { ...speler }, ...maakSpelers(8, { geboortejaar: 2016 })],
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
      maakTeam({
        naam: "Team B",
        spelers: [speler, ...maakSpelers(5).map((s, i) => ({ ...s, id: `b-${i}` }))],
      }),
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
