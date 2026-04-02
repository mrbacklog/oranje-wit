import { describe, it, expect, vi, beforeEach } from "vitest";
import { logDaisyActie, getDaisyActies, markeerOngedaan } from "./daisy-acties";

vi.mock("@/lib/teamindeling/db/prisma", () => ({
  prisma: {
    daisyActie: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/teamindeling/db/prisma";

describe("daisy-acties", () => {
  beforeEach(() => vi.clearAllMocks());

  it("logDaisyActie slaat correcte velden op", async () => {
    const mock = prisma.daisyActie.create as ReturnType<typeof vi.fn>;
    mock.mockResolvedValue({ id: "act-1", ongedaan: false });

    await logDaisyActie({
      sessieId: "gesprek-1",
      tool: "spelerVerplaatsen",
      doPayload: { spelerId: "s1", van: "T1", naar: "T2" },
      undoPayload: { spelerId: "s1", van: "T2", naar: "T1" },
      uitgevoerdIn: "werkindeling",
    });

    expect(mock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sessieId: "gesprek-1",
          tool: "spelerVerplaatsen",
          uitgevoerdIn: "werkindeling",
        }),
      })
    );
  });

  it("getDaisyActies filtert op sessieId en ongedaan=false", async () => {
    const mock = prisma.daisyActie.findMany as ReturnType<typeof vi.fn>;
    mock.mockResolvedValue([]);

    await getDaisyActies("gesprek-1");

    expect(mock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { sessieId: "gesprek-1", ongedaan: false },
      })
    );
  });

  it("markeerOngedaan roept update aan met ongedaan: true", async () => {
    const mock = prisma.daisyActie.update as ReturnType<typeof vi.fn>;
    mock.mockResolvedValue({});

    await markeerOngedaan("act-1");

    expect(mock).toHaveBeenCalledWith({
      where: { id: "act-1" },
      data: { ongedaan: true },
    });
  });
});
