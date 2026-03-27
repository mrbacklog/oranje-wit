import { vi, describe, it, expect, beforeEach } from "vitest";
import { createMockPrisma } from "@oranje-wit/test-utils";

// ============================================================
// Mocks
// ============================================================

const mockPrisma = createMockPrisma();
const mockBerekenAlleRatings = vi.fn();

vi.mock("@/lib/teamindeling/db/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/teamindeling/auth-check", () => ({
  requireTC: vi.fn().mockResolvedValue({
    user: { email: "antjanlaban@gmail.com", name: "Test", role: "EDITOR" },
  }),
}));

vi.mock("@/lib/teamindeling/rating", () => ({
  berekenAlleRatings: mockBerekenAlleRatings,
}));

// ============================================================
// Import NA mocks
// ============================================================

const { herbereken } = await import("./actions");

// ============================================================
// Tests
// ============================================================

describe("rating/actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("herbereken", () => {
    it("roept berekenAlleRatings aan met het huidige seizoen en prisma", async () => {
      mockBerekenAlleRatings.mockResolvedValueOnce({ bijgewerkt: 42 });

      const result = await herbereken();

      expect(result).toEqual({ bijgewerkt: 42 });
      expect(mockBerekenAlleRatings).toHaveBeenCalledWith(
        expect.any(String), // HUIDIG_SEIZOEN
        mockPrisma
      );
    });

    it("propageert fouten uit berekenAlleRatings", async () => {
      mockBerekenAlleRatings.mockRejectedValueOnce(new Error("Berekening mislukt"));

      await expect(herbereken()).rejects.toThrow("Berekening mislukt");
    });
  });
});
