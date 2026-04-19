import { prisma } from "@oranje-wit/database";
import { logger } from "@oranje-wit/types";
import type { SportlinkLid, LedenSyncResultaat } from "../types";

/**
 * Laag 1: Sync alle Sportlink leden naar de Lid-tabel.
 *
 * Pure spiegel — geen interpretatie, geen filtering.
 * Upsert op basis van relCode (PublicPersonId).
 */
export async function syncLeden(leden: SportlinkLid[]): Promise<LedenSyncResultaat> {
  let bijgewerkt = 0;
  let nieuw = 0;
  const nu = new Date();

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
      laatstGesyncOp: nu,
      updatedAt: nu,
    };

    const bestaand = await prisma.lid.findUnique({ where: { relCode } });

    if (bestaand) {
      await prisma.lid.update({ where: { relCode }, data });
      bijgewerkt++;
    } else {
      await prisma.lid.create({ data: { relCode, ...data, createdAt: nu } });
      nieuw++;
    }
  }

  logger.info(
    `[sportlink] Leden-sync: ${nieuw} nieuw, ${bijgewerkt} bijgewerkt van ${leden.length} leden`
  );

  return { bijgewerkt, nieuw, totaalVergeleken: leden.length };
}
