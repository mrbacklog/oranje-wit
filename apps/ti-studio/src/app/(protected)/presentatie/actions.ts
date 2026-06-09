"use server";

import { requireTC } from "@oranje-wit/auth/checks";
import { logger } from "@oranje-wit/types";
import { korfbalPeildatum, berekenKorfbalLeeftijd, type Seizoen } from "@oranje-wit/types";
import type { ActionResult } from "@oranje-wit/types";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { effectieveSpelerStatus } from "@/lib/teamindeling/speler-status";
import { getOfMaakWerkindelingVoorSeizoen } from "../indeling/actions";
import {
  getWerkindelingVoorEditor,
  getKadersStatusOverrides,
} from "../indeling/werkindeling-actions";
import type {
  PresentatieTeam,
  PresentatieSpeler,
  PresentatieStaf,
  PresentatieLidTeam,
  PresentatieOpmerking,
  PresentatiePayload,
  SpelerStatus,
} from "./presentatie-types";

// Prisma Kleur enum (UPPERCASE) → lowercase token (gelijk aan indeling/page.tsx)
const KLEUR_MAP: Record<string, string> = {
  PAARS: "blauw",
  BLAUW: "blauw",
  GROEN: "groen",
  GEEL: "geel",
  ORANJE: "oranje",
  ROOD: "rood",
};

// Prisma TeamType enum → lowercase token
const TEAM_TYPE_MAP: Record<string, string> = {
  VIERTAL: "viertal",
  ACHTTAL: "achttal",
};

const TOEGESTANE_STATUSSEN = new Set<SpelerStatus>([
  "BESCHIKBAAR",
  "TWIJFELT",
  "GEBLESSEERD",
  "GAAT_STOPPEN",
  "GESTOPT",
  "NIEUW_POTENTIEEL",
  "NIEUW_DEFINITIEF",
  "ALGEMEEN_RESERVE",
  "RECREANT",
  "NIET_SPELEND",
]);

function mapStatus(s: string | null | undefined): SpelerStatus {
  if (s && TOEGESTANE_STATUSSEN.has(s as SpelerStatus)) return s as SpelerStatus;
  return "BESCHIKBAAR";
}

function berekenGemiddeldeLeeftijd(
  spelers: { geboortedatum: string | null; geboortejaar: number }[],
  peildatum: Date
): number | null {
  if (spelers.length === 0) return null;
  const som = spelers.reduce(
    (acc, sp) => acc + berekenKorfbalLeeftijd(sp.geboortedatum, sp.geboortejaar, peildatum),
    0
  );
  return Math.round((som / spelers.length) * 10) / 10;
}

