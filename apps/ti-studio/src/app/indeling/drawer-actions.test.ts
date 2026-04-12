import { vi, describe, it, expect, beforeEach } from "vitest";
import { createMockPrisma } from "@oranje-wit/test-utils";

const mockPrisma = createMockPrisma();

vi.mock("@/lib/teamindeling/db/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@oranje-wit/auth/checks", () => ({
  requireTC: vi.fn().mockResolvedValue({ user: { email: "test@ow.nl" } }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { getVersiesVoorDrawer, createWhatIfVanHuidigeVersie } = await import("./drawer-actions");

describe("getVersiesVoorDrawer", () => {
  beforeEach(() => vi.clearAllMocks());

  it("geeft werkversie, what-ifs en archiefversies terug", async () => {
    mockPrisma.versie.findMany.mockResolvedValue([
      { id: "v3", nummer: 3, naam: "Concept", auteur: "AJ", createdAt: new Date("2026-04-10") },
      { id: "v2", nummer: 2, naam: "Start", auteur: "AJ", createdAt: new Date("2026-04-09") },
      { id: "v1", nummer: 1, naam: null, auteur: "systeem", createdAt: new Date("2026-04-08") },
    ]);
    mockPrisma.whatIf.findMany.mockResolvedValue([
      {
        id: "wi1",
        vraag: "Sen 1 verjongen",
        status: "OPEN",
        basisVersieNummer: 3,
        createdAt: new Date("2026-04-10"),
        _count: { teams: 2 },
      },
      {
        id: "wi2",
        vraag: "Rood wisselen",
        status: "OPEN",
        basisVersieNummer: 2,
        createdAt: new Date("2026-04-09"),
        _count: { teams: 3 },
      },
      {
        id: "wi3",
        vraag: "Extra heer",
        status: "TOEGEPAST",
        basisVersieNummer: 2,
        createdAt: new Date("2026-04-08"),
        _count: { teams: 1 },
      },
    ]);
    mockPrisma.teamSpeler.count.mockResolvedValue(26);

    const result = await getVersiesVoorDrawer("wi-1");

    expect(result.werkversie.nummer).toBe(3);
    expect(result.werkversie.aantalIngedeeld).toBe(26);
    expect(result.whatIfs).toHaveLength(3);
    expect(result.whatIfs[0].isStale).toBe(false); // v3 == v3
    expect(result.whatIfs[1].isStale).toBe(true); // v2 < v3
    expect(result.archiefVersies).toHaveLength(2); // v1 en v2 (v3 is werkversie)
  });

  it("geeft lege arrays terug als er geen what-ifs zijn", async () => {
    mockPrisma.versie.findMany.mockResolvedValue([
      { id: "v1", nummer: 1, naam: null, auteur: "systeem", createdAt: new Date() },
    ]);
    mockPrisma.whatIf.findMany.mockResolvedValue([]);
    mockPrisma.teamSpeler.count.mockResolvedValue(0);

    const result = await getVersiesVoorDrawer("wi-1");

    expect(result.archiefVersies).toHaveLength(0);
    expect(result.whatIfs).toHaveLength(0);
  });
});

describe("createWhatIfVanHuidigeVersie", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maakt een what-if aan met alle teams van de hoogste versie", async () => {
    mockPrisma.versie.findFirst.mockResolvedValue({
      id: "v3",
      nummer: 3,
      teams: [
        {
          id: "t1",
          naam: "Sen 1",
          categorie: "SENIOR",
          kleur: "BLAUW",
          teamType: null,
          niveau: null,
          volgorde: 1,
          spelers: [{ spelerId: "sp1", statusOverride: null, notitie: null }],
          staf: [],
        },
      ],
    });
    mockPrisma.whatIf.create.mockResolvedValue({ id: "wi-new" });

    const result = await createWhatIfVanHuidigeVersie("werkindeling-1", {
      vraag: "Test what-if",
    });

    expect(result.id).toBe("wi-new");
    expect(mockPrisma.whatIf.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          werkindelingId: "werkindeling-1",
          vraag: "Test what-if",
          basisVersieNummer: 3,
        }),
      })
    );
  });

  it("gooit een fout als de werkindeling geen versie heeft", async () => {
    mockPrisma.versie.findFirst.mockResolvedValue(null);

    await expect(
      createWhatIfVanHuidigeVersie("werkindeling-1", { vraag: "Test" })
    ).rejects.toMatchObject({
      message: "Werkindeling heeft geen versie",
    });
  });
});
