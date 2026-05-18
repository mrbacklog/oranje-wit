import { prisma } from "./types";
import type { SpelerStatus, Geslacht } from "@oranje-wit/database";
import { logger } from "@oranje-wit/types";
import { getUniekeNaam } from "./namen-pool";

interface StatusEdgeFixture {
  volgnr: number;
  status: SpelerStatus;
  geslacht: Geslacht;
}

// 10 status-scenario's — naam wordt dynamisch getrokken uit namen-pool
// zodat de spelers leesbare Nederlandse namen krijgen (status zit alleen
// in metadata, niet meer in de roepnaam).
export const STATUS_FIXTURES: StatusEdgeFixture[] = [
  { volgnr: 1, status: "BESCHIKBAAR", geslacht: "V" },
  { volgnr: 2, status: "TWIJFELT", geslacht: "V" },
  { volgnr: 3, status: "GEBLESSEERD", geslacht: "V" },
  { volgnr: 4, status: "GAAT_STOPPEN", geslacht: "V" },
  { volgnr: 5, status: "GESTOPT", geslacht: "M" },
  { volgnr: 6, status: "NIEUW_POTENTIEEL", geslacht: "M" },
  { volgnr: 7, status: "NIEUW_DEFINITIEF", geslacht: "M" },
  { volgnr: 8, status: "ALGEMEEN_RESERVE", geslacht: "V" },
  { volgnr: 9, status: "RECREANT", geslacht: "M" },
  { volgnr: 10, status: "NIET_SPELEND", geslacht: "V" },
];

export async function seedStatusEdge(): Promise<void> {
  logger.info("[seed-status-edge] 10 status-fixtures");
  for (const f of STATUS_FIXTURES) {
    // rel_code patroon: 9900 + 1000 (sectie-ID) + volgnr (4 cijfers) = 12 cijfers
    const code = `99001000${String(f.volgnr).padStart(4, "0")}`;
    const naam = getUniekeNaam(f.geslacht);
    const roepnaam = naam?.roepnaam ?? `Speler${f.volgnr}`;
    const achternaam = naam
      ? naam.tussenvoegsel
        ? `${naam.tussenvoegsel} ${naam.achternaam}`
        : naam.achternaam
      : "Onbekend";
    await prisma.speler.upsert({
      where: { id: code },
      create: {
        id: code,
        roepnaam,
        achternaam,
        geslacht: f.geslacht,
        geboortejaar: 2000,
        geboortedatum: new Date("2000-06-15"),
        status: f.status,
      },
      update: { status: f.status, roepnaam, achternaam },
    });
  }
  logger.info("[seed-status-edge] klaar");
}
