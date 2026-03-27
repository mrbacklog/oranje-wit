import { vi, describe, it, expect, beforeEach } from "vitest";
import { createMockPrisma, callRoute } from "@oranje-wit/test-utils";

// -- Mocks --
const mockPrisma = createMockPrisma();
vi.mock("@/lib/teamindeling/db/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@oranje-wit/database", () => ({ prisma: mockPrisma }));

const { GET } = await import("./route");

describe("GET /api/scenarios/[id]/teams", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("geeft teams en selectiegroepen voor een scenario", async () => {
    const teams = [
      { id: "t1", naam: "E1", volgorde: 1, spelers: [], staf: [] },
      { id: "t2", naam: "E2", volgorde: 2, spelers: [], staf: [] },
    ];
    const selectieGroepen = [{ id: "sg1", spelers: [], staf: [] }];

    mockPrisma.scenario.findUnique.mockResolvedValue({
      versies: [{ teams, selectieGroepen }],
    });

    const result = await callRoute(GET, {
      method: "GET",
      params: { id: "scenario-1" },
    });

    expect(result.status).toBe(200);
    const data = result.data as {
      ok: boolean;
      data: { teams: typeof teams; selectieGroepen: typeof selectieGroepen };
    };
    expect(data.ok).toBe(true);
    expect(data.data.teams).toHaveLength(2);
    expect(data.data.selectieGroepen).toHaveLength(1);
  });

  it("geeft lege teams als scenario niet bestaat", async () => {
    mockPrisma.scenario.findUnique.mockResolvedValue(null);

    const result = await callRoute(GET, {
      method: "GET",
      params: { id: "onbekend" },
    });

    expect(result.status).toBe(200);
    const data = result.data as {
      ok: boolean;
      data: { teams: unknown[]; selectieGroepen: unknown[] };
    };
    expect(data.data.teams).toHaveLength(0);
    expect(data.data.selectieGroepen).toHaveLength(0);
  });

  it("geeft lege teams als scenario geen versies heeft", async () => {
    mockPrisma.scenario.findUnique.mockResolvedValue({
      versies: [],
    });

    const result = await callRoute(GET, {
      method: "GET",
      params: { id: "scenario-zonder-versies" },
    });

    expect(result.status).toBe(200);
    const data = result.data as {
      ok: boolean;
      data: { teams: unknown[]; selectieGroepen: unknown[] };
    };
    expect(data.data.teams).toHaveLength(0);
    expect(data.data.selectieGroepen).toHaveLength(0);
  });
});
