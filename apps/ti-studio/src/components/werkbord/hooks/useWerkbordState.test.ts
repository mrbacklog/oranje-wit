// apps/web/src/components/ti-studio/werkbord/hooks/useWerkbordState.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWerkbordState } from "./useWerkbordState";
import type { WerkbordTeam, WerkbordSpeler, WerkbordValidatieItem } from "../types";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/app/indeling/werkindeling-actions", () => ({
  voegSelectieSpelerToe: vi.fn().mockResolvedValue({ ok: true }),
  verwijderSelectieSpeler: vi.fn().mockResolvedValue({ ok: true }),
  toggleSelectieBundeling: vi.fn().mockResolvedValue({ ok: true }),
}));

// fetch en EventSource zijn niet aanwezig in jsdom — minimale stub
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: vi.fn().mockResolvedValue({ validatieUpdates: [] }),
});

// EventSource wordt nooit aangeroepen in deze tests, maar moet bestaan
class MockEventSource {
  onmessage: ((e: MessageEvent) => void) | null = null;
  close = vi.fn();
  constructor(_url: string) {}
}
// @ts-expect-error jsdom heeft geen EventSource
global.EventSource = MockEventSource;

// ── Testdata helpers ─────────────────────────────────────────────────────────

function maakSpeler(
  id: string,
  geslacht: "V" | "M",
  override?: Partial<WerkbordSpeler>
): WerkbordSpeler {
  return {
    id,
    roepnaam: `Speler${id}`,
    achternaam: "Test",
    geboortejaar: 2005,
    geboortedatum: null,
    geslacht,
    status: "BESCHIKBAAR",
    rating: null,
    notitie: null,
    afmelddatum: null,
    teamId: null,
    gepind: false,
    isNieuw: false,
    openMemoCount: 0,
    huidigTeam: null,
    ingedeeldTeamNaam: null,
    selectieGroepId: null,
    ...override,
  };
}

