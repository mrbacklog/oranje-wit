import { vi, describe, it, expect, beforeEach } from "vitest";
import { createMockPrisma, callRoute } from "@oranje-wit/test-utils";

// -- Mocks --
const mockPrisma = createMockPrisma();
vi.mock("@/lib/db/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@oranje-wit/database", () => ({ prisma: mockPrisma }));

// Import handlers na mocks
const { POST } = await import("./route");

describe("POST /api/ratings/batch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // $transaction: voer array van promises uit
    mockPrisma.$transaction.mockImplementation((promises: Promise<unknown>[]) =>
      Promise.all(promises)
    );
    mockPrisma.speler.update.mockResolvedValue({});
  });

  it("werkt ratings bij voor meerdere spelers", async () => {
    const result = await callRoute(POST, {
      method: "POST",
      body: {
        ratings: [
          { spelerId: "ABC123", rating: 150 },
          { spelerId: "DEF456", rating: 200 },
        ],
      },
    });

    expect(result.status).toBe(200);
    expect(result.data).toEqual({
      ok: true,
      data: { bijgewerkt: 2 },
    });
  });

  it("valideert: rating te hoog (>300)", async () => {
    const result = await callRoute(POST, {
      method: "POST",
      body: {
        ratings: [{ spelerId: "ABC123", rating: 999 }],
      },
    });

    expect(result.status).toBe(422);
    const data = result.data as { ok: boolean; error: { code: string } };
    expect(data.ok).toBe(false);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("valideert: rating negatief", async () => {
    const result = await callRoute(POST, {
      method: "POST",
      body: {
        ratings: [{ spelerId: "ABC123", rating: -1 }],
      },
    });

    expect(result.status).toBe(422);
  });

  it("valideert: lege spelerId", async () => {
    const result = await callRoute(POST, {
      method: "POST",
      body: {
        ratings: [{ spelerId: "", rating: 100 }],
      },
    });

    expect(result.status).toBe(422);
  });

  it("valideert: ontbrekende body", async () => {
    const result = await callRoute(POST, {
      method: "POST",
      body: {},
    });

    expect(result.status).toBe(422);
  });

  it("valideert: ongeldige JSON", async () => {
    // Maak een request met ongeldige JSON
    const req = new Request("http://localhost/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "dit is geen json",
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe("BAD_REQUEST");
  });

  it("geeft lege batch correct terug", async () => {
    mockPrisma.$transaction.mockResolvedValue([]);

    const result = await callRoute(POST, {
      method: "POST",
      body: { ratings: [] },
    });

    expect(result.status).toBe(200);
    expect(result.data).toEqual({
      ok: true,
      data: { bijgewerkt: 0 },
    });
  });
});
