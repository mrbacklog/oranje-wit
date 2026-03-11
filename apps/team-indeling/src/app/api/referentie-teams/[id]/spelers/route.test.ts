import { vi, describe, it, expect, beforeEach } from "vitest";
import { createMockPrisma, callRoute } from "@oranje-wit/test-utils";

// -- Mocks --
const mockPrisma = createMockPrisma();
vi.mock("@/lib/db/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@oranje-wit/database", () => ({ prisma: mockPrisma }));

const { GET } = await import("./route");

describe("GET /api/referentie-teams/[id]/spelers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("geeft spelers voor een referentieteam", async () => {
    mockPrisma.referentieTeam.findUnique.mockResolvedValue({
      spelerIds: ["SP1", "SP2"],
    });

    const spelers = [
      {
        id: "SP1",
        roepnaam: "Jan",
        achternaam: "Bakker",
        geslacht: "M",
        geboortejaar: 2014,
        geboortedatum: null,
        rating: 120,
        ratingBerekend: 115,
        status: "BESCHIKBAAR",
        huidig: { team: "E1" },
      },
      {
        id: "SP2",
        roepnaam: "Lisa",
        achternaam: "Aalbers",
        geslacht: "V",
        geboortejaar: 2013,
        geboortedatum: null,
        rating: 140,
        ratingBerekend: 140,
        status: "BESCHIKBAAR",
        huidig: { team: "E1" },
      },
    ];
    mockPrisma.speler.findMany.mockResolvedValue(spelers);

    const result = await callRoute(GET, {
      method: "GET",
      params: { id: "rt-1" },
    });

    expect(result.status).toBe(200);
    const data = result.data as { ok: boolean; data: { spelers: typeof spelers } };
    expect(data.ok).toBe(true);
    expect(data.data.spelers).toHaveLength(2);

    // Controle: spelers worden gefilterd op de juiste IDs
    expect(mockPrisma.speler.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ["SP1", "SP2"] } },
      })
    );
  });

  it("geeft 404 als referentieteam niet bestaat", async () => {
    mockPrisma.referentieTeam.findUnique.mockResolvedValue(null);

    const result = await callRoute(GET, {
      method: "GET",
      params: { id: "onbekend" },
    });

    expect(result.status).toBe(404);
    const data = result.data as { ok: boolean; error: { code: string } };
    expect(data.error.code).toBe("NOT_FOUND");
  });

  it("geeft lege spelerlijst als team geen spelers heeft", async () => {
    mockPrisma.referentieTeam.findUnique.mockResolvedValue({
      spelerIds: [],
    });
    mockPrisma.speler.findMany.mockResolvedValue([]);

    const result = await callRoute(GET, {
      method: "GET",
      params: { id: "rt-leeg" },
    });

    expect(result.status).toBe(200);
    const data = result.data as { ok: boolean; data: { spelers: unknown[] } };
    expect(data.data.spelers).toHaveLength(0);
  });
});
