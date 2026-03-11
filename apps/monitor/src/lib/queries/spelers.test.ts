import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "@/test/mock-prisma";
import { getSpelerDetail } from "./spelers";

describe("getSpelerDetail", () => {
  beforeEach(() => {
    mockPrisma.lid.findUnique.mockReset();
    mockPrisma.$queryRaw.mockReset();
    mockPrisma.ledenverloop.findMany.mockReset();
  });

  it("retourneert null als lid niet bestaat", async () => {
    mockPrisma.lid.findUnique.mockResolvedValue(null);
    const result = await getSpelerDetail("ONBEKEND");
    expect(result).toBeNull();
  });

  it("retourneert detail met seizoenen en verloop", async () => {
    mockPrisma.lid.findUnique.mockResolvedValue({
      relCode: "TSTN001",
      roepnaam: "Daan",
      achternaam: "de Jong",
      tussenvoegsel: null,
      geslacht: "M",
      geboortejaar: 2010,
      geboortedatum: new Date(2010, 5, 15),
      lidSinds: new Date(2020, 8, 1),
      afmelddatum: null,
      foto: null,
    });

    mockPrisma.$queryRaw.mockResolvedValue([
      { seizoen: "2025-2026", competitie: "veld_najaar", team: "B1" },
      { seizoen: "2025-2026", competitie: "zaal", team: "B1" },
      { seizoen: "2024-2025", competitie: "veld_najaar", team: "C1" },
    ]);

    mockPrisma.ledenverloop.findMany.mockResolvedValue([
      { seizoen: "2025-2026", status: "behouden", teamVorig: "C1", teamNieuw: "B1" },
      { seizoen: "2024-2025", status: "nieuw", teamVorig: null, teamNieuw: "C1" },
    ]);

    const result = await getSpelerDetail("TSTN001");

    expect(result).not.toBeNull();
    expect(result!.relCode).toBe("TSTN001");
    expect(result!.roepnaam).toBe("Daan");
    expect(result!.heeftFoto).toBe(false);

    // 2 seizoenen
    expect(result!.seizoenen).toHaveLength(2);
    expect(result!.seizoenen[0].seizoen).toBe("2025-2026");
    expect(result!.seizoenen[0].team).toBe("B1");
    expect(result!.seizoenen[0].competities).toHaveLength(2);

    // Verloop
    expect(result!.verloop).toHaveLength(2);
    expect(result!.verloop[0].status).toBe("behouden");
  });

  it("markeert heeftFoto correct wanneer foto aanwezig", async () => {
    mockPrisma.lid.findUnique.mockResolvedValue({
      relCode: "TSTN002",
      roepnaam: "Emma",
      achternaam: "Jansen",
      tussenvoegsel: null,
      geslacht: "V",
      geboortejaar: 2008,
      geboortedatum: new Date(2008, 3, 10),
      lidSinds: new Date(2019, 8, 1),
      afmelddatum: null,
      foto: { relCode: "TSTN002" },
    });
    mockPrisma.$queryRaw.mockResolvedValue([]);
    mockPrisma.ledenverloop.findMany.mockResolvedValue([]);

    const result = await getSpelerDetail("TSTN002");
    expect(result!.heeftFoto).toBe(true);
  });
});
