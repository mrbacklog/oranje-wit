import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "@/test/mock-prisma";
import { getDashboardKPIs } from "./dashboard";

describe("getDashboardKPIs", () => {
  beforeEach(() => {
    mockPrisma.signalering.findMany.mockReset();
    mockPrisma.oWTeam.count.mockReset();
    mockPrisma.$queryRaw.mockReset();
  });

  it("retourneert lege KPIs als er geen spelers zijn", async () => {
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([{ totaal: 0 }]) // spelerCount
      .mockResolvedValueOnce([]); // geslachtRows
    mockPrisma.signalering.findMany.mockResolvedValue([]);
    mockPrisma.oWTeam.count.mockResolvedValue(0);

    const result = await getDashboardKPIs("2024-2025");

    expect(result).toEqual({
      seizoen: "2024-2025",
      totaal_spelers: 0,
      totaal_teams: 0,
      signalering_kritiek: 0,
      signalering_aandacht: 0,
      geslacht: { M: 0, V: 0 },
    });
  });

  it("combineert spelers, signaleringen en teams correct", async () => {
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([{ totaal: 120 }]) // spelerCount
      .mockResolvedValueOnce([ // geslachtRows
        { geslacht: "M", aantal: 70 },
        { geslacht: "V", aantal: 50 },
      ]);
    mockPrisma.signalering.findMany.mockResolvedValue([
      { ernst: "kritiek" },
      { ernst: "kritiek" },
      { ernst: "aandacht" },
      { ernst: "info" },
    ]);
    mockPrisma.oWTeam.count.mockResolvedValue(12);

    const result = await getDashboardKPIs("2024-2025");

    expect(result.seizoen).toBe("2024-2025");
    expect(result.totaal_spelers).toBe(120);
    expect(result.totaal_teams).toBe(12);
    expect(result.signalering_kritiek).toBe(2);
    expect(result.signalering_aandacht).toBe(1);
    expect(result.geslacht).toEqual({ M: 70, V: 50 });
  });

  it("handelt ontbrekende geslacht rows af", async () => {
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([{ totaal: 10 }])
      .mockResolvedValueOnce([]);
    mockPrisma.signalering.findMany.mockResolvedValue([]);
    mockPrisma.oWTeam.count.mockResolvedValue(2);

    const result = await getDashboardKPIs("2024-2025");

    expect(result.geslacht).toEqual({ M: 0, V: 0 });
  });
});
