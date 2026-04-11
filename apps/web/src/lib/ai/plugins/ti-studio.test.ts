import { describe, it, expect, vi, beforeEach } from "vitest";

// getVersieId is private — we testen via teamSamenstelling.execute
// zodat we het prefix-pad dekken zonder de private functie te exposen.
// We mocken prisma.versie.findUnique en kijken of de tool dit correct aanroept.

vi.mock("@/lib/teamindeling/db/prisma", () => ({
  prisma: {
    versie: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    werkindeling: {
      findFirst: vi.fn(),
    },
    team: {
      findMany: vi.fn(),
    },
    kaders: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/teamindeling/db/prisma";
import { getTiStudioTools } from "./ti-studio";

describe("getVersieId via tool (prefix v:)", () => {
  beforeEach(() => vi.clearAllMocks());

  it('versieId-prefix "v:<uuid>" roept findUnique direct aan', async () => {
    const mockVersieId = "versie-abc-123";
    const vFindUnique = prisma.versie.findUnique as ReturnType<typeof vi.fn>;
    vFindUnique.mockResolvedValue({ id: mockVersieId });

    const teamFindMany = prisma.team.findMany as ReturnType<typeof vi.fn>;
    teamFindMany.mockResolvedValue([]); // geen teams gevonden

    const tools = getTiStudioTools("sessie-1", "test@example.com");
    const result = await tools.teamSamenstelling.execute({
      teamNaam: "Sen 1",
      inContext: `v:${mockVersieId}`,
    });

    // prisma.versie.findUnique aangeroepen met het uuid (zonder prefix)
    expect(vFindUnique).toHaveBeenCalledWith({
      where: { id: mockVersieId },
      select: { id: true },
    });

    // Versie is gevonden, maar team niet → fout over team
    expect(result).toEqual(
      expect.objectContaining({
        fout: expect.stringContaining('Geen team gevonden met naam "Sen 1"'),
      })
    );
  });

  it("versieId-prefix met onbekend uuid geeft null terug (geen versie)", async () => {
    const vFindUnique = prisma.versie.findUnique as ReturnType<typeof vi.fn>;
    vFindUnique.mockResolvedValue(null);

    const tools = getTiStudioTools("sessie-1", "test@example.com");
    const result = await tools.teamSamenstelling.execute({
      teamNaam: "Sen 1",
      inContext: "v:onbekend-uuid",
    });

    // Fout omdat versie niet gevonden is
    expect(result).toHaveProperty("fout");
  });

  it('"werkindeling" pad ongewijzigd — gebruikt kaders lookup', async () => {
    const kadersFindFirst = prisma.kaders.findFirst as ReturnType<typeof vi.fn>;
    kadersFindFirst.mockResolvedValue(null); // geen actieve blauwdruk

    const tools = getTiStudioTools("sessie-1", "test@example.com");
    const result = await tools.teamSamenstelling.execute({
      teamNaam: "Sen 1",
      inContext: "werkindeling",
    });

    // kaders.findFirst moet aangeroepen zijn (niet versie.findUnique)
    expect(kadersFindFirst).toHaveBeenCalled();
    expect(result).toHaveProperty("fout");
  });
});
