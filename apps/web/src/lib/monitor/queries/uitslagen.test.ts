import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "@/test/mock-prisma";
import { getOWTeamsMetUitslagen } from "./uitslagen";

describe("getOWTeamsMetUitslagen", () => {
  beforeEach(() => {
    mockPrisma.$queryRaw.mockReset();
  });

  it("retourneert lege array als er geen data is", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([]);

    const result = await getOWTeamsMetUitslagen("2025-2026");

    expect(result).toEqual([]);
  });

  it("groepeert poules per OW-team", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      {
        pool_stand_id: 1,
        pool: "Poule A",
        niveau: "2e klasse",
        periode: "veld_najaar",
        positie: 1,
        team_naam: "Oranje Wit (D) B1",
        is_ow: true,
        gs: 5,
        wn: 4,
        gl: 0,
        vl: 1,
        pt: 12,
        vr: 30,
        tg: 15,
      },
      {
        pool_stand_id: 1,
        pool: "Poule A",
        niveau: "2e klasse",
        periode: "veld_najaar",
        positie: 2,
        team_naam: "Tegenstander 1",
        is_ow: false,
        gs: 5,
        wn: 3,
        gl: 1,
        vl: 1,
        pt: 10,
        vr: 25,
        tg: 18,
      },
    ]);

    const result = await getOWTeamsMetUitslagen("2025-2026");

    expect(result).toHaveLength(1);
    expect(result[0].teamCode).toBe("B1");
    expect(result[0].poules).toHaveLength(1);
    expect(result[0].poules[0].pool).toBe("Poule A");
    expect(result[0].poules[0].niveau).toBe("2e klasse");
    expect(result[0].poules[0].regels).toHaveLength(2);

    // Controleer OW-team regel
    const owRegel = result[0].poules[0].regels[0];
    expect(owRegel.isOW).toBe(true);
    expect(owRegel.positie).toBe(1);
    expect(owRegel.gewonnen).toBe(4);
    expect(owRegel.punten).toBe(12);
  });

  it("filtert poules waar OW 0 wedstrijden heeft gespeeld", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      {
        pool_stand_id: 10,
        pool: "Poule B",
        niveau: null,
        periode: "zaal",
        positie: 1,
        team_naam: "Oranje Wit (D) C1",
        is_ow: true,
        gs: 0, // geen wedstrijden gespeeld
        wn: 0,
        gl: 0,
        vl: 0,
        pt: 0,
        vr: 0,
        tg: 0,
      },
    ]);

    const result = await getOWTeamsMetUitslagen("2025-2026");

    // Poule wordt gefilterd omdat owGespeeld === 0
    expect(result).toEqual([]);
  });

  it("sorteert teams op teamcode (nummers eerst, dan letters)", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      // Team "1" (senioren)
      {
        pool_stand_id: 1,
        pool: "P1",
        niveau: null,
        periode: "zaal",
        positie: 1,
        team_naam: "Oranje Wit (D) 1",
        is_ow: true,
        gs: 3,
        wn: 2,
        gl: 0,
        vl: 1,
        pt: 6,
        vr: 20,
        tg: 10,
      },
      // Team "B1"
      {
        pool_stand_id: 2,
        pool: "P2",
        niveau: null,
        periode: "zaal",
        positie: 1,
        team_naam: "Oranje Wit (D) B1",
        is_ow: true,
        gs: 4,
        wn: 3,
        gl: 0,
        vl: 1,
        pt: 9,
        vr: 25,
        tg: 12,
      },
      // Team "A1"
      {
        pool_stand_id: 3,
        pool: "P3",
        niveau: null,
        periode: "zaal",
        positie: 1,
        team_naam: "Oranje Wit (D) A1",
        is_ow: true,
        gs: 5,
        wn: 5,
        gl: 0,
        vl: 0,
        pt: 15,
        vr: 40,
        tg: 5,
      },
    ]);

    const result = await getOWTeamsMetUitslagen("2025-2026");

    expect(result).toHaveLength(3);
    expect(result[0].teamCode).toBe("1"); // nummers eerst
    expect(result[1].teamCode).toBe("A1");
    expect(result[2].teamCode).toBe("B1");
  });

  it("dedupliceert poules met dezelfde pool+niveau", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      // Eerste versie: 2 wedstrijden
      {
        pool_stand_id: 1,
        pool: "Poule A",
        niveau: "3e klasse",
        periode: "veld_najaar",
        positie: 1,
        team_naam: "Oranje Wit (D) A1",
        is_ow: true,
        gs: 2,
        wn: 1,
        gl: 0,
        vl: 1,
        pt: 3,
        vr: 10,
        tg: 8,
      },
      // Tweede versie (zelfde pool+niveau): 5 wedstrijden — moet winnen
      {
        pool_stand_id: 2,
        pool: "Poule A",
        niveau: "3e klasse",
        periode: "veld_voorjaar",
        positie: 1,
        team_naam: "Oranje Wit (D) A1",
        is_ow: true,
        gs: 5,
        wn: 4,
        gl: 0,
        vl: 1,
        pt: 12,
        vr: 30,
        tg: 15,
      },
    ]);

    const result = await getOWTeamsMetUitslagen("2025-2026");

    expect(result).toHaveLength(1);
    expect(result[0].poules).toHaveLength(1);
    // De versie met meer wedstrijden moet overblijven
    expect(result[0].poules[0].regels[0].gespeeld).toBe(5);
  });
});
