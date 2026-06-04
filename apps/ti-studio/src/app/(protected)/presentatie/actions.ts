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
        isNieuw: false, // fase 2: koppelen aan seizoenStart-grens als nodig
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

    // Bepaal welke teamIds in een gebundelde selectieGroep zitten (mogen NIET los worden getoond)
    const gebundeldTeamIds = new Set<string>();
    for (const sg of (versie as any).selectieGroepen ?? []) {
      if (sg.gebundeld) {
        for (const t of sg.teams ?? []) {
          gebundeldTeamIds.add(t.id);
        }
      }
    }

    const teams: PresentatieTeam[] = [];

    // 1. Losse teams (niet in een gebundelde selectie)
    for (const team of versie.teams as any[]) {
      if (gebundeldTeamIds.has(team.id)) continue;

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

      const alleSpelersVoorLeeftijd = [...dames, ...heren];
      const opmerkingen = bouwOpmerkingen(team.id);

      teams.push({
        id: team.id,
        naam: team.naam ?? "",
        kleur: KLEUR_MAP[team.kleur ?? ""] ?? null,
        teamCategorie: team.categorie ? String(team.categorie) : null,
        teamType: TEAM_TYPE_MAP[team.teamType ?? ""] ?? null,
        niveau: team.niveau ?? null,
        volgorde: team.volgorde ?? 0,
        isSelectie: Boolean(team.selectieGroepId),
        gebundeld: false,
        selectieNaam: null,
        dames,
        heren,
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
        gemiddeldeLeeftijd: berekenGemiddeldeLeeftijd(alleSpelersVoorLeeftijd, peildatum),
        validatieCount: 0, // fase 2: koppelen aan validatie-engine
        openMemoCount: telOpenMemos(team.id),
      });
    }

    // 2. Gebundelde selectiegroepen → één kaart per groep
    for (const sg of (versie as any).selectieGroepen ?? []) {
      if (!sg.gebundeld) continue;

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

      // Gebruik de eerste team in de groep als representatief (kleur, categorie, niveau)
      const groepTeams: any[] = (sg.teams as any[]) ?? [];
      const eersteTeam = groepTeams[0];
      const minVolgorde = groepTeams.reduce(
        (min: number, t: any) => Math.min(min, t.volgorde ?? 999),
        999
      );

      const alleSpelersVoorLeeftijd = [...dames, ...heren];

      // Memo's van alle teams in de groep samenvoegen
      const opmerkingen: PresentatieOpmerking[] = groepTeams.flatMap((t: any) =>
        bouwOpmerkingen(t.id)
      );
      const openMemoCount = groepTeams.reduce((sum: number, t: any) => sum + telOpenMemos(t.id), 0);

      teams.push({
        id: sg.id,
        naam: sg.naam ?? groepTeams.map((t: any) => t.naam).join(" / "),
        kleur: KLEUR_MAP[eersteTeam?.kleur ?? ""] ?? null,
        teamCategorie: eersteTeam?.categorie ? String(eersteTeam.categorie) : null,
        teamType: TEAM_TYPE_MAP[eersteTeam?.teamType ?? ""] ?? null,
        niveau: eersteTeam?.niveau ?? null,
        volgorde: minVolgorde,
        isSelectie: true,
        gebundeld: true,
        selectieNaam: sg.naam ?? null,
        dames,
        heren,
        staf,
        opmerkingen,
        aantalDames: dames.length,
        aantalHeren: heren.length,
        gemiddeldeLeeftijd: berekenGemiddeldeLeeftijd(alleSpelersVoorLeeftijd, peildatum),
        validatieCount: 0, // fase 2: koppelen aan validatie-engine
        openMemoCount,
      });
    }

    // Sorteer op volgorde
    teams.sort((a, b) => a.volgorde - b.volgorde);

    return {
      ok: true,
      data: {
        teams,
        peildatum: peildatum.toISOString(),
      },
    };
  } catch (error) {
    logger.error("getTeamsVoorPresentatie mislukt:", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
