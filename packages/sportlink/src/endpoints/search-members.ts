import { logger } from "@oranje-wit/types";
import { navajoGet, navajoPost } from "../navajo";
import type { SportlinkLid } from "../types";

/**
 * Haal alle leden op uit Sportlink.
 * Haalt ALLE leden op (bondsleden, actief + inactief + afmelding in toekomst).
 * Geen filtering — dat is de verantwoordelijkheid van de sync-laag.
 */
export async function zoekLeden(token: string): Promise<SportlinkLid[]> {
  const [inputExtended, inputSimple] = await Promise.all([
    navajoGet<Record<string, unknown>>("member/search/FilterMembersExtended", token),
    navajoGet<Record<string, unknown>>("member/search/FilterMembersSimple", token),
  ]);

  selecteerOpties(inputExtended.TypeOfMember, ["KERNELMEMBER"]);
  selecteerOpties(inputExtended.MemberStatus, ["ACTIVE", "INACTIVE", "ELIGABLE_FOR_REMOVE"]);

  const data = await navajoPost<{ Members: SportlinkLid[] }>("member/search/SearchMembers", token, {
    Filters: { InputExtended: inputExtended, InputSimple: inputSimple },
  });

  const leden = data.Members ?? [];
  logger.info(`[sportlink] ${leden.length} leden opgehaald`);
  return leden;
}

function selecteerOpties(
  filter: { Options?: { Id: string; IsSelected: boolean }[] } | undefined,
  ids: string[]
) {
  if (!filter?.Options) return;
  const selectSet = new Set(ids);
  for (const opt of filter.Options) {
    opt.IsSelected = selectSet.has(opt.Id);
  }
}
