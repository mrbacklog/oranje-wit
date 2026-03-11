import { vi, describe, it, expect, beforeEach } from "vitest";
import { createMockPrisma, callRoute } from "@oranje-wit/test-utils";

// -- Mocks --
const mockPrisma = createMockPrisma();
vi.mock("@/lib/db/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@oranje-wit/database", () => ({ prisma: mockPrisma }));

const { PATCH } = await import("./route");

describe("PATCH /api/referentie-teams/[id]/teamscore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("update teamscore voor een referentieteam", async () => {
    mockPrisma.referentieTeam.update.mockResolvedValue({
      id: "rt-1",
      naam: "Oranje Wit E1",
      teamscore: 150,
    });

    const result = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: "rt-1" },
      body: { teamscore: 150 },
    });

    expect(result.status).toBe(200);
    const data = result.data as { ok: boolean; data: { id: string; teamscore: number } };
    expect(data.ok).toBe(true);
    expect(data.data.teamscore).toBe(150);

    expect(mockPrisma.referentieTeam.update).toHaveBeenCalledWith({
      where: { id: "rt-1" },
      data: { teamscore: 150 },
      select: { id: true, naam: true, teamscore: true },
    });
  });

  it("geeft 404 als referentieteam niet bestaat", async () => {
    mockPrisma.referentieTeam.update.mockRejectedValue(new Error("Record not found"));

    const result = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: "onbekend" },
      body: { teamscore: 100 },
    });

    expect(result.status).toBe(404);
    const data = result.data as { ok: boolean; error: { code: string } };
    expect(data.error.code).toBe("NOT_FOUND");
  });

  it("valideert: teamscore te hoog (>300)", async () => {
    const result = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: "rt-1" },
      body: { teamscore: 400 },
    });

    expect(result.status).toBe(422);
  });

  it("valideert: teamscore negatief", async () => {
    const result = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: "rt-1" },
      body: { teamscore: -10 },
    });

    expect(result.status).toBe(422);
  });

  it("valideert: ontbrekende teamscore", async () => {
    const result = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: "rt-1" },
      body: {},
    });

    expect(result.status).toBe(422);
  });
});
