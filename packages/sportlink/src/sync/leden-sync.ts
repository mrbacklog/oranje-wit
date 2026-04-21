import { prisma } from "@oranje-wit/database";
import { logger } from "@oranje-wit/types";
import type { SportlinkLid, LedenSyncResultaat, LidWijziging, VeldWijziging } from "../types";

/**
 * Vergelijk twee waarden en retourneer een VeldWijziging als ze verschillen.
 * Null/undefined/'' worden als gelijkwaardig behandeld om lege veld-ruis te voorkomen.
 */
function diffVeld(veld: string, oud: unknown, nieuw: unknown): VeldWijziging | null {
  const oudNorm = oud === undefined || oud === "" ? null : oud;
  const nieuwNorm = nieuw === undefined || nieuw === "" ? null : nieuw;

  // Date vergelijking op timestamp
  if (oudNorm instanceof Date && nieuwNorm instanceof Date) {
    if (oudNorm.getTime() === nieuwNorm.getTime()) return null;
    return {
      veld,
      oud: oudNorm.toISOString().slice(0, 10),
      nieuw: nieuwNorm.toISOString().slice(0, 10),
    };
  }

  if (oudNorm instanceof Date && nieuwNorm === null) {
    return { veld, oud: oudNorm.toISOString().slice(0, 10), nieuw: null };
  }
  if (oudNorm === null && nieuwNorm instanceof Date) {
    return { veld, oud: null, nieuw: nieuwNorm.toISOString().slice(0, 10) };
  }

  if (oudNorm === nieuwNorm) return null;

  return {
    veld,
    oud: oudNorm === null ? null : String(oudNorm),
    nieuw: nieuwNorm === null ? null : String(nieuwNorm),
  };
}

/**
 * Laag 1: Sync alle Sportlink leden naar de Lid-tabel.
 *
 * Pure spiegel — geen interpretatie, geen filtering.
 * Upsert op basis van relCode (PublicPersonId), met diff-detectie per veld.
 */
export async function syncLeden(leden: SportlinkLid[]): Promise<LedenSyncResultaat> {
  let bijgewerkt = 0;
  let nieuw = 0;
  let ongewijzigd = 0;
  const wijzigingen: LidWijziging[] = [];
  const nu = new Date();

  const bestaand = await prisma.lid.findMany();
  const byRelCode = new Map(bestaand.map((l) => [l.relCode, l]));

  for (const lid of leden) {
    const relCode = lid.PublicPersonId;

    // Alleen geldige Sportlink relCodes
    if (!relCode.match(/^[A-Z]{1,3}\w+$/)) continue;

    const geboortedatum = lid.DateOfBirth ? new Date(lid.DateOfBirth) : null;
    const geboortejaar = geboortedatum ? geboortedatum.getFullYear() : null;

    const data = {
      roepnaam: lid.FirstName ?? "",
      achternaam: lid.LastName ?? "",
      tussenvoegsel: lid.Infix || null,
      voorletters: lid.Initials || null,
      geslacht: lid.GenderCode === "Male" ? "M" : "V",
      geboortejaar,
      geboortedatum,
      email: lid.Email || null,
      lidSinds: lid.MemberSince ? new Date(lid.MemberSince) : null,
      registratieDatum: lid.RelationStart ? new Date(lid.RelationStart) : null,
      afmelddatum: lid.RelationEnd ? new Date(lid.RelationEnd) : null,
      lidsoort: lid.TypeOfMemberDescription || null,
      lidStatus: lid.MemberStatus || null,
      spelactiviteiten: lid.KernelGameActivities || null,
      clubTeams: lid.ClubTeams || null,
      leeftijdscategorie: lid.AgeClassDescription || null,
    };

    const huidig = byRelCode.get(relCode);
    const naam = `${data.roepnaam} ${data.achternaam}`.trim() || relCode;

    if (!huidig) {
      await (prisma.lid as any).create({
        data: { relCode, ...data, laatstGesyncOp: nu, createdAt: nu, updatedAt: nu },
      });
      nieuw++;
      wijzigingen.push({ relCode, naam, type: "nieuw", wijzigingen: [] });
      continue;
    }

    // Diff per veld — alleen bij echte wijzigingen een UPDATE
    const veldWijzigingen: VeldWijziging[] = [];
    const velden: Array<[string, unknown, unknown]> = [
      ["roepnaam", huidig.roepnaam, data.roepnaam],
      ["achternaam", huidig.achternaam, data.achternaam],
      ["tussenvoegsel", huidig.tussenvoegsel, data.tussenvoegsel],
      ["voorletters", huidig.voorletters, data.voorletters],
      ["geslacht", huidig.geslacht, data.geslacht],
      ["geboortejaar", huidig.geboortejaar, data.geboortejaar],
      ["geboortedatum", huidig.geboortedatum, data.geboortedatum],
      ["email", huidig.email, data.email],
      ["lidSinds", huidig.lidSinds, data.lidSinds],
      ["registratieDatum", huidig.registratieDatum, data.registratieDatum],
      ["afmelddatum", huidig.afmelddatum, data.afmelddatum],
      ["lidsoort", huidig.lidsoort, data.lidsoort],
      ["lidStatus", huidig.lidStatus, data.lidStatus],
      ["spelactiviteiten", huidig.spelactiviteiten, data.spelactiviteiten],
      ["clubTeams", huidig.clubTeams, data.clubTeams],
      ["leeftijdscategorie", huidig.leeftijdscategorie, data.leeftijdscategorie],
    ];

    for (const [veld, oud, nieuwVal] of velden) {
      const diff = diffVeld(veld, oud, nieuwVal);
      if (diff) veldWijzigingen.push(diff);
    }

    if (veldWijzigingen.length === 0) {
      // Alleen laatstGesyncOp updaten — telt niet als "bijgewerkt"
      await (prisma.lid as any).update({
        where: { relCode },
        data: { laatstGesyncOp: nu },
      });
      ongewijzigd++;
      continue;
    }

    await (prisma.lid as any).update({
      where: { relCode },
      data: { ...data, laatstGesyncOp: nu, updatedAt: nu },
    });
    bijgewerkt++;
    wijzigingen.push({
      relCode,
      naam,
      type: "bijgewerkt",
      wijzigingen: veldWijzigingen,
    });
  }

  logger.info(
    `[sportlink] Leden-sync: ${nieuw} nieuw, ${bijgewerkt} bijgewerkt, ${ongewijzigd} ongewijzigd van ${leden.length} leden`
  );

  return {
    bijgewerkt,
    nieuw,
    ongewijzigd,
    totaalVergeleken: leden.length,
    wijzigingen,
  };
}
