// apps/web/src/lib/teamindeling/validatie-engine.test.ts
import { describe, it, expect } from "vitest";
import {
  berekenTeamValidatie,
  berekenValidatieStatus,
  korfbalLeeftijd,
  bepaalKaderSleutel,
} from "./validatie-engine";
import { TC_DEFAULTS } from "@/app/(teamindeling-studio)/ti-studio/kader/kader-defaults";
import type { WerkbordTeam, WerkbordSpelerInTeam } from "@/components/ti-studio/werkbord/types";

const PEILJAAR = 2026;

function maakSpeler(
  id: string,
  geboortejaar: number,
  geslacht: "V" | "M",
  geboortedatum?: string
): WerkbordSpelerInTeam {
  return {
    id,
    spelerId: id,
    speler: {
      id,
      roepnaam: "Test",
      achternaam: id,
      geboortejaar,
      geboortedatum: geboortedatum ?? null,
      geslacht,
      status: "BESCHIKBAAR",
      rating: null,
      notitie: null,
      afmelddatum: null,
      teamId: "team-1",
      gepind: false,
      isNieuw: false,
      huidigTeam: null,
      ingedeeldTeamNaam: null,
      selectieGroepId: null,
    },
    notitie: null,
  };
}

function maakTeam(overrides: Partial<WerkbordTeam>): WerkbordTeam {
  return {
    id: "team-1",
    naam: "Test",
    categorie: "SENIOREN",
    kleur: "senior",
    formaat: "achtal",
    volgorde: 0,
    canvasX: 0,
    canvasY: 0,
    dames: [],
    heren: [],
    staf: [],
    werkitems: [],
    ussScore: null,
    gemiddeldeLeeftijd: null,
    validatieStatus: "ok",
    validatieCount: 0,
    teamCategorie: "SENIOREN",
    niveau: null,
    selectieGroepId: null,
    selectieNaam: null,
    selectieDames: [],
    selectieHeren: [],
    gebundeld: false,
    ...overrides,
  };
}

describe("korfbalLeeftijd", () => {
  it("berekent exact met geboortedatum", () => {
    const leeftijd = korfbalLeeftijd("2009-01-15", 2009, 2026);
    expect(leeftijd).toBeGreaterThan(16.9);
    expect(leeftijd).toBeLessThan(17.1);
  });

  it("valt terug op geboortejaar als datum ontbreekt", () => {
    expect(korfbalLeeftijd(null, 2009, 2026)).toBe(17);
  });
});

describe("bepaalKaderSleutel", () => {
  it("SEN_A voor SENIOREN niveau A", () => {
    expect(
      bepaalKaderSleutel({
        teamCategorie: "SENIOREN",
        niveau: "A",
        kleur: "senior",
        formaat: "achtal",
      })
    ).toBe("SEN_A");
  });
  it("GEEL4 voor geel viertal", () => {
    expect(
      bepaalKaderSleutel({
        teamCategorie: "B_CATEGORIE",
        niveau: null,
        kleur: "geel",
        formaat: "viertal",
      })
    ).toBe("GEEL4");
  });
  it("GEEL8 voor geel achtal", () => {
    expect(
      bepaalKaderSleutel({
        teamCategorie: "B_CATEGORIE",
        niveau: null,
        kleur: "geel",
        formaat: "achtal",
      })
    ).toBe("GEEL8");
  });
  it("null als niveau ontbreekt bij SENIOREN", () => {
    expect(
      bepaalKaderSleutel({
        teamCategorie: "SENIOREN",
        niveau: null,
        kleur: "senior",
        formaat: "achtal",
      })
    ).toBeNull();
  });
});

