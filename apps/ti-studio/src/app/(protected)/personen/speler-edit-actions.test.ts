import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@oranje-wit/auth/checks", () => ({
  requireTC: vi.fn().mockResolvedValue({ user: { email: "tc@ow.nl" } }),
}));

const log = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/teamindeling/audit/log-werkbord-mutatie", () => ({
  logWerkbordMutatie: log,
}));

vi.mock("@/lib/teamindeling/audit/huidige-user", () => ({
  huidigeUserId: vi.fn().mockResolvedValue("u1"),
}));

const versieFindUniqueOrThrow = vi.fn();
const teamSpelerDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
const selectieSpelerDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
const teamSpelerCreate = vi.fn().mockResolvedValue({ id: "ts-1" });
const selectieSpelerCreate = vi.fn().mockResolvedValue({ id: "ss-1" });
const transaction = vi.fn().mockImplementation(async (ops: unknown[]) => ops.map(() => ({})));

vi.mock("@/lib/teamindeling/db/prisma", () => ({
  prisma: {
    versie: { findUniqueOrThrow: versieFindUniqueOrThrow },
    teamSpeler: { deleteMany: teamSpelerDeleteMany, create: teamSpelerCreate },
    selectieSpeler: { deleteMany: selectieSpelerDeleteMany, create: selectieSpelerCreate },
    $transaction: transaction,
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("zetSpelerIndeling — audit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    versieFindUniqueOrThrow.mockResolvedValue({
      id: "v1",
      teams: [{ id: "t-sen1" }, { id: "t-sen2" }],
      selectieGroepen: [{ id: "sg-1", gebundeld: true }],
    });
  });

  it("logt speler_indeling_gezet bij koppeling aan selectie", async () => {
    const { zetSpelerIndeling } = await import("./speler-edit-actions");
    await zetSpelerIndeling("v1", "HANDMATIG-tycho", { type: "selectie", id: "sg-1" });
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "speler_indeling_gezet",
        versieId: "v1",
        spelerId: "HANDMATIG-tycho",
        selectieGroepId: "sg-1",
        naarTeamId: null,
        doorId: "u1",
      })
    );
  });

  it("logt speler_indeling_gezet bij koppeling aan team", async () => {
    const { zetSpelerIndeling } = await import("./speler-edit-actions");
    await zetSpelerIndeling("v1", "HANDMATIG-tycho", { type: "team", id: "t-sen1" });
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "speler_indeling_gezet",
        spelerId: "HANDMATIG-tycho",
        naarTeamId: "t-sen1",
        selectieGroepId: null,
      })
    );
  });

  it("logt speler_indeling_gezet bij ontkoppelen (doel=null)", async () => {
    const { zetSpelerIndeling } = await import("./speler-edit-actions");
    await zetSpelerIndeling("v1", "HANDMATIG-tycho", null);
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "speler_indeling_gezet",
        spelerId: "HANDMATIG-tycho",
        naarTeamId: null,
        selectieGroepId: null,
      })
    );
  });
});
