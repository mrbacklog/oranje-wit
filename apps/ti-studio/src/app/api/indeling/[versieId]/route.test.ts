import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/teamindeling/audit/log-werkbord-mutatie", () => ({
  logWerkbordMutatie: vi.fn(),
}));
vi.mock("@oranje-wit/auth/checks", () => ({
  guardTC: vi.fn().mockResolvedValue({
    ok: true,
    session: { user: { email: "antjan@x" } },
  }),
}));
vi.mock("@/lib/teamindeling/validatie-update", () => ({
  haalValidatieUpdate: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/lib/teamindeling/db/prisma", () => ({
  prisma: {
    $transaction: vi
      .fn()
      .mockImplementation((ops: unknown) =>
        Array.isArray(ops) ? Promise.resolve(ops.map(() => ({}))) : Promise.resolve({})
      ),
    teamSpeler: {
      upsert: vi.fn().mockResolvedValue({}),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    selectieSpeler: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    versie: {
      findUniqueOrThrow: vi.fn().mockResolvedValue({ posities: {} }),
      update: vi.fn().mockResolvedValue({}),
    },
    $executeRaw: vi.fn().mockResolvedValue(0),
    user: { findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "u1" }) },
  },
}));

import { POST } from "./route";
import { logWerkbordMutatie } from "@/lib/teamindeling/audit/log-werkbord-mutatie";

const log = vi.mocked(logWerkbordMutatie);

function makeRequest(body: unknown) {
  return new Request("http://x", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/indeling/[versieId]", () => {
  beforeEach(() => log.mockReset());

  it("logt speler_verplaatst", async () => {
    await POST(
      makeRequest({
        type: "speler_verplaatst",
        spelerId: "HANDMATIG-tycho",
        vanTeamId: null,
        naarTeamId: "t-sen2",
        naarGeslacht: "M",
        sessionId: "s1",
      }),
      { params: Promise.resolve({ versieId: "v1" }) }
    );
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        versieId: "v1",
        type: "speler_verplaatst",
        doorId: "u1",
        spelerId: "HANDMATIG-tycho",
        naarTeamId: "t-sen2",
        sessionId: "s1",
      })
    );
  });

  it("logt speler_naar_pool", async () => {
    await POST(
      makeRequest({
        type: "speler_naar_pool",
        spelerId: "HANDMATIG-tycho",
        vanTeamId: "t-sen2",
        sessionId: "s1",
      }),
      { params: Promise.resolve({ versieId: "v1" }) }
    );
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "speler_naar_pool",
        spelerId: "HANDMATIG-tycho",
        vanTeamId: "t-sen2",
      })
    );
  });

  it("logt team_positie", async () => {
    await POST(
      makeRequest({
        type: "team_positie",
        teamId: "t-sen2",
        x: 100,
        y: 200,
        sessionId: "s1",
      }),
      { params: Promise.resolve({ versieId: "v1" }) }
    );
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "team_positie",
      })
    );
  });
});
