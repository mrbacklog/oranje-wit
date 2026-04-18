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
  const gezienInSportlink = new Set<string>();

  for (const lid of leden) {
    const relCode = lid.PublicPersonId;
    gezienInSportlink.add(relCode);

    if (bekendeIds.has(relCode)) {
      const speler = spelerById.get(relCode)!;
      const act = lid.KernelGameActivities ?? "";
      const heeftSpelactiviteit = act.includes("Veld") || act.includes("Zaal");
      const isAfgemeld =
        lid.RelationEnd !== null || lid.MemberStatus !== "ACTIVE" || !heeftSpelactiviteit;
      // Markeer als afgemeld/niet-spelend als Sportlink dat zegt maar speler nog niet GAAT_STOPPEN is
      if (isAfgemeld && speler.status !== "GAAT_STOPPEN") {
        const reden =
          lid.RelationEnd !== null
            ? ("afmelddatum" as const)
            : lid.MemberStatus !== "ACTIVE"
              ? ("niet-actief" as const)
              : ("niet-spelend" as const);
        afgemeld.push({
          lid,
          spelerId: speler.id,
          spelerNaam: `${speler.roepnaam} ${speler.achternaam}`,
          reden,
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
      const act = lid.KernelGameActivities ?? "";
      const isNieuwLid = !act.includes("Veld") && !act.includes("Zaal");
      nieuwe.push({ lid, isNieuwLid });
    }
  }

  // Spelers die in de database staan met Sportlink relCode maar NIET meer in
  // Sportlink voorkomen — waarschijnlijk afgemeld tussen syncs in
  for (const speler of spelers) {
    if (
      speler.id.match(/^[A-Z]{1,3}\w+$/) &&
      !gezienInSportlink.has(speler.id) &&
      speler.status !== "GAAT_STOPPEN"
    ) {
      afgemeld.push({
        lid: {
          PublicPersonId: speler.id,
          FirstName: speler.roepnaam,
          LastName: speler.achternaam,
          FullName: `${speler.roepnaam} ${speler.achternaam}`,
          Infix: null,
          DateOfBirth: speler.geboortedatum?.toISOString().slice(0, 10) ?? "",
          GenderCode: "Male",
          MemberStatus: "INACTIVE",
          RelationStart: "",
          RelationEnd: null,
          AgeClassDescription: "",
          ClubTeams: null,
          KernelGameActivities: null,
          Email: null,
          Mobile: null,
        },
        spelerId: speler.id,
        spelerNaam: `${speler.roepnaam} ${speler.achternaam}`,
        reden: "verdwenen",
      });
    }
  }

  return { nieuwe, afgemeld, fuzzyMatches };
}

function normaliseer(naam: string | null | undefined): string {
  return (naam ?? "").toLowerCase().trim().replace(/\s+/g, " ");
}
