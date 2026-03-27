import { vi, describe, it, expect, beforeEach } from "vitest";
import { createMockPrisma, callRoute } from "@oranje-wit/test-utils";

// -- Mocks --
const mockPrisma = createMockPrisma();
vi.mock("@/lib/teamindeling/db/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@oranje-wit/database", () => ({ prisma: mockPrisma }));

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

const { POST } = await import("./route");

describe("POST /api/referentie-teams/ververs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reset teamscores voor geselecteerde teams", async () => {
    mockPrisma.referentieTeam.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.referentieTeam.findMany.mockResolvedValue([
      {
        id: "rt-1",
        naam: "E1",
        seizoen: "2025-2026",
        teamType: "JEUGD",
        niveau: "1e",
        poolVeld: "1A",
        teamscore: null,
        spelerIds: [],
      },
      {
        id: "rt-2",
        naam: "E2",
        seizoen: "2025-2026",
        teamType: "JEUGD",
        niveau: "2e",
        poolVeld: "2B",
        teamscore: 130,
        spelerIds: [],
      },
    ]);

    const result = await callRoute(POST, {
      method: "POST",
      body: {
        seizoen: "2025-2026",
        scoreKeuzes: {
          "rt-1": "reset",
          "rt-2": "behoud",
        },
      },
    });

    expect(result.status).toBe(200);
    const data = result.data as { ok: boolean; data: { teams: unknown[] } };
    expect(data.ok).toBe(true);
    expect(data.data.teams).toHaveLength(2);

    // Alleen rt-1 moet gereset worden
    expect(mockPrisma.referentieTeam.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["rt-1"] } },
      data: { teamscore: null },
    });
  });

  it("doet geen update als alles behoud is", async () => {
    mockPrisma.referentieTeam.findMany.mockResolvedValue([]);

    const result = await callRoute(POST, {
      method: "POST",
      body: {
        seizoen: "2025-2026",
        scoreKeuzes: {
          "rt-1": "behoud",
          "rt-2": "behoud",
        },
      },
    });

    expect(result.status).toBe(200);
    // updateMany niet aangeroepen want geen "reset" keuzes
    expect(mockPrisma.referentieTeam.updateMany).not.toHaveBeenCalled();
  });

  it("valideert: ongeldig seizoen-formaat", async () => {
    const result = await callRoute(POST, {
      method: "POST",
      body: {
        seizoen: "2025",
        scoreKeuzes: {},
      },
    });

    expect(result.status).toBe(422);
  });

  it("valideert: ongeldige keuze-waarde", async () => {
    const result = await callRoute(POST, {
      method: "POST",
      body: {
        seizoen: "2025-2026",
        scoreKeuzes: { "rt-1": "verwijder" },
      },
    });

    expect(result.status).toBe(422);
  });
});
