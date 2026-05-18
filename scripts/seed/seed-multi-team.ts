import { prisma, teamId } from "./types";
import { logger } from "@oranje-wit/types";
import { getUniekeNaam } from "./namen-pool";

/**
 * Sectie 1.6: Multi-team illegal-state fixtures.
 * Twee spelers worden elk aan twee teams toegewezen (bewust illegale state).
 * KNKV-validator moet beide teams als ROOD markeren met "dubbel ingedeeld".
 *
 * Teams: team-edge-01 (Senioren 1) en team-edge-02 (Senioren 2)
 */
export async function seedMultiTeam(): Promise<void> {
  logger.info("[seed-multi-team] 2 multi-team illegal fixtures");

  const multiTeamSpelers = [
    { code: "990040000001", geslacht: "V" as const },
    { code: "990040000002", geslacht: "M" as const },
  ];

  // Teams waar deze spelers dubbel aan toegewezen worden
  const team1 = teamId(1); // Senioren 1
  const team2 = teamId(2); // Senioren 2

  for (const s of multiTeamSpelers) {
    const naam = getUniekeNaam(s.geslacht);
    const roepnaam = naam?.roepnaam ?? "Speler";
    const achternaam = naam
      ? naam.tussenvoegsel
        ? `${naam.tussenvoegsel} ${naam.achternaam}`
        : naam.achternaam
      : "Onbekend";
    await prisma.speler.upsert({
      where: { id: s.code },
      create: {
        id: s.code,
        roepnaam,
        achternaam,
        geslacht: s.geslacht,
        geboortejaar: 2000,
        geboortedatum: new Date("2000-06-15"),
        status: "BESCHIKBAAR",
      },
      update: { roepnaam, achternaam },
    });

    // Toewijzing aan team 1
    await prisma.teamSpeler.upsert({
      where: { teamId_spelerId: { teamId: team1, spelerId: s.code } },
      create: { teamId: team1, spelerId: s.code },
      update: {},
    });

    // Toewijzing aan team 2 — bewust dubbel (illegale state voor KNKV-validator)
    await prisma.teamSpeler.upsert({
      where: { teamId_spelerId: { teamId: team2, spelerId: s.code } },
      create: { teamId: team2, spelerId: s.code },
      update: {},
    });
  }

  logger.info("[seed-multi-team] klaar — 2 spelers elk in 2 teams");
}
