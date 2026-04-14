/* eslint-disable max-lines */
/**
 * TI-studio plugin voor Daisy — 19 tools voor de teamindeling.
 *
 * Lees-tools (4): spelersZoeken, teamSamenstelling, scenarioVergelijken, blauwdrukToetsen
 * Schrijf-tools spelers (5): spelerVerplaatsen, spelerStatusZetten,
 *   nieuwLidInBlauwdruk, plaatsreserveringZetten, besluitVastleggen
 * Schrijf-tools teams & staf (3): teamAanmaken, selectieAanmaken, stafPlaatsen
 * Schrijf-tools werkbord & scenario (2): whatIfScenarioAanmaken, actiePlaatsen
 * Memo-tools (3): memosOphalen, memoAanmaken, memoStatusZetten
 * Undo (2): actieOngedaanMaken, sessieTerugdraaien
 */
import { z } from "zod";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { HUIDIG_SEIZOEN, PEILJAAR } from "@oranje-wit/types";
import {
  logDaisyActie,
  getDaisyActies,
  markeerOngedaan,
  getDaisyActie,
  voerUndoUit,
} from "@/lib/ai/daisy-acties";

// ─── Helpers ────────────────────────────────────────────────────

async function getWerkBlauwdruk() {
  return prisma.kaders.findFirst({
    where: { isWerkseizoen: true },
    select: { id: true, seizoen: true, kaders: true, keuzes: true },
  });
}

async function getLaatsteVersie(werkindelingId: string) {
  return prisma.versie.findFirst({
    where: { werkindelingId },
    orderBy: { nummer: "desc" },
    select: { id: true, nummer: true },
  });
}

async function getVersieId(inContext: string): Promise<string | null> {
  if (inContext.startsWith("v:")) {
    const id = inContext.slice(2);
    const versie = await prisma.versie.findUnique({
      where: { id },
      select: { id: true },
    });
    return versie?.id ?? null;
  }
  if (inContext === "werkindeling") {
    const blauwdruk = await getWerkBlauwdruk();
    if (!blauwdruk) return null;
    const wi = await prisma.werkindeling.findFirst({
      where: { kadersId: blauwdruk.id, verwijderdOp: null },
    });
    if (!wi) return null;
    const v = await getLaatsteVersie(wi.id);
    return v?.id ?? null;
  }
  const v = await getLaatsteVersie(inContext);
  return v?.id ?? null;
}

// ─── Lees-tools ─────────────────────────────────────────────────

