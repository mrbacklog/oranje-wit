import { vi, describe, it, expect, beforeEach } from "vitest";
import { createMockPrisma } from "@oranje-wit/test-utils";

// ============================================================
// Mocks
// ============================================================

const mockPrisma = createMockPrisma();

vi.mock("@/lib/teamindeling/db/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/teamindeling/seizoen", () => ({
  getActiefSeizoen: vi.fn().mockResolvedValue("2025-2026"),
}));

// ============================================================
// Import NA mocks
// ============================================================

const { getMijlpalen, getWerkindelingOverzicht } = await import("./actions");

// ============================================================
// Tests
// ============================================================

describe("dashboard/actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----------------------------------------------------------
  // getMijlpalen
  // ----------------------------------------------------------

  describe("getMijlpalen", () => {
    it("haalt mijlpalen op voor het actieve seizoen", async () => {
      const mockData = [
        { id: "m1", seizoen: "2025-2026", label: "Blauwdruk af", volgorde: 1 },
        { id: "m2", seizoen: "2025-2026", label: "Concepten delen", volgorde: 2 },
      ];
      mockPrisma.mijlpaal.findMany.mockResolvedValueOnce(mockData);

      const result = await getMijlpalen();

      expect(result).toEqual(mockData);
      expect(mockPrisma.mijlpaal.findMany).toHaveBeenCalledWith({
        where: { seizoen: "2025-2026" },
        orderBy: { volgorde: "asc" },
      });
    });

    it("retourneert lege array als er geen mijlpalen zijn", async () => {
      mockPrisma.mijlpaal.findMany.mockResolvedValueOnce([]);

      const result = await getMijlpalen();

      expect(result).toEqual([]);
    });
  });

  // ----------------------------------------------------------
  // getWerkindelingOverzicht
  // ----------------------------------------------------------

  describe("getWerkindelingOverzicht", () => {
    it("retourneert lege array als er geen blauwdruk is", async () => {
      mockPrisma.kaders.findFirst.mockResolvedValueOnce(null);

      const result = await getWerkindelingOverzicht();

      expect(result).toEqual([]);
      expect(mockPrisma.werkindeling.findMany).not.toHaveBeenCalled();
    });

    it("haalt werkindelingen op via de blauwdruk", async () => {
      mockPrisma.kaders.findFirst.mockResolvedValueOnce({ id: "bp-1" });
      const mockWerkindelingen = [
        {
          id: "w1",
          naam: "Basis",
          status: "CONCEPT",
          updatedAt: new Date("2026-01-15"),
          _count: { versies: 2 },
        },
      ];
      mockPrisma.werkindeling.findMany.mockResolvedValueOnce(mockWerkindelingen);

      const result = await getWerkindelingOverzicht();

      expect(result).toEqual(mockWerkindelingen);
      expect(mockPrisma.werkindeling.findMany).toHaveBeenCalledWith({
        where: { kadersId: "bp-1", verwijderdOp: null },
        select: {
          id: true,
          naam: true,
          status: true,
          updatedAt: true,
          _count: { select: { versies: true } },
        },
        orderBy: { updatedAt: "desc" },
      });
    });
  });
});
