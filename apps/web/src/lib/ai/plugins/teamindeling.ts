/**
 * Teamindeling-plugin voor Daisy — spelers opzoeken en werkindeling-status
 */

import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { HUIDIG_SEIZOEN } from "@oranje-wit/types";

export const teamindelingTools = {
  spelersInTeam: {
    description: "Zoekt een team op naam (fuzzy) en geeft de spelers in dat team terug",
    parameters: z.object({
      teamNaam: z.string().describe("(Deel van) de teamnaam, bijv. 'D1' of 'Oranje Wit'"),
    }),
    execute: async ({ teamNaam }: { teamNaam: string }) => {
      const teams = await prisma.oWTeam.findMany({
        where: {
          seizoen: HUIDIG_SEIZOEN,
          naam: { contains: teamNaam, mode: "insensitive" },
        },
        select: { owCode: true, naam: true, kleur: true, categorie: true },
      });

      if (teams.length === 0) {
        return { fout: `Geen team gevonden met naam "${teamNaam}"` };
      }

      const owCodes = teams.map((t) => t.owCode);

      // CompetitieSpeler heeft geen naam-veld, join met Lid voor de naam
      const spelers = await prisma.competitieSpeler.findMany({
        where: {
          seizoen: HUIDIG_SEIZOEN,
          team: { in: owCodes },
        },
        select: {
          relCode: true,
          geslacht: true,
          team: true,
          lid: { select: { roepnaam: true, achternaam: true, tussenvoegsel: true } },
        },
        distinct: ["relCode"],
      });

      const teamNaamMap = new Map(teams.map((t) => [t.owCode, t.naam]));

      // Sorteer op achternaam
      const gesorteerd = spelers.sort((a, b) =>
        (a.lid.achternaam ?? "").localeCompare(b.lid.achternaam ?? "")
      );

      return {
        teams: teams.map((t) => t.naam),
        aantalSpelers: gesorteerd.length,
        spelers: gesorteerd.map((s) => {
          const naam = s.lid.tussenvoegsel
            ? `${s.lid.roepnaam} ${s.lid.tussenvoegsel} ${s.lid.achternaam}`
            : `${s.lid.roepnaam} ${s.lid.achternaam}`;
          return {
            relCode: s.relCode,
            naam,
            geslacht: s.geslacht,
            team: teamNaamMap.get(s.team) ?? s.team,
          };
        }),
      };
    },
  },

  werkindelingStatus: {
    description: "Geeft de status van de blauwdruk en alle scenarios voor het huidige seizoen",
    parameters: z.object({}),
    execute: async () => {
      const blauwdruk = await prisma.blauwdruk.findUnique({
        where: { seizoen: HUIDIG_SEIZOEN },
        select: {
          id: true,
          seizoen: true,
          isWerkseizoen: true,
          createdAt: true,
          concepten: {
            select: {
              id: true,
              naam: true,
              status: true,
              scenarios: {
                select: {
                  id: true,
                  naam: true,
                  status: true,
                  isWerkindeling: true,
                },
              },
            },
          },
        },
      });

      if (!blauwdruk) {
        return {
          seizoen: HUIDIG_SEIZOEN,
          blauwdruk: null,
          bericht: "Nog geen blauwdruk aangemaakt voor dit seizoen",
        };
      }

      const scenarios = blauwdruk.concepten.flatMap((c) =>
        c.scenarios.map((s) => ({
          naam: s.naam,
          concept: c.naam,
          status: s.status,
          isWerkindeling: s.isWerkindeling,
        }))
      );

      return {
        seizoen: HUIDIG_SEIZOEN,
        blauwdruk: {
          id: blauwdruk.id,
          isWerkseizoen: blauwdruk.isWerkseizoen,
          aantalConcepten: blauwdruk.concepten.length,
          aantalScenarios: scenarios.length,
          createdAt: blauwdruk.createdAt,
        },
        scenarios,
        werkindeling: scenarios.find((s) => s.isWerkindeling) ?? null,
      };
    },
  },
};
