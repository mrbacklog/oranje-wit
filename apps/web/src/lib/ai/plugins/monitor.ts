/**
 * Monitor-plugin voor Daisy — ledenaantallen en teambezetting
 */

import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { HUIDIG_SEIZOEN } from "@oranje-wit/types";

export const monitorTools = {
  ledenPerCategorie: {
    description: "Telt het aantal actieve leden per kleur (leeftijdsgroep) in het huidige seizoen",
    inputSchema: z.object({}),
    execute: async () => {
      const teams = await prisma.oWTeam.findMany({
        where: { seizoen: HUIDIG_SEIZOEN },
        select: { owCode: true, kleur: true, naam: true },
      });

      const teamKleurMap = new Map(teams.map((t) => [t.owCode, t.kleur ?? "onbekend"]));

      const spelers = await prisma.competitieSpeler.findMany({
        where: { seizoen: HUIDIG_SEIZOEN },
        select: { team: true, relCode: true },
        distinct: ["relCode"],
      });

      const perKleur: Record<string, number> = {};
      for (const speler of spelers) {
        const kleur = teamKleurMap.get(speler.team) ?? "onbekend";
        perKleur[kleur] = (perKleur[kleur] ?? 0) + 1;
      }

      return {
        seizoen: HUIDIG_SEIZOEN,
        totaal: spelers.length,
        perKleur,
      };
    },
  },

  teamBezetting: {
    description: "Telt het aantal spelers per team, optioneel gefilterd op kleur (leeftijdsgroep)",
    inputSchema: z.object({
      kleur: z
        .string()
        .optional()
        .describe("Optioneel: filter op kleur/leeftijdsgroep (bijv. 'groen', 'geel', 'oranje')"),
    }),
    execute: async ({ kleur }: { kleur?: string }) => {
      const teamWhere: { seizoen: string; kleur?: string } = {
        seizoen: HUIDIG_SEIZOEN,
      };
      if (kleur) {
        teamWhere.kleur = kleur.toLowerCase();
      }

      const teams = await prisma.oWTeam.findMany({
        where: teamWhere,
        select: { owCode: true, naam: true, kleur: true, categorie: true },
        orderBy: { sortOrder: "asc" },
      });

      const owCodes = teams.map((t) => t.owCode);

      const spelerCounts = await prisma.competitieSpeler.groupBy({
        by: ["team"],
        where: {
          seizoen: HUIDIG_SEIZOEN,
          team: { in: owCodes },
        },
        _count: { relCode: true },
      });

      const countMap = new Map(spelerCounts.map((c) => [c.team, c._count.relCode]));

      return {
        seizoen: HUIDIG_SEIZOEN,
        filter: kleur ?? "alle",
        teams: teams.map((t) => ({
          naam: t.naam,
          owCode: t.owCode,
          kleur: t.kleur,
          categorie: t.categorie,
          aantalSpelers: countMap.get(t.owCode) ?? 0,
        })),
      };
    },
  },
};
