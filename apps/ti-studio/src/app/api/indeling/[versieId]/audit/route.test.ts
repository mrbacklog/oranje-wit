import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@oranje-wit/auth/checks", () => ({
  guardTC: vi.fn().mockResolvedValue({ ok: true, session: { user: { email: "antjan@x" } } }),
}));

vi.mock("@/lib/teamindeling/db/prisma", () => ({
  prisma: { werkbordMutatie: { findMany: vi.fn() } },
}));

import { GET } from "./route";
import { prisma } from "@/lib/teamindeling/db/prisma";

const findMany = vi.mocked(prisma.werkbordMutatie.findMany);

describe("GET /api/indeling/[versieId]/audit", () => {
  beforeEach(() => findMany.mockReset());

  it("retourneert laatste 100 mutaties van versie", async () => {
    findMany.mockResolvedValue([
      {
        id: "m1",
        type: "speler_verplaatst",
        createdAt: new Date("2026-05-18T18:24:00Z"),
        spelerId: "HANDMATIG-tycho",
        door: { naam: "Merel van Gurp", email: "merel@x" },
        speler: { roepnaam: "Tycho", achternaam: "de Koning" },
      },
    ] as never);
    const res = await GET(new Request("http://x"), {
      params: Promise.resolve({ versieId: "v1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      type: "speler_verplaatst",
      spelerId: "HANDMATIG-tycho",
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { versieId: "v1" },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          door: { select: { naam: true, email: true } },
          speler: { select: { roepnaam: true, achternaam: true } },
        },
      })
    );
  });

  it("geeft auth-response terug bij niet-TC", async () => {
    const { guardTC } = await import("@oranje-wit/auth/checks");
    vi.mocked(guardTC).mockResolvedValueOnce({
      ok: false,
      response: new Response("Forbidden", { status: 403 }),
    } as never);
    const res = await GET(new Request("http://x"), {
      params: Promise.resolve({ versieId: "v1" }),
    });
    expect(res.status).toBe(403);
  });
});
