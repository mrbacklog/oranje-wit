import { prisma } from "@/lib/teamindeling/db/prisma";
import type { SportlinkLid, SyncDiff, NieuwLid, AfgemeldLid, FuzzyMatch } from "./types";

export async function berekenDiff(leden: SportlinkLid[]): Promise<SyncDiff> {
  const spelers = await prisma.speler.findMany({
    select: { id: true, roepnaam: true, achternaam: true, geboortedatum: true, status: true },
  });

  const spelerById = new Map(spelers.map((s) => [s.id, s]));

  // Handmatige spelers = IDs die niet het Sportlink-patroon volgen
  const handmatigeSpelers = spelers.filter((s) => !s.id.match(/^[A-Z]{1,3}\w+$/));

  const nieuwe: NieuwLid[] = [];
  const afgemeld: AfgemeldLid[] = [];
  const fuzzyMatches: FuzzyMatch[] = [];
  const bekendeIds = new Set(spelers.map((s) => s.id));

  for (const lid of leden) {
    const relCode = lid.PublicPersonId;

    if (bekendeIds.has(relCode)) {
      const speler = spelerById.get(relCode)!;
      const isAfgemeld = lid.RelationEnd !== null || lid.MemberStatus !== "ACTIVE";
      // Skip als speler al als GAAT_STOPPEN is gemarkeerd
      if (isAfgemeld && speler.status !== "GAAT_STOPPEN") {
        afgemeld.push({
          lid,
          spelerId: speler.id,
          spelerNaam: `${speler.roepnaam} ${speler.achternaam}`,
        });
      }
      continue;
    }

    const fuzzyHit = handmatigeSpelers.find((s) => {
      const naamMatch =
        normaliseer(s.roepnaam) === normaliseer(lid.FirstName) &&
        normaliseer(s.achternaam) === normaliseer(lid.LastName);
      const datumMatch =
        s.geboortedatum && s.geboortedatum.toISOString().slice(0, 10) === lid.DateOfBirth;
      return naamMatch && datumMatch;
    });

    if (fuzzyHit) {
      fuzzyMatches.push({
        lid,
        spelerId: fuzzyHit.id,
        spelerNaam: `${fuzzyHit.roepnaam} ${fuzzyHit.achternaam}`,
      });
    } else {
      nieuwe.push({ lid });
    }
  }

  return { nieuwe, afgemeld, fuzzyMatches };
}

function normaliseer(naam: string | null | undefined): string {
  return (naam ?? "").toLowerCase().trim().replace(/\s+/g, " ");
}
