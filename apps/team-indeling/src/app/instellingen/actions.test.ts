import { vi, describe, it, expect, beforeEach } from "vitest";
import { createMockPrisma } from "@oranje-wit/test-utils";

// ============================================================
// Mocks
// ============================================================

const mockPrisma = createMockPrisma();

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@oranje-wit/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { email: "antjanlaban@gmail.com", name: "Test", role: "EDITOR" },
  }),
}));

vi.mock("@oranje-wit/auth/allowlist", () => ({
  ADMIN_EMAIL: "antjanlaban@gmail.com",
}));

vi.mock("@/lib/seizoen", () => ({
  getActiefSeizoen: vi.fn().mockResolvedValue("2025-2026"),
}));

// ============================================================
// Import NA mocks
// ============================================================

const {
  isAdmin,
  switchSeizoen,
  getMijlpalen,
  createMijlpaal,
  updateMijlpaal,
  deleteMijlpaal,
  getImportHistorie,
  getAlleSeizoenen,
} = await import("./actions");

// ============================================================
// Tests
// ============================================================

describe("instellingen/actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----------------------------------------------------------
  // isAdmin
  // ----------------------------------------------------------

  describe("isAdmin", () => {
    it("retourneert true voor admin email", async () => {
      const result = await isAdmin();
      expect(result).toBe(true);
    });

    it("retourneert false voor niet-admin email", async () => {
      const { auth } = await import("@oranje-wit/auth");
      (auth as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        user: { email: "ander@gmail.com" },
      });

      const result = await isAdmin();
      expect(result).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // switchSeizoen
  // ----------------------------------------------------------

  describe("switchSeizoen", () => {
    it("zet alle blauwdrukken op niet-werkseizoen en activeert het nieuwe", async () => {
      mockPrisma.blauwdruk.updateMany.mockResolvedValueOnce({ count: 2 });
      mockPrisma.blauwdruk.update.mockResolvedValueOnce({
        seizoen: "2024-2025",
        isWerkseizoen: true,
      });

      await switchSeizoen("2024-2025");

      expect(mockPrisma.blauwdruk.updateMany).toHaveBeenCalledWith({
        data: { isWerkseizoen: false },
      });
      expect(mockPrisma.blauwdruk.update).toHaveBeenCalledWith({
        where: { seizoen: "2024-2025" },
        data: { isWerkseizoen: true },
      });
    });

    it("gooit een fout voor niet-admin gebruikers", async () => {
      const { auth } = await import("@oranje-wit/auth");
      (auth as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        user: { email: "ander@gmail.com" },
      });

      await expect(switchSeizoen("2024-2025")).rejects.toThrow("Alleen admin mag seizoen wisselen");
    });
  });

  // ----------------------------------------------------------
  // getMijlpalen
  // ----------------------------------------------------------

  describe("getMijlpalen", () => {
    it("haalt mijlpalen op voor het actieve seizoen", async () => {
      const data = [{ id: "m1", label: "Fase 1", volgorde: 1 }];
      mockPrisma.mijlpaal.findMany.mockResolvedValueOnce(data);

      const result = await getMijlpalen();

      expect(result).toEqual(data);
      expect(mockPrisma.mijlpaal.findMany).toHaveBeenCalledWith({
        where: { seizoen: "2025-2026" },
        orderBy: { volgorde: "asc" },
      });
    });
  });

  // ----------------------------------------------------------
  // createMijlpaal
  // ----------------------------------------------------------

  describe("createMijlpaal", () => {
    it("maakt een mijlpaal aan met de juiste volgorde", async () => {
      mockPrisma.mijlpaal.aggregate.mockResolvedValueOnce({
        _max: { volgorde: 3 },
      });
      mockPrisma.mijlpaal.create.mockResolvedValueOnce({
        id: "m-new",
        label: "Nieuwe mijlpaal",
        volgorde: 4,
      });

      const result = await createMijlpaal({
        label: "Nieuwe mijlpaal",
        datum: "2026-05-01",
      });

      expect(result).toEqual(expect.objectContaining({ label: "Nieuwe mijlpaal" }));
      expect(mockPrisma.mijlpaal.create).toHaveBeenCalledWith({
        data: {
          seizoen: "2025-2026",
          label: "Nieuwe mijlpaal",
          datum: new Date("2026-05-01"),
          volgorde: 4,
        },
      });
    });

    it("start met volgorde 1 als er geen mijlpalen zijn", async () => {
      mockPrisma.mijlpaal.aggregate.mockResolvedValueOnce({
        _max: { volgorde: null },
      });
      mockPrisma.mijlpaal.create.mockResolvedValueOnce({
        id: "m1",
        volgorde: 1,
      });

      await createMijlpaal({ label: "Eerste", datum: "2026-01-01" });

      expect(mockPrisma.mijlpaal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ volgorde: 1 }),
        })
      );
    });
  });

  // ----------------------------------------------------------
  // updateMijlpaal
  // ----------------------------------------------------------

  describe("updateMijlpaal", () => {
    it("update het label van een mijlpaal", async () => {
      mockPrisma.mijlpaal.update.mockResolvedValueOnce({
        id: "m1",
        label: "Bijgewerkt",
      });

      await updateMijlpaal("m1", { label: "Bijgewerkt" });

      expect(mockPrisma.mijlpaal.update).toHaveBeenCalledWith({
        where: { id: "m1" },
        data: { label: "Bijgewerkt" },
      });
    });

    it("zet afgerond met afgerondOp timestamp", async () => {
      mockPrisma.mijlpaal.update.mockResolvedValueOnce({
        id: "m1",
        afgerond: true,
      });

      await updateMijlpaal("m1", { afgerond: true });

      expect(mockPrisma.mijlpaal.update).toHaveBeenCalledWith({
        where: { id: "m1" },
        data: expect.objectContaining({
          afgerond: true,
          afgerondOp: expect.any(Date),
        }),
      });
    });

    it("reset afgerondOp naar null als afgerond false is", async () => {
      mockPrisma.mijlpaal.update.mockResolvedValueOnce({
        id: "m1",
        afgerond: false,
      });

      await updateMijlpaal("m1", { afgerond: false });

      expect(mockPrisma.mijlpaal.update).toHaveBeenCalledWith({
        where: { id: "m1" },
        data: expect.objectContaining({
          afgerond: false,
          afgerondOp: null,
        }),
      });
    });
  });

  // ----------------------------------------------------------
  // deleteMijlpaal
  // ----------------------------------------------------------

  describe("deleteMijlpaal", () => {
    it("verwijdert een mijlpaal op id", async () => {
      mockPrisma.mijlpaal.delete.mockResolvedValueOnce({ id: "m1" });

      await deleteMijlpaal("m1");

      expect(mockPrisma.mijlpaal.delete).toHaveBeenCalledWith({
        where: { id: "m1" },
      });
    });
  });

  // ----------------------------------------------------------
  // getImportHistorie
  // ----------------------------------------------------------

  describe("getImportHistorie", () => {
    it("retourneert de laatste 5 imports", async () => {
      const data = [{ id: "i1", createdAt: new Date() }];
      mockPrisma.import.findMany.mockResolvedValueOnce(data);

      const result = await getImportHistorie();

      expect(result).toEqual(data);
      expect(mockPrisma.import.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
        take: 5,
      });
    });
  });

  // ----------------------------------------------------------
  // getAlleSeizoenen
  // ----------------------------------------------------------

  describe("getAlleSeizoenen", () => {
    it("retourneert seizoenen met werkseizoen-vlag", async () => {
      const data = [
        { seizoen: "2025-2026", isWerkseizoen: true },
        { seizoen: "2024-2025", isWerkseizoen: false },
      ];
      mockPrisma.blauwdruk.findMany.mockResolvedValueOnce(data);

      const result = await getAlleSeizoenen();

      expect(result).toEqual(data);
      expect(mockPrisma.blauwdruk.findMany).toHaveBeenCalledWith({
        orderBy: { seizoen: "desc" },
        select: { seizoen: true, isWerkseizoen: true },
      });
    });
  });
});
