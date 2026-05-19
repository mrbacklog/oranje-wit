import { describe, it, expect, vi, beforeEach } from "vitest";

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/lib/teamindeling/db/prisma", () => ({
  prisma: { werkbordMutatie: { create } },
}));

import { logWerkbordMutatie } from "./log-werkbord-mutatie";

describe("logWerkbordMutatie", () => {
  beforeEach(() => create.mockReset());

  it("schrijft een row met alle velden", async () => {
    create.mockResolvedValue({ id: "x" });
    await logWerkbordMutatie({
      versieId: "v1",
      type: "speler_verplaatst",
      doorId: "u1",
      spelerId: "HANDMATIG-tycho",
      vanTeamId: null,
      naarTeamId: "t-sen2",
      sessionId: "sess-1",
      payload: { type: "speler_verplaatst", spelerId: "HANDMATIG-tycho" },
    });
    expect(create).toHaveBeenCalledTimes(1);
    const arg = create.mock.calls[0][0];
    expect(arg.data.versieId).toBe("v1");
    expect(arg.data.type).toBe("speler_verplaatst");
    expect(arg.data.doorId).toBe("u1");
    expect(arg.data.spelerId).toBe("HANDMATIG-tycho");
    expect(arg.data.naarTeamId).toBe("t-sen2");
    expect(arg.data.sessionId).toBe("sess-1");
    expect(arg.data.payload).toEqual({ type: "speler_verplaatst", spelerId: "HANDMATIG-tycho" });
  });

  it("gooit niet als prisma faalt (audit mag nooit een mutatie blokkeren)", async () => {
    create.mockRejectedValueOnce(new Error("DB weg"));
    await expect(
      logWerkbordMutatie({
        versieId: "v1",
        type: "speler_verplaatst",
        doorId: "u1",
        payload: {},
      })
    ).resolves.toBeUndefined();
  });
});
