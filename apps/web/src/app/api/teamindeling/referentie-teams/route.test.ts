import { vi, describe, it, expect, beforeEach } from "vitest";
import { createMockPrisma, callRoute } from "@oranje-wit/test-utils";

// -- Mocks --
const mockPrisma = createMockPrisma();
vi.mock("@/lib/teamindeling/db/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@oranje-wit/database", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/teamindeling/seizoen", () => ({
  getActiefSeizoen: vi.fn().mockResolvedValue("2025-2026"),
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
