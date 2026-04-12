import { vi, describe, it, expect, beforeEach } from "vitest";
import { createMockPrisma, callRoute } from "@oranje-wit/test-utils";

// -- Mocks --
const mockPrisma = createMockPrisma();
vi.mock("@/lib/teamindeling/db/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@oranje-wit/database", () => ({ prisma: mockPrisma }));
vi.mock("@oranje-wit/teamindeling-shared/seizoen", () => ({
  getActiefSeizoen: vi.fn().mockResolvedValue("2025-2026"),
}));

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

const { GET } = await import("./route");

describe("GET /api/referentie-teams", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("geeft alle referentieteams voor het actieve seizoen", async () => {
    const teams = [
      {
        id: "rt-1",
        naam: "Oranje Wit E1",
        seizoen: "2025-2026",
        teamType: "JEUGD",
        niveau: "1e",
        poolVeld: "1A",
        teamscore: 120,
      },
      {
        id: "rt-2",
        naam: "Oranje Wit E2",
        seizoen: "2025-2026",
        teamType: "JEUGD",
        niveau: "2e",
        poolVeld: "2B",
        teamscore: null,
      },
    ];

    mockPrisma.referentieTeam.findMany.mockResolvedValue(teams);

    const result = await callRoute(GET, { method: "GET" });

    expect(result.status).toBe(200);
    const data = result.data as { ok: boolean; data: typeof teams };
    expect(data.ok).toBe(true);
    expect(data.data).toHaveLength(2);
    expect(data.data[0].naam).toBe("Oranje Wit E1");
  });

  it("geeft lege lijst als er geen referentieteams zijn", async () => {
    mockPrisma.referentieTeam.findMany.mockResolvedValue([]);

    const result = await callRoute(GET, { method: "GET" });

    expect(result.status).toBe(200);
    const data = result.data as { ok: boolean; data: unknown[] };
    expect(data.data).toHaveLength(0);
  });
});
