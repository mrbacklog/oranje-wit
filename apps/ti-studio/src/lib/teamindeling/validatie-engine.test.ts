import { describe, it, expect } from "vitest";
import { berekenTeamValidatie } from "./validatie-engine";
import type { WerkbordTeam, WerkbordSpelerInTeam } from "@/components/werkbord/types";
import type { TcKader } from "@/app/(protected)/kader/kader-defaults";

const KADER_SEN_A: Record<string, TcKader> = {
  SEN_A: {
    teamMin: 9,
    teamIdeaal: 10,
    teamMax: 12,
    damesMin: 4,
    damesIdeaal: 5,
    damesMax: 7,
    herenMin: 4,
    herenIdeaal: 5,
    herenMax: 7,
  },
};

function maakSpeler(id: string, geslacht: "V" | "M"): WerkbordSpelerInTeam {
  return {
    id,
    spelerId: id,
    notitie: null,
    speler: {
      id,
      roepnaam: `Speler${id}`,
      tussenvoegsel: null,
      achternaam: "Test",
      geboortejaar: 2000,
      geboortedatum: null,
      geslacht,
      status: "BESCHIKBAAR",
      sportlinkStatus: "BESCHIKBAAR",
      rating: null,
      notitie: null,
      afmelddatum: null,
      teamId: null,
      gepind: false,
      isNieuw: false,
      openMemoCount: 0,
      ussScore: null,
      fotoUrl: null,
      huidigTeam: null,
      ingedeeldTeamNaam: null,
      selectieGroepId: "groep-1",
    },
  };
}

function maakBasisTeam(overrides: Partial<WerkbordTeam> = {}): WerkbordTeam {
  return {
    id: "team-1",
    naam: "OW1",
    categorie: "SENIOREN",
    kleur: "senior",
    formaat: "achtal",
    volgorde: 1,
    canvasX: 0,
    canvasY: 0,
    dames: [],
    heren: [],
    staf: [],
    ussScore: null,
    gemiddeldeLeeftijd: null,
    validatieStatus: "ok",
    validatieCount: 0,
    teamCategorie: "SENIOREN",
    niveau: "A",
    selectieGroepId: null,
    selectieNaam: null,
    selectieDames: [],
    selectieHeren: [],
    gebundeld: false,
    werkitems: [],
    openMemoCount: 0,
    ...overrides,
  };
}

describe("berekenTeamValidatie", () => {
  it("valideert normaal team op eigen dames/heren", () => {
    const dames = ["d1", "d2", "d3", "d4", "d5"].map((id) => maakSpeler(id, "V"));
    const heren = ["h1", "h2", "h3", "h4", "h5"].map((id) => maakSpeler(id, "M"));
    const team = maakBasisTeam({ dames, heren });
    const items = berekenTeamValidatie(team, KADER_SEN_A, new Date(2026, 11, 31));
    expect(items.filter((i) => i.type === "err")).toHaveLength(0);
  });

  it("geeft fout wanneer gebundeld team GEEN selectiespelers heeft", () => {
    const team = maakBasisTeam({ gebundeld: true, selectieGroepId: "groep-1" });
    const items = berekenTeamValidatie(team, KADER_SEN_A, new Date(2026, 11, 31));
    expect(items.some((i) => i.type === "err" && i.regel === "Te weinig spelers")).toBe(true);
  });

  it("valideert gecombineerd team op selectieDames en selectieHeren", () => {
    const selectieDames = ["d1", "d2", "d3", "d4", "d5"].map((id) => maakSpeler(id, "V"));
    const selectieHeren = ["h1", "h2", "h3", "h4", "h5"].map((id) => maakSpeler(id, "M"));
    const team = maakBasisTeam({
      gebundeld: true,
      selectieGroepId: "groep-1",
      selectieDames,
      selectieHeren,
    });
    const items = berekenTeamValidatie(team, KADER_SEN_A, new Date(2026, 11, 31));
    expect(items.filter((i) => i.type === "err")).toHaveLength(0);
  });
});
