import { vi, describe, it, expect, beforeEach } from "vitest";
import { createMockPrisma } from "@oranje-wit/test-utils";

// ============================================================
// Mocks
// ============================================================

const mockPrisma = createMockPrisma();

vi.mock("@/lib/teamindeling/db/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/teamindeling/auth-check", () => ({
  requireTC: vi.fn().mockResolvedValue({
    user: { email: "antjanlaban@gmail.com", name: "Test", role: "EDITOR" },
  }),
}));

vi.mock("@/lib/teamindeling/seizoen", () => ({
  assertBewerkbaar: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// ============================================================
// Import NA mocks
// ============================================================

const {
  getWerkitems,
  getWerkitem,
  createWerkitem,
  updateWerkitemStatus,
  deleteWerkitem,
  countBlockers,
  getWerkitemStats,
  createActiepunt,
  updateActiepuntStatus,
  deleteActiepunt,
  reorderActiepunten,
  getTimelineVoorSubject,
  createStatusWerkitem,
  getUsers,
} = await import("./actions");

// ============================================================
// Tests
// ============================================================

describe("werkbord/actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Standaard: blauwdruk bewerkbaar
    mockPrisma.kaders.findUniqueOrThrow.mockResolvedValue({
      seizoen: "2025-2026",
    });
    mockPrisma.kaders.findFirst.mockResolvedValue({
      id: "bp-1",
      seizoen: "2025-2026",
    });
    // User upsert
    mockPrisma.user.upsert.mockResolvedValue({ id: "user-1" });
  });

  // ----------------------------------------------------------
  // getWerkitems
  // ----------------------------------------------------------

  describe("getWerkitems", () => {
    it("haalt werkitems op voor een blauwdruk zonder filters", async () => {
      mockPrisma.werkitem.findMany.mockResolvedValueOnce([]);

      const result = await getWerkitems("bp-1");

      expect(result).toEqual([]);
      expect(mockPrisma.werkitem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { kadersId: "bp-1" },
        })
      );
    });

    it("past statusfilter toe", async () => {
      mockPrisma.werkitem.findMany.mockResolvedValueOnce([]);

      await getWerkitems("bp-1", { status: ["OPEN", "IN_BESPREKING"] });

      expect(mockPrisma.werkitem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            kadersId: "bp-1",
            status: { in: ["OPEN", "IN_BESPREKING"] },
          },
        })
      );
    });

    it("past meerdere filters tegelijk toe", async () => {
      mockPrisma.werkitem.findMany.mockResolvedValueOnce([]);

      await getWerkitems("bp-1", {
        status: ["OPEN"],
        prioriteit: ["BLOCKER"],
        spelerId: "sp-1",
      });

      expect(mockPrisma.werkitem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            kadersId: "bp-1",
            status: { in: ["OPEN"] },
            prioriteit: { in: ["BLOCKER"] },
            spelerId: "sp-1",
          },
        })
      );
    });
  });

  // ----------------------------------------------------------
  // getWerkitem
  // ----------------------------------------------------------

  describe("getWerkitem", () => {
    it("haalt een enkel werkitem op", async () => {
      const mockItem = { id: "wi-1", titel: "Test item" };
      mockPrisma.werkitem.findUnique.mockResolvedValueOnce(mockItem);

      const result = await getWerkitem("wi-1");

      expect(result).toEqual(mockItem);
    });

    it("retourneert null als werkitem niet bestaat", async () => {
      mockPrisma.werkitem.findUnique.mockResolvedValueOnce(null);

      const result = await getWerkitem("onbekend");

      expect(result).toBeNull();
    });
  });

  // ----------------------------------------------------------
  // createWerkitem
  // ----------------------------------------------------------

  describe("createWerkitem", () => {
    it("maakt een werkitem aan met standaard prioriteit MIDDEL", async () => {
      mockPrisma.werkitem.create.mockResolvedValueOnce({
        id: "wi-new",
        titel: "Nieuw item",
      });

      await createWerkitem({
        kadersId: "bp-1",
        titel: "Nieuw item",
        beschrijving: "Details",
        type: "SPELER",
      });

      expect(mockPrisma.werkitem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            titel: "Nieuw item",
            prioriteit: "MIDDEL",
            auteurId: "user-1",
          }),
        })
      );
    });

    it("zet status OPGELOST voor BESLUIT met resolutie", async () => {
      mockPrisma.werkitem.create.mockResolvedValueOnce({ id: "wi-b" });

      await createWerkitem({
        kadersId: "bp-1",
        titel: "Besluit genomen",
        beschrijving: "We kiezen optie A",
        type: "BESLUIT",
        resolutie: "Optie A",
      });

      expect(mockPrisma.werkitem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "OPGELOST",
            resolutie: "Optie A",
            opgelostOp: expect.any(Date),
          }),
        })
      );
    });
  });

  // ----------------------------------------------------------
  // updateWerkitemStatus
  // ----------------------------------------------------------

  describe("updateWerkitemStatus", () => {
    it("gooit fout als status OPGELOST is zonder resolutie", async () => {
      mockPrisma.werkitem.findUniqueOrThrow.mockResolvedValueOnce({
        kadersId: "bp-1",
      });

      await expect(updateWerkitemStatus("wi-1", "OPGELOST")).rejects.toThrow(
        "Resolutie is verplicht bij status OPGELOST"
      );
    });

    it("update status met resolutie en opgelostOp", async () => {
      mockPrisma.werkitem.findUniqueOrThrow.mockResolvedValueOnce({
        kadersId: "bp-1",
      });
      mockPrisma.werkitem.update.mockResolvedValueOnce({
        id: "wi-1",
        status: "OPGELOST",
      });

      await updateWerkitemStatus("wi-1", "OPGELOST", "Afgehandeld");

      expect(mockPrisma.werkitem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "OPGELOST",
            resolutie: "Afgehandeld",
            opgelostOp: expect.any(Date),
          }),
        })
      );
    });

    it("zet opgelostOp voor GEACCEPTEERD_RISICO", async () => {
      mockPrisma.werkitem.findUniqueOrThrow.mockResolvedValueOnce({
        kadersId: "bp-1",
      });
      mockPrisma.werkitem.update.mockResolvedValueOnce({
        id: "wi-1",
        status: "GEACCEPTEERD_RISICO",
      });

      await updateWerkitemStatus("wi-1", "GEACCEPTEERD_RISICO");

      expect(mockPrisma.werkitem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            opgelostOp: expect.any(Date),
          }),
        })
      );
    });
  });

  // ----------------------------------------------------------
  // deleteWerkitem
  // ----------------------------------------------------------

  describe("deleteWerkitem", () => {
    it("verwijdert een werkitem", async () => {
      mockPrisma.werkitem.findUniqueOrThrow.mockResolvedValueOnce({
        kadersId: "bp-1",
      });
      mockPrisma.werkitem.delete.mockResolvedValueOnce({ id: "wi-1" });

      await deleteWerkitem("wi-1");

      expect(mockPrisma.werkitem.delete).toHaveBeenCalledWith({
        where: { id: "wi-1" },
      });
    });
  });

  // ----------------------------------------------------------
  // countBlockers
  // ----------------------------------------------------------

  describe("countBlockers", () => {
    it("telt open blockers", async () => {
      mockPrisma.werkitem.count.mockResolvedValueOnce(3);

      const result = await countBlockers("bp-1");

      expect(result).toBe(3);
      expect(mockPrisma.werkitem.count).toHaveBeenCalledWith({
        where: {
          kadersId: "bp-1",
          prioriteit: "BLOCKER",
          status: { in: ["OPEN", "IN_BESPREKING"] },
        },
      });
    });
  });

  // ----------------------------------------------------------
  // getWerkitemStats
  // ----------------------------------------------------------

  describe("getWerkitemStats", () => {
    it("retourneert alle statistiekvelden", async () => {
      mockPrisma.werkitem.count
        .mockResolvedValueOnce(5) // open
        .mockResolvedValueOnce(1) // blockers
        .mockResolvedValueOnce(3) // besluiten
        .mockResolvedValueOnce(7); // afgerond

      const result = await getWerkitemStats("bp-1");

      expect(result).toEqual({
        open: 5,
        blockers: 1,
        besluiten: 3,
        afgerond: 7,
      });
    });
  });

  // ----------------------------------------------------------
  // Actiepunten
  // ----------------------------------------------------------

  describe("createActiepunt", () => {
    it("maakt een actiepunt aan", async () => {
      mockPrisma.actiepunt.create.mockResolvedValueOnce({
        id: "ap-1",
        beschrijving: "Bel trainer",
      });

      await createActiepunt({
        kadersId: "bp-1",
        beschrijving: "Bel trainer",
      });

      expect(mockPrisma.actiepunt.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            kadersId: "bp-1",
            beschrijving: "Bel trainer",
            auteurId: "user-1",
            volgorde: 0,
          }),
        })
      );
    });

    it("zet deadline als string wordt meegegeven", async () => {
      mockPrisma.actiepunt.create.mockResolvedValueOnce({ id: "ap-2" });

      await createActiepunt({
        kadersId: "bp-1",
        beschrijving: "Deadline taak",
        deadline: "2026-06-01",
      });

      expect(mockPrisma.actiepunt.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deadline: new Date("2026-06-01"),
          }),
        })
      );
    });
  });

  describe("updateActiepuntStatus", () => {
    it("zet afgerondOp bij status AFGEROND", async () => {
      mockPrisma.actiepunt.findUniqueOrThrow.mockResolvedValueOnce({
        kadersId: "bp-1",
      });
      mockPrisma.actiepunt.update.mockResolvedValueOnce({ id: "ap-1" });

      await updateActiepuntStatus("ap-1", "AFGEROND");

      expect(mockPrisma.actiepunt.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "AFGEROND",
            afgerondOp: expect.any(Date),
          }),
        })
      );
    });

    it("reset afgerondOp als status niet AFGEROND is", async () => {
      mockPrisma.actiepunt.findUniqueOrThrow.mockResolvedValueOnce({
        kadersId: "bp-1",
      });
      mockPrisma.actiepunt.update.mockResolvedValueOnce({ id: "ap-1" });

      await updateActiepuntStatus("ap-1", "OPEN");

      expect(mockPrisma.actiepunt.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "OPEN",
            afgerondOp: null,
          }),
        })
      );
    });
  });

  describe("deleteActiepunt", () => {
    it("verwijdert een actiepunt op id", async () => {
      mockPrisma.actiepunt.findUniqueOrThrow.mockResolvedValueOnce({
        kadersId: "bp-1",
      });
      mockPrisma.actiepunt.delete.mockResolvedValueOnce({ id: "ap-1" });

      await deleteActiepunt("ap-1");

      expect(mockPrisma.actiepunt.delete).toHaveBeenCalledWith({
        where: { id: "ap-1" },
      });
    });
  });

  describe("reorderActiepunten", () => {
    it("zet volgorde op basis van array-index", async () => {
      mockPrisma.actiepunt.update.mockResolvedValue({});

      await reorderActiepunten(["ap-3", "ap-1", "ap-2"]);

      expect(mockPrisma.actiepunt.update).toHaveBeenCalledTimes(3);
      expect(mockPrisma.actiepunt.update).toHaveBeenCalledWith({
        where: { id: "ap-3" },
        data: { volgorde: 0 },
      });
      expect(mockPrisma.actiepunt.update).toHaveBeenCalledWith({
        where: { id: "ap-1" },
        data: { volgorde: 1 },
      });
      expect(mockPrisma.actiepunt.update).toHaveBeenCalledWith({
        where: { id: "ap-2" },
        data: { volgorde: 2 },
      });
    });
  });

  // ----------------------------------------------------------
  // Timeline
  // ----------------------------------------------------------

  describe("getTimelineVoorSubject", () => {
    it("haalt werkitems op voor een speler", async () => {
      mockPrisma.werkitem.findMany.mockResolvedValueOnce([]);

      await getTimelineVoorSubject({ spelerId: "sp-1" });

      expect(mockPrisma.werkitem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            kadersId: "bp-1",
            spelerId: "sp-1",
          }),
        })
      );
    });

    it("gooit fout als er geen werkseizoen is", async () => {
      mockPrisma.kaders.findFirst.mockResolvedValueOnce(null);

      await expect(getTimelineVoorSubject({ spelerId: "sp-1" })).rejects.toThrow(
        "Geen werkseizoen gevonden"
      );
    });
  });

  // ----------------------------------------------------------
  // createStatusWerkitem
  // ----------------------------------------------------------

  describe("createStatusWerkitem", () => {
    it("maakt een statuswijziging-werkitem aan", async () => {
      mockPrisma.werkitem.create.mockResolvedValueOnce({ id: "wi-s1" });

      await createStatusWerkitem("sp-1", "BESCHIKBAAR", "TWIJFELT");

      expect(mockPrisma.werkitem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            titel: "Status: BESCHIKBAAR \u2192 TWIJFELT",
            type: "SPELER",
            spelerId: "sp-1",
            auteurId: "user-1",
          }),
        })
      );
    });
  });

  // ----------------------------------------------------------
  // getUsers
  // ----------------------------------------------------------

  describe("getUsers", () => {
    it("retourneert gebruikers gesorteerd op naam", async () => {
      const users = [{ id: "u1", naam: "Anna", email: "anna@test.nl", rol: "EDITOR" }];
      mockPrisma.user.findMany.mockResolvedValueOnce(users);

      const result = await getUsers();

      expect(result).toEqual(users);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        select: { id: true, naam: true, email: true, rol: true },
        orderBy: { naam: "asc" },
      });
    });
  });
});
