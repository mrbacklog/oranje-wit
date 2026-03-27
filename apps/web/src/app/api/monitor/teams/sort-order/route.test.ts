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

describe("PATCH /api/teams/sort-order", () => {
  beforeEach(() => {
    mockPrisma.oWTeam.updateMany.mockReset();
    mockPrisma.$transaction.mockReset();
  });

  it("wijst verzoek af zonder seizoen", async () => {
    const result = await callRoute(PATCH, {
      method: "PATCH",
      body: { codes: ["B1", "C1"] },
    });

    expect(result.status).toBe(400);
  });

  it("wijst verzoek af zonder codes array", async () => {
    const result = await callRoute(PATCH, {
      method: "PATCH",
      body: { seizoen: "2025-2026" },
    });

    expect(result.status).toBe(400);
  });

  it("wijst verzoek af met lege codes array", async () => {
    const result = await callRoute(PATCH, {
      method: "PATCH",
      body: { seizoen: "2025-2026", codes: [] },
    });

    expect(result.status).toBe(400);
  });

  it("update sort order succesvol", async () => {
    mockPrisma.$transaction.mockResolvedValueOnce([{}, {}]);

    const result = await callRoute(PATCH, {
      method: "PATCH",
      body: { seizoen: "2025-2026", codes: ["B1", "C1", "A1"] },
    });

    expect(result.status).toBe(200);
    const data = result.data as { ok: boolean; data: { updated: number } };
    expect(data.ok).toBe(true);
    expect(data.data.updated).toBe(3);
  });

  it("retourneert foutmelding bij database-fout", async () => {
    mockPrisma.$transaction.mockRejectedValueOnce(new Error("DB connectie verloren"));

    const result = await callRoute(PATCH, {
      method: "PATCH",
      body: { seizoen: "2025-2026", codes: ["B1"] },
    });

    expect(result.status).toBe(500);
    const data = result.data as { ok: boolean; error: { message: string } };
    expect(data.ok).toBe(false);
    expect(data.error.message).toContain("DB connectie verloren");
  });
});