describe("berekenTeamValidatie", () => {
  it("warn als teamtype niet ingesteld", () => {
    const team = maakTeam({ teamCategorie: "SENIOREN", niveau: null });
    const items = berekenTeamValidatie(team, TC_DEFAULTS, PEILJAAR);
    expect(items).toHaveLength(1);
    expect(items[0].type).toBe("warn");
    expect(items[0].regel).toBe("Teamtype niet ingesteld");
  });

  it("geen items als SEN_A ideaal bezet (5V + 5M = 10)", () => {
    const dames = [1, 2, 3, 4, 5].map((i) => maakSpeler(`v${i}`, 2000, "V"));
    const heren = [1, 2, 3, 4, 5].map((i) => maakSpeler(`m${i}`, 2000, "M"));
    const team = maakTeam({
      teamCategorie: "SENIOREN",
      niveau: "A",
      dames,
      heren,
      gemiddeldeLeeftijd: 26,
    });
    const items = berekenTeamValidatie(team, TC_DEFAULTS, PEILJAAR);
    expect(items).toHaveLength(0);
  });

  it("err te weinig spelers + err te weinig dames + err te weinig heren (SEN_A, 3V+3M)", () => {
    const team = maakTeam({
      teamCategorie: "SENIOREN",
      niveau: "A",
      dames: [1, 2, 3].map((i) => maakSpeler(`v${i}`, 2000, "V")),
      heren: [1, 2, 3].map((i) => maakSpeler(`m${i}`, 2000, "M")),
      gemiddeldeLeeftijd: 26,
    });
    const items = berekenTeamValidatie(team, TC_DEFAULTS, PEILJAAR);
    const regels = items.map((i) => i.regel);
    expect(regels).toContain("Te weinig spelers");
    expect(regels).toContain("Te weinig dames");
    expect(regels).toContain("Te weinig heren");
    expect(items.every((i) => i.type === "err")).toBe(true);
  });

  it("warn onder ideaal voor SEN_A met 4V+4M=8", () => {
    const team = maakTeam({
      teamCategorie: "SENIOREN",
      niveau: "A",
      dames: [1, 2, 3, 4].map((i) => maakSpeler(`v${i}`, 2000, "V")),
      heren: [1, 2, 3, 4].map((i) => maakSpeler(`m${i}`, 2000, "M")),
      gemiddeldeLeeftijd: 26,
    });
    const items = berekenTeamValidatie(team, TC_DEFAULTS, PEILJAAR);
    expect(items.some((i) => i.regel === "Onder ideaalgrootte")).toBe(true);
    expect(items.every((i) => i.type !== "err")).toBe(true);
  });

  it("err speler te oud voor U17 (geboortedatum 2007-01-15 → ~19 jaar in 2026)", () => {
    const teOud = maakSpeler("v1", 2007, "V", "2007-01-15");
    const team = maakTeam({
      teamCategorie: "A_CATEGORIE",
      niveau: "U17",
      dames: [teOud, ...[2009, 2010, 2010, 2011].map((y, i) => maakSpeler(`v${i + 2}`, y, "V"))],
      heren: [2009, 2010, 2010, 2011].map((y, i) => maakSpeler(`m${i}`, y, "M")),
      gemiddeldeLeeftijd: 16,
    });
    const items = berekenTeamValidatie(team, TC_DEFAULTS, PEILJAAR);
    expect(
      items.some((i) => i.type === "err" && i.laag === "KNKV" && i.regel.includes("te oud"))
    ).toBe(true);
  });

  it("err bandbreedte overschreden voor ROOD (spreiding > 3 jaar)", () => {
    const spelersV = [
      maakSpeler("v1", 2010, "V", "2010-06-01"), // 16.6 jaar
      maakSpeler("v2", 2014, "V", "2014-01-01"), // 12.0 jaar → spread 4.6 > 3
    ];
    const spelersM = [2010, 2011, 2012, 2013].map((y, i) => maakSpeler(`m${i}`, y, "M"));
    const team = maakTeam({
      teamCategorie: "B_CATEGORIE",
      kleur: "rood",
      dames: spelersV,
      heren: spelersM,
      gemiddeldeLeeftijd: 14,
    });
    const items = berekenTeamValidatie(team, TC_DEFAULTS, PEILJAAR);
    expect(
      items.some((i) => i.regel === "Leeftijdsbandbreedte overschreden" && i.laag === "KNKV")
    ).toBe(true);
  });
});

describe("berekenValidatieStatus", () => {
  it("err als er een err item is", () => {
    expect(
      berekenValidatieStatus([
        { teamId: "t1", type: "warn", regel: "x", beschrijving: "y" },
        { teamId: "t1", type: "err", regel: "a", beschrijving: "b" },
      ])
    ).toBe("err");
  });
  it("warn als alleen warn items", () => {
    expect(
      berekenValidatieStatus([{ teamId: "t1", type: "warn", regel: "x", beschrijving: "y" }])
    ).toBe("warn");
  });
  it("ok als lege array", () => {
    expect(berekenValidatieStatus([])).toBe("ok");
  });
});
