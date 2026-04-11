// apps/web/src/app/(teamindeling-studio)/ti-studio/memo/kanban-filter.test.ts
import { describe, it, expect } from "vitest";
import { filterWerkitems, type FilterType } from "./kanban-filter";

const basis = {
  id: "1",
  status: "OPEN",
  prioriteit: "MIDDEL",
  beschrijving: "test",
  volgorde: 0,
  createdAt: "2026-04-01T00:00:00.000Z",
  teamId: null,
  spelerId: null,
  stafId: null,
  doelgroep: null,
  team: null,
  speler: null,
  staf: null,
};

describe("filterWerkitems", () => {
  it("alles geeft alle items terug", () => {
    const items = [
      { ...basis, id: "1", teamId: "t1" },
      { ...basis, id: "2", spelerId: "s1" },
    ];
    expect(filterWerkitems(items, "alles")).toHaveLength(2);
  });

  it("team filtert op teamId not null", () => {
    const items = [
      { ...basis, id: "1", teamId: "t1" },
      { ...basis, id: "2", spelerId: "s1" },
    ];
    expect(filterWerkitems(items, "team")).toHaveLength(1);
    expect(filterWerkitems(items, "team")[0].id).toBe("1");
  });

  it("speler filtert op spelerId not null", () => {
    const items = [{ ...basis, id: "2", spelerId: "s1" }];
    expect(filterWerkitems(items, "speler")).toHaveLength(1);
  });

  it("doelgroep filtert op doelgroep not null en not ALLE", () => {
    const items = [
      { ...basis, id: "3", doelgroep: "TOP" },
      { ...basis, id: "4", doelgroep: "ALLE" },
    ];
    expect(filterWerkitems(items, "doelgroep")).toHaveLength(1);
    expect(filterWerkitems(items, "doelgroep")[0].id).toBe("3");
  });

  it("tc-algemeen filtert op doelgroep === ALLE", () => {
    const items = [
      { ...basis, id: "4", doelgroep: "ALLE" },
      { ...basis, id: "5", doelgroep: "TOP" },
    ];
    expect(filterWerkitems(items, "tc-algemeen")).toHaveLength(1);
    expect(filterWerkitems(items, "tc-algemeen")[0].id).toBe("4");
  });
});
