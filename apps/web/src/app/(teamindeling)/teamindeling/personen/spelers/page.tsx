export const dynamic = "force-dynamic";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";
import { getWerkindelingId } from "@/lib/teamindeling/db/werkindeling";
import { PEILJAAR, PEILDATUM } from "@oranje-wit/types";
import {
  SpelersOverzicht,
  type SpelerListItem,
} from "@/components/teamindeling/mobile/spelers/SpelersOverzicht";

/** Bereken korfballeeftijd */
function korfbalLeeftijd(geboortedatum: Date | null, geboortejaar: number): number {
  if (geboortedatum) {
    const ms = PEILDATUM.getTime() - geboortedatum.getTime();
    return Math.round((ms / (365.25 * 86_400_000)) * 100) / 100;
  }
  return PEILJAAR - geboortejaar;
}

/** Kleurindicatie op basis van korfballeeftijd */
function kleurIndicatie(kl: number): string | null {
  if (kl < 5) return "PAARS";
  if (kl <= 8) return "BLAUW";
  if (kl <= 10) return "GROEN";
  if (kl <= 12) return "GEEL";
  if (kl <= 14) return "ORANJE";
  if (kl <= 18) return "ROOD";
  return null;
}

export default async function SpelersPage() {
  const seizoen = await getActiefSeizoen();

  // Haal alle spelers op
  const dbSpelers = await prisma.speler.findMany({
    orderBy: [{ geboortejaar: "asc" }, { achternaam: "asc" }],
    select: {
      id: true,
      roepnaam: true,
      achternaam: true,
      geboortejaar: true,
      geboortedatum: true,
      geslacht: true,
      status: true,
    },
  });

  // Haal werkindeling op voor teamnaam-mapping
  const kaders = await prisma.kaders.findUnique({
    where: { seizoen },
    select: { id: true },
  });
  const werkindelingId = kaders ? await getWerkindelingId(kaders.id) : null;
  const werkindeling = werkindelingId
    ? await prisma.werkindeling.findUnique({
        where: { id: werkindelingId },
        select: {
          versies: {
            orderBy: { nummer: "desc" },
            take: 1,
            select: {
              teams: {
                select: {
                  naam: true,
                  spelers: {
                    select: { spelerId: true },
                  },
                },
              },
            },
          },
        },
      })
    : null;

  // Bouw speler -> teamnaam lookup
  const spelerTeamMap = new Map<string, string>();
  if (werkindeling?.versies[0]) {
    for (const team of werkindeling.versies[0].teams) {
      for (const ts of team.spelers) {
        spelerTeamMap.set(ts.spelerId, team.naam);
      }
    }
  }

  // Map naar SpelerListItem
  const spelers: SpelerListItem[] = dbSpelers.map((s) => {
    const kl = korfbalLeeftijd(s.geboortedatum, s.geboortejaar);
    return {
      id: s.id,
      roepnaam: s.roepnaam,
      achternaam: s.achternaam,
      korfbalLeeftijd: kl,
      geslacht: s.geslacht,
      kleur: kleurIndicatie(kl),
      teamNaam: spelerTeamMap.get(s.id) ?? null,
      status: s.status,
    };
  });

  return <SpelersOverzicht spelers={spelers} />;
}
