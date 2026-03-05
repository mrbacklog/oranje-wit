import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock de prisma module
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    evaluatieUitnodiging: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db/prisma";
import { valideerToken } from "./tokens";

const mockFindUnique = vi.mocked(prisma.evaluatieUitnodiging.findUnique);

describe("valideerToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourneert null voor onbekend token", async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await valideerToken("onbekend-token");
    expect(result).toBeNull();
  });

  it("retourneert null als ronde niet actief is", async () => {
    mockFindUnique.mockResolvedValue({
      id: "uit1",
      type: "trainer",
      naam: "Jan Jansen",
      email: "jan@test.nl",
      ronde: {
        id: "r1",
        seizoen: "2025-2026",
        ronde: 1,
        naam: "Ronde 1",
        type: "trainer",
        deadline: new Date(),
        status: "concept",
      },
      owTeam: { id: 1, naam: "J1", seizoen: "2025-2026" },
    } as never);

    const result = await valideerToken("geldig-maar-concept");
    expect(result).toBeNull();
  });

  it("retourneert uitnodiging voor actieve ronde", async () => {
    const mockUitnodiging = {
      id: "uit1",
      type: "trainer",
      naam: "Jan Jansen",
      email: "jan@test.nl",
      ronde: {
        id: "r1",
        seizoen: "2025-2026",
        ronde: 1,
        naam: "Ronde 1",
        type: "trainer",
        deadline: new Date(),
        status: "actief",
      },
      owTeam: { id: 1, naam: "J1", seizoen: "2025-2026" },
    };
    mockFindUnique.mockResolvedValue(mockUitnodiging as never);

    const result = await valideerToken("geldig-token");
    expect(result).toEqual(mockUitnodiging);
  });

  it("roept findUnique aan met het juiste token", async () => {
    mockFindUnique.mockResolvedValue(null);
    await valideerToken("mijn-token");

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { token: "mijn-token" },
      include: {
        ronde: {
          select: expect.objectContaining({ id: true, status: true }),
        },
        owTeam: {
          select: expect.objectContaining({ id: true, naam: true }),
        },
      },
    });
  });
});
