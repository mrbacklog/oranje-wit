import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "@/test/mock-prisma";
import { getDashboardKPIs } from "./dashboard";

describe("getDashboardKPIs", () => {
  beforeEach(() => {
    mockPrisma.signalering.findMany.mockReset();
    mockPrisma.$queryRaw.mockReset();
  });

  it("retourneert lege KPIs als er geen spelers zijn", async () => {
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([{ totaal: 0 }]) // spelerCount
      .mockResolvedValueOnce([]) // teamRows
      .mockResolvedValueOnce([]); // geslachtRows
    mockPrisma.signalering.findMany.mockResolvedValue([]);

    const result = await getDashboardKPIs("2024-2025");

    expect(result).toEqual({
      seizoen: "2024-2025",
      totaal_spelers: 0,
      totaal_teams: 0,
      teams_8tal: 0,
      teams_4tal: 0,
      signalering_kritiek: 0,
      signalering_aandacht: 0,
      geslacht: { M: 0, V: 0 },
    });
  });

  it("combineert spelers, signaleringen en teams correct", async () => {
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([{ totaal: 120 }]) // spelerCount
      .mockResolvedValueOnce([
        // teamRows
        { spelvorm: "8-tal", aantal: 8 },
        { spelvorm: "4-tal", aantal: 4 },
      ])
      .mockResolvedValueOnce([
        // geslachtRows
        { geslacht: "M", aantal: 70 },
        { geslacht: "V", aantal: 50 },
      ]);
    mockPrisma.signalering.findMany.mockResolvedValue([
      { ernst: "kritiek" },
      { ernst: "kritiek" },
      { ernst: "aandacht" },
      { ernst: "info" },
    ]);

    const result = await getDashboardKPIs("2024-2025");

    expect(result.seizoen).toBe("2024-2025");
    expect(result.totaal_spelers).toBe(120);
    expect(result.totaal_teams).toBe(12);
    expect(result.teams_8tal).toBe(8);
    expect(result.teams_4tal).toBe(4);
    expect(result.signalering_kritiek).toBe(2);
    expect(result.signalering_aandacht).toBe(1);
    expect(result.geslacht).toEqual({ M: 70, V: 50 });
  });

  it("handelt ontbrekende geslacht rows af", async () => {
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([{ totaal: 10 }]) // spelerCount
      .mockResolvedValueOnce([{ spelvorm: "8-tal", aantal: 2 }]) // teamRows
      .mockResolvedValueOnce([]); // geslachtRows (leeg)
    mockPrisma.signalering.findMany.mockResolvedValue([]);

    const result = await getDashboardKPIs("2024-2025");

    expect(result.geslacht).toEqual({ M: 0, V: 0 });
    expect(result.totaal_teams).toBe(2);
  });
});