const leesTools = {
  spelersZoeken: {
    description:
      "Zoek spelers op met filters. Gebruik dit om kandidaten te vinden voor verplaatsing of analyse.",
    inputSchema: z.object({
      geslacht: z.enum(["M", "V"]).optional().describe("Filter op geslacht"),
      geboortejaar: z.number().optional().describe("Filter op exact geboortejaar"),
      leeftijdVolgendSeizoen: z
        .number()
        .optional()
        .describe(`Leeftijd volgend seizoen (peiljaar ${PEILJAAR})`),
      ussMin: z.number().optional().describe("Minimale USS-score"),
      ussMax: z.number().optional().describe("Maximale USS-score"),
      retentierisico: z
        .enum(["hoog", "middel", "laag"])
        .optional()
        .describe("Filter op retentierisico"),
      naam: z.string().optional().describe("Zoek op (deel van) voor- of achternaam"),
      team: z.string().optional().describe("Filter op huidig team (gedeeltelijke naam)"),
      status: z
        .enum([
          "BESCHIKBAAR",
          "TWIJFELT",
          "GAAT_STOPPEN",
          "NIEUW_POTENTIEEL",
          "NIEUW_DEFINITIEF",
          "ALGEMEEN_RESERVE",
        ])
        .optional()
        .describe("Filter op spelerstatus"),
    }),
    execute: async (params: {
      naam?: string;
      geslacht?: "M" | "V";
      geboortejaar?: number;
      leeftijdVolgendSeizoen?: number;
      ussMin?: number;
      ussMax?: number;
      retentierisico?: "hoog" | "middel" | "laag";
      team?: string;
      status?: string;
    }) => {
      const where: Record<string, any> = {};
      if (params.naam) {
        where.OR = [
          { roepnaam: { contains: params.naam, mode: "insensitive" } },
          { achternaam: { contains: params.naam, mode: "insensitive" } },
        ];
      }
      if (params.geslacht) where.geslacht = params.geslacht;
      if (params.geboortejaar) where.geboortejaar = params.geboortejaar;
      if (params.leeftijdVolgendSeizoen)
        where.geboortejaar = PEILJAAR - params.leeftijdVolgendSeizoen;
      if (params.status) where.status = params.status;

      const spelers = await prisma.speler.findMany({
        where,
        select: {
          id: true,
          roepnaam: true,
          achternaam: true,
          geboortejaar: true,
          geslacht: true,
          status: true,
          rating: true,
          ratingBerekend: true,
          retentie: true,
          huidig: true,
        },
        orderBy: [{ achternaam: "asc" }, { roepnaam: "asc" }],
        take: 50,
      });

      let resultaat = spelers.map((s) => ({
        id: s.id,
        naam: `${s.roepnaam} ${s.achternaam}`,
        geslacht: s.geslacht,
        geboortejaar: s.geboortejaar,
        leeftijdVolgendSeizoen: PEILJAAR - s.geboortejaar,
        status: s.status,
        uss: s.rating ?? s.ratingBerekend ?? null,
        retentierisico: (s.retentie as any)?.risico ?? null,
        huidigTeam: (s.huidig as any)?.team ?? null,
      }));

      if (params.ussMin != null)
        resultaat = resultaat.filter((s) => s.uss != null && s.uss >= params.ussMin!);
      if (params.ussMax != null)
        resultaat = resultaat.filter((s) => s.uss != null && s.uss <= params.ussMax!);
      if (params.retentierisico)
        resultaat = resultaat.filter((s) => s.retentierisico === params.retentierisico);
      if (params.team)
        resultaat = resultaat.filter((s) =>
          s.huidigTeam?.toLowerCase().includes(params.team!.toLowerCase())
        );

      return { aantalGevonden: resultaat.length, spelers: resultaat };
    },
  },

  teamSamenstelling: {
    description:
      "Geeft de volledige bezetting van een team: spelers, USS-scores, geslachtsverhouding en staf.",
    inputSchema: z.object({
      teamNaam: z.string().describe("(Deel van) de teamnaam, bijv. 'Sen 1' of 'U15'"),
      inContext: z
        .string()
        .optional()
        .describe(
          '"werkindeling" (standaard), werkindelingId, of "v:<versieId>" voor directe versie'
        ),
    }),
    execute: async ({ teamNaam, inContext }: { teamNaam: string; inContext?: string }) => {
      const versieId = await getVersieId(inContext ?? "werkindeling");
      if (!versieId) return { fout: "Geen versie gevonden" };

      const teams = await prisma.team.findMany({
        where: {
          versieId,
          naam: { contains: teamNaam, mode: "insensitive" },
        },
        select: {
          id: true,
          naam: true,
          categorie: true,
          kleur: true,
          spelers: {
            select: {
              speler: {
                select: {
                  id: true,
                  roepnaam: true,
                  achternaam: true,
                  geslacht: true,
                  rating: true,
                  ratingBerekend: true,
                  status: true,
                },
              },
            },
          },
          staf: {
            select: {
              staf: { select: { naam: true } },
              rol: true,
            },
          },
        },
      });

      if (teams.length === 0) return { fout: `Geen team gevonden met naam "${teamNaam}"` };

      return teams.map((team) => {
        const spelers = team.spelers.map(
          (ts: {
            speler: {
              id: string;
              roepnaam: string;
              achternaam: string;
              geslacht: string;
              rating: number | null;
              ratingBerekend: number | null;
              status: string;
            };
          }) => ({
            id: ts.speler.id,
            naam: `${ts.speler.roepnaam} ${ts.speler.achternaam}`,
            geslacht: ts.speler.geslacht,
            uss: ts.speler.rating ?? ts.speler.ratingBerekend ?? null,
            status: ts.speler.status,
          })
        );
        const mannen = spelers.filter((s: { geslacht: string }) => s.geslacht === "M").length;
        const vrouwen = spelers.filter((s: { geslacht: string }) => s.geslacht === "V").length;
        const metUss = spelers.filter((s: { uss: number | null }) => s.uss != null);
        const gemUss =
          metUss.length > 0
            ? Math.round(
                metUss.reduce((sum: number, s: { uss: number | null }) => sum + s.uss!, 0) /
                  metUss.length
              )
            : null;
        return {
          id: team.id,
          naam: team.naam,
          categorie: team.categorie,
          aantalSpelers: spelers.length,
          mannen,
          vrouwen,
          gemiddeldeUss: gemUss,
          spelers,
          staf: team.staf.map((ts: { staf: { naam: string }; rol: string }) => ({
            naam: ts.staf.naam,
            rol: ts.rol,
          })),
        };
      });
    },
  },

  scenarioVergelijken: {
    description: "Vergelijkt twee scenario's en toont wie verschoven is en wat de score-impact is.",
    inputSchema: z.object({
      whatIfIdA: z.string().describe("ID van het eerste scenario"),
      whatIfIdB: z.string().describe("ID van het tweede scenario"),
    }),
    execute: async ({ whatIfIdA, whatIfIdB }: { whatIfIdA: string; whatIfIdB: string }) => {
      async function getTeamplaatsingen(werkindelingId: string) {
        const versie = await getLaatsteVersie(werkindelingId);
        if (!versie) return new Map<string, { team: string; naam: string }>();
        const spelers = await prisma.teamSpeler.findMany({
          where: { team: { versieId: versie.id } },
          select: {
            spelerId: true,
            team: { select: { naam: true } },
            speler: { select: { roepnaam: true, achternaam: true } },
          },
        });
        return new Map(
          spelers.map((s) => [
            s.spelerId,
            {
              team: s.team.naam,
              naam: `${s.speler.roepnaam} ${s.speler.achternaam}`,
            },
          ])
        );
      }

      const [plaatsingenA, plaatsingenB] = await Promise.all([
        getTeamplaatsingen(whatIfIdA),
        getTeamplaatsingen(whatIfIdB),
      ]);

      const verschuivingen: Array<{ naam: string; van: string; naar: string }> = [];
      const alleSpelers = new Set([...plaatsingenA.keys(), ...plaatsingenB.keys()]);

      for (const spelerId of alleSpelers) {
        const a = plaatsingenA.get(spelerId);
        const b = plaatsingenB.get(spelerId);
        if (a?.team !== b?.team) {
          verschuivingen.push({
            naam: a?.naam ?? b?.naam ?? spelerId,
            van: a?.team ?? "(niet geplaatst)",
            naar: b?.team ?? "(niet geplaatst)",
          });
        }
      }

      return {
        aantalVerschuivingen: verschuivingen.length,
        verschuivingen: verschuivingen.sort((a, b) => a.naam.localeCompare(b.naam)),
      };
    },
  },

  blauwdrukToetsen: {
    description:
      "Toetst de huidige werkindeling aan de blauwdruk-kaders: teamgrootte, categorieën en knelpunten.",
    inputSchema: z.object({}),
    execute: async () => {
      const blauwdruk = await getWerkBlauwdruk();
      if (!blauwdruk) return { fout: "Geen actieve blauwdruk gevonden" };

      const werkindeling = await prisma.werkindeling.findFirst({
        where: { kadersId: blauwdruk.id, verwijderdOp: null },
        select: { id: true, naam: true },
      });
      if (!werkindeling) return { fout: "Geen werkindeling gevonden" };

      const versie = await getLaatsteVersie(werkindeling.id);
      if (!versie) return { fout: "Geen versie gevonden in werkindeling" };

      const teams = await prisma.team.findMany({
        where: { versieId: versie.id },
        select: {
          naam: true,
          categorie: true,
          _count: { select: { spelers: true } },
        },
      });

      const kaders = blauwdruk.kaders as any;
      const knelpunten: string[] = [];

      for (const team of teams) {
        const aantal = team._count.spelers;
        if (aantal < 8) knelpunten.push(`${team.naam}: te weinig spelers (${aantal}, min 8)`);
        if (aantal > 14) knelpunten.push(`${team.naam}: te veel spelers (${aantal}, max 14)`);
      }

      return {
        seizoen: blauwdruk.seizoen,
        werkindeling: werkindeling.naam,
        aantalTeams: teams.length,
        teams: teams.map((t) => ({
          naam: t.naam,
          categorie: t.categorie,
          aantalSpelers: t._count.spelers,
        })),
        knelpunten,
        kaders: kaders ?? {},
      };
    },
  },
};

