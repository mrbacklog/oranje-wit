import { vi, describe, it, expect, beforeEach } from "vitest";
import { createMockPrisma, callRoute } from "@oranje-wit/test-utils";

// -- Mocks --
const mockPrisma = createMockPrisma();
vi.mock("@/lib/teamindeling/db/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@oranje-wit/database", () => ({ prisma: mockPrisma }));

const mockBerekenAlleRatings = vi.fn();
vi.mock("@/lib/teamindeling/rating", () => ({
  berekenAlleRatings: (...args: unknown[]) => mockBerekenAlleRatings(...args),
}));

vi.mock("@oranje-wit/types", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@oranje-wit/types")>();
  return {
    ...actual,
    HUIDIG_SEIZOEN: "2025-2026",
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  };
});

const { POST } = await import("./route");

describe("POST /api/ratings/herbereken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("herberekent alle ratings voor het huidige seizoen", async () => {
    mockBerekenAlleRatings.mockResolvedValue({
      bijgewerkt: 42,
      overgeslagen: 5,
    });

    const result = await callRoute(POST, { method: "POST" });

    expect(result.status).toBe(200);
    const data = result.data as { ok: boolean; data: { bijgewerkt: number } };
    expect(data.ok).toBe(true);
    expect(data.data.bijgewerkt).toBe(42);

    // Controle: correcte seizoen en prisma doorgegeven
    expect(mockBerekenAlleRatings).toHaveBeenCalledWith("2025-2026", mockPrisma);
  });

  it("geeft 500 als berekening faalt", async () => {
    mockBerekenAlleRatings.mockRejectedValue(new Error("Database timeout"));

    const result = await callRoute(POST, { method: "POST" });

    expect(result.status).toBe(500);
    const data = result.data as { ok: boolean; error: { message: string } };
    expect(data.ok).toBe(false);
    expect(data.error.message).toContain("Database timeout");
  });
});
