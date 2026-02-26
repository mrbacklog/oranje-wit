import { describe, it, expect } from "vitest";
import { HUIDIG_SEIZOEN, getSeizoen } from "./seizoen";

describe("seizoen utilities", () => {
  describe("HUIDIG_SEIZOEN", () => {
    it("is een geldig seizoen formaat (YYYY-YYYY)", () => {
      expect(HUIDIG_SEIZOEN).toMatch(/^\d{4}-\d{4}$/);
    });

    it("het tweede jaar is één meer dan het eerste", () => {
      const [start, end] = HUIDIG_SEIZOEN.split("-").map(Number);
      expect(end).toBe(start + 1);
    });
  });

  describe("getSeizoen", () => {
    it("geeft het seizoen uit searchParams terug als dat er is", () => {
      expect(getSeizoen({ seizoen: "2023-2024" })).toBe("2023-2024");
    });

    it("geeft HUIDIG_SEIZOEN terug als seizoen ontbreekt", () => {
      expect(getSeizoen({})).toBe(HUIDIG_SEIZOEN);
    });

    it("geeft HUIDIG_SEIZOEN terug als seizoen undefined is", () => {
      expect(getSeizoen({ seizoen: undefined })).toBe(HUIDIG_SEIZOEN);
    });
  });
});
