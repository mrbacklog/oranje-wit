import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@oranje-wit/auth/checks", () => ({
  requireTC: vi.fn().mockResolvedValue({ user: { email: "tc@ow.nl" } }),
}));

vi.mock("@/lib/teamindeling/audit/log-werkbord-mutatie", () => ({
  logWerkbordMutatie: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/teamindeling/audit/huidige-user", () => ({
  huidigeUserId: vi.fn().mockResolvedValue("u1"),
}));

const teamSpelerDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
const selectieSpelerDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
const selectieSpelerUpsert = vi.fn().mockResolvedValue({ id: "ss-1" });
const selectieGroepFindUniqueOrThrow = vi.fn();
const selectieGroepFindUnique = vi.fn();
const transaction = vi.fn();
const executeRaw = vi.fn().mockResolvedValue(1);

vi.mock("@/lib/teamindeling/db/prisma", () => ({
  prisma: {
    teamSpeler: { deleteMany: teamSpelerDeleteMany },
    selectieSpeler: { deleteMany: selectieSpelerDeleteMany, upsert: selectieSpelerUpsert },
    selectieGroep: {
      findUniqueOrThrow: selectieGroepFindUniqueOrThrow,
      findUnique: selectieGroepFindUnique,
    },
    $transaction: transaction,
    $executeRaw: executeRaw,
  },
  anyTeam: {},
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("voegSelectieSpelerToe — invariant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectieGroepFindUniqueOrThrow.mockResolvedValue({ versieId: "versie-1" });
    transaction.mockImplementation(async (ops: unknown[]) => {
      // Bootst $transaction(array) na: voer elke prepared op uit en geef resultaten terug
      return ops.map(() => ({ id: "ss-1" }));
    });
  });

  it("verwijdert ALLE TeamSpeler-records van speler in versie (niet alleen binnen selectiegroep)", async () => {
    const { voegSelectieSpelerToe } = await import("./werkindeling-actions");
    const result = await voegSelectieSpelerToe("groep-1", "rel-1", "sess-A");

    expect(result.ok).toBe(true);
    // De $transaction moet aangeroepen zijn met 3 operaties: teamSpeler.deleteMany,
    // selectieSpeler.deleteMany (andere groepen), selectieSpeler.upsert.
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(teamSpelerDeleteMany).toHaveBeenCalledWith({
      where: { spelerId: "rel-1", team: { versieId: "versie-1" } },
    });
    // SelectieSpeler in andere groepen wordt opgeruimd
    expect(selectieSpelerDeleteMany).toHaveBeenCalledWith({
      where: {
        spelerId: "rel-1",
        selectieGroepId: { not: "groep-1" },
        selectieGroep: { versieId: "versie-1" },
      },
    });
    expect(selectieSpelerUpsert).toHaveBeenCalled();
  });

  it("stuurt pg_notify met sessionId zodat eigen SSE-event genegeerd kan worden", async () => {
    const { voegSelectieSpelerToe } = await import("./werkindeling-actions");
    await voegSelectieSpelerToe("groep-1", "rel-1", "sess-A");
    expect(executeRaw).toHaveBeenCalledTimes(1);
    // Controleer dat het pg_notify-statement een payload met sessionId bevat
    const callArgs = executeRaw.mock.calls[0];
    const stringsArg = callArgs[0] as TemplateStringsArray;
    expect(stringsArg.join("?")).toMatch(/pg_notify/);
    const payload = callArgs[2] as string;
    const parsed = JSON.parse(payload);
    expect(parsed).toMatchObject({
      type: "selectie_speler_toegevoegd",
      selectieGroepId: "groep-1",
      spelerId: "rel-1",
      sessionId: "sess-A",
    });
  });
});

describe("verwijderSelectieSpeler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectieGroepFindUnique.mockResolvedValue({ versieId: "versie-1" });
  });

  it("stuurt pg_notify selectie_speler_verwijderd met sessionId", async () => {
    const { verwijderSelectieSpeler } = await import("./werkindeling-actions");
    const result = await verwijderSelectieSpeler("groep-1", "rel-1", "sess-B");
    expect(result.ok).toBe(true);
    expect(selectieSpelerDeleteMany).toHaveBeenCalledWith({
      where: { selectieGroepId: "groep-1", spelerId: "rel-1" },
    });
    expect(executeRaw).toHaveBeenCalledTimes(1);
    const payload = executeRaw.mock.calls[0][2] as string;
    expect(JSON.parse(payload)).toMatchObject({
      type: "selectie_speler_verwijderd",
      selectieGroepId: "groep-1",
      spelerId: "rel-1",
      sessionId: "sess-B",
    });
  });
});

describe("audit-trail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectieGroepFindUniqueOrThrow.mockResolvedValue({ versieId: "versie-1" });
    selectieGroepFindUnique.mockResolvedValue({ versieId: "versie-1" });
    transaction.mockImplementation(async (ops: unknown[]) => {
      return ops.map(() => ({ id: "ss-1" }));
    });
  });

  it("voegSelectieSpelerToe logt selectie_speler_toegevoegd", async () => {
    const { logWerkbordMutatie } = await import("@/lib/teamindeling/audit/log-werkbord-mutatie");
    const log = vi.mocked(logWerkbordMutatie);

    const { voegSelectieSpelerToe } = await import("./werkindeling-actions");
    await voegSelectieSpelerToe("sg-1", "HANDMATIG-tycho", "sess-1");

    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "selectie_speler_toegevoegd",
        selectieGroepId: "sg-1",
        spelerId: "HANDMATIG-tycho",
        sessionId: "sess-1",
        doorId: "u1",
      })
    );
    const arg = log.mock.calls[0][0];
    expect(arg.inverse).toEqual({
      type: "selectie_speler_verwijderd",
      selectieGroepId: "sg-1",
      spelerId: "HANDMATIG-tycho",
    });
  });

  it("verwijderSelectieSpeler logt selectie_speler_verwijderd met inverse", async () => {
    const { logWerkbordMutatie } = await import("@/lib/teamindeling/audit/log-werkbord-mutatie");
    const log = vi.mocked(logWerkbordMutatie);

    const { verwijderSelectieSpeler } = await import("./werkindeling-actions");
    await verwijderSelectieSpeler("sg-1", "HANDMATIG-tycho", "sess-1");

    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "selectie_speler_verwijderd",
        selectieGroepId: "sg-1",
        spelerId: "HANDMATIG-tycho",
        doorId: "u1",
      })
    );
    const arg = log.mock.calls[0][0];
    expect(arg.inverse).toEqual({
      type: "selectie_speler_toegevoegd",
      selectieGroepId: "sg-1",
      spelerId: "HANDMATIG-tycho",
    });
  });
});
