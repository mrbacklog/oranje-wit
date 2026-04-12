/**
 * Teamindeling-plugin voor Daisy — spelers opzoeken en werkindeling-status
 */

import { z } from "zod";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { HUIDIG_SEIZOEN } from "@oranje-wit/types";

export const teamindelingTools = {
  spelersInTeam: {
    description:
      "Zoekt een team op naam en geeft de spelers terug. Accepteert KNKV-competitienamen (J3, J8, OW J4, 1, 2, MW1) én OW-teamnamen (Oranje-2, Rood-1, Geel, ...).",
    inputSchema: z.object({
      teamNaam: z
        .string()
        .describe(
          "Teamnaam: KNKV-code (J3, OW J8, 1, 2, MW1) of OW-naam (Oranje-2, Rood-1, Geel). Geef exact de code door zoals de gebruiker die noemt."
        ),
    }),
    execute: async ({ teamNaam }: { teamNaam: string }) => {
      // Probeer eerst exacte alias-lookup (KNKV-competitienamen: "J3", "OW J8", "1", "2", ...)
      const alias = await prisma.teamAlias.findUnique({
        where: { seizoen_alias: { seizoen: HUIDIG_SEIZOEN, alias: teamNaam } },
        select: { owCode: true },
      });

      let teams;
      if (alias) {
        teams = await prisma.oWTeam.findMany({
          where: { seizoen: HUIDIG_SEIZOEN, owCode: alias.owCode },
          select: { id: true, owCode: true, naam: true, kleur: true, categorie: true },
        });
      } else {
        // Fuzzy search op OW-teamnaam (bijv. "Oranje-2", "Rood")
        teams = await prisma.oWTeam.findMany({
          where: {
            seizoen: HUIDIG_SEIZOEN,
            naam: { contains: teamNaam, mode: "insensitive" },
          },
          select: { id: true, owCode: true, naam: true, kleur: true, categorie: true },
        });
      }

      if (teams.length === 0) {
        return { fout: `Geen team gevonden met naam "${teamNaam}"` };
      }

      const teamIds = teams.map((t) => t.id);

      // Filter op owTeamId (FK naar OWTeam.id) — het team-veld bevat KNKV-competitiecodes
      const spelers = await prisma.competitieSpeler.findMany({
        where: {
          seizoen: HUIDIG_SEIZOEN,
          owTeamId: { in: teamIds },
        },
        select: {
          relCode: true,
          geslacht: true,
          owTeamId: true,
          lid: { select: { roepnaam: true, achternaam: true, tussenvoegsel: true } },
        },
        distinct: ["relCode"],
      });

      const teamNaamMap = new Map(teams.map((t) => [t.id, t.naam]));

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
            team: teamNaamMap.get(s.owTeamId) ?? teamNaam,
          };
        }),
      };
    },
  },

  werkindelingStatus: {
    description: "Geeft de status van de blauwdruk en alle scenarios voor het huidige seizoen",
    inputSchema: z.object({}),
    execute: async () => {
      const blauwdrukken = await prisma.$queryRaw<
        Array<{ id: string; seizoen: string; created_at: Date }>
      >`
        SELECT id, seizoen, created_at FROM "Blauwdruk" WHERE seizoen = ${HUIDIG_SEIZOEN} LIMIT 1
      `;
      const blauwdruk = blauwdrukken[0] ?? null;

      if (!blauwdruk) {
        return {
          seizoen: HUIDIG_SEIZOEN,
          blauwdruk: null,
          bericht: "Nog geen blauwdruk aangemaakt voor dit seizoen",
        };
      }

      const werkindelingen = await prisma.werkindeling.findMany({
        where: { kadersId: blauwdruk.id, verwijderdOp: null },
        select: {
          naam: true,
          status: true,
        },
      });

      const scenarios = werkindelingen.map((w) => ({
        naam: w.naam,
        status: w.status,
      }));

      return {
        seizoen: HUIDIG_SEIZOEN,
        blauwdruk: {
          id: blauwdruk.id,
          aantalWerkindelingen: werkindelingen.length,
          createdAt: blauwdruk.created_at,
        },
        werkindeling: scenarios[0] ?? null,
      };
    },
  },
};
