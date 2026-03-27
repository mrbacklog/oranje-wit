import { vi, describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "@/test/mock-prisma";
import { callRoute } from "@oranje-wit/test-utils";

vi.mock("@oranje-wit/auth/checks", () => ({
  guardAuth: vi.fn().mockResolvedValue({
    ok: true,
    session: {
      user: { email: "test@test.nl", isTC: true, isScout: false, clearance: 3, doelgroepen: [] },
    },
  }),
  guardTC: vi.fn().mockResolvedValue({
    ok: true,
    session: {
      user: { email: "test@test.nl", isTC: true, isScout: false, clearance: 3, doelgroepen: [] },
    },
  }),
  guardScout: vi.fn().mockResolvedValue({
    ok: true,
    session: {
      user: { email: "test@test.nl", isTC: true, isScout: true, clearance: 3, doelgroepen: [] },
    },
  }),
  guardCoordinator: vi.fn().mockResolvedValue({
    ok: true,
    session: {
      user: {
        email: "test@test.nl",
        isTC: true,
        isScout: false,
        clearance: 3,
        doelgroepen: ["ALLE"],
      },
    },
  }),
  guardClearance: vi.fn().mockResolvedValue({
    ok: true,
    session: {
      user: { email: "test@test.nl", isTC: true, isScout: false, clearance: 3, doelgroepen: [] },
    },
  }),
}));

import { PATCH } from "./route";

describe("PATCH /api/teams/:id/naam", () => {
  beforeEach(() => {
    mockPrisma.oWTeam.update.mockReset();
  });

  it("wijst ongeldig team ID af", async () => {
    const result = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: "abc" },
      body: { naam: "Test Team" },
    });

    expect(result.status).toBe(400);
  });

  it("update team naam succesvol", async () => {
    mockPrisma.oWTeam.update.mockResolvedValueOnce({
      id: 42,
      naam: "Nieuwe Naam",
    });

    const result = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: "42" },
      body: { naam: "Nieuwe Naam" },
    });

    expect(result.status).toBe(200);
    const data = result.data as { ok: boolean; data: { id: number; naam: string } };
    expect(data.ok).toBe(true);
    expect(data.data.id).toBe(42);
    expect(data.data.naam).toBe("Nieuwe Naam");
  });

  it("zet lege naam om naar null", async () => {
    mockPrisma.oWTeam.update.mockResolvedValueOnce({
      id: 42,
      naam: null,
    });

    const result = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: "42" },
      body: { naam: "" },
    });

    expect(result.status).toBe(200);
    expect(mockPrisma.oWTeam.update).toHaveBeenCalledWith({
      where: { id: 42 },
      data: { naam: null },
    });
  });

  it("trimt whitespace van naam", async () => {
    mockPrisma.oWTeam.update.mockResolvedValueOnce({
      id: 10,
      naam: "Team A",
    });

    const result = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: "10" },
      body: { naam: "  Team A  " },
    });

    expect(result.status).toBe(200);
    expect(mockPrisma.oWTeam.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { naam: "Team A" },
    });
  });

  it("retourneert foutmelding bij database-fout", async () => {
    mockPrisma.oWTeam.update.mockRejectedValueOnce(new Error("Record niet gevonden"));

    const result = await callRoute(PATCH, {
      method: "PATCH",
      params: { id: "999" },
      body: { naam: "Test" },
    });

    expect(result.status).toBe(500);
    const data = result.data as { ok: boolean; error: { message: string } };
    expect(data.ok).toBe(false);
    expect(data.error.message).toContain("Record niet gevonden");
  });
});
