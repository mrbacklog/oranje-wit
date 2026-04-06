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
  getActiefSeizoen: vi.fn().mockResolvedValue("2026-2027"),
}));

vi.mock("@/lib/teamindeling/db/werkindeling", () => ({
  getWerkindeling: vi.fn(),
  getWerkindelingId: vi.fn(),
}));

// ============================================================
// Import NA mocks
// ============================================================

const { getWerkindeling } = await import("@/lib/teamindeling/db/werkindeling");
const { getWerkindelingVoorSeizoen, getWerkindelingIdVoorSeizoen } = await import("./actions");
const { getWerkindelingId } = await import("@/lib/teamindeling/db/werkindeling");

// ============================================================
// Tests
// ============================================================

describe("indeling/actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default: blauwdruk gevonden
    mockPrisma.kaders.findUnique.mockResolvedValue({ id: "bp-1" });
  });

  // ----------------------------------------------------------
  // Module sanity check
  // ----------------------------------------------------------

  it("module kan geïmporteerd worden", () => {
    expect(typeof getWerkindelingVoorSeizoen).toBe("function");
    expect(typeof getWerkindelingIdVoorSeizoen).toBe("function");
  });

  // ----------------------------------------------------------
  // getWerkindelingVoorSeizoen
  // ----------------------------------------------------------

  describe("getWerkindelingVoorSeizoen", () => {
    it("roept getWerkindeling aan met blauwdruk ID", async () => {
      vi.mocked(getWerkindeling).mockResolvedValueOnce({
        id: "sc-1",
        naam: "Test",
      } as any);

      const result = await getWerkindelingVoorSeizoen();

      expect(getWerkindeling).toHaveBeenCalledWith("bp-1");
      expect(result).toEqual({ id: "sc-1", naam: "Test" });
    });

    it("retourneert null als geen blauwdruk", async () => {
      mockPrisma.kaders.findUnique.mockResolvedValueOnce(null);

      const result = await getWerkindelingVoorSeizoen();

      expect(result).toBeNull();
      expect(getWerkindeling).not.toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------
  // getWerkindelingIdVoorSeizoen
  // ----------------------------------------------------------

  describe("getWerkindelingIdVoorSeizoen", () => {
    it("retourneert scenario-ID via getWerkindelingId", async () => {
      vi.mocked(getWerkindelingId).mockResolvedValueOnce("sc-42");

      const result = await getWerkindelingIdVoorSeizoen();

      expect(getWerkindelingId).toHaveBeenCalledWith("bp-1");
      expect(result).toBe("sc-42");
    });

    it("retourneert null als geen blauwdruk", async () => {
      mockPrisma.kaders.findUnique.mockResolvedValueOnce(null);

      const result = await getWerkindelingIdVoorSeizoen();

      expect(result).toBeNull();
      expect(getWerkindelingId).not.toHaveBeenCalled();
    });
  });
});
