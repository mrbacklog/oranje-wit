import { prisma } from "@oranje-wit/database";
import { logger } from "@oranje-wit/types";
import type { SportlinkNotificatie } from "../types";

/**
 * Laag 1: Sla Sportlink notificaties op als wijzigingslog.
 *
 * Filtert op relevante entiteiten (member, membership, player).
 * Slaat geen ChangeVector op (bevat gevoelige data).
 */
export async function syncNotificaties(
  notificaties: SportlinkNotificatie[]
): Promise<{ opgeslagen: number; overgeslagen: number }> {
  let opgeslagen = 0;
  let overgeslagen = 0;

  // Filter op relevante entiteiten
  const relevant = notificaties.filter((n) =>
    ["member", "membership", "player"].includes(n.Entity)
  );

  const relCodes = [...new Set(relevant.map((n) => n.PublicPersonId))];
  const bestaande = await prisma.sportlinkNotificatie.findMany({
    where: { relCode: { in: relCodes } },
    select: { relCode: true, datum: true, actie: true, beschrijving: true },
  });
  const bestaandeKeys = new Set(
    bestaande.map((b) => `${b.relCode}|${b.datum.toISOString()}|${b.actie}|${b.beschrijving}`)
  );

  for (const notif of relevant) {
    // Alleen geldige relCodes
    if (!notif.PublicPersonId.match(/^[A-Z]{1,3}\w+$/)) {
      overgeslagen++;
      continue;
    }

    const key = `${notif.PublicPersonId}|${new Date(notif.DateOfChange).toISOString()}|${notif.TypeOfAction}|${notif.Description}`;
    if (bestaandeKeys.has(key)) {
      overgeslagen++;
      continue;
    }

    await prisma.sportlinkNotificatie.create({
      data: {
        relCode: notif.PublicPersonId,
        datum: new Date(notif.DateOfChange),
        actie: notif.TypeOfAction,
        entiteit: notif.Entity,
        beschrijving: notif.Description,
        categorie: notif.Category,
        gewijzigdDoor: notif.ChangedBy,
      },
    });
    opgeslagen++;
  }

  logger.info(
    `[sportlink] Notificatie-sync: ${opgeslagen} opgeslagen, ${overgeslagen} overgeslagen`
  );

  return { opgeslagen, overgeslagen };
}
