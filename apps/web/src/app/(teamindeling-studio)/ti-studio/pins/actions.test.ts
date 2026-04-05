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

// ============================================================
// Import NA mocks
// ============================================================

const { createPin, deletePin, getPinsVoorWerkindeling } = await import("./actions");

// ============================================================
// Tests
// ============================================================

describe("pins/actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Standaard: blauwdruk bestaat en is bewerkbaar
    mockPrisma.blauwdruk.findUniqueOrThrow.mockResolvedValue({
      seizoen: "2025-2026",
    });
  });

  // ----------------------------------------------------------
  // createPin
  // ----------------------------------------------------------

  describe("createPin", () => {
    it("verwijdert bestaande pin en maakt een nieuwe aan", async () => {
      mockPrisma.user.upsert.mockResolvedValueOnce({ id: "user-1" });
      mockPrisma.pin.deleteMany.mockResolvedValueOnce({ count: 0 });
      const mockPin = {
        id: "pin-1",
        blauwdrukId: "bp-1",
        spelerId: "sp-1",
        type: "SPELER_POSITIE",
        waarde: { teamNaam: "Geel 1", teamId: "t1" },
        speler: { id: "sp-1", roepnaam: "Jan", achternaam: "Bakker" },
        staf: null,
        gepindDoor: { id: "user-1", naam: "Test" },
      };
      mockPrisma.pin.create.mockResolvedValueOnce(mockPin);

      const result = await createPin({
        blauwdrukId: "bp-1",
        spelerId: "sp-1",
        type: "SPELER_POSITIE",
        waarde: { teamNaam: "Geel 1", teamId: "t1" },
      });

      expect(result).toEqual(mockPin);
      expect(mockPrisma.pin.deleteMany).toHaveBeenCalledWith({
        where: {
          blauwdrukId: "bp-1",
          spelerId: "sp-1",
          type: "SPELER_POSITIE",
        },
      });
      expect(mockPrisma.pin.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          blauwdrukId: "bp-1",
          spelerId: "sp-1",
          type: "SPELER_POSITIE",
          gepindDoorId: "user-1",
        }),
        include: expect.any(Object),
      });
    });

    it("slaat notitie op als die is meegegeven", async () => {
      mockPrisma.user.upsert.mockResolvedValueOnce({ id: "user-1" });
      mockPrisma.pin.deleteMany.mockResolvedValueOnce({ count: 0 });
      mockPrisma.pin.create.mockResolvedValueOnce({ id: "pin-1" });

      await createPin({
        blauwdrukId: "bp-1",
        spelerId: "sp-1",
        type: "SPELER_STATUS",
        waarde: { teamNaam: "Geel 1", teamId: "t1" },
        notitie: "Speelt liever zaal",
      });

      expect(mockPrisma.pin.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            notitie: "Speelt liever zaal",
          }),
        })
      );
    });
  });

  // ----------------------------------------------------------
  // deletePin
  // ----------------------------------------------------------

  describe("deletePin", () => {
    it("zoekt de pin op en verwijdert deze", async () => {
      mockPrisma.pin.findUniqueOrThrow.mockResolvedValueOnce({
        blauwdrukId: "bp-1",
      });
      mockPrisma.pin.delete.mockResolvedValueOnce({ id: "pin-1" });

      await deletePin("pin-1");

      expect(mockPrisma.pin.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: "pin-1" },
        select: { blauwdrukId: true },
      });
      expect(mockPrisma.pin.delete).toHaveBeenCalledWith({
        where: { id: "pin-1" },
      });
    });
  });

  // ----------------------------------------------------------
  // getPinsVoorWerkindeling
  // ----------------------------------------------------------

  describe("getPinsVoorWerkindeling", () => {
    it("haalt pins op via werkindeling → blauwdrukId", async () => {
      mockPrisma.werkindeling.findUniqueOrThrow.mockResolvedValueOnce({
        blauwdrukId: "bp-1",
      });
      const mockPins = [
        {
          id: "pin-1",
          speler: { id: "sp-1", roepnaam: "Jan", achternaam: "Bakker" },
        },
      ];
      mockPrisma.pin.findMany.mockResolvedValueOnce(mockPins);

      const result = await getPinsVoorWerkindeling("werkindeling-1");

      expect(result).toEqual(mockPins);
      expect(mockPrisma.pin.findMany).toHaveBeenCalledWith({
        where: { blauwdrukId: "bp-1" },
        include: expect.any(Object),
        orderBy: { gepindOp: "desc" },
      });
    });

    it("retourneert lege array als er geen pins zijn", async () => {
      mockPrisma.werkindeling.findUniqueOrThrow.mockResolvedValueOnce({
        blauwdrukId: "bp-1",
      });
      mockPrisma.pin.findMany.mockResolvedValueOnce([]);

      const result = await getPinsVoorWerkindeling("werkindeling-1");

      expect(result).toEqual([]);
    });
  });
});
