import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@oranje-wit/auth/checks", () => ({
  requireTC: vi.fn().mockResolvedValue({ user: { email: "tc@ow.nl" } }),
}));

const mockUpdate = vi.fn().mockResolvedValue({ id: "team-1" });
const mockCreate = vi.fn().mockResolvedValue({ id: "groep-1" });
const mockDelete = vi.fn().mockResolvedValue({ id: "groep-1" });

vi.mock("@/lib/teamindeling/db/prisma", () => ({
  prisma: {
    team: { update: mockUpdate },
    selectieGroep: { create: mockCreate, delete: mockDelete },
  },
}));

vi.mock("@/lib/teamindeling/validatie-update", () => ({
  haalValidatieUpdate: vi.fn().mockResolvedValue({
    teamId: "team-1",
    items: [],
    status: "ok" as const,
    count: 0,
  }),
}));

describe("updateTeamConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("slaat SENIOREN op als SENIOREN", async () => {
    const { updateTeamConfig } = await import("./team-config-actions");
    const result = await updateTeamConfig("team-1", {
      hoofdCategorie: "SENIOREN",
      kleur: null,
      niveau: null,
      teamType: null,
    });
    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "team-1" },
      data: {
        categorie: "SENIOREN",
        kleur: null,
        niveau: null,
        teamType: null,
      },
    });
  });

  it("slaat Jeugd B Geel 4-tal op", async () => {
    const { updateTeamConfig } = await import("./team-config-actions");
    const result = await updateTeamConfig("team-1", {
      hoofdCategorie: "B_CATEGORIE",
      kleur: "geel",
      niveau: null,
      teamType: "viertal",
    });
    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "team-1" },
      data: {
        categorie: "B_CATEGORIE",
        kleur: "GEEL",
        niveau: null,
        teamType: "VIERTAL",
      },
    });
  });

  it("slaat Jeugd A U17 op", async () => {
    const { updateTeamConfig } = await import("./team-config-actions");
    const result = await updateTeamConfig("team-1", {
      hoofdCategorie: "A_CATEGORIE",
      kleur: null,
      niveau: "U17",
      teamType: null,
    });
    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "team-1" },
      data: {
        categorie: "A_CATEGORIE",
        kleur: null,
        niveau: "U17",
        teamType: null,
      },
    });
  });

  it("geeft ok:false terug bij database fout", async () => {
    mockUpdate.mockRejectedValueOnce(new Error("DB connection lost"));
    const { updateTeamConfig } = await import("./team-config-actions");
    const result = await updateTeamConfig("team-1", {
      hoofdCategorie: "SENIOREN",
      kleur: null,
      niveau: null,
      teamType: null,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("DB connection lost");
  });
});

describe("koppelSelectie", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maakt een SelectieGroep aan en koppelt twee teams", async () => {
    const { koppelSelectie } = await import("./team-config-actions");
    const result = await koppelSelectie("versie-1", "team-1", "team-2");
    expect(result.ok).toBe(true);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        versieId: "versie-1",
        teams: { connect: [{ id: "team-1" }, { id: "team-2" }] },
      },
    });
  });

  it("geeft ok:false terug bij database fout", async () => {
    mockCreate.mockRejectedValueOnce(new Error("Unique constraint failed"));
    const { koppelSelectie } = await import("./team-config-actions");
    const result = await koppelSelectie("versie-1", "team-1", "team-2");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Unique constraint failed");
  });
});

describe("ontkoppelSelectie", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("verwijdert de SelectieGroep", async () => {
    const { ontkoppelSelectie } = await import("./team-config-actions");
    const result = await ontkoppelSelectie("groep-1");
    expect(result.ok).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "groep-1" } });
  });

  it("geeft ok:false terug bij database fout", async () => {
    mockDelete.mockRejectedValueOnce(new Error("Record not found"));
    const { ontkoppelSelectie } = await import("./team-config-actions");
    const result = await ontkoppelSelectie("groep-1");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Record not found");
  });
});
