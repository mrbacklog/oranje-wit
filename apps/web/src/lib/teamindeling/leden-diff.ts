/**
 * Diff-engine: vergelijk Sportlink CSV met database-stand
 *
 * Detecteert nieuwe leden, vertrokken spelers en gewijzigde gegevens.
 * Puur functioneel — schrijft niets naar de database.
 */

import { prisma } from "@/lib/db/prisma";
import type { LidCsvRij } from "./leden-csv";

export interface VertrokkenSpeler {
  id: string;
  roepnaam: string;
  achternaam: string;
  huidigeStatus: string;
}

export interface GewijzigdLid {
  relCode: string;
  naam: string;
  wijzigingen: { veld: string; oud: string | null; nieuw: string | null }[];
}

export interface LedenDiff {
  nieuweLeden: LidCsvRij[];
  vertrokkenSpelers: VertrokkenSpeler[];
  gewijzigdeLeden: GewijzigdLid[];
  ongewijzigd: number;
  csvBondsleden: number;
  dbSpelers: number;
}

/** Filter CSV op actieve bondsleden (geen afmelddatum, lidsoort=Bondslid) */
function filterActieveBondsleden(rijen: LidCsvRij[]): LidCsvRij[] {
  return rijen.filter((r) => r.lidsoort === "Bondslid" && !r.afmelddatum);
}

/** Vergelijk twee string-waarden (null-safe) */
function verschilt(oud: string | null | undefined, nieuw: string | null | undefined): boolean {
  return (oud || "") !== (nieuw || "");
}

export async function berekenLedenDiff(csvRijen: LidCsvRij[]): Promise<LedenDiff> {
  const bondsleden = filterActieveBondsleden(csvRijen);
  const bondsledenMap = new Map(bondsleden.map((r) => [r.relCode, r]));

  // Haal huidige Speler-records
  const spelers = await prisma.speler.findMany({
    select: { id: true, roepnaam: true, achternaam: true, status: true },
  });
  const spelerMap = new Map(spelers.map((s) => [s.id, s]));

  // Haal huidige Lid-records voor wijzigingsdetectie
  const leden = await prisma.lid.findMany({
    select: {
      relCode: true,
      roepnaam: true,
      achternaam: true,
      tussenvoegsel: true,
      geslacht: true,
      email: true,
    },
  });
  const lidMap = new Map(leden.map((l) => [l.relCode, l]));

  // 1. Nieuwe leden: bondslid in CSV, geen Speler-record
  const nieuweLeden = bondsleden.filter((r) => !spelerMap.has(r.relCode));

  // 2. Vertrokken spelers: Speler-record, niet meer in actieve bondsleden CSV
  const vertrokkenSpelers: VertrokkenSpeler[] = spelers
    .filter((s) => s.status !== "GAAT_STOPPEN" && !bondsledenMap.has(s.id))
    .map((s) => ({
      id: s.id,
      roepnaam: s.roepnaam,
      achternaam: s.achternaam,
      huidigeStatus: s.status,
    }));

  // 3. Gewijzigde leden: lid-record bestaat, velden verschilt
  const gewijzigdeLeden: GewijzigdLid[] = [];
  let ongewijzigd = 0;

  for (const csvRij of bondsleden) {
    const lid = lidMap.get(csvRij.relCode);
    if (!lid) continue;

    const wijzigingen: { veld: string; oud: string | null; nieuw: string | null }[] = [];

    if (verschilt(lid.roepnaam, csvRij.roepnaam)) {
      wijzigingen.push({ veld: "roepnaam", oud: lid.roepnaam, nieuw: csvRij.roepnaam });
    }
    if (verschilt(lid.achternaam, csvRij.achternaam)) {
      wijzigingen.push({ veld: "achternaam", oud: lid.achternaam, nieuw: csvRij.achternaam });
    }
    if (verschilt(lid.tussenvoegsel, csvRij.tussenvoegsel)) {
      wijzigingen.push({
        veld: "tussenvoegsel",
        oud: lid.tussenvoegsel,
        nieuw: csvRij.tussenvoegsel,
      });
    }
    if (verschilt(lid.geslacht, csvRij.geslacht)) {
      wijzigingen.push({ veld: "geslacht", oud: lid.geslacht, nieuw: csvRij.geslacht });
    }
    if (verschilt(lid.email, csvRij.email)) {
      wijzigingen.push({ veld: "email", oud: lid.email, nieuw: csvRij.email });
    }

    if (wijzigingen.length > 0) {
      const naam = [csvRij.roepnaam, csvRij.tussenvoegsel, csvRij.achternaam]
        .filter(Boolean)
        .join(" ");
      gewijzigdeLeden.push({ relCode: csvRij.relCode, naam, wijzigingen });
    } else {
      ongewijzigd++;
    }
  }

  return {
    nieuweLeden,
    vertrokkenSpelers,
    gewijzigdeLeden,
    ongewijzigd,
    csvBondsleden: bondsleden.length,
    dbSpelers: spelers.length,
  };
}
