import { describe, expect, it } from "vitest";
import type { PresentatieTeam } from "./presentatie-types";
import {
  DEFAULT_PUBLICATIE_SECTIES,
  bouwPreseasonPdfSecties,
  formatPubliekeSpelerNaam,
} from "./preseason-pdf-data";

function speler(overrides: Partial<PresentatieTeam["dames"][number]> = {}) {
  return {
    relCode: overrides.relCode ?? "REL-1",
    roepnaam: overrides.roepnaam ?? "Sara",
    achternaam: overrides.achternaam ?? "Boshoven",
    tussenvoegsel: overrides.tussenvoegsel ?? null,
    geslacht: overrides.geslacht ?? "V",
    geboortedatum: overrides.geboortedatum ?? "2010-01-01",
    geboortejaar: overrides.geboortejaar ?? 2010,
    fotoUrl: overrides.fotoUrl ?? "/foto",
    status: overrides.status ?? "BESCHIKBAAR",
    isNieuw: overrides.isNieuw ?? false,
    huidigTeam: overrides.huidigTeam ?? "J4",
  } satisfies PresentatieTeam["dames"][number];
}

function team(overrides: Partial<PresentatieTeam> = {}): PresentatieTeam {
  return {
    id: overrides.id ?? "team-1",
    naam: overrides.naam ?? "Oranje Wit J1",
    kleur: overrides.kleur ?? "rood",
    teamCategorie: overrides.teamCategorie ?? "B_CATEGORIE",
    teamType: overrides.teamType ?? "achttal",
    niveau: overrides.niveau ?? null,
    volgorde: overrides.volgorde ?? 1,
    soort: overrides.soort ?? "team",
    gebundeld: overrides.gebundeld ?? false,
    dames: overrides.dames ?? [speler()],
    heren: overrides.heren ?? [],
    leden: overrides.leden ?? [],
    staf: overrides.staf ?? [],
    opmerkingen: overrides.opmerkingen ?? [],
    aantalDames: overrides.aantalDames ?? (overrides.dames ?? [speler()]).length,
    aantalHeren: overrides.aantalHeren ?? (overrides.heren ?? []).length,
    gemiddeldeLeeftijd: overrides.gemiddeldeLeeftijd ?? 15.2,
    validatieCount: overrides.validatieCount ?? 0,
    openMemoCount: overrides.openMemoCount ?? 0,
  };
}

describe("preseason PDF data", () => {
  it("houdt de bestaande teamvolgorde binnen publicatiesecties aan", () => {
    const secties = bouwPreseasonPdfSecties([
      team({ id: "j2", naam: "Oranje Wit J2", kleur: "rood", volgorde: 20 }),
      team({
        id: "s1",
        naam: "Oranje Wit 1",
        teamCategorie: "SENIOREN",
        kleur: null,
        volgorde: 10,
      }),
      team({ id: "j1", naam: "Oranje Wit J1", kleur: "rood", volgorde: 5 }),
      team({ id: "j7", naam: "Oranje Wit J7", kleur: "geel", volgorde: 30 }),
    ]);

    expect(secties.map((sectie) => sectie.titel)).toEqual([
      "Senioren-teams",
      "U-19 / Rood",
      "Geel",
    ]);
    expect(
      secties.find((sectie) => sectie.titel === "U-19 / Rood")?.teams.map((t) => t.naam)
    ).toEqual(["Oranje Wit J1", "Oranje Wit J2"]);
  });

  it("publiceert alleen namen en staf, geen geboortedatum of vorig team", () => {
    const secties = bouwPreseasonPdfSecties([
      team({
        dames: [
          speler({
            relCode: "REL-2",
            roepnaam: "Demi",
            achternaam: "Dijk",
            tussenvoegsel: "van",
            geboortedatum: "2012-05-06",
            huidigTeam: "Oranje Wit J3",
          }),
        ],
        staf: [{ stafId: "staf-1", naam: "Menno Kop", rol: "Trainer/Coach" }],
      }),
    ]);

    expect(secties[0].teams[0].dames).toEqual(["Dijk, D. (Demi) van"]);
    expect(JSON.stringify(secties)).not.toContain("2012-05-06");
    expect(JSON.stringify(secties)).not.toContain("Oranje Wit J3");
    expect(JSON.stringify(secties)).not.toContain("REL-2");
  });

  it("ondersteunt de standaardsecties van de pre-season publicatie", () => {
    expect(DEFAULT_PUBLICATIE_SECTIES.map((sectie) => sectie.titel)).toEqual([
      "Senioren-teams",
      "U-19 / Rood",
      "U-17 / U-15 / Oranje",
      "Geel",
      "Groen",
      "Blauw",
    ]);
  });

  it("formatteert publieke spelersnamen zoals de bestaande PDF", () => {
    expect(formatPubliekeSpelerNaam(speler({ roepnaam: "Lois", achternaam: "Fernhout" }))).toBe(
      "Fernhout, L. (Lois)"
    );
    expect(
      formatPubliekeSpelerNaam(
        speler({ roepnaam: "Seth", achternaam: "Burgt", tussenvoegsel: "van de" })
      )
    ).toBe("Burgt, S. (Seth) van de");
  });
});
