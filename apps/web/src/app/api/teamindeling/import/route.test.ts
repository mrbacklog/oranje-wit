import { vi, describe, it, expect, beforeEach } from "vitest";
import { createMockPrisma, callRoute } from "@oranje-wit/test-utils";

// -- Mocks --
const mockPrisma = createMockPrisma();
vi.mock("@/lib/teamindeling/db/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@oranje-wit/database", () => ({ prisma: mockPrisma }));

const mockImportData = vi.fn();
const mockGetLastImport = vi.fn();
vi.mock("@/lib/teamindeling/import", () => ({
  importData: (...args: unknown[]) => mockImportData(...args),
  getLastImport: () => mockGetLastImport(),
}));

// Mock fs voor POST (bestandscheck)
const mockExistsSync = vi.fn();
const mockReadFileSync = vi.fn();
vi.mock("fs", () => ({
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
}));

const { GET, POST } = await import("./route");

describe("GET /api/import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("geeft import-status als er data is", async () => {
    mockGetLastImport.mockResolvedValue({
      id: "imp-1",
      seizoen: "2025-2026",
      exportDatum: "2025-06-01",
      snapshotDatum: "2025-05-31",
      spelersNieuw: 5,
      spelersBijgewerkt: 20,
      stafNieuw: 1,
      stafBijgewerkt: 3,
      teamsGeladen: 8,
      diff: null,
      createdAt: new Date("2025-06-01T12:00:00Z"),
    });

    const result = await callRoute(GET, { method: "GET" });

    expect(result.status).toBe(200);
    const data = result.data as {
      ok: boolean;
      data: { hasData: boolean; lastImport: { spelers: number; teams: number } };
    };
    expect(data.ok).toBe(true);
    expect(data.data.hasData).toBe(true);
    expect(data.data.lastImport.spelers).toBe(25); // 5 + 20
    expect(data.data.lastImport.teams).toBe(8);
  });

  it("geeft hasData=false als er geen import is", async () => {
    mockGetLastImport.mockResolvedValue(null);

    const result = await callRoute(GET, { method: "GET" });

    expect(result.status).toBe(200);
    const data = result.data as { ok: boolean; data: { hasData: boolean; lastImport: null } };
    expect(data.data.hasData).toBe(false);
    expect(data.data.lastImport).toBeNull();
  });

  it("geeft 500 bij database-fout", async () => {
    mockGetLastImport.mockRejectedValue(new Error("Connection refused"));

    const result = await callRoute(GET, { method: "GET" });

    expect(result.status).toBe(500);
    const data = result.data as { ok: boolean; error: { message: string } };
    expect(data.ok).toBe(false);
    expect(data.error.message).toContain("Connection refused");
  });
});

describe("POST /api/import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("importeert data uit een geldig export-bestand", async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(
      JSON.stringify({ versie: 2, seizoen: "2025-2026", spelers: [], staf: [], teams: [] })
    );
    mockImportData.mockResolvedValue({
      spelersNieuw: 3,
      spelersBijgewerkt: 10,
      stafNieuw: 0,
      stafBijgewerkt: 2,
    });

    const result = await callRoute(POST, {
      method: "POST",
      body: { exportPad: "/data/export/export-2025-2026.json" },
    });

    expect(result.status).toBe(200);
    const data = result.data as { ok: boolean; data: { spelersNieuw: number } };
    expect(data.ok).toBe(true);
    expect(data.data.spelersNieuw).toBe(3);
  });

  it("geeft 404 als bestand niet bestaat", async () => {
    mockExistsSync.mockReturnValue(false);

    const result = await callRoute(POST, {
      method: "POST",
      body: { exportPad: "/pad/niet/bestaand.json" },
    });

    expect(result.status).toBe(404);
    const data = result.data as { ok: boolean; error: { code: string } };
    expect(data.error.code).toBe("NOT_FOUND");
  });

  it("valideert: ontbrekend exportPad", async () => {
    const result = await callRoute(POST, {
      method: "POST",
      body: {},
    });

    expect(result.status).toBe(422);
  });

  it("valideert: leeg exportPad", async () => {
    const result = await callRoute(POST, {
      method: "POST",
      body: { exportPad: "" },
    });

    expect(result.status).toBe(422);
  });

  it("geeft 500 als import mislukt", async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify({ versie: 2, spelers: [] }));
    mockImportData.mockRejectedValue(new Error("Ongeldig formaat"));

    const result = await callRoute(POST, {
      method: "POST",
      body: { exportPad: "/data/fout.json" },
    });

    expect(result.status).toBe(500);
    const data = result.data as { ok: boolean; error: { message: string } };
    expect(data.error.message).toContain("Ongeldig formaat");
  });
});
