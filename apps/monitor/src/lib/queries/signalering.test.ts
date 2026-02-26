import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "@/test/mock-prisma";
import { getSignaleringen, getSignaleringSamenvatting } from "./signalering";

// ---------------------------------------------------------------------------
// getSignaleringen
// ---------------------------------------------------------------------------

describe("getSignaleringen", () => {
  beforeEach(() => {
    mockPrisma.signalering.findMany.mockReset();
  });

  it("mapt database-rows naar SignaleringRow met correcte number-conversie", async () => {
    mockPrisma.signalering.findMany.mockResolvedValue([
      {
        id: 1,
        seizoen: "2024-2025",
        type: "retentie",
        ernst: "kritiek",
        leeftijdsgroep: "13-18",
        geslacht: "M",
        waarde: { toNumber: () => 65.2 } as any,
        drempel: { toNumber: () => 70.0 } as any,
        streef: { toNumber: () => 80.0 } as any,
        beschrijving: "Lage retentie jongens 13-18",
      },
      {
        id: 2,
        seizoen: "2024-2025",
        type: "instroom",
        ernst: "aandacht",
        leeftijdsgroep: null,
        geslacht: null,
        waarde: null,
        drempel: null,
        streef: null,
        beschrijving: "Instroom onder gemiddelde",
      },
    ]);

    const result = await getSignaleringen("2024-2025");

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 1,
      seizoen: "2024-2025",
      type: "retentie",
      ernst: "kritiek",
      leeftijdsgroep: "13-18",
      geslacht: "M",
      waarde: expect.any(Number),
      drempel: expect.any(Number),
      streef: expect.any(Number),
      beschrijving: "Lage retentie jongens 13-18",
    });
    expect(result[1].waarde).toBeNull();
    expect(result[1].leeftijdsgroep).toBeNull();
  });

  it("geeft lege array als er geen signaleringen zijn", async () => {
    mockPrisma.signalering.findMany.mockResolvedValue([]);
    const result = await getSignaleringen("2024-2025");
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getSignaleringSamenvatting
// ---------------------------------------------------------------------------

describe("getSignaleringSamenvatting", () => {
  beforeEach(() => {
    mockPrisma.signalering.findMany.mockReset();
  });

  it("telt kritiek en aandacht correct", async () => {
    mockPrisma.signalering.findMany.mockResolvedValue([
      {
        id: 1,
        seizoen: "2024-2025",
        type: "retentie",
        ernst: "kritiek",
        leeftijdsgroep: null,
        geslacht: null,
        waarde: 60,
        drempel: 70,
        streef: null,
        beschrijving: "test",
      },
      {
        id: 2,
        seizoen: "2024-2025",
        type: "instroom",
        ernst: "kritiek",
        leeftijdsgroep: null,
        geslacht: null,
        waarde: 5,
        drempel: 10,
        streef: null,
        beschrijving: "test2",
      },
      {
        id: 3,
        seizoen: "2024-2025",
        type: "balans",
        ernst: "aandacht",
        leeftijdsgroep: null,
        geslacht: null,
        waarde: 55,
        drempel: 60,
        streef: null,
        beschrijving: "test3",
      },
    ]);

    const result = await getSignaleringSamenvatting("2024-2025");

    expect(result.totaal).toBe(3);
    expect(result.kritiek).toBe(2);
    expect(result.aandacht).toBe(1);
  });

  it("geeft nullen als er geen signaleringen zijn", async () => {
    mockPrisma.signalering.findMany.mockResolvedValue([]);

    const result = await getSignaleringSamenvatting("2024-2025");

    expect(result).toEqual({
      totaal: 0,
      kritiek: 0,
      aandacht: 0,
    });
  });
});
