import { logger } from "@oranje-wit/types";
import { navajoGet } from "../navajo";
import type { SportlinkTeam } from "../types";

/**
 * Haal alle bondsteams op (Veld + Zaal).
 */
export async function haalBondsteamsOp(token: string): Promise<SportlinkTeam[]> {
  const data = await navajoGet<{ Team: SportlinkTeam[] }>("team/UnionTeams", token);
  const teams = data.Team ?? [];
  logger.info(`[sportlink] ${teams.length} bondsteams opgehaald`);
  return teams;
}
