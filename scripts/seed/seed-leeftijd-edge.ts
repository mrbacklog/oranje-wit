import { prisma } from "./types";
import type { Geslacht } from "@oranje-wit/database";
import { logger } from "@oranje-wit/types";
import { getUniekeNaam } from "./namen-pool";

interface LeeftijdEdgeFixture {
  volgnr: number;
  geboortedatum: string;
  geboortejaar: number;
  geslacht: Geslacht;
  omschrijving: string;
}

// 8 leeftijdsgrens-scenario's — naam wordt dynamisch getrokken uit namen-pool.
export const LEEFTIJD_FIXTURES: LeeftijdEdgeFixture[] = [
  {
    volgnr: 1,
    geboortedatum: "2020-01-01",
    geboortejaar: 2020,
    geslacht: "V",
    omschrijving: "Kangoeroe / Blauw-1 grens",
  },
  {
    volgnr: 2,
    geboortedatum: "2018-01-01",
    geboortejaar: 2018,
    geslacht: "V",
    omschrijving: "Blauw / Groen-1 grens",
  },
  {
    volgnr: 3,
    geboortedatum: "2016-01-01",
    geboortejaar: 2016,
    geslacht: "M",
    omschrijving: "Groen / Geel-1 grens",
  },
  {
    volgnr: 4,
    geboortedatum: "2014-01-01",
    geboortejaar: 2014,
    geslacht: "M",
    omschrijving: "Geel / Oranje-1 grens",
  },
  {
    volgnr: 5,
    geboortedatum: "2012-01-01",
    geboortejaar: 2012,
    geslacht: "V",
    omschrijving: "Oranje / Rood-1 grens",
  },
  {
    volgnr: 6,
    geboortedatum: "2010-01-01",
    geboortejaar: 2010,
    geslacht: "V",
    omschrijving: "Rood / U17-1 grens",
  },
  {
    volgnr: 7,
    geboortedatum: "2008-01-01",
    geboortejaar: 2008,
    geslacht: "M",
    omschrijving: "U17 / U19-1 grens",
  },
  {
    volgnr: 8,
    geboortedatum: "2006-01-01",
    geboortejaar: 2006,
    geslacht: "M",
    omschrijving: "U19 / Senior-1 grens",
  },
];

export async function seedLeeftijdEdge(): Promise<void> {
  logger.info("[seed-leeftijd-edge] 8 leeftijdsgrens-fixtures");
  for (const f of LEEFTIJD_FIXTURES) {
    const code = `99002000${String(f.volgnr).padStart(4, "0")}`;
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
        geboortejaar: f.geboortejaar,
        geboortedatum: new Date(f.geboortedatum),
        status: "BESCHIKBAAR",
      },
      update: {
        roepnaam,
        achternaam,
        geboortejaar: f.geboortejaar,
        geboortedatum: new Date(f.geboortedatum),
      },
    });
  }
  logger.info("[seed-leeftijd-edge] klaar");
}
