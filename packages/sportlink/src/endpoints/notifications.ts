import { logger } from "@oranje-wit/types";
import { navajoGet } from "../navajo";
import type { SportlinkNotificatie } from "../types";

/**
 * Haal notificaties op uit Sportlink vanaf een bepaalde datum.
 * Maximaal terug tot 2015-01-01 (eerder geeft server error).
 */
export async function haalNotificatiesOp(
  token: string,
  datumVanaf: string
): Promise<SportlinkNotificatie[]> {
  const data = await navajoGet<{ Items: SportlinkNotificatie[] }>(
    "member/notifications/Notifications",
    token,
    { DateFrom: datumVanaf }
  );

  const items = data.Items ?? [];
  logger.info(`[sportlink] ${items.length} notificaties opgehaald sinds ${datumVanaf}`);
  return items;
}
