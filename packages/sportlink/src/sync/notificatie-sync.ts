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

  for (const notif of relevant) {
    // Alleen geldige relCodes
    if (!notif.PublicPersonId.match(/^[A-Z]{1,3}\w+$/)) {
      overgeslagen++;
      continue;
    }

    // Check of we deze notificatie al hebben (op basis van datum+relCode+actie+beschrijving)
    const bestaat = await prisma.sportlinkNotificatie.findFirst({
      where: {
        relCode: notif.PublicPersonId,
        datum: new Date(notif.DateOfChange),
        actie: notif.TypeOfAction,
        beschrijving: notif.Description,
      },
    });

    if (bestaat) {
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
