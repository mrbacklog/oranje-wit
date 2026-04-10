import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@oranje-wit/auth/checks", () => ({
  requireTC: vi.fn().mockResolvedValue({ user: { email: "tc@ow.nl" } }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockTeamUpdate = vi.fn().mockResolvedValue({ id: "team-1" });

vi.mock("@/lib/teamindeling/db/prisma", () => ({
  prisma: {
    team: { update: mockTeamUpdate },
  },
}));

describe("updateTeamMemo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTeamUpdate.mockResolvedValue({ id: "team-1" });
  });

  it("slaat een open memo op", async () => {
    const { updateTeamMemo } = await import("./memo-actions");
    const result = await updateTeamMemo("team-1", {
      tekst: "Dit team mist een coach",
      memoStatus: "open",
      besluit: null,
    });
    expect(result.ok).toBe(true);
    expect(mockTeamUpdate).toHaveBeenCalledWith({
      where: { id: "team-1" },
      data: {
        notitie: "Dit team mist een coach",
        memoStatus: "open",
        besluit: null,
      },
    });
  });

  it("slaat een gesloten memo op met besluit", async () => {
    const { updateTeamMemo } = await import("./memo-actions");
    const result = await updateTeamMemo("team-1", {
      tekst: "Coach gezocht",
      memoStatus: "gesloten",
      besluit: "Thomas neemt tijdelijk de coaching over",
    });
    expect(result.ok).toBe(true);
    expect(mockTeamUpdate).toHaveBeenCalledWith({
      where: { id: "team-1" },
      data: {
        notitie: "Coach gezocht",
        memoStatus: "gesloten",
        besluit: "Thomas neemt tijdelijk de coaching over",
      },
    });
  });

  it("zet lege tekst om naar null in DB", async () => {
    const { updateTeamMemo } = await import("./memo-actions");
    await updateTeamMemo("team-1", {
      tekst: "",
      memoStatus: "gesloten",
      besluit: null,
    });
    expect(mockTeamUpdate).toHaveBeenCalledWith({
      where: { id: "team-1" },
      data: {
        notitie: null,
        memoStatus: "gesloten",
        besluit: null,
      },
    });
  });

  it("retourneert ok: false bij fout", async () => {
    mockTeamUpdate.mockRejectedValueOnce(new Error("DB fout"));
    const { updateTeamMemo } = await import("./memo-actions");
    const result = await updateTeamMemo("team-1", {
      tekst: "test",
      memoStatus: "open",
      besluit: null,
    });
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toBe("DB fout");
  });
});
