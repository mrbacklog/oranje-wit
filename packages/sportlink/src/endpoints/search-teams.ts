import { logger } from "@oranje-wit/types";
import { navajoGet, navajoPost } from "../navajo";
import type { SportlinkTeamLid } from "../types";

/**
 * Haal de volledige teamsamenstelling op voor Veld of Zaal.
 * Selecteert alle teams en filtert op spelactiviteit.
 * Retourneert spelers + staf + coaches met functies in één call.
 */
export async function zoekTeams(
  token: string,
  spelvorm: "Veld" | "Zaal"
): Promise<SportlinkTeamLid[]> {
  const [inputExtended, inputSimple] = await Promise.all([
    navajoGet<Record<string, unknown>>("member/search/FilterTeamsExtended", token),
    navajoGet<Record<string, unknown>>("member/search/FilterTeamsSimple", token),
  ]);

  // Selecteer alle teams
  const unionTeamFilter = inputSimple.UnionTeam as {
    Options?: { Id: string; IsSelected: boolean }[];
  };
  if (unionTeamFilter?.Options) {
    for (const opt of unionTeamFilter.Options) {
      opt.IsSelected = true;
    }
  }

  // Filter op spelactiviteit
  const activityFilter = inputExtended.Activity as {
    Options?: { Id: string; IsSelected: boolean }[];
  };
  const spelvormId = spelvorm === "Veld" ? "KORFBALL-VE-WK/STANDARD" : "KORFBALL-ZA-WK/STANDARD";
  if (activityFilter?.Options) {
    for (const opt of activityFilter.Options) {
      opt.IsSelected = opt.Id === spelvormId;
    }
  }

  const data = await navajoPost<{ Members: SportlinkTeamLid[] }>(
    "member/search/SearchTeams",
    token,
    { Filters: { InputExtended: inputExtended, InputSimple: inputSimple } }
  );

  const leden = data.Members ?? [];
  logger.info(`[sportlink] ${leden.length} teamleden opgehaald voor ${spelvorm}`);
  return leden;
}
