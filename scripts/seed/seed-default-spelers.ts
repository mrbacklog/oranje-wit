import { TEAM_DEFS } from "./seed-teams";
import { prisma, relCode, teamId } from "./types";
import { logger } from "@oranje-wit/types";

function geboortejaarVoorTeam(alias: string): number {
  // Kies een midden-leeftijd in de KNKV-categorie zodat speler ruim binnen valt
  if (alias === "S1" || alias === "S2" || alias === "MW1" || alias === "RC") return 2000;
  if (alias === "S3" || alias === "S4") return 2002;
  if (alias === "EDGE-LEEG" || alias === "EDGE-ONDER") return 2000;
  if (alias.startsWith("U19")) return 2007;
  if (alias.startsWith("U17")) return 2009;
  if (alias.startsWith("U15")) return 2011;
  if (alias === "R1" || alias === "R2") return 2013;
  if (alias === "O1" || alias === "O2") return 2015;
  if (alias === "G1" || alias === "G2") return 2017;
  if (alias === "Gr1" || alias === "Gr2") return 2018;
  if (alias === "B1" || alias === "B2") return 2019;
  if (alias === "K") return 2020;
  return 2010;
}

export async function seedDefaultSpelers(): Promise<void> {
  logger.info("[seed-default-spelers] starten");
  let totaal = 0;

  for (const team of TEAM_DEFS) {
    if (team.defaultOmvang === 0) continue;

    const alias = team.alias ?? team.naam;
    const geboortejaar = geboortejaarVoorTeam(alias);

    for (let i = 1; i <= team.defaultOmvang; i++) {
      const code = relCode(team.nr, i);
      const isVrouw = i % 2 === 1;

      await prisma.speler.upsert({
        where: { id: code },
        create: {
          id: code,
          roepnaam: `Speler-${alias}-${String(i).padStart(2, "0")}`,
          achternaam: "Test",
          geslacht: isVrouw ? "V" : "M",
          geboortejaar,
          geboortedatum: new Date(`${geboortejaar}-06-15`),
          status: "BESCHIKBAAR",
        },
        update: {
          roepnaam: `Speler-${alias}-${String(i).padStart(2, "0")}`,
          geslacht: isVrouw ? "V" : "M",
          geboortejaar,
          geboortedatum: new Date(`${geboortejaar}-06-15`),
          status: "BESCHIKBAAR",
        },
      });

      await prisma.teamSpeler.upsert({
        where: { teamId_spelerId: { teamId: teamId(team.nr), spelerId: code } },
        create: { teamId: teamId(team.nr), spelerId: code },
        update: {},
      });

      totaal++;
    }
  }

  logger.info(`[seed-default-spelers] klaar — ${totaal} spelers + toewijzingen`);
}
