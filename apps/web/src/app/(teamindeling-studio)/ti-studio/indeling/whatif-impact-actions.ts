"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { logger } from "@oranje-wit/types";
import { berekenImpactSamenvatting } from "@/lib/teamindeling/whatif/delta";
import type { WerkindelingTeamData } from "@/lib/teamindeling/whatif/delta";
import type { WhatIfTeamData, ImpactSamenvatting } from "@/lib/teamindeling/whatif/types";

// ============================================================
// WHAT-IF IMPACT BEREKENING
// ============================================================

/**
 * Bereken de volledige impact van een what-if.
 *
 * Laadt de what-if met alle teams, spelers en staf, plus de werkindeling
 * met de huidige versie. Berekent delta's per team (spelers + staf) en
 * identificeert impact-teams: teams die niet in de what-if zitten maar
 * wel spelers of staf kwijtraken.
 *
 * Retourneert een ImpactSamenvatting met gewijzigde teams, impact-teams
 * en totaaltellingen.
 */
export async function berekenWhatIfImpact(whatIfId: string): Promise<ImpactSamenvatting> {
  // 1. Laad de what-if met alle teams + spelers + staf
  const whatIf = await prisma.whatIf.findUniqueOrThrow({
    where: { id: whatIfId },
    select: {
      id: true,
      werkindelingId: true,
      vraag: true,
      teams: {
        orderBy: { volgorde: "asc" as const },
        select: {
          id: true,
          bronTeamId: true,
          naam: true,
          categorie: true,
          kleur: true,
          teamType: true,
          volgorde: true,
          spelers: {
            select: {
              id: true,
              spelerId: true,
              statusOverride: true,
              notitie: true,
            },
          },
          staf: {
            select: { id: true, stafId: true, rol: true },
          },
        },
      },
    },
  });

  // 2. Laad de werkindeling met huidige versie teams + spelers + staf
  const werkindeling = await prisma.scenario.findUniqueOrThrow({
    where: { id: whatIf.werkindelingId },
    select: {
      versies: {
        orderBy: { nummer: "desc" as const },
        take: 1,
        select: {
          teams: {
            select: {
              id: true,
              naam: true,
              spelers: { select: { spelerId: true } },
              staf: { select: { stafId: true } },
            },
          },
        },
      },
    },
  });

  const huidigeVersie = werkindeling.versies[0];
  if (!huidigeVersie) {
    throw new Error("Werkindeling heeft geen versie");
  }

  // 3. Map naar de interfaces die de delta-functies verwachten
  const werkTeams: WerkindelingTeamData[] = huidigeVersie.teams.map((t: any) => ({
    id: t.id,
    naam: t.naam,
    spelers: t.spelers,
    staf: t.staf,
  }));

  const whatIfTeams: WhatIfTeamData[] = whatIf.teams.map((t: any) => ({
    id: t.id,
    bronTeamId: t.bronTeamId,
    naam: t.naam,
    categorie: t.categorie,
    kleur: t.kleur,
    teamType: t.teamType,
    volgorde: t.volgorde,
    spelers: t.spelers,
    staf: t.staf,
  }));

  // 4. Bereken de volledige impact
  const impact = berekenImpactSamenvatting(werkTeams, whatIfTeams);

  logger.info(
    `Impact berekend voor what-if "${whatIf.vraag}" (${whatIfId}): ` +
      `${impact.gewijzigdeTeams.length} gewijzigd, ` +
      `${impact.impactTeams.length} impact, ` +
      `${impact.totaalSpelersVerplaatst} spelers, ` +
      `${impact.totaalStafVerplaatst} staf`
  );

  return impact;
}
