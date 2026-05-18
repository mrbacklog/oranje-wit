import { prisma } from "./types";
import type { SpelerStatus, Geslacht } from "@oranje-wit/database";
import { logger } from "@oranje-wit/types";

interface StatusEdgeFixture {
  volgnr: number;
  naam: string;
  status: SpelerStatus;
  geslacht: Geslacht;
}

export const STATUS_FIXTURES: StatusEdgeFixture[] = [
  { volgnr: 1, naam: "Edge-Beschikbaar-V", status: "BESCHIKBAAR", geslacht: "V" },
  { volgnr: 2, naam: "Edge-Twijfelt-V", status: "TWIJFELT", geslacht: "V" },
  { volgnr: 3, naam: "Edge-Geblesseerd-V", status: "GEBLESSEERD", geslacht: "V" },
  { volgnr: 4, naam: "Edge-GaatStoppen-V", status: "GAAT_STOPPEN", geslacht: "V" },
  { volgnr: 5, naam: "Edge-Gestopt-M", status: "GESTOPT", geslacht: "M" },
  { volgnr: 6, naam: "Edge-NieuwPotent-M", status: "NIEUW_POTENTIEEL", geslacht: "M" },
  { volgnr: 7, naam: "Edge-NieuwDef-M", status: "NIEUW_DEFINITIEF", geslacht: "M" },
  { volgnr: 8, naam: "Edge-AlgReserve-V", status: "ALGEMEEN_RESERVE", geslacht: "V" },
  { volgnr: 9, naam: "Edge-Recreant-M", status: "RECREANT", geslacht: "M" },
  { volgnr: 10, naam: "Edge-NietSpelend-V", status: "NIET_SPELEND", geslacht: "V" },
];

export async function seedStatusEdge(): Promise<void> {
  logger.info("[seed-status-edge] 10 status-fixtures");
  for (const f of STATUS_FIXTURES) {
    // rel_code patroon: 9900 + 1000 (sectie-ID) + volgnr (4 cijfers) = 12 cijfers
    const code = `99001000${String(f.volgnr).padStart(4, "0")}`;
    await prisma.speler.upsert({
      where: { id: code },
      create: {
        id: code,
        roepnaam: f.naam,
        achternaam: "Edge",
        geslacht: f.geslacht,
        geboortejaar: 2000,
        geboortedatum: new Date("2000-06-15"),
        status: f.status,
      },
      update: { status: f.status, roepnaam: f.naam },
    });
  }
  logger.info("[seed-status-edge] klaar");
}
