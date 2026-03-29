// @ts-nocheck — Prisma 7.x + TS 5.9 excessive stack depth in Lid model
import { prisma } from "@/lib/db/prisma";
import type { LidCsvRij } from "./csv-parser";
import { logger } from "@oranje-wit/types";

// -- Types -------------------------------------------------------------------

export interface LedenDiffResult {
  nieuw: {
    relCode: string;
    naam: string;
    geslacht: string;
    geboortejaar: number | null;
  }[];
  gewijzigd: {
    relCode: string;
    naam: string;
    wijzigingen: { veld: string; oud: string | null; nieuw: string | null }[];
  }[];
  afgemeld: { relCode: string; naam: string; afmelddatum: string }[];
  verdwenen: { relCode: string; naam: string }[];
  ongewijzigd: number;
  totaalCsv: number;
  totaalDb: number;
}

export interface LedenSyncResult {
  aangemaakt: number;
  bijgewerkt: number;
  afgemeldGemarkeerd: number;
  signaleringen: string[];
}

// -- Helpers -----------------------------------------------------------------

function maakNaam(rij: LidCsvRij): string {
  return [rij.roepnaam, rij.tussenvoegsel, rij.achternaam].filter(Boolean).join(" ");
}

function verschilt(oud: string | null | undefined, nieuw: string | null | undefined): boolean {
  return (oud ?? "") !== (nieuw ?? "");
}

// -- Diff --------------------------------------------------------------------

export async function berekenLedenDiff(csvRijen: LidCsvRij[]): Promise<LedenDiffResult> {
  const csvMap = new Map(csvRijen.map((r) => [r.relCode, r]));

  const leden = await prisma.lid.findMany({
    select: {
      relCode: true,
      roepnaam: true,
      achternaam: true,
      tussenvoegsel: true,
      geslacht: true,
      email: true,
      afmelddatum: true,
      lidsoort: true,
    },
  });
  const dbMap = new Map(leden.map((l) => [l.relCode, l]));

  const nieuw: LedenDiffResult["nieuw"] = [];
  const gewijzigd: LedenDiffResult["gewijzigd"] = [];
  const afgemeld: LedenDiffResult["afgemeld"] = [];
  let ongewijzigd = 0;

  for (const rij of csvRijen) {
    const db = dbMap.get(rij.relCode);
    if (!db) {
      nieuw.push({
        relCode: rij.relCode,
        naam: maakNaam(rij),
        geslacht: rij.geslacht,
        geboortejaar: rij.geboortejaar,
      });
      continue;
    }

    // Check afmelddatum
    if (rij.afmelddatum && !db.afmelddatum) {
      afgemeld.push({
        relCode: rij.relCode,
        naam: maakNaam(rij),
        afmelddatum: rij.afmelddatum,
      });
      continue;
    }

    // Check wijzigingen
    const wijzigingen: {
      veld: string;
      oud: string | null;
      nieuw: string | null;
    }[] = [];
    if (verschilt(db.roepnaam, rij.roepnaam))
      wijzigingen.push({
        veld: "roepnaam",
        oud: db.roepnaam,
        nieuw: rij.roepnaam,
      });
    if (verschilt(db.achternaam, rij.achternaam))
      wijzigingen.push({
        veld: "achternaam",
        oud: db.achternaam,
        nieuw: rij.achternaam,
      });
    if (verschilt(db.tussenvoegsel, rij.tussenvoegsel))
      wijzigingen.push({
        veld: "tussenvoegsel",
        oud: db.tussenvoegsel,
        nieuw: rij.tussenvoegsel,
      });
    if (verschilt(db.geslacht, rij.geslacht))
      wijzigingen.push({
        veld: "geslacht",
        oud: db.geslacht,
        nieuw: rij.geslacht,
      });
    if (verschilt(db.email, rij.email))
      wijzigingen.push({ veld: "email", oud: db.email, nieuw: rij.email });
    if (verschilt(db.lidsoort, rij.lidsoort))
      wijzigingen.push({
        veld: "lidsoort",
        oud: db.lidsoort,
        nieuw: rij.lidsoort,
      });

    if (wijzigingen.length > 0) {
      gewijzigd.push({
        relCode: rij.relCode,
        naam: maakNaam(rij),
        wijzigingen,
      });
    } else {
      ongewijzigd++;
    }
  }

  // Leden in DB die niet in CSV staan
  const verdwenen = leden
    .filter((l) => !csvMap.has(l.relCode) && !l.afmelddatum)
    .map((l) => ({
      relCode: l.relCode,
      naam: [l.roepnaam, l.tussenvoegsel, l.achternaam].filter(Boolean).join(" "),
    }));

  return {
    nieuw,
    gewijzigd,
    afgemeld,
    verdwenen,
    ongewijzigd,
    totaalCsv: csvRijen.length,
    totaalDb: leden.length,
  };
}

// -- Verwerk -----------------------------------------------------------------

export async function verwerkLedenSync(csvRijen: LidCsvRij[]): Promise<LedenSyncResult> {
  let aangemaakt = 0;
  let bijgewerkt = 0;
  let afgemeldGemarkeerd = 0;
  const signaleringen: string[] = [];

  for (const rij of csvRijen) {
    const bestaand = (await (prisma.lid.findUnique as Function)({
      where: { relCode: rij.relCode },
      select: { relCode: true, afmelddatum: true },
    })) as { relCode: string; afmelddatum: Date | null } | null;

    const data = {
      roepnaam: rij.roepnaam,
      achternaam: rij.achternaam,
      tussenvoegsel: rij.tussenvoegsel,
      voorletters: rij.voorletters,
      geslacht: rij.geslacht,
      geboortejaar: rij.geboortejaar,
      geboortedatum: rij.geboortedatum ? new Date(rij.geboortedatum) : null,
      lidsoort: rij.lidsoort,
      email: rij.email,
      lidSinds: rij.lidSinds ? new Date(rij.lidSinds) : null,
      afmelddatum: rij.afmelddatum ? new Date(rij.afmelddatum) : null,
    };

    // Prisma casts nodig vanwege TS2321 (excessive stack depth) in TS 5.9 + Prisma
    if (!bestaand) {
      await (prisma.lid.create as Function)({
        data: { relCode: rij.relCode, ...data },
      });
      aangemaakt++;
      signaleringen.push(
        `Nieuw lid: ${maakNaam(rij)} (${rij.geslacht}, ${rij.geboortejaar ?? "?"})`
      );
    } else {
      await (prisma.lid.update as Function)({
        where: { relCode: rij.relCode },
        data,
      });
      bijgewerkt++;

      // Signaleer als lid nu afgemeld is maar dat eerder niet was
      if (rij.afmelddatum && !bestaand.afmelddatum) {
        afgemeldGemarkeerd++;
        signaleringen.push(`Afgemeld: ${maakNaam(rij)}`);

        const spelerCount = await prisma.speler.count({
          where: { id: rij.relCode, status: { not: "GAAT_STOPPEN" } },
        });
        if (spelerCount > 0) {
          await (prisma.speler.update as Function)({
            where: { id: rij.relCode },
            data: { status: "GAAT_STOPPEN" },
          });
          signaleringen.push(`  Speler ${maakNaam(rij)} status -> GAAT_STOPPEN`);
        }
      }
    }
  }

  logger.info(
    `[leden-sync] ${aangemaakt} aangemaakt, ${bijgewerkt} bijgewerkt, ${afgemeldGemarkeerd} afgemeld`
  );

  return { aangemaakt, bijgewerkt, afgemeldGemarkeerd, signaleringen };
}
