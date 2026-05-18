import { prisma } from "./types";
import type { Geslacht } from "@oranje-wit/database";
import { logger } from "@oranje-wit/types";

interface LeeftijdEdgeFixture {
  volgnr: number;
  naam: string;
  geboortedatum: string;
  geboortejaar: number;
  geslacht: Geslacht;
  omschrijving: string;
}

export const LEEFTIJD_FIXTURES: LeeftijdEdgeFixture[] = [
  {
    volgnr: 1,
    naam: "Edge-GrensKangoer-V",
    geboortedatum: "2020-01-01",
    geboortejaar: 2020,
    geslacht: "V",
    omschrijving: "Kangoeroe / Blauw-1 grens",
  },
  {
    volgnr: 2,
    naam: "Edge-GrensBlauw-V",
    geboortedatum: "2018-01-01",
    geboortejaar: 2018,
    geslacht: "V",
    omschrijving: "Blauw / Groen-1 grens",
  },
  {
    volgnr: 3,
    naam: "Edge-GrensGroen-M",
    geboortedatum: "2016-01-01",
    geboortejaar: 2016,
    geslacht: "M",
    omschrijving: "Groen / Geel-1 grens",
  },
  {
    volgnr: 4,
    naam: "Edge-GrensGeel-M",
    geboortedatum: "2014-01-01",
    geboortejaar: 2014,
    geslacht: "M",
    omschrijving: "Geel / Oranje-1 grens",
  },
  {
    volgnr: 5,
    naam: "Edge-GrensOranje-V",
    geboortedatum: "2012-01-01",
    geboortejaar: 2012,
    geslacht: "V",
    omschrijving: "Oranje / Rood-1 grens",
  },
  {
    volgnr: 6,
    naam: "Edge-GrensRood-V",
    geboortedatum: "2010-01-01",
    geboortejaar: 2010,
    geslacht: "V",
    omschrijving: "Rood / U17-1 grens",
  },
  {
    volgnr: 7,
    naam: "Edge-GrensU17-M",
    geboortedatum: "2008-01-01",
    geboortejaar: 2008,
    geslacht: "M",
    omschrijving: "U17 / U19-1 grens",
  },
  {
    volgnr: 8,
    naam: "Edge-GrensU19-M",
    geboortedatum: "2006-01-01",
    geboortejaar: 2006,
    geslacht: "M",
    omschrijving: "U19 / Senior-1 grens",
  },
];

export async function seedLeeftijdEdge(): Promise<void> {
  logger.info("[seed-leeftijd-edge] 8 leeftijdsgrens-fixtures");
  for (const f of LEEFTIJD_FIXTURES) {
    // rel_code patroon: 9900 + 2000 (sectie-ID) + volgnr (4 cijfers) = 12 cijfers
    const code = `99002000${String(f.volgnr).padStart(4, "0")}`;
    await prisma.speler.upsert({
      where: { id: code },
      create: {
        id: code,
        roepnaam: f.naam,
        achternaam: "Edge",
        geslacht: f.geslacht,
        geboortejaar: f.geboortejaar,
        geboortedatum: new Date(f.geboortedatum),
        status: "BESCHIKBAAR",
      },
      update: {
        roepnaam: f.naam,
        geboortejaar: f.geboortejaar,
        geboortedatum: new Date(f.geboortedatum),
      },
    });
  }
  logger.info("[seed-leeftijd-edge] klaar");
}