// ─── Schrijf-tools spelers ───────────────────────────────────────

function maakSchrijfToolsSpelers(sessieId: string, gebruikerEmail: string) {
  return {
    spelerVerplaatsen: {
      description:
        "Verplaatst een speler van het ene team naar het andere. Werkt in scenario of werkindeling.",
      inputSchema: z.object({
        spelerId: z.string().describe("ID van de speler (rel_code)"),
        naarTeam: z.string().describe("Naam van het doelteam"),
        inContext: z
          .string()
          .describe(
            '"werkindeling" (standaard), werkindelingId, of "v:<versieId>" voor directe versie'
          ),
      }),
      execute: async ({
        spelerId,
        naarTeam,
        inContext,
      }: {
        spelerId: string;
        naarTeam: string;
        inContext: string;
      }) => {
        const versieId = await getVersieId(inContext);
        if (!versieId) return { fout: "Context niet gevonden" };

        const huidigeplaatsing = await prisma.teamSpeler.findFirst({
          where: { spelerId, team: { versieId } },
          select: { id: true, teamId: true, team: { select: { naam: true } } },
        });

        const doelTeam = await prisma.team.findFirst({
          where: { versieId, naam: { contains: naarTeam, mode: "insensitive" } },
          select: { id: true, naam: true },
        });
        if (!doelTeam) return { fout: `Team "${naarTeam}" niet gevonden in deze context` };

        const speler = await prisma.speler.findUnique({
          where: { id: spelerId },
          select: { roepnaam: true, achternaam: true },
        });
        const spelerNaam = speler ? `${speler.roepnaam} ${speler.achternaam}` : spelerId;
        const vanTeamNaam = huidigeplaatsing?.team?.naam ?? "(niet geplaatst)";

        await prisma.$transaction(async (tx: any) => {
          if (huidigeplaatsing) {
            await tx.teamSpeler.delete({ where: { id: huidigeplaatsing.id } });
          }
          await tx.teamSpeler.create({ data: { teamId: doelTeam.id, spelerId } });
        });

        await logDaisyActie({
          sessieId,
          tool: "spelerVerplaatsen",
          doPayload: { spelerId, spelerNaam, van: vanTeamNaam, naar: doelTeam.naam },
          undoPayload: {
            spelerId,
            vanTeamId: doelTeam.id,
            naarTeamId: huidigeplaatsing?.teamId ?? null,
            versieId,
          },
          namens: gebruikerEmail,
          uitgevoerdIn: inContext,
        });

        return {
          gedaan: true,
          samenvatting: `${spelerNaam} verplaatst van ${vanTeamNaam} naar ${doelTeam.naam}`,
        };
      },
    },

    spelerStatusZetten: {
      description: "Zet de status van een speler (bijv. TWIJFELT, GAAT_STOPPEN, BESCHIKBAAR).",
      inputSchema: z.object({
        spelerId: z.string().describe("ID van de speler"),
        status: z
          .enum([
            "BESCHIKBAAR",
            "TWIJFELT",
            "GAAT_STOPPEN",
            "NIEUW_POTENTIEEL",
            "NIEUW_DEFINITIEF",
            "ALGEMEEN_RESERVE",
          ])
          .describe("Nieuwe status"),
      }),
      execute: async ({ spelerId, status }: { spelerId: string; status: string }) => {
        const speler = await prisma.speler.findUnique({
          where: { id: spelerId },
          select: { roepnaam: true, achternaam: true, status: true },
        });
        if (!speler) return { fout: `Speler ${spelerId} niet gevonden` };

        const oudeStatus = speler.status;
        await prisma.speler.update({ where: { id: spelerId }, data: { status } });

        await logDaisyActie({
          sessieId,
          tool: "spelerStatusZetten",
          doPayload: { spelerId, spelerNaam: `${speler.roepnaam} ${speler.achternaam}`, status },
          undoPayload: { spelerId, status: oudeStatus },
          namens: gebruikerEmail,
          uitgevoerdIn: "werkindeling",
        });

        return {
          gedaan: true,
          samenvatting: `Status van ${speler.roepnaam} ${speler.achternaam} gezet op ${status}`,
        };
      },
    },

    nieuwLidInBlauwdruk: {
      description:
        "Maakt een nieuw verwacht lid aan in de blauwdruk (iemand die nog niet in het systeem staat).",
      inputSchema: z.object({
        naam: z.string().describe("Volledige naam van het nieuwe lid"),
        geslacht: z.enum(["M", "V"]).describe("Geslacht"),
        geboortejaar: z.number().int().min(2000).max(2030).describe("Geboortejaar"),
      }),
      execute: async ({
        naam,
        geslacht,
        geboortejaar,
      }: {
        naam: string;
        geslacht: "M" | "V";
        geboortejaar: number;
      }) => {
        const delen = naam.trim().split(" ");
        const roepnaam = delen[0] ?? naam;
        const achternaam = delen.slice(1).join(" ") || roepnaam;

        const nieuweId = `NIEUW-${Date.now()}`;
        await prisma.speler.create({
          data: {
            id: nieuweId,
            roepnaam,
            achternaam,
            geslacht,
            geboortejaar,
            status: "NIEUW_POTENTIEEL",
          },
        });

        await logDaisyActie({
          sessieId,
          tool: "nieuwLidInBlauwdruk",
          doPayload: { spelerId: nieuweId, naam, geslacht, geboortejaar },
          undoPayload: { spelerId: nieuweId },
          namens: gebruikerEmail,
          uitgevoerdIn: "werkindeling",
        });

        return {
          gedaan: true,
          spelerId: nieuweId,
          samenvatting: `Nieuw lid "${naam}" aangemaakt met id ${nieuweId}`,
        };
      },
    },

    plaatsreserveringZetten: {
      description:
        "Plaatst een naamloze of benoemde placeholder in een team (bijv. 'verwacht: Robin').",
      inputSchema: z.object({
        teamNaam: z.string().describe("Naam van het team"),
        naam: z.string().describe("Naam voor de placeholder, bijv. 'Verwacht lid'"),
        geslacht: z.enum(["M", "V"]).optional().describe("Optioneel geslacht van de placeholder"),
        inContext: z
          .string()
          .describe(
            '"werkindeling" (standaard), werkindelingId, of "v:<versieId>" voor directe versie'
          ),
      }),
      execute: async ({
        teamNaam,
        naam,
        geslacht,
        inContext,
      }: {
        teamNaam: string;
        naam: string;
        geslacht?: "M" | "V";
        inContext: string;
      }) => {
        const versieId = await getVersieId(inContext);
        if (!versieId) return { fout: "Context niet gevonden" };

        const team = await prisma.team.findFirst({
          where: { versieId, naam: { contains: teamNaam, mode: "insensitive" } },
          select: { id: true, naam: true },
        });
        if (!team) return { fout: `Team "${teamNaam}" niet gevonden` };

        const reservering = await prisma.plaatsreservering.create({
          data: { teamId: team.id, naam, geslacht: geslacht ?? null },
        });

        await logDaisyActie({
          sessieId,
          tool: "plaatsreserveringZetten",
          doPayload: { reserveringId: reservering.id, team: team.naam, naam, geslacht },
          undoPayload: { reserveringId: reservering.id },
          namens: gebruikerEmail,
          uitgevoerdIn: inContext,
        });

        return {
          gedaan: true,
          samenvatting: `Plaatsreservering "${naam}" aangemaakt in ${team.naam}`,
        };
      },
    },

    besluitVastleggen: {
      description:
        "Legt een besluit vast namens een TC-lid als werkitem. Vereist altijd een 'namens' attribuering.",
      inputSchema: z.object({
        besluit: z.string().describe("Tekst van het besluit"),
        namens: z.string().describe("Naam of e-mail van het TC-lid dat het besluit nam"),
      }),
      execute: async ({ besluit, namens }: { besluit: string; namens: string }) => {
        const blauwdruk = await getWerkBlauwdruk();
        if (!blauwdruk) return { fout: "Geen actieve blauwdruk gevonden" };

        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { naam: { contains: namens, mode: "insensitive" } },
              { email: { contains: namens, mode: "insensitive" } },
            ],
          },
          select: { id: true, naam: true },
        });

        if (!user) {
          user = await prisma.user.findFirst({
            where: { email: gebruikerEmail },
            select: { id: true, naam: true },
          });
        }
        if (!user) return { fout: "Kon geen gebruiker vinden voor auteurId" };

        const werkitem = await prisma.werkitem.create({
          data: {
            kadersId: blauwdruk.id,
            titel: `Besluit: ${besluit.slice(0, 80)}`,
            beschrijving: besluit,
            type: "BESLUIT",
            status: "OPGELOST",
            resolutie: besluit,
            opgelostOp: new Date(),
            auteurId: user.id,
          },
        });

        await logDaisyActie({
          sessieId,
          tool: "besluitVastleggen",
          doPayload: { werkitemId: werkitem.id, besluit, namens },
          undoPayload: { werkitemId: werkitem.id },
          namens,
          uitgevoerdIn: "werkindeling",
        });

        return {
          gedaan: true,
          samenvatting: `Besluit vastgelegd namens ${namens}: "${besluit.slice(0, 60)}…"`,
        };
      },
    },
  };
}