export async function getTeamsVoorPresentatie(): Promise<ActionResult<PresentatiePayload>> {
  try {
    await requireTC();

    const werkindeling = await getOfMaakWerkindelingVoorSeizoen();
    if (!werkindeling)
      return { ok: true, data: { teams: [], peildatum: new Date().toISOString() } };

    const volledig = await getWerkindelingVoorEditor(werkindeling.id);
    if (!volledig) return { ok: true, data: { teams: [], peildatum: new Date().toISOString() } };

    const kadersId = volledig.kaders.id;
    const seizoen = volledig.kaders.seizoen as Seizoen;
    const peildatum = korfbalPeildatum(seizoen);
    const versie = volledig.versies[0];

    if (!versie) return { ok: true, data: { teams: [], peildatum: peildatum.toISOString() } };

    // Status overrides ophalen
    const statusOverrides = await getKadersStatusOverrides(kadersId);

    // Verzamel alle relCodes over alle teams en selectiegroepen voor batch-queries
    const alleRelCodes = new Set<string>();
    for (const team of versie.teams) {
      for (const ts of team.spelers as any[]) {
        alleRelCodes.add(ts.spelerId);
      }
    }
    for (const sg of (versie as any).selectieGroepen ?? []) {
      for (const ss of sg.spelers ?? []) {
        alleRelCodes.add(ss.spelerId);
      }
    }
    const relCodeArray = Array.from(alleRelCodes);

    // Batch: tussenvoegsels + foto's in één ronde
    const [leden, fotos] = await Promise.all([
      prisma.lid.findMany({
        where: { relCode: { in: relCodeArray } },
        select: { relCode: true, tussenvoegsel: true },
      }),
      prisma.lidFoto.findMany({
        where: { relCode: { in: relCodeArray } },
        select: { relCode: true },
      }),
    ]);

    const tussenvoegelMap = new Map<string, string | null>(
      leden.map((l: { relCode: string; tussenvoegsel: string | null }) => [
        l.relCode,
        l.tussenvoegsel,
      ])
    );
    const heeftFotoSet = new Set<string>(fotos.map((f: { relCode: string }) => f.relCode));

    // Memo's per team ophalen (getWerkindelingVoorEditor zet werkitems: [] hardcoded)
    const teamMemos = await prisma.werkitem.findMany({
      where: { kadersId, type: "MEMO", teamId: { not: null } },
      select: {
        teamId: true,
        titel: true,
        beschrijving: true,
        status: true,
        type: true,
        createdAt: true,
      },
    });

    // Groepeer memo's per teamId
    const memoPerTeam = new Map<
      string,
      {
        titel: string | null;
        beschrijving: string | null;
        status: string;
        type: string;
        createdAt: Date;
      }[]
    >();
    for (const memo of teamMemos as any[]) {
      if (!memo.teamId) continue;
      const arr = memoPerTeam.get(memo.teamId) ?? [];
      arr.push(memo);
      memoPerTeam.set(memo.teamId, arr);
    }

    // Helper: bouw PresentatieSpeler vanuit een speler-record
    function bouwSpeler(
      spelerId: string,
      spelerRecord: any,
      statusOverride?: string | null
    ): PresentatieSpeler {
      const effectief = effectieveSpelerStatus(
        spelerRecord?.status,
        statusOverride ?? statusOverrides[spelerId]
      );
      const geboortedatum = spelerRecord?.geboortedatum
        ? (spelerRecord.geboortedatum as Date).toISOString().split("T")[0]
        : null;
      return {
        relCode: spelerId,
        roepnaam: spelerRecord?.roepnaam ?? "?",
        achternaam: spelerRecord?.achternaam ?? "",
        tussenvoegsel: tussenvoegelMap.get(spelerId) ?? null,
        geslacht: spelerRecord?.geslacht === "V" ? "V" : "M",
        geboortedatum,
        geboortejaar: spelerRecord?.geboortejaar ?? peildatum.getFullYear() - 15,
        fotoUrl: heeftFotoSet.has(spelerId) ? `/api/scouting/spelers/${spelerId}/foto` : null,
        status: mapStatus(effectief),
        isNieuw: false,
        huidigTeam: (spelerRecord?.huidig as { team?: string } | null)?.team ?? null,
      };
    }

    // Helper: bouw opmerkingen voor een teamId
    function bouwOpmerkingen(teamId: string): PresentatieOpmerking[] {
      return (memoPerTeam.get(teamId) ?? []).map((m) => ({
        bron: "MEMO",
        type: m.type,
        status: String(m.status),
        datum: (m.createdAt as Date).toISOString(),
        tekst: [m.titel, m.beschrijving].filter(Boolean).join(" — "),
      }));
    }

    function telOpenMemos(teamId: string): number {
      return (memoPerTeam.get(teamId) ?? []).filter(
        (m) => m.status === "OPEN" || m.status === "IN_BESPREKING"
      ).length;
    }

    // Bouw een map van teamId → selectieGroepId voor alle teams in versie.
    // Zo kunnen we snel bepalen of een team bij een selectiegroep hoort,
    // ook als sg.teams niet in de query-resultaten zit.
    const teamNaarSelectieGroep = new Map<string, string>();
    for (const team of versie.teams as any[]) {
      if (team.selectieGroepId) {
        teamNaarSelectieGroep.set(team.id, team.selectieGroepId);
      }
    }

    // Alle teamIds die bij ENIGE selectiegroep horen (gebundeld én ongecombineerd).
    // Deze mogen nooit als losse team-kaart verschijnen.
    const selectieTeamIds = new Set<string>(teamNaarSelectieGroep.keys());

    // Bouw lookup: selectieGroepId → array van teamrecords (voor ongecombineerde selecties)
    const teamsPerSelectieGroep = new Map<string, any[]>();
    for (const team of versie.teams as any[]) {
      const sgId = team.selectieGroepId;
      if (!sgId) continue;
      const arr = teamsPerSelectieGroep.get(sgId) ?? [];
      arr.push(team);
      teamsPerSelectieGroep.set(sgId, arr);
    }

    const kaarten: PresentatieTeam[] = [];

    // 1. Losse teams (geen selectieGroepId)
    for (const team of versie.teams as any[]) {
      if (selectieTeamIds.has(team.id)) continue;

      const dames: PresentatieSpeler[] = [];
      const heren: PresentatieSpeler[] = [];

      for (const ts of team.spelers as any[]) {
        const speler = bouwSpeler(ts.spelerId, ts.speler, ts.statusOverride);
        if (ts.speler?.geslacht === "V") {
          dames.push(speler);
        } else {
          heren.push(speler);
        }
      }

      const opmerkingen = bouwOpmerkingen(team.id);

      kaarten.push({
        id: team.id,
        naam: team.naam ?? "",
        kleur: KLEUR_MAP[team.kleur ?? ""] ?? null,
        teamCategorie: team.categorie ? String(team.categorie) : null,
        teamType: TEAM_TYPE_MAP[team.teamType ?? ""] ?? null,
        niveau: team.niveau ?? null,
        volgorde: team.volgorde ?? 0,
        soort: "team",
        gebundeld: false,
        dames,
        heren,
        leden: [],
        staf: (team.staf as any[]).map(
          (ts: any): PresentatieStaf => ({
            stafId: ts.stafId,
            naam: ts.staf?.naam ?? "?",
            rol: ts.rol ?? "",
          })
        ),
        opmerkingen,
        aantalDames: dames.length,
        aantalHeren: heren.length,
        gemiddeldeLeeftijd: berekenGemiddeldeLeeftijd([...dames, ...heren], peildatum),
        validatieCount: 0,
        openMemoCount: telOpenMemos(team.id),
      });
    }

    // 2. Eén kaart per selectiegroep
    for (const sg of (versie as any).selectieGroepen ?? []) {
      const groepTeams: any[] = teamsPerSelectieGroep.get(sg.id) ?? [];

      // Representatief eerste team (kleur, categorie, niveau)
      const eersteTeam = groepTeams[0];
      const minVolgorde = groepTeams.reduce(
        (min: number, t: any) => Math.min(min, t.volgorde ?? 999),
        999
      );

      const groepNaam =
        (typeof sg.naam === "string" && sg.naam.trim()) ||
        groepTeams.map((t: any) => t.naam).join(" / ") ||
        "Selectie";

      // Memo's en openMemoCount van alle lidteams samenvoegen
      const opmerkingen: PresentatieOpmerking[] = groepTeams.flatMap((t: any) =>
        bouwOpmerkingen(t.id)
      );
      const openMemoCount = groepTeams.reduce((sum: number, t: any) => sum + telOpenMemos(t.id), 0);

      if (sg.gebundeld) {
        // Gebundelde pool: spelers/staf op selectiegroep-niveau
        const dames: PresentatieSpeler[] = [];
        const heren: PresentatieSpeler[] = [];

        for (const ss of (sg.spelers as any[]) ?? []) {
          const speler = bouwSpeler(ss.spelerId, ss.speler, ss.statusOverride);
          if (ss.speler?.geslacht === "V") {
            dames.push(speler);
          } else {
            heren.push(speler);
          }
        }

        // Staf dedupliceren op stafId
        const stafGezien = new Set<string>();
        const staf: PresentatieStaf[] = [];
        for (const ss of (sg.staf as any[]) ?? []) {
          if (stafGezien.has(ss.stafId)) continue;
          stafGezien.add(ss.stafId);
          staf.push({
            stafId: ss.stafId,
            naam: ss.staf?.naam ?? "?",
            rol: ss.rol ?? "",
          });
        }

        kaarten.push({
          id: sg.id,
          naam: groepNaam,
          kleur: KLEUR_MAP[eersteTeam?.kleur ?? ""] ?? null,
          teamCategorie: eersteTeam?.categorie ? String(eersteTeam.categorie) : null,
          teamType: TEAM_TYPE_MAP[eersteTeam?.teamType ?? ""] ?? null,
          niveau: eersteTeam?.niveau ?? null,
          volgorde: minVolgorde,
          soort: "selectie",
          gebundeld: true,
          dames,
          heren,
          leden: [],
          staf,
          opmerkingen,
          aantalDames: dames.length,
          aantalHeren: heren.length,
          gemiddeldeLeeftijd: berekenGemiddeldeLeeftijd([...dames, ...heren], peildatum),
          validatieCount: 0,
          openMemoCount,
        });
      } else {
        // Ongecombineerd: spelers/staf per lidteam, geaggregeerd op topniveau
        const ledenKaarten: PresentatieLidTeam[] = [];
        const alleDames: PresentatieSpeler[] = [];
        const alleHeren: PresentatieSpeler[] = [];

        // Staf: dedupliceerde unie van alle lidteam-staf
        const stafGezien = new Set<string>();
        const staf: PresentatieStaf[] = [];

        for (const team of groepTeams) {
          const teamDames: PresentatieSpeler[] = [];
          const teamHeren: PresentatieSpeler[] = [];

          for (const ts of (team.spelers as any[]) ?? []) {
            const speler = bouwSpeler(ts.spelerId, ts.speler, ts.statusOverride);
            if (ts.speler?.geslacht === "V") {
              teamDames.push(speler);
            } else {
              teamHeren.push(speler);
            }
          }

          alleDames.push(...teamDames);
          alleHeren.push(...teamHeren);

          ledenKaarten.push({
            teamId: team.id,
            naam: team.naam ?? "",
            kleur: KLEUR_MAP[team.kleur ?? ""] ?? null,
            dames: teamDames,
            heren: teamHeren,
          });

          for (const ts of (team.staf as any[]) ?? []) {
            if (stafGezien.has(ts.stafId)) continue;
            stafGezien.add(ts.stafId);
            staf.push({
              stafId: ts.stafId,
              naam: ts.staf?.naam ?? "?",
              rol: ts.rol ?? "",
            });
          }
        }

        kaarten.push({
          id: sg.id,
          naam: groepNaam,
          kleur: KLEUR_MAP[eersteTeam?.kleur ?? ""] ?? null,
          teamCategorie: eersteTeam?.categorie ? String(eersteTeam.categorie) : null,
          teamType: TEAM_TYPE_MAP[eersteTeam?.teamType ?? ""] ?? null,
          niveau: eersteTeam?.niveau ?? null,
          volgorde: minVolgorde,
          soort: "selectie",
          gebundeld: false,
          dames: alleDames,
          heren: alleHeren,
          leden: ledenKaarten,
          staf,
          opmerkingen,
          aantalDames: alleDames.length,
          aantalHeren: alleHeren.length,
          gemiddeldeLeeftijd: berekenGemiddeldeLeeftijd([...alleDames, ...alleHeren], peildatum),
          validatieCount: 0,
          openMemoCount,
        });
      }
    }

    // Sorteer op volgorde
    kaarten.sort((a, b) => a.volgorde - b.volgorde);

    return {
      ok: true,
      data: {
        teams: kaarten,
        peildatum: peildatum.toISOString(),
      },
    };
  } catch (error) {
    logger.error("getTeamsVoorPresentatie mislukt:", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
