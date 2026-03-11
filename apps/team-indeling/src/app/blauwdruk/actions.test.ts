import { vi, describe, it, expect, beforeEach } from "vitest";
import { createMockPrisma } from "@oranje-wit/test-utils";

// ============================================================
// Mocks
// ============================================================

const mockPrisma = createMockPrisma();

vi.mock("@/lib/db/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/seizoen", () => ({
  getActiefSeizoen: vi.fn().mockResolvedValue("2025-2026"),
  assertBewerkbaar: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: "2025-2026" }),
    set: vi.fn(),
  }),
}));

// ============================================================
// Import NA mocks
// ============================================================

const {
  getBlauwdruk,
  updateKaders,
  updateSpeerpunten,
  updateToelichting,
  updateCategorieKaders,
  updateSpelerStatus,
  getSpelersUitgebreid,
  getLedenStatistieken,
  getPinsVoorBlauwdruk,
  setWerkseizoen,
} = await import("./actions");

// ============================================================
// Tests
// ============================================================

describe("blauwdruk/actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Standaard: blauwdruk bestaat en is bewerkbaar
    mockPrisma.blauwdruk.findUniqueOrThrow.mockResolvedValue({
      seizoen: "2025-2026",
      isWerkseizoen: true,
    });
    mockPrisma.blauwdruk.findUnique.mockResolvedValue({
      seizoen: "2025-2026",
      isWerkseizoen: true,
    });
  });

  // ----------------------------------------------------------
  // getBlauwdruk
  // ----------------------------------------------------------

  describe("getBlauwdruk", () => {
    it("upsert een blauwdruk voor het seizoen", async () => {
      const mockBlauwdruk = {
        id: "bp-1",
        seizoen: "2025-2026",
        kaders: {},
        speerpunten: [],
        toelichting: "",
      };
      mockPrisma.blauwdruk.upsert.mockResolvedValueOnce(mockBlauwdruk);

      const result = await getBlauwdruk("2025-2026");

      expect(result).toEqual(mockBlauwdruk);
      expect(mockPrisma.blauwdruk.upsert).toHaveBeenCalledWith({
        where: { seizoen: "2025-2026" },
        create: {
          seizoen: "2025-2026",
          kaders: {},
          speerpunten: [],
          toelichting: "",
        },
        update: {},
      });
    });
  });

  // ----------------------------------------------------------
  // updateKaders
  // ----------------------------------------------------------

  describe("updateKaders", () => {
    it("update de kaders van een blauwdruk", async () => {
      const kaders = { BLAUW: { aantalTeams: 2 } };
      mockPrisma.blauwdruk.update.mockResolvedValueOnce({
        id: "bp-1",
        kaders,
      });

      await updateKaders("bp-1", kaders);

      expect(mockPrisma.blauwdruk.update).toHaveBeenCalledWith({
        where: { id: "bp-1" },
        data: { kaders },
      });
    });
  });

  // ----------------------------------------------------------
  // updateSpeerpunten
  // ----------------------------------------------------------

  describe("updateSpeerpunten", () => {
    it("update de speerpunten-array", async () => {
      const speerpunten = ["Meer plezier", "Betere doorstroom"];
      mockPrisma.blauwdruk.update.mockResolvedValueOnce({
        id: "bp-1",
        speerpunten,
      });

      await updateSpeerpunten("bp-1", speerpunten);

      expect(mockPrisma.blauwdruk.update).toHaveBeenCalledWith({
        where: { id: "bp-1" },
        data: { speerpunten },
      });
    });
  });

  // ----------------------------------------------------------
  // updateToelichting
  // ----------------------------------------------------------

  describe("updateToelichting", () => {
    it("update de toelichting tekst", async () => {
      mockPrisma.blauwdruk.update.mockResolvedValueOnce({
        id: "bp-1",
        toelichting: "Nieuwe tekst",
      });

      await updateToelichting("bp-1", "Nieuwe tekst");

      expect(mockPrisma.blauwdruk.update).toHaveBeenCalledWith({
        where: { id: "bp-1" },
        data: { toelichting: "Nieuwe tekst" },
      });
    });
  });

  // ----------------------------------------------------------
  // updateCategorieKaders
  // ----------------------------------------------------------

  describe("updateCategorieKaders", () => {
    it("merged nieuwe settings met bestaande kaders", async () => {
      // Eerste call: assertBlauwdrukBewerkbaar, tweede call: ophalen kaders
      mockPrisma.blauwdruk.findUniqueOrThrow
        .mockResolvedValueOnce({ seizoen: "2025-2026" })
        .mockResolvedValueOnce({ kaders: { BLAUW: { aantalTeams: 2 } } });
      mockPrisma.blauwdruk.update.mockResolvedValueOnce({ id: "bp-1" });

      await updateCategorieKaders("bp-1", "GROEN", { aantalTeams: 3 });

      expect(mockPrisma.blauwdruk.update).toHaveBeenCalledWith({
        where: { id: "bp-1" },
        data: {
          kaders: {
            BLAUW: { aantalTeams: 2 },
            GROEN: { aantalTeams: 3 },
          },
        },
      });
    });

    it("werkt bestaande categorie bij zonder andere te overschrijven", async () => {
      mockPrisma.blauwdruk.findUniqueOrThrow
        .mockResolvedValueOnce({ seizoen: "2025-2026" })
        .mockResolvedValueOnce({ kaders: { BLAUW: { aantalTeams: 2, notitie: "Test" } } });
      mockPrisma.blauwdruk.update.mockResolvedValueOnce({ id: "bp-1" });

      await updateCategorieKaders("bp-1", "BLAUW", { aantalTeams: 3 });

      expect(mockPrisma.blauwdruk.update).toHaveBeenCalledWith({
        where: { id: "bp-1" },
        data: {
          kaders: {
            BLAUW: { aantalTeams: 3, notitie: "Test" },
          },
        },
      });
    });
  });

  // ----------------------------------------------------------
  // updateSpelerStatus
  // ----------------------------------------------------------

  describe("updateSpelerStatus", () => {
    it("update de status van een speler", async () => {
      mockPrisma.speler.update.mockResolvedValueOnce({
        id: "sp-1",
        status: "TWIJFELT",
      });

      await updateSpelerStatus("sp-1", "TWIJFELT");

      expect(mockPrisma.speler.update).toHaveBeenCalledWith({
        where: { id: "sp-1" },
        data: { status: "TWIJFELT" },
      });
    });
  });

  // ----------------------------------------------------------
  // getSpelersUitgebreid
  // ----------------------------------------------------------

  describe("getSpelersUitgebreid", () => {
    it("combineert spelers met afmelddata", async () => {
      mockPrisma.speler.findMany.mockResolvedValueOnce([
        {
          id: "ABC123",
          roepnaam: "Jan",
          achternaam: "Bakker",
          geboortejaar: 2015,
          geslacht: "M",
          status: "BESCHIKBAAR",
          huidig: { team: "Geel 1", kleur: "GEEL" },
          volgendSeizoen: null,
          retentie: null,
          seizoenenActief: 3,
          instroomLeeftijd: 7,
          lidSinds: "2022-2023",
          spelerspad: null,
          notitie: null,
        },
      ]);
      mockPrisma.lid.findMany.mockResolvedValueOnce([
        { relCode: "ABC123", afmelddatum: new Date("2026-06-30") },
      ]);

      const result = await getSpelersUitgebreid();

      expect(result).toHaveLength(1);
      expect(result[0].afmelddatum).toBe("2026-06-30T00:00:00.000Z");
      expect(result[0].leeftijdVolgendSeizoen).toBeGreaterThan(0);
    });

    it("zet afmelddatum op null als speler niet is afgemeld", async () => {
      mockPrisma.speler.findMany.mockResolvedValueOnce([
        {
          id: "XYZ789",
          roepnaam: "Lisa",
          achternaam: "Vos",
          geboortejaar: 2014,
          geslacht: "V",
          status: "BESCHIKBAAR",
          huidig: null,
          volgendSeizoen: null,
          retentie: null,
          seizoenenActief: 1,
          instroomLeeftijd: 10,
          lidSinds: "2024-2025",
          spelerspad: null,
          notitie: null,
        },
      ]);
      mockPrisma.lid.findMany.mockResolvedValueOnce([]);

      const result = await getSpelersUitgebreid();

      expect(result[0].afmelddatum).toBeNull();
    });
  });

  // ----------------------------------------------------------
  // getLedenStatistieken
  // ----------------------------------------------------------

  describe("getLedenStatistieken", () => {
    it("berekent statistieken voor lege spelerslijst", async () => {
      mockPrisma.speler.findMany.mockResolvedValueOnce([]);

      const result = await getLedenStatistieken();

      expect(result.totaal).toBe(0);
      expect(result.perStatus.BESCHIKBAAR).toBe(0);
      expect(result.retentie.onbekend).toBe(0);
    });

    it("telt spelers per status", async () => {
      mockPrisma.speler.findMany.mockResolvedValueOnce([
        { geboortejaar: 2015, geslacht: "M", status: "BESCHIKBAAR", retentie: null },
        { geboortejaar: 2014, geslacht: "V", status: "BESCHIKBAAR", retentie: null },
        { geboortejaar: 2013, geslacht: "M", status: "TWIJFELT", retentie: null },
        { geboortejaar: 2016, geslacht: "V", status: "GAAT_STOPPEN", retentie: null },
      ]);

      const result = await getLedenStatistieken();

      expect(result.totaal).toBe(4);
      expect(result.perStatus.BESCHIKBAAR).toBe(2);
      expect(result.perStatus.TWIJFELT).toBe(1);
      expect(result.perStatus.GAAT_STOPPEN).toBe(1);
    });

    it("classificeert retentierisico's correct", async () => {
      mockPrisma.speler.findMany.mockResolvedValueOnce([
        { geboortejaar: 2015, geslacht: "M", status: "BESCHIKBAAR", retentie: { risico: "hoog" } },
        { geboortejaar: 2014, geslacht: "V", status: "BESCHIKBAAR", retentie: { risico: "laag" } },
        { geboortejaar: 2013, geslacht: "M", status: "BESCHIKBAAR", retentie: null },
      ]);

      const result = await getLedenStatistieken();

      expect(result.retentie.hoog).toBe(1);
      expect(result.retentie.laag).toBe(1);
      expect(result.retentie.onbekend).toBe(1);
    });
  });

  // ----------------------------------------------------------
  // getPinsVoorBlauwdruk
  // ----------------------------------------------------------

  describe("getPinsVoorBlauwdruk", () => {
    it("haalt pins op met speler- en stafdata", async () => {
      const mockPins = [
        {
          id: "pin-1",
          speler: { id: "sp-1", roepnaam: "Jan", achternaam: "Bakker" },
          staf: null,
          gepindDoor: { id: "u-1", naam: "Trainer" },
        },
      ];
      mockPrisma.pin.findMany.mockResolvedValueOnce(mockPins);

      const result = await getPinsVoorBlauwdruk("bp-1");

      expect(result).toEqual(mockPins);
      expect(mockPrisma.pin.findMany).toHaveBeenCalledWith({
        where: { blauwdrukId: "bp-1" },
        include: expect.objectContaining({
          speler: expect.any(Object),
          staf: expect.any(Object),
          gepindDoor: expect.any(Object),
        }),
        orderBy: { gepindOp: "desc" },
      });
    });
  });

  // ----------------------------------------------------------
  // setWerkseizoen
  // ----------------------------------------------------------

  describe("setWerkseizoen", () => {
    it("gooit fout bij ongeldig seizoensformaat", async () => {
      await expect(setWerkseizoen("invalid")).rejects.toThrow("Ongeldig seizoensformaat");
    });

    it("zet het werkseizoen en schrijft cookie", async () => {
      mockPrisma.blauwdruk.updateMany.mockResolvedValueOnce({ count: 1 });
      mockPrisma.blauwdruk.update.mockResolvedValueOnce({
        seizoen: "2025-2026",
        isWerkseizoen: true,
      });

      await setWerkseizoen("2025-2026");

      expect(mockPrisma.blauwdruk.updateMany).toHaveBeenCalledWith({
        data: { isWerkseizoen: false },
      });
      expect(mockPrisma.blauwdruk.update).toHaveBeenCalledWith({
        where: { seizoen: "2025-2026" },
        data: { isWerkseizoen: true },
      });
    });
  });
});