// ─── Schrijf-tools teams & staf + werkbord & scenario ───────────

function maakSchrijfToolsRest(sessieId: string, gebruikerEmail: string) {
  return {
    teamAanmaken: {
      description: "Maakt een nieuw team aan in een scenario.",
      inputSchema: z.object({
        naam: z.string().describe("Naam van het nieuwe team"),
        categorie: z
          .enum(["SENIOREN", "JEUGD_A", "JEUGD_B", "RECREANTEN", "MIXED"])
          .describe("Teamcategorie"),
        inContext: z
          .string()
          .describe('werkindelingId of "v:<versieId>" om het team in aan te maken'),
      }),
      execute: async ({
        naam,
        categorie,
        inContext,
      }: {
        naam: string;
        categorie: string;
        inContext: string;
      }) => {
        const versie = await getVersieId(inContext);
        if (!versie) return { fout: "Scenario niet gevonden" };

        const team = await prisma.team.create({
          data: { versieId: versie, naam, categorie, volgorde: 99 },
        });

        await logDaisyActie({
          sessieId,
          tool: "teamAanmaken",
          doPayload: { teamId: team.id, naam, categorie },
          undoPayload: { teamId: team.id },
          namens: gebruikerEmail,
          uitgevoerdIn: inContext,
        });

        return { gedaan: true, teamId: team.id, samenvatting: `Team "${naam}" aangemaakt` };
      },
    },

    selectieAanmaken: {
      description: "Maakt een selectiegroep aan en koppelt spelers.",
      inputSchema: z.object({
        naam: z.string().describe("Naam van de selectiegroep"),
        spelerIds: z.array(z.string()).describe("Lijst van speler-IDs"),
        inContext: z.string().describe('werkindelingId of "v:<versieId>"'),
      }),
      execute: async ({
        naam,
        spelerIds,
        inContext,
      }: {
        naam: string;
        spelerIds: string[];
        inContext: string;
      }) => {
        const versie = await getVersieId(inContext);
        if (!versie) return { fout: "Scenario niet gevonden" };

        const groep = await prisma.selectieGroep.create({
          data: {
            versieId: versie,
            naam,
            spelers: {
              create: spelerIds.map((spelerId) => ({ spelerId })),
            },
          },
        });

        await logDaisyActie({
          sessieId,
          tool: "selectieAanmaken",
          doPayload: { groepId: groep.id, naam, spelerIds },
          undoPayload: { groepId: groep.id },
          namens: gebruikerEmail,
          uitgevoerdIn: inContext,
        });

        return {
          gedaan: true,
          groepId: groep.id,
          samenvatting: `Selectiegroep "${naam}" aangemaakt met ${spelerIds.length} spelers`,
        };
      },
    },

    stafPlaatsen: {
      description: "Wijst een stafmedewerker toe aan een team in een scenario of werkindeling.",
      inputSchema: z.object({
        stafNaam: z.string().describe("Naam van de stafmedewerker (gedeeltelijk)"),
        rol: z.string().describe('Rol, bijv. "Trainer/Coach", "Assistent", "Begeleider"'),
        teamNaam: z.string().describe("Naam van het doelteam"),
        inContext: z
          .string()
          .describe(
            '"werkindeling" (standaard), werkindelingId, of "v:<versieId>" voor directe versie'
          ),
      }),
      execute: async ({
        stafNaam,
        rol,
        teamNaam,
        inContext,
      }: {
        stafNaam: string;
        rol: string;
        teamNaam: string;
        inContext: string;
      }) => {
        const versieId = await getVersieId(inContext);
        if (!versieId) return { fout: "Context niet gevonden" };

        const staf = await prisma.staf.findFirst({
          where: { naam: { contains: stafNaam, mode: "insensitive" } },
          select: { id: true, naam: true },
        });
        if (!staf) return { fout: `Stafmedewerker "${stafNaam}" niet gevonden` };

        const team = await prisma.team.findFirst({
          where: { versieId, naam: { contains: teamNaam, mode: "insensitive" } },
          select: { id: true, naam: true },
        });
        if (!team) return { fout: `Team "${teamNaam}" niet gevonden` };

        const bestaand = await prisma.teamStaf.findFirst({
          where: { teamId: team.id, stafId: staf.id },
          select: { id: true },
        });

        if (bestaand) {
          await prisma.teamStaf.update({ where: { id: bestaand.id }, data: { rol } });
        } else {
          await prisma.teamStaf.create({ data: { teamId: team.id, stafId: staf.id, rol } });
        }

        await logDaisyActie({
          sessieId,
          tool: "stafPlaatsen",
          doPayload: { stafId: staf.id, stafNaam: staf.naam, teamId: team.id, rol },
          undoPayload: { stafId: staf.id, teamId: team.id, bestaandId: bestaand?.id ?? null },
          namens: gebruikerEmail,
          uitgevoerdIn: inContext,
        });

        return {
          gedaan: true,
          samenvatting: `${staf.naam} geplaatst als ${rol} bij ${team.naam}`,
        };
      },
    },

    whatIfScenarioAanmaken: {
      description: "Maakt een kopie van de werkindeling als nieuw what-if scenario.",
      inputSchema: z.object({
        naam: z.string().describe("Naam voor het nieuwe scenario"),
      }),
      execute: async ({ naam }: { naam: string }) => {
        const blauwdruk = await getWerkBlauwdruk();
        if (!blauwdruk) return { fout: "Geen actieve blauwdruk gevonden" };

        const werkindeling = await prisma.werkindeling.create({
          data: {
            kadersId: blauwdruk.id,
            naam,
            versies: {
              create: {
                nummer: 1,
                naam: "Initieel",
                auteur: gebruikerEmail ?? "daisy",
              },
            },
          },
          select: { id: true },
        });

        await logDaisyActie({
          sessieId,
          tool: "whatIfScenarioAanmaken",
          doPayload: { werkindelingId: werkindeling.id, naam },
          undoPayload: { werkindelingId: werkindeling.id },
          namens: gebruikerEmail,
          uitgevoerdIn: `werkindeling:${werkindeling.id}`,
        });

        return {
          gedaan: true,
          werkindelingId: werkindeling.id,
          samenvatting: `Werkindeling "${naam}" aangemaakt`,
        };
      },
    },

    actiePlaatsen: {
      description: "Plaatst een actiepunt/werkitem op het werkbord.",
      inputSchema: z.object({
        titel: z.string().describe("Korte titel van de actie"),
        beschrijving: z.string().optional().describe("Optionele uitleg"),
        toegewezenAan: z
          .string()
          .optional()
          .describe("Naam of e-mail van de persoon waaraan de actie is toegewezen"),
      }),
      execute: async ({
        titel,
        beschrijving,
        toegewezenAan,
      }: {
        titel: string;
        beschrijving?: string;
        toegewezenAan?: string;
      }) => {
        const blauwdruk = await getWerkBlauwdruk();
        if (!blauwdruk) return { fout: "Geen actieve blauwdruk gevonden" };

        const user = await prisma.user.findFirst({
          where: { email: gebruikerEmail },
          select: { id: true },
        });
        if (!user) return { fout: "Gebruiker niet gevonden" };

        const werkitem = await prisma.werkitem.create({
          data: {
            kadersId: blauwdruk.id,
            titel,
            beschrijving: beschrijving ?? "",
            type: "STRATEGISCH",
            status: "OPEN",
            auteurId: user.id,
          },
        });

        await logDaisyActie({
          sessieId,
          tool: "actiePlaatsen",
          doPayload: { werkitemId: werkitem.id, titel, toegewezenAan },
          undoPayload: { werkitemId: werkitem.id },
          namens: gebruikerEmail,
          uitgevoerdIn: "werkindeling",
        });

        return {
          gedaan: true,
          werkitemId: werkitem.id,
          samenvatting: `Actie "${titel}" aangemaakt op het werkbord`,
        };
      },
    },
  };
}

