import { describe, it, expect, vi, beforeEach } from "vitest";

const { teamSpeler, selectieSpeler, werkbordMutatie } = vi.hoisted(() => ({
  teamSpeler: { findFirst: vi.fn() },
  selectieSpeler: { findFirst: vi.fn() },
  werkbordMutatie: { findFirst: vi.fn() },
}));
vi.mock("@/lib/teamindeling/db/prisma", () => ({
  prisma: { teamSpeler, selectieSpeler, werkbordMutatie },
}));

import { bepaalHuidigeLocatie, vergelijkLocatie, laatsteMutatieVoor } from "./huidige-locatie";

describe("bepaalHuidigeLocatie", () => {
  beforeEach(() => {
    teamSpeler.findFirst.mockReset();
    selectieSpeler.findFirst.mockReset();
    werkbordMutatie.findFirst.mockReset();
  });

  it("returnt pool als geen team en geen selectie", async () => {
    teamSpeler.findFirst.mockResolvedValue(null);
    selectieSpeler.findFirst.mockResolvedValue(null);
    const r = await bepaalHuidigeLocatie("v1", "HANDMATIG-tycho");
    expect(r).toEqual({ soort: "pool" });
  });

  it("returnt team als TeamSpeler gevonden", async () => {
    teamSpeler.findFirst.mockResolvedValue({ teamId: "t-sen2" });
    selectieSpeler.findFirst.mockResolvedValue(null);
    const r = await bepaalHuidigeLocatie("v1", "HANDMATIG-tycho");
    expect(r).toEqual({ soort: "team", teamId: "t-sen2" });
  });

  it("returnt selectie als SelectieSpeler gevonden", async () => {
    teamSpeler.findFirst.mockResolvedValue(null);
    selectieSpeler.findFirst.mockResolvedValue({ selectieGroepId: "sg-1" });
    const r = await bepaalHuidigeLocatie("v1", "HANDMATIG-tycho");
    expect(r).toEqual({ soort: "selectie", selectieGroepId: "sg-1" });
  });

  it("prefereert team boven selectie als beide gevonden (defensief)", async () => {
    teamSpeler.findFirst.mockResolvedValue({ teamId: "t-sen2" });
    selectieSpeler.findFirst.mockResolvedValue({ selectieGroepId: "sg-1" });
    const r = await bepaalHuidigeLocatie("v1", "HANDMATIG-tycho");
    expect(r).toEqual({ soort: "team", teamId: "t-sen2" });
  });
});

describe("vergelijkLocatie", () => {
  it("gelijk pool/pool", () => {
    expect(vergelijkLocatie({ soort: "pool" }, { soort: "pool" })).toBe(true);
  });
  it("ongelijk pool/team", () => {
    expect(vergelijkLocatie({ soort: "pool" }, { soort: "team", teamId: "t1" })).toBe(false);
  });
  it("gelijk team/team zelfde id", () => {
    expect(vergelijkLocatie({ soort: "team", teamId: "t1" }, { soort: "team", teamId: "t1" })).toBe(
      true
    );
  });
  it("ongelijk team/team andere id", () => {
    expect(vergelijkLocatie({ soort: "team", teamId: "t1" }, { soort: "team", teamId: "t2" })).toBe(
      false
    );
  });
  it("gelijk selectie/selectie zelfde id", () => {
    expect(
      vergelijkLocatie(
        { soort: "selectie", selectieGroepId: "sg-1" },
        { soort: "selectie", selectieGroepId: "sg-1" }
      )
    ).toBe(true);
  });
  it("ongelijk selectie/selectie andere id", () => {
    expect(
      vergelijkLocatie(
        { soort: "selectie", selectieGroepId: "sg-1" },
        { soort: "selectie", selectieGroepId: "sg-2" }
      )
    ).toBe(false);
  });
});

describe("laatsteMutatieVoor", () => {
  beforeEach(() => werkbordMutatie.findFirst.mockReset());

  it("returnt null als geen mutatie", async () => {
    werkbordMutatie.findFirst.mockResolvedValue(null);
    const r = await laatsteMutatieVoor("v1", "HANDMATIG-tycho");
    expect(r).toBeNull();
  });

  it("returnt naam + sessionId + tijdstip bij gevonden mutatie", async () => {
    const tijdstip = new Date("2026-05-18T18:24:00Z");
    werkbordMutatie.findFirst.mockResolvedValue({
      sessionId: "sess-merel",
      createdAt: tijdstip,
      door: { naam: "Merel van Gurp" },
    });
    const r = await laatsteMutatieVoor("v1", "HANDMATIG-tycho");
    expect(r).toEqual({ naam: "Merel van Gurp", sessionId: "sess-merel", tijdstip });
  });
});
