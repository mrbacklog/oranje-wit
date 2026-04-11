// apps/web/src/app/(teamindeling-studio)/ti-studio/memo/tijdlijn-utils.test.ts
import { describe, it, expect } from "vitest";
import { mergeTijdlijn, type TijdlijnItem } from "./tijdlijn-utils";

describe("mergeTijdlijn", () => {
  it("combineert toelichtingen en log-items", () => {
    const toelichtingen = [
      {
        id: "t1",
        type: "toelichting" as const,
        auteurNaam: "Antjan",
        auteurEmail: "a@ow.nl",
        tekst: "hoi",
        timestamp: "2026-04-10T10:00:00.000Z",
      },
    ];
    const logItems = [
      {
        id: "l1",
        type: "log" as const,
        auteurNaam: "Thomas",
        auteurEmail: "t@ow.nl",
        actie: "STATUS_GEWIJZIGD",
        detail: "OPEN",
        timestamp: "2026-04-10T11:00:00.000Z",
      },
    ];
    const result = mergeTijdlijn(toelichtingen, logItems);
    expect(result).toHaveLength(2);
  });

  it("sorteert nieuwste eerst (DESC)", () => {
    const toelichtingen = [
      {
        id: "t1",
        type: "toelichting" as const,
        auteurNaam: "A",
        auteurEmail: "a@ow.nl",
        tekst: "oud",
        timestamp: "2026-04-10T08:00:00.000Z",
      },
      {
        id: "t2",
        type: "toelichting" as const,
        auteurNaam: "A",
        auteurEmail: "a@ow.nl",
        tekst: "nieuw",
        timestamp: "2026-04-10T12:00:00.000Z",
      },
    ];
    const result = mergeTijdlijn(toelichtingen, []);
    expect(result[0].id).toBe("t2");
    expect(result[1].id).toBe("t1");
  });
});