// ─── Memo-tools ─────────────────────────────────────────────────

function maakMemoTools(sessieId: string, gebruikerEmail: string) {
  async function vindAuteurId(namens?: string): Promise<string | null> {
    const zoekEmail = namens ?? gebruikerEmail;
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { contains: zoekEmail, mode: "insensitive" } },
          { naam: { contains: zoekEmail, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });
    if (user) return user.id;
    // Fallback: eerste TC-lid
    const tc = await prisma.user.findFirst({
      where: { isTC: true },
      select: { id: true },
    });
    return tc?.id ?? null;
  }

  return {
    memosOphalen: {
      description:
        "Haalt memo's (werkitems) op uit het kanban-bord. Filterbaar op status, prioriteit, entiteit of doelgroep.",
      inputSchema: z.object({
        status: z
          .enum(["OPEN", "IN_BESPREKING", "OPGELOST", "GEACCEPTEERD_RISICO", "GEARCHIVEERD"])
          .optional()
          .describe("Filter op status (standaard: OPEN + IN_BESPREKING)"),
        prioriteit: z
          .enum(["BLOCKER", "HOOG", "MIDDEL", "LAAG", "INFO"])
          .optional()
          .describe("Filter op prioriteit"),
        entiteit: z
          .enum(["SPELER", "TEAM", "STAF", "BLAUWDRUK"])
          .optional()
          .describe("Filter op type entiteit"),
        doelgroep: z
          .enum(["KWEEKVIJVER", "ONTWIKKELHART", "TOP", "WEDSTRIJDSPORT", "KORFBALPLEZIER", "ALLE"])
          .optional()
          .describe("Filter op doelgroep"),
        spelerId: z.string().optional().describe("Memo's voor één specifieke speler"),
        teamId: z.string().optional().describe("Memo's voor één specifiek team"),
      }),
      execute: async (params: {
        status?: string;
        prioriteit?: string;
        entiteit?: string;
        doelgroep?: string;
        spelerId?: string;
        teamId?: string;
      }) => {
        const blauwdruk = await getWerkBlauwdruk();
        if (!blauwdruk) return { fout: "Geen actieve blauwdruk gevonden" };

        const statusFilter = params.status ? [params.status] : ["OPEN", "IN_BESPREKING"];

        const memos = await prisma.werkitem.findMany({
          where: {
            kadersId: blauwdruk.id,
            type: "MEMO",
            status: { in: statusFilter as any[] },
            ...(params.prioriteit ? { prioriteit: params.prioriteit as any } : {}),
            ...(params.entiteit ? { entiteit: params.entiteit as any } : {}),
            ...(params.doelgroep ? { doelgroep: params.doelgroep as any } : {}),
            ...(params.spelerId ? { spelerId: params.spelerId } : {}),
            ...(params.teamId ? { teamId: params.teamId } : {}),
          },
          select: {
            id: true,
            titel: true,
            beschrijving: true,
            status: true,
            prioriteit: true,
            entiteit: true,
            doelgroep: true,
            resolutie: true,
            createdAt: true,
            speler: { select: { roepnaam: true, achternaam: true } },
            team: { select: { naam: true } },
          },
          orderBy: [{ prioriteit: "asc" }, { createdAt: "desc" }],
          take: 50,
        });

        return {
          aantalGevonden: memos.length,
          memos: memos.map((m) => ({
            id: m.id,
            titel: m.titel,
            beschrijving: m.beschrijving,
            status: m.status,
            prioriteit: m.prioriteit,
            entiteit: m.entiteit,
            doelgroep: m.doelgroep,
            resolutie: m.resolutie,
            speler: m.speler ? `${m.speler.roepnaam} ${m.speler.achternaam}` : null,
            team: m.team?.naam ?? null,
            aangemaakt: m.createdAt.toISOString(),
          })),
        };
      },
    },

    memoAanmaken: {
      description:
        "Maakt een nieuw memo aan op het kanban-bord. Koppelbaar aan speler, team, doelgroep of TC-algemeen.",
      inputSchema: z.object({
        beschrijving: z.string().describe("Inhoud van het memo"),
        titel: z.string().optional().describe("Optionele korte titel"),
        prioriteit: z
          .enum(["BLOCKER", "HOOG", "MIDDEL", "LAAG", "INFO"])
          .optional()
          .describe("Prioriteit (standaard: MIDDEL)"),
        spelerId: z.string().optional().describe("Koppel aan speler (speler-ID)"),
        teamId: z.string().optional().describe("Koppel aan team (team-ID)"),
        doelgroep: z
          .enum(["KWEEKVIJVER", "ONTWIKKELHART", "TOP", "WEDSTRIJDSPORT", "KORFBALPLEZIER", "ALLE"])
          .optional()
          .describe("Koppel aan doelgroep (laat weg voor TC-algemeen)"),
        namens: z
          .string()
          .optional()
          .describe("Naam of e-mail van de TC-auteur (optioneel, standaard: Daisy)"),
      }),
      execute: async (params: {
        beschrijving: string;
        titel?: string;
        prioriteit?: string;
        spelerId?: string;
        teamId?: string;
        doelgroep?: string;
        namens?: string;
      }) => {
        const blauwdruk = await getWerkBlauwdruk();
        if (!blauwdruk) return { fout: "Geen actieve blauwdruk gevonden" };

        const auteurId = await vindAuteurId(params.namens);
        if (!auteurId) return { fout: "Geen TC-gebruiker gevonden om het memo aan te koppelen" };

        const entiteit = params.spelerId ? "SPELER" : params.teamId ? "TEAM" : null;

        const memo = await prisma.werkitem.create({
          data: {
            kadersId: blauwdruk.id,
            titel: params.titel ?? null,
            beschrijving: params.beschrijving,
            type: "MEMO",
            status: "OPEN",
            prioriteit: (params.prioriteit ?? "MIDDEL") as any,
            entiteit: entiteit as any,
            doelgroep: params.doelgroep ? (params.doelgroep as any) : null,
            spelerId: params.spelerId ?? null,
            teamId: params.teamId ?? null,
            auteurId,
          },
          select: { id: true, titel: true, status: true, prioriteit: true },
        });

        await logDaisyActie({
          sessieId,
          tool: "memoAanmaken",
          doPayload: { werkitemId: memo.id, beschrijving: params.beschrijving },
          undoPayload: { werkitemId: memo.id },
          namens: params.namens ?? gebruikerEmail,
          uitgevoerdIn: "kanban",
        });

        return {
          gedaan: true,
          werkitemId: memo.id,
          samenvatting: `Memo aangemaakt: "${(params.titel ?? params.beschrijving).slice(0, 60)}"`,
        };
      },
    },

    memoStatusZetten: {
      description:
        "Wijzigt de status of prioriteit van een bestaand memo. Gebruik dit om een memo op te lossen, te archiveren of te escaleren.",
      inputSchema: z.object({
        memoId: z.string().describe("ID van het memo (werkitem-ID)"),
        status: z
          .enum(["OPEN", "IN_BESPREKING", "OPGELOST", "GEACCEPTEERD_RISICO", "GEARCHIVEERD"])
          .optional()
          .describe("Nieuwe status"),
        prioriteit: z
          .enum(["BLOCKER", "HOOG", "MIDDEL", "LAAG", "INFO"])
          .optional()
          .describe("Nieuwe prioriteit"),
        resolutie: z
          .string()
          .optional()
          .describe("Toelichting bij oplossing (invullen bij OPGELOST of GEACCEPTEERD_RISICO)"),
      }),
      execute: async (params: {
        memoId: string;
        status?: string;
        prioriteit?: string;
        resolutie?: string;
      }) => {
        const memo = await prisma.werkitem.findUnique({
          where: { id: params.memoId },
          select: {
            id: true,
            titel: true,
            beschrijving: true,
            status: true,
            prioriteit: true,
          },
        });
        if (!memo) return { fout: `Memo ${params.memoId} niet gevonden` };

        const updateData: Record<string, unknown> = {};
        if (params.status) updateData.status = params.status;
        if (params.prioriteit) updateData.prioriteit = params.prioriteit;
        if (params.resolutie !== undefined) updateData.resolutie = params.resolutie;
        if (params.status === "OPGELOST" || params.status === "GEACCEPTEERD_RISICO") {
          updateData.opgelostOp = new Date();
        }

        if (Object.keys(updateData).length === 0) {
          return { fout: "Geen wijziging opgegeven (status of prioriteit vereist)" };
        }

        await prisma.werkitem.update({
          where: { id: params.memoId },
          data: updateData as any,
        });

        await logDaisyActie({
          sessieId,
          tool: "memoStatusZetten",
          doPayload: { memoId: params.memoId, ...updateData },
          undoPayload: {
            memoId: params.memoId,
            status: memo.status,
            prioriteit: memo.prioriteit,
          },
          namens: gebruikerEmail,
          uitgevoerdIn: "kanban",
        });

        const label = memo.titel ?? memo.beschrijving.slice(0, 50);
        return {
          gedaan: true,
          samenvatting: `Memo "${label}" bijgewerkt${params.status ? ` → ${params.status}` : ""}${params.prioriteit ? ` (${params.prioriteit})` : ""}`,
        };
      },
    },
  };
}

