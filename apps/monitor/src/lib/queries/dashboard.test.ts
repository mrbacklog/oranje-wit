import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "@/test/mock-prisma";
import { getDashboardKPIs } from "./dashboard";

describe("getDashboardKPIs", () => {
  beforeEach(() => {
    mockPrisma.snapshot.findFirst.mockReset();
    mockPrisma.signalering.findMany.mockReset();
    mockPrisma.oWTeam.count.mockReset();
    mockPrisma.$queryRaw.mockReset();
  });

  it("retourneert lege KPIs als er geen snapshot is", async () => {
    mockPrisma.snapshot.findFirst.mockResolvedValue(null);
    mockPrisma.signalering.findMany.mockResolvedValue([]);
    mockPrisma.oWTeam.count.mockResolvedValue(0);

    const result = await getDashboardKPIs("2024-2025");

    expect(result).toEqual({
      seizoen: "2024-2025",
      snapshot_datum: null,
      totaal_leden: 0,
      totaal_spelers: 0,
      totaal_teams: 0,
      signalering_kritiek: 0,
      signalering_aandacht: 0,
      geslacht: { M: 0, V: 0 },
      categorie: { a: 0, b: 0 },
    });
  });

  it("combineert snapshot, signaleringen en teams correct", async () => {
    const datum = new Date("2024-10-01");
    mockPrisma.snapshot.findFirst.mockResolvedValue({
      id: 42,
      snapshotDatum: datum,
      totaalLeden: 150,
      totaalSpelers: 120,
    });
    mockPrisma.signalering.findMany.mockResolvedValue([
      { ernst: "kritiek" },
      { ernst: "kritiek" },
      { ernst: "aandacht" },
      { ernst: "info" },
    ]);
    mockPrisma.oWTeam.count.mockResolvedValue(12);

    // Eerste $queryRaw call = geslacht, tweede = categorie
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([
        { geslacht: "M", aantal: 70 },
        { geslacht: "V", aantal: 50 },
      ])
      .mockResolvedValueOnce([
        { categorie: "a", aantal: 80 },
        { categorie: "b", aantal: 40 },
      ]);

    const result = await getDashboardKPIs("2024-2025");

    expect(result.seizoen).toBe("2024-2025");
    expect(result.snapshot_datum).toEqual(datum);
    expect(result.totaal_leden).toBe(150);
    expect(result.totaal_spelers).toBe(120);
    expect(result.totaal_teams).toBe(12);
    expect(result.signalering_kritiek).toBe(2);
    expect(result.signalering_aandacht).toBe(1);
    expect(result.geslacht).toEqual({ M: 70, V: 50 });
    expect(result.categorie).toEqual({ a: 80, b: 40 });
  });

  it("handelt ontbrekende geslacht/categorie rows af", async () => {
    mockPrisma.snapshot.findFirst.mockResolvedValue({
      id: 1,
      snapshotDatum: new Date(),
      totaalLeden: 10,
      totaalSpelers: 8,
    });
    mockPrisma.signalering.findMany.mockResolvedValue([]);
    mockPrisma.oWTeam.count.mockResolvedValue(2);

    // Geen M/V rows, geen categorie rows
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await getDashboardKPIs("2024-2025");

    expect(result.geslacht).toEqual({ M: 0, V: 0 });
    expect(result.categorie).toEqual({ a: 0, b: 0 });
  });

  it("handelt null totaalLeden/totaalSpelers af", async () => {
    mockPrisma.snapshot.findFirst.mockResolvedValue({
      id: 1,
      snapshotDatum: new Date(),
      totaalLeden: null,
      totaalSpelers: null,
    });
    mockPrisma.signalering.findMany.mockResolvedValue([]);
    mockPrisma.oWTeam.count.mockResolvedValue(0);
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await getDashboardKPIs("2024-2025");

    expect(result.totaal_leden).toBe(0);
    expect(result.totaal_spelers).toBe(0);
  });
});
