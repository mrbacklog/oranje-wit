import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "@/test/mock-prisma";
import { getStafPerTeam } from "./staf";

describe("getStafPerTeam", () => {
  beforeEach(() => {
    mockPrisma.$queryRaw.mockReset();
  });

  it("retourneert lege map als er geen staf is", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([]);

    const result = await getStafPerTeam("2025-2026");

    expect(result.size).toBe(0);
  });

  it("groepeert staf per teamcode", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      {
        ow_code: "B1",
        staf_id: "S001",
        naam: "Jan Bakker",
        rol: "trainer",
        functie: "hoofdtrainer",
      },
      {
        ow_code: "B1",
        staf_id: "S002",
        naam: "Piet Smit",
        rol: "coach",
        functie: null,
      },
      {
        ow_code: "C1",
        staf_id: "S003",
        naam: "Marie Groot",
        rol: "trainer",
        functie: "hoofdtrainer",
      },
    ]);

    const result = await getStafPerTeam("2025-2026");

    expect(result.size).toBe(2);

    const b1Staf = result.get("B1");
    expect(b1Staf).toHaveLength(2);
    expect(b1Staf![0]).toEqual({
      stafCode: "S001",
      naam: "Jan Bakker",
      rol: "trainer",
      functie: "hoofdtrainer",
    });
    expect(b1Staf![1].functie).toBeNull();

    const c1Staf = result.get("C1");
    expect(c1Staf).toHaveLength(1);
    expect(c1Staf![0].naam).toBe("Marie Groot");
  });

  it("handelt een enkel staf-lid correct af", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      {
        ow_code: "A1",
        staf_id: "S010",
        naam: "Kim de Vries",
        rol: "trainer",
        functie: null,
      },
    ]);

    const result = await getStafPerTeam("2025-2026");

    expect(result.size).toBe(1);
    expect(result.get("A1")).toHaveLength(1);
  });
});
