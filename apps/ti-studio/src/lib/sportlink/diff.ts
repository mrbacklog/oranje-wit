import { prisma } from "@/lib/teamindeling/db/prisma";
import type { SportlinkLid } from "./types";
import type { SyncDiff, NieuwLid, AfgemeldLid, FuzzyMatch, LidType } from "./diff-types";

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

      // Spelers die al een niet-actieve status hebben hoeven niet opnieuw als afgemeld gemeld
      const alNietActief = [
        "GAAT_STOPPEN",
        "NIET_SPELEND",
        "RECREANT",
        "ALGEMEEN_RESERVE",
      ].includes(speler.status);
      if (alNietActief) continue;

      // Kandidaat-leden (NIEUW_POTENTIEEL/NIEUW_DEFINITIEF) worden bewust door TC
      // gemonitord — die hoeven niet als 'afgemeld' gemeld te worden enkel omdat ze
      // (nog) geen Veld/Zaal-spelactiviteit hebben (Kangoeroe Klup, leeg, etc.).
      // Voor hen tellen alleen echte signalen: een afmelddatum of inactieve status.
      const isKandidaat =
        speler.status === "NIEUW_POTENTIEEL" || speler.status === "NIEUW_DEFINITIEF";
      const act = lid.KernelGameActivities ?? "";
      const heeftSpelactiviteit = act.includes("Veld") || act.includes("Zaal");
      const reden =
        lid.RelationEnd !== null
          ? ("afmelddatum" as const)
          : lid.MemberStatus !== "ACTIVE"
            ? ("niet-actief" as const)
            : !heeftSpelactiviteit && !isKandidaat
              ? ("niet-spelend" as const)
              : null;

      if (reden) {
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
      nieuwe.push({ lid, lidType: bepaalLidType(lid) });
    }
  }

  // Spelers die in de database staan met Sportlink relCode maar NIET meer in
  // Sportlink voorkomen — waarschijnlijk afgemeld tussen syncs in
  for (const speler of spelers) {
    const alNietActief = ["GAAT_STOPPEN", "NIET_SPELEND", "RECREANT", "ALGEMEEN_RESERVE"].includes(
      speler.status
    );
    if (speler.id.match(/^[A-Z]{1,3}\w+$/) && !gezienInSportlink.has(speler.id) && !alNietActief) {
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

  const gewijzigd = nieuwe.length + afgemeld.length + fuzzyMatches.length;
  return {
    nieuwe,
    afgemeld,
    fuzzyMatches,
    stats: {
      ledenVergeleken: leden.length,
      spelersInPool: spelers.length,
      ongewijzigd:
        spelers.filter((s) => s.id.match(/^[A-Z]{1,3}\w+$/) && gezienInSportlink.has(s.id)).length -
        afgemeld.filter((a) => gezienInSportlink.has(a.spelerId)).length,
    },
  };
}

function normaliseer(naam: string | null | undefined): string {
  return (naam ?? "").toLowerCase().trim().replace(/\s+/g, " ");
}

function bepaalLidType(lid: SportlinkLid): LidType {
  const act = lid.KernelGameActivities ?? "";
  if (act.includes("Veld") || act.includes("Zaal")) return "korfbalspeler";
  if (act.includes("Recreant")) return "recreant";
  if (act.includes("Algemeen reserve")) return "algemeen-reserve";
  if (act.includes("Niet spelend")) return "niet-spelend";
  return "nieuw-lid";
}
