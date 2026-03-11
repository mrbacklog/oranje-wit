import { vi, describe, it, expect, beforeEach } from "vitest";
import { createMockPrisma } from "@oranje-wit/test-utils";

// ============================================================
// Mocks
// ============================================================

const mockPrisma = createMockPrisma();
const mockAnyTeam = {
  findUniqueOrThrow: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
};

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
  anyTeam: mockAnyTeam,
}));

vi.mock("@/lib/seizoen", () => ({
  assertBewerkbaar: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/db/speler-guard", () => ({
  assertSpelerVrij: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/db/scenario-snapshot", () => ({
  maakScenarioSnapshot: vi.fn().mockResolvedValue("snap-1"),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@oranje-wit/types", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ============================================================
// Import NA mocks
// ============================================================

const {
  getScenario,
  getScenarios,
  getAlleSpelers,
  addSpelerToTeam,
  removeSpelerFromTeam,
  moveSpeler,
  createTeam,
  updateScenarioNaam,
  deleteScenario,
  herstelScenario,
  getVerwijderdeScenarios,
  markeerDefinitief,
  getPosities,
  savePosities,
} = await import("./actions");

// ============================================================
// Tests
// ============================================================

describe("scenarios/actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Standaard bewerkbaarheids-chain
    mockAnyTeam.findUniqueOrThrow.mockResolvedValue({
      versie: {
        scenario: {
          concept: { blauwdruk: { seizoen: "2025-2026" } },
        },
      },
      selectieGroepId: null,
      versieId: "v-1",
    });
    mockPrisma.versie.findUniqueOrThrow.mockResolvedValue({
      scenario: {
        concept: { blauwdruk: { seizoen: "2025-2026" } },
      },
    });
    mockPrisma.scenario.findUniqueOrThrow.mockResolvedValue({
      concept: { blauwdruk: { seizoen: "2025-2026" } },
      conceptId: "c-1",
    });
  });

  // ----------------------------------------------------------
  // getScenario
  // ----------------------------------------------------------

  describe("getScenario", () => {
    it("retourneert een scenario met versies en teams", async () => {
      const mockScenario = {
        id: "s-1",
        naam: "Basis",
        versies: [
          {
            teams: [{ id: "t-1", naam: "Geel 1" }],
            selectieGroepen: [],
          },
        ],
      };
      mockPrisma.scenario.findUnique.mockResolvedValueOnce(mockScenario);

      const result = await getScenario("s-1");

      expect(result).toEqual(mockScenario);
    });

    it("retourneert null als scenario niet bestaat", async () => {
      mockPrisma.scenario.findUnique.mockResolvedValueOnce(null);

      const result = await getScenario("onbekend");

      expect(result).toBeNull();
    });
  });

  // ----------------------------------------------------------
  // getScenarios
  // ----------------------------------------------------------

  describe("getScenarios", () => {
    it("haalt scenario's op voor een blauwdruk", async () => {
      const mockData = [{ id: "s-1", naam: "A", versies: [] }];
      mockPrisma.scenario.findMany.mockResolvedValueOnce(mockData);

      const result = await getScenarios("bp-1");

      expect(result).toEqual(mockData);
      expect(mockPrisma.scenario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { verwijderdOp: null, concept: { blauwdrukId: "bp-1" } },
        })
      );
    });
  });

  // ----------------------------------------------------------
  // getAlleSpelers
  // ----------------------------------------------------------

  describe("getAlleSpelers", () => {
    it("combineert spelers met afmelddata", async () => {
      mockPrisma.speler.findMany.mockResolvedValueOnce([
        {
          id: "ABC123",
          roepnaam: "Jan",
          achternaam: "Bakker",
          geboortejaar: 2015,
          geboortedatum: null,
          geslacht: "M",
          status: "BESCHIKBAAR",
          huidig: null,
          spelerspad: null,
          lidSinds: null,
          seizoenenActief: 2,
          notitie: null,
          rating: null,
          ratingBerekend: null,
        },
      ]);
      mockPrisma.lid.findMany.mockResolvedValueOnce([
        { relCode: "ABC123", afmelddatum: new Date("2026-06-30") },
      ]);

      const result = await getAlleSpelers();

      expect(result).toHaveLength(1);
      expect(result[0].afmelddatum).toBe("2026-06-30T00:00:00.000Z");
    });

    it("zet afmelddatum op null als niet afgemeld", async () => {
      mockPrisma.speler.findMany.mockResolvedValueOnce([
        {
          id: "XYZ789",
          roepnaam: "Lisa",
          achternaam: "Vos",
          geboortejaar: 2014,
          geboortedatum: null,
          geslacht: "V",
          status: "BESCHIKBAAR",
          huidig: null,
          spelerspad: null,
          lidSinds: null,
          seizoenenActief: 1,
          notitie: null,
          rating: null,
          ratingBerekend: null,
        },
      ]);
      mockPrisma.lid.findMany.mockResolvedValueOnce([]);

      const result = await getAlleSpelers();

      expect(result[0].afmelddatum).toBeNull();
    });
  });

  // ----------------------------------------------------------
  // addSpelerToTeam
  // ----------------------------------------------------------

  describe("addSpelerToTeam", () => {
    it("voegt speler toe aan TeamSpeler als team geen selectie heeft", async () => {
      mockAnyTeam.findUniqueOrThrow.mockResolvedValueOnce({
        versie: {
          scenario: {
            concept: { blauwdruk: { seizoen: "2025-2026" } },
          },
        },
      });
      mockAnyTeam.findUniqueOrThrow.mockResolvedValueOnce({
        selectieGroepId: null,
        versieId: "v-1",
      });
      mockPrisma.teamSpeler.create.mockResolvedValueOnce({});

      await addSpelerToTeam("t-1", "sp-1");

      expect(mockPrisma.teamSpeler.create).toHaveBeenCalledWith({
        data: { teamId: "t-1", spelerId: "sp-1" },
      });
    });

    it("voegt speler toe aan SelectieSpeler als team in selectie zit", async () => {
      mockAnyTeam.findUniqueOrThrow.mockResolvedValueOnce({
        versie: {
          scenario: {
            concept: { blauwdruk: { seizoen: "2025-2026" } },
          },
        },
      });
      mockAnyTeam.findUniqueOrThrow.mockResolvedValueOnce({
        selectieGroepId: "sg-1",
        versieId: "v-1",
      });
      mockPrisma.selectieSpeler.create.mockResolvedValueOnce({});

      await addSpelerToTeam("t-1", "sp-1");

      expect(mockPrisma.selectieSpeler.create).toHaveBeenCalledWith({
        data: { selectieGroepId: "sg-1", spelerId: "sp-1" },
      });
    });
  });

  // ----------------------------------------------------------
  // removeSpelerFromTeam
  // ----------------------------------------------------------

  describe("removeSpelerFromTeam", () => {
    it("verwijdert speler uit TeamSpeler als team geen selectie heeft", async () => {
      mockAnyTeam.findUniqueOrThrow.mockResolvedValueOnce({
        versie: {
          scenario: {
            concept: { blauwdruk: { seizoen: "2025-2026" } },
          },
        },
      });
      mockAnyTeam.findUniqueOrThrow.mockResolvedValueOnce({
        selectieGroepId: null,
      });
      mockPrisma.teamSpeler.deleteMany.mockResolvedValueOnce({ count: 1 });

      await removeSpelerFromTeam("t-1", "sp-1");

      expect(mockPrisma.teamSpeler.deleteMany).toHaveBeenCalledWith({
        where: { teamId: "t-1", spelerId: "sp-1" },
      });
    });
  });

  // ----------------------------------------------------------
  // moveSpeler
  // ----------------------------------------------------------

  describe("moveSpeler", () => {
    it("verplaatst speler van team naar team via transactie", async () => {
      // assertTeamBewerkbaar
      mockAnyTeam.findUniqueOrThrow.mockResolvedValueOnce({
        versie: {
          scenario: {
            concept: { blauwdruk: { seizoen: "2025-2026" } },
          },
        },
      });
      // vanTeam
      mockAnyTeam.findUniqueOrThrow.mockResolvedValueOnce({
        selectieGroepId: null,
      });
      // naarTeam
      mockAnyTeam.findUniqueOrThrow.mockResolvedValueOnce({
        selectieGroepId: null,
      });

      // Mock $transaction die callback uitvoert
      mockPrisma.$transaction.mockImplementationOnce(async (fn: any) => {
        const tx = {
          teamSpeler: {
            deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
            create: vi.fn().mockResolvedValue({}),
          },
          selectieSpeler: {
            deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
            create: vi.fn().mockResolvedValue({}),
          },
        };
        await fn(tx);
      });

      await moveSpeler("sp-1", "t-van", "t-naar");

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  // ----------------------------------------------------------
  // createTeam
  // ----------------------------------------------------------

  describe("createTeam", () => {
    it("maakt een team aan met de juiste volgorde", async () => {
      mockAnyTeam.findFirst.mockResolvedValueOnce({ volgorde: 5 });
      mockAnyTeam.create.mockResolvedValueOnce({ id: "t-new" });

      const result = await createTeam("v-1", {
        naam: "Geel 3",
        categorie: "A_CATEGORIE",
      });

      expect(result).toEqual({ id: "t-new" });
      expect(mockAnyTeam.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            versieId: "v-1",
            naam: "Geel 3",
            volgorde: 6,
          }),
        })
      );
    });

    it("start op volgorde 0 als er geen teams zijn", async () => {
      mockAnyTeam.findFirst.mockResolvedValueOnce(null);
      mockAnyTeam.create.mockResolvedValueOnce({ id: "t-first" });

      await createTeam("v-1", {
        naam: "Blauw 1",
        categorie: "A_CATEGORIE",
      });

      expect(mockAnyTeam.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ volgorde: 0 }),
        })
      );
    });
  });

  // ----------------------------------------------------------
  // updateScenarioNaam
  // ----------------------------------------------------------

  describe("updateScenarioNaam", () => {
    it("trimt en update de naam", async () => {
      mockPrisma.scenario.update.mockResolvedValueOnce({});

      await updateScenarioNaam("s-1", "  Nieuw  ");

      expect(mockPrisma.scenario.update).toHaveBeenCalledWith({
        where: { id: "s-1" },
        data: { naam: "Nieuw" },
      });
    });
  });

  // ----------------------------------------------------------
  // deleteScenario
  // ----------------------------------------------------------

  describe("deleteScenario", () => {
    it("soft-delete: zet verwijderdOp in plaats van hard delete", async () => {
      mockPrisma.scenario.update.mockResolvedValueOnce({});

      await deleteScenario("s-1");

      expect(mockPrisma.scenario.update).toHaveBeenCalledWith({
        where: { id: "s-1" },
        data: { verwijderdOp: expect.any(Date) },
      });
      // Mag NIET hard deleten
      expect(mockPrisma.scenario.delete).not.toHaveBeenCalled();
    });
  });

  describe("herstelScenario", () => {
    it("zet verwijderdOp terug naar null", async () => {
      mockPrisma.scenario.update.mockResolvedValueOnce({});

      await herstelScenario("s-1");

      expect(mockPrisma.scenario.update).toHaveBeenCalledWith({
        where: { id: "s-1" },
        data: { verwijderdOp: null },
      });
    });
  });

  describe("getVerwijderdeScenarios", () => {
    it("haalt alleen soft-deleted scenario's op", async () => {
      mockPrisma.scenario.findMany.mockResolvedValueOnce([]);

      await getVerwijderdeScenarios("bp-1");

      expect(mockPrisma.scenario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            verwijderdOp: { not: null },
          }),
        })
      );
    });
  });

  // ----------------------------------------------------------
  // markeerDefinitief
  // ----------------------------------------------------------

  describe("markeerDefinitief", () => {
    it("blokkeert als er open blockers zijn", async () => {
      // Eerste call: assertScenarioBewerkbaar, tweede call: ophalen scenario
      mockPrisma.scenario.findUniqueOrThrow
        .mockResolvedValueOnce({
          concept: { blauwdruk: { seizoen: "2025-2026" } },
        })
        .mockResolvedValueOnce({
          conceptId: "c-1",
          concept: { blauwdrukId: "bp-1" },
        });
      mockPrisma.werkitem.count.mockResolvedValueOnce(2);

      await expect(markeerDefinitief("s-1")).rejects.toThrow(
        "Kan niet definitief maken: 2 blocker(s) nog niet opgelost"
      );
    });

    it("archiveert andere scenario's en markeert als definitief", async () => {
      mockPrisma.scenario.findUniqueOrThrow
        .mockResolvedValueOnce({
          concept: { blauwdruk: { seizoen: "2025-2026" } },
        })
        .mockResolvedValueOnce({
          conceptId: "c-1",
          concept: { blauwdrukId: "bp-1" },
        });
      mockPrisma.werkitem.count.mockResolvedValueOnce(0);
      // findMany voor siblings (snapshot)
      mockPrisma.scenario.findMany.mockResolvedValueOnce([]);
      mockPrisma.scenario.updateMany.mockResolvedValueOnce({ count: 2 });
      mockPrisma.scenario.update.mockResolvedValueOnce({});

      // redirect gooit, maar we negeren dat
      const { redirect } = await import("next/navigation");
      (redirect as any).mockImplementation(() => {
        throw new Error("NEXT_REDIRECT");
      });

      await expect(markeerDefinitief("s-1")).rejects.toThrow("NEXT_REDIRECT");

      expect(mockPrisma.scenario.updateMany).toHaveBeenCalledWith({
        where: {
          conceptId: "c-1",
          id: { not: "s-1" },
          verwijderdOp: null,
        },
        data: { status: "GEARCHIVEERD" },
      });
      expect(mockPrisma.scenario.update).toHaveBeenCalledWith({
        where: { id: "s-1" },
        data: { status: "DEFINITIEF" },
      });
    });
  });

  // ----------------------------------------------------------
  // Posities
  // ----------------------------------------------------------

  describe("getPosities", () => {
    it("retourneert posities van een versie", async () => {
      const posities = { "t-1": { x: 100, y: 200 } };
      mockPrisma.versie.findUnique.mockResolvedValueOnce({ posities });

      const result = await getPosities("v-1");

      expect(result).toEqual(posities);
    });

    it("retourneert null als versie geen posities heeft", async () => {
      mockPrisma.versie.findUnique.mockResolvedValueOnce({
        posities: null,
      });

      const result = await getPosities("v-1");

      expect(result).toBeNull();
    });

    it("retourneert null als versie niet bestaat", async () => {
      mockPrisma.versie.findUnique.mockResolvedValueOnce(null);

      const result = await getPosities("onbekend");

      expect(result).toBeNull();
    });
  });

  describe("savePosities", () => {
    it("slaat posities op in de versie", async () => {
      const posities = { "t-1": { x: 50, y: 75 } };
      mockPrisma.versie.update.mockResolvedValueOnce({});

      await savePosities("v-1", posities);

      expect(mockPrisma.versie.update).toHaveBeenCalledWith({
        where: { id: "v-1" },
        data: { posities },
      });
    });
  });
});