// ─── Undo-tools ─────────────────────────────────────────────────

function maakUndoTools(sessieId: string) {
  return {
    actieOngedaanMaken: {
      description:
        "Maakt de laatste Daisy-actie ongedaan (of een specifieke actie op basis van ID).",
      inputSchema: z.object({
        actieId: z
          .string()
          .optional()
          .describe("Optioneel: ID van een specifieke actie. Zonder ID: laatste actie."),
      }),
      execute: async ({ actieId }: { actieId?: string }) => {
        let actie;
        if (actieId) {
          actie = await getDaisyActie(actieId);
        } else {
          const acties = await getDaisyActies(sessieId, 1);
          actie = acties[0] ?? null;
        }

        if (!actie) return { fout: "Geen actie gevonden om ongedaan te maken" };
        if (actie.ongedaan) return { fout: "Deze actie is al ongedaan gemaakt" };

        const resultaat = await voerUndoUit(actie);
        await markeerOngedaan(actie.id);

        return {
          gedaan: true,
          samenvatting: `Actie "${actie.tool}" ongedaan gemaakt: ${resultaat}`,
        };
      },
    },

    sessieTerugdraaien: {
      description:
        "Draait alle Daisy-acties van de huidige chat-sessie terug in omgekeerde volgorde.",
      inputSchema: z.object({}),
      execute: async () => {
        const acties = await getDaisyActies(sessieId, 100);
        if (acties.length === 0)
          return { samenvatting: "Geen acties te herstellen in deze sessie" };

        const resultaten: string[] = [];
        for (const actie of acties) {
          const resultaat = await voerUndoUit(actie);
          await markeerOngedaan(actie.id);
          resultaten.push(`• ${actie.tool}: ${resultaat}`);
        }

        return {
          gedaan: true,
          aantalHersteld: acties.length,
          samenvatting: `${acties.length} acties teruggedraaid:\n${resultaten.join("\n")}`,
        };
      },
    },
  };
}

// ─── Export ─────────────────────────────────────────────────────

export function getTiStudioTools(sessieId: string, gebruikerEmail: string) {
  return {
    ...leesTools,
    ...maakSchrijfToolsSpelers(sessieId, gebruikerEmail),
    ...maakSchrijfToolsRest(sessieId, gebruikerEmail),
    ...maakMemoTools(sessieId, gebruikerEmail),
    ...maakUndoTools(sessieId),
  };
}

// Verwijder ongebruikte import-warnings
void HUIDIG_SEIZOEN;