function maakTeam(id: string, override?: Partial<WerkbordTeam>): WerkbordTeam {
  return {
    id,
    naam: `Team ${id}`,
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
    niveau: null,
    selectieGroepId: null,
    selectieNaam: null,
    selectieDames: [],
    selectieHeren: [],
    gebundeld: false,
    werkitems: [],
    openMemoCount: 0,
    ...override,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("useWerkbordState — initialisatie", () => {
  it("begint met de doorgegeven teams en spelers", () => {
    const team = maakTeam("t1");
    const speler = maakSpeler("s1", "V");
    const { result } = renderHook(() => useWerkbordState("versie-1", [team], [speler], []));
    expect(result.current.teams).toHaveLength(1);
    expect(result.current.alleSpelers).toHaveLength(1);
    expect(result.current.validatie).toHaveLength(0);
  });
});

describe("verplaatsTeamKaart — positie update", () => {
  it("werkt canvasX en canvasY bij voor het juiste team", () => {
    const t1 = maakTeam("t1");
    const t2 = maakTeam("t2");
    const { result } = renderHook(() => useWerkbordState("versie-1", [t1, t2], [], []));

    act(() => result.current.verplaatsTeamKaart("t1", 100, 200));

    const bijgewerkt = result.current.teams.find((t) => t.id === "t1");
    expect(bijgewerkt?.canvasX).toBe(100);
    expect(bijgewerkt?.canvasY).toBe(200);
  });

  it("clamp: positie gaat niet onder 0", () => {
    const t1 = maakTeam("t1");
    const { result } = renderHook(() => useWerkbordState("versie-1", [t1], [], []));

    act(() => result.current.verplaatsTeamKaart("t1", -50, -100));

    const bijgewerkt = result.current.teams.find((t) => t.id === "t1");
    expect(bijgewerkt?.canvasX).toBe(0);
    expect(bijgewerkt?.canvasY).toBe(0);
  });

  it("raakt andere teams niet aan", () => {
    const t1 = maakTeam("t1");
    const t2 = maakTeam("t2", { canvasX: 999, canvasY: 999 });
    const { result } = renderHook(() => useWerkbordState("versie-1", [t1, t2], [], []));

    act(() => result.current.verplaatsTeamKaart("t1", 50, 50));

    const ongewijzigd = result.current.teams.find((t) => t.id === "t2");
    expect(ongewijzigd?.canvasX).toBe(999);
    expect(ongewijzigd?.canvasY).toBe(999);
  });
});

describe("verwijderTeamLokaal", () => {
  it("verwijdert het opgegeven team uit de lijst", () => {
    const t1 = maakTeam("t1");
    const t2 = maakTeam("t2");
    const { result } = renderHook(() => useWerkbordState("versie-1", [t1, t2], [], []));

    act(() => result.current.verwijderTeamLokaal("t1"));

    expect(result.current.teams).toHaveLength(1);
    expect(result.current.teams[0].id).toBe("t2");
  });
});

describe("updateTeamLokaal", () => {
  it("past de naam van het team aan", () => {
    const t1 = maakTeam("t1", { naam: "Oud" });
    const { result } = renderHook(() => useWerkbordState("versie-1", [t1], [], []));

    act(() => result.current.updateTeamLokaal("t1", { naam: "Nieuw" }));

    expect(result.current.teams[0].naam).toBe("Nieuw");
  });
});

describe("koppelSelectieLokaal", () => {
  it("zet formaat op selectie en leegt de spelerslijsten", () => {
    const spelerInTeam = {
      id: "sit-1",
      spelerId: "s1",
      speler: maakSpeler("s1", "V"),
      notitie: null,
    };
    const t1 = maakTeam("t1", { dames: [spelerInTeam], gebundeld: true });
    const { result } = renderHook(() => useWerkbordState("versie-1", [t1], [], []));

    act(() => result.current.koppelSelectieLokaal("t1", "sel-groep-1"));

    const team = result.current.teams[0];
    expect(team.selectieGroepId).toBe("sel-groep-1");
    expect(team.formaat).toBe("selectie");
    expect(team.selectieDames).toHaveLength(0);
    expect(team.selectieHeren).toHaveLength(0);
    expect(team.gebundeld).toBe(false);
  });
});

describe("ontkoppelSelectieLokaal — formaat herstel", () => {
  it("herstelt naar achtal voor een senior team", () => {
    const t1 = maakTeam("t1", {
      selectieGroepId: "sel-1",
      formaat: "selectie",
      teamCategorie: "SENIOREN",
      kleur: "senior",
    });
    const { result } = renderHook(() => useWerkbordState("versie-1", [t1], [], []));

    act(() => result.current.ontkoppelSelectieLokaal("sel-1"));

    expect(result.current.teams[0].formaat).toBe("achtal");
    expect(result.current.teams[0].selectieGroepId).toBeNull();
  });

  it("herstelt naar viertal voor B_CATEGORIE blauw", () => {
    const t1 = maakTeam("t1", {
      selectieGroepId: "sel-2",
      formaat: "selectie",
      teamCategorie: "B_CATEGORIE",
      kleur: "blauw",
    });
    const { result } = renderHook(() => useWerkbordState("versie-1", [t1], [], []));

    act(() => result.current.ontkoppelSelectieLokaal("sel-2"));

    expect(result.current.teams[0].formaat).toBe("viertal");
  });

  it("herstelt naar viertal voor B_CATEGORIE groen", () => {
    const t1 = maakTeam("t1", {
      selectieGroepId: "sel-3",
      formaat: "selectie",
      teamCategorie: "B_CATEGORIE",
      kleur: "groen",
    });
    const { result } = renderHook(() => useWerkbordState("versie-1", [t1], [], []));

    act(() => result.current.ontkoppelSelectieLokaal("sel-3"));

    expect(result.current.teams[0].formaat).toBe("viertal");
  });

  it("herstelt naar achtal voor B_CATEGORIE geel (niet blauw of groen)", () => {
    const t1 = maakTeam("t1", {
      selectieGroepId: "sel-4",
      formaat: "selectie",
      teamCategorie: "B_CATEGORIE",
      kleur: "geel",
    });
    const { result } = renderHook(() => useWerkbordState("versie-1", [t1], [], []));

    act(() => result.current.ontkoppelSelectieLokaal("sel-4"));

    expect(result.current.teams[0].formaat).toBe("achtal");
  });

  it("raakt teams met een andere selectieGroepId niet aan", () => {
    const t1 = maakTeam("t1", {
      selectieGroepId: "sel-A",
      formaat: "selectie",
    });
    const t2 = maakTeam("t2", {
      selectieGroepId: "sel-B",
      formaat: "selectie",
    });
    const { result } = renderHook(() => useWerkbordState("versie-1", [t1, t2], [], []));

    act(() => result.current.ontkoppelSelectieLokaal("sel-A"));

    expect(result.current.teams.find((t) => t.id === "t2")?.selectieGroepId).toBe("sel-B");
  });
});

describe("updateSelectieNaamLokaal", () => {
  it("stelt een naam in op alle teams in de selectiegroep", () => {
    const t1 = maakTeam("t1", { selectieGroepId: "sg-1" });
    const t2 = maakTeam("t2", { selectieGroepId: "sg-1" });
    const { result } = renderHook(() => useWerkbordState("versie-1", [t1, t2], [], []));

    act(() => result.current.updateSelectieNaamLokaal("sg-1", "U17 Selectie"));

    result.current.teams
      .filter((t) => t.selectieGroepId === "sg-1")
      .forEach((t) => expect(t.selectieNaam).toBe("U17 Selectie"));
  });

  it("zet selectieNaam op null bij lege string", () => {
    const t1 = maakTeam("t1", { selectieGroepId: "sg-1", selectieNaam: "Bestaand" });
    const { result } = renderHook(() => useWerkbordState("versie-1", [t1], [], []));

    act(() => result.current.updateSelectieNaamLokaal("sg-1", ""));

    expect(result.current.teams[0].selectieNaam).toBeNull();
  });
});

describe("updateValidatieLokaal", () => {
  it("vervangt bestaande validatie-items voor een team", () => {
    const bestaand: WerkbordValidatieItem = {
      teamId: "t1",
      type: "err",
      regel: "V/M balans",
      beschrijving: "Geen balans",
    };
    const { result } = renderHook(() => useWerkbordState("versie-1", [], [], [bestaand]));

    act(() =>
      result.current.updateValidatieLokaal([
        {
          teamId: "t1",
          items: [{ teamId: "t1", type: "ok", regel: "V/M balans", beschrijving: "OK" }],
          status: "ok",
          count: 0,
        },
      ])
    );

    const items = result.current.validatie.filter((v) => v.teamId === "t1");
    expect(items).toHaveLength(1);
    expect(items[0].type).toBe("ok");
  });

  it("past validatieStatus en validatieCount op het bijbehorende team aan", () => {
    const t1 = maakTeam("t1", { validatieStatus: "ok", validatieCount: 0 });
    const { result } = renderHook(() => useWerkbordState("versie-1", [t1], [], []));

    act(() =>
      result.current.updateValidatieLokaal([
        {
          teamId: "t1",
          items: [],
          status: "warn",
          count: 2,
        },
      ])
    );

    const team = result.current.teams[0];
    expect(team.validatieStatus).toBe("warn");
    expect(team.validatieCount).toBe(2);
  });
});

describe("bundelSelectieLokaal (via toggleBundeling)", () => {
  it("voegt dames+heren samen in selectieDames/selectieHeren op primary team", async () => {
    const dame1 = {
      id: "sit-d1",
      spelerId: "s1",
      speler: maakSpeler("s1", "V"),
      notitie: null,
    };
    const heer1 = {
      id: "sit-h1",
      spelerId: "s2",
      speler: maakSpeler("s2", "M"),
      notitie: null,
    };
    const dame2 = {
      id: "sit-d2",
      spelerId: "s3",
      speler: maakSpeler("s3", "V"),
      notitie: null,
    };

    const primary = maakTeam("t1", {
      selectieGroepId: "sg-1",
      formaat: "selectie",
      volgorde: 1,
      dames: [dame1],
      heren: [heer1],
    });
    const partner = maakTeam("t2", {
      selectieGroepId: "sg-1",
      formaat: "selectie",
      volgorde: 2,
      dames: [dame2],
      heren: [],
    });

    const { result } = renderHook(() => useWerkbordState("versie-1", [primary, partner], [], []));

    await act(async () => {
      await result.current.toggleBundeling("sg-1", true);
    });

    const bijgewerktPrimary = result.current.teams.find((t) => t.id === "t1")!;
    expect(bijgewerktPrimary.gebundeld).toBe(true);
    expect(bijgewerktPrimary.selectieDames).toHaveLength(2); // dame1 + dame2
    expect(bijgewerktPrimary.selectieHeren).toHaveLength(1); // heer1
    expect(bijgewerktPrimary.dames).toHaveLength(0);
    expect(bijgewerktPrimary.heren).toHaveLength(0);
  });
});
