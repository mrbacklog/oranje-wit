import { vi, describe, it, expect, beforeEach } from "vitest";
import { createMockPrisma, callRoute } from "@oranje-wit/test-utils";

// -- Mocks --
const mockPrisma = createMockPrisma();
vi.mock("@/lib/teamindeling/db/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@oranje-wit/database", () => ({ prisma: mockPrisma }));

const { PATCH } = await import("./route");

describe("PATCH /api/spelers/[id]/rating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("update rating voor een speler", async () => {
    mockPrisma.speler.update.mockResolvedValue({
      id: "NJH39X4",
      rating: 180,
      ratingBerekend: 170,
    });

    const result = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: "NJH39X4" },
      body: { rating: 180 },
    });

    expect(result.status).toBe(200);
    const data = result.data as { ok: boolean; data: { id: string; rating: number } };
    expect(data.ok).toBe(true);
    expect(data.data.id).toBe("NJH39X4");
    expect(data.data.rating).toBe(180);

    expect(mockPrisma.speler.update).toHaveBeenCalledWith({
      where: { id: "NJH39X4" },
      data: { rating: 180 },
      select: { id: true, rating: true, ratingBerekend: true },
    });
  });

  it("geeft 404 als speler niet bestaat", async () => {
    mockPrisma.speler.update.mockRejectedValue(new Error("Record not found"));

    const result = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: "ONBEKEND" },
      body: { rating: 100 },
    });

    expect(result.status).toBe(404);
    const data = result.data as { ok: boolean; error: { code: string } };
    expect(data.error.code).toBe("NOT_FOUND");
  });

  it("valideert: rating te hoog", async () => {
    const result = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: "NJH39X4" },
      body: { rating: 500 },
    });

    expect(result.status).toBe(422);
  });

  it("valideert: rating is geen integer", async () => {
    const result = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: "NJH39X4" },
      body: { rating: 99.5 },
    });

    expect(result.status).toBe(422);
  });

  it("valideert: ontbrekende rating", async () => {
    const result = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: "NJH39X4" },
      body: {},
    });

    expect(result.status).toBe(422);
  });
});
