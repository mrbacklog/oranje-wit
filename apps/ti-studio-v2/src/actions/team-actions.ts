"use server";

import { prisma as _prisma } from "@oranje-wit/database";
import { requireTC } from "@oranje-wit/auth/checks";
import {
  korfbalPeildatum,
  seizoenStart,
  berekenKorfbalLeeftijdExact,
  logger,
} from "@oranje-wit/types";
import type { ActionResult, Seizoen } from "@oranje-wit/types";
import type {
  TeamKaartData,
  TeamKaartSpeler,
  TeamKaartStaf,
  TeamReservering,
} from "@/app/(app)/(studio)/indeling/_components/werkbord-types";
import type { SpelerWerkitemDetail } from "@/components/personen/types";
import { getSpelersMetFoto } from "@/lib/queries/spelers-foto";

// Workaround voor TS2321 Prisma v7 type-recursie
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = _prisma as any;

function nieuwGrensVoorSeizoen(seizoen: string): Date {
  const start = seizoenStart(seizoen as Seizoen);
  return new Date(start.getFullYear() - 1, 6, 1);
}

function bepaalIsNieuw(lidSinds: string | null, grens: Date): boolean {
  if (!lidSinds) return false;
  const d = new Date(lidSinds);
  return !isNaN(d.getTime()) && d >= grens;
}

export async function getTeamDialogData(teamId: string): Promise<ActionResult<TeamKaartData>> {
  await requireTC();

  try {
    const kaders = await db.kaders.findFirst({
      where: { isWerkseizoen: true },
      select: { id: true, seizoen: true },
    });
    if (!kaders) {
      return { ok: false, error: "Geen actief werkseizoen gevonden" };
    }
    const seizoen = kaders.seizoen as string;
    const peildatum = korfbalPeildatum(seizoen as `${number}-${number}`);
    const nieuwGrens = nieuwGrensVoorSeizoen(seizoen);

    const team = await db.team.findUnique({
      where: { id: teamId },
      include: {
        spelers: {
          include: {
            speler: {
              select: {
                id: true,
                roepnaam: true,
                achternaam: true,
                // tussenvoegsel niet in Speler-schema
                geslacht: true,
                geboortejaar: true,
                geboortedatum: true,
                status: true,
                lidSinds: true,
                kadersStatussen: {
                  where: { kadersId: kaders.id },
                  select: { gezienStatus: true },
                  take: 1,
                },
              },
            },
          },
        },
        staf: {
          include: {
            staf: {
              select: { id: true, naam: true, rollen: true },
            },
          },
        },
        werkitems: {
          orderBy: [{ status: "asc" }, { createdAt: "desc" }],
          take: 50,
          include: {
            auteur: { select: { naam: true, email: true } },
          },
        },
        reserveringen: { select: { id: true, titel: true, geslacht: true } },
      },
    });

    if (!team) {
      return { ok: false, error: "Team niet gevonden" };
    }

    // ── Spelers mappen ────────────────────────────────────────────────────────

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spelersRaw: TeamKaartSpeler[] = team.spelers.map((ts: any) => {
      const s = ts.speler;
      const leeftijd = berekenKorfbalLeeftijdExact(
        (s.geboortedatum as Date | null) ?? null,
        s.geboortejaar as number,
        peildatum
      );
      const lidSindsStr = s.lidSinds as string | null;
      return {
        spelerId: s.id as string,
        roepnaam: s.roepnaam as string,
        achternaam: s.achternaam as string,
        tussenvoegsel: null, // niet in Speler-schema
        korfbalLeeftijd: leeftijd,
        geslacht: s.geslacht as "M" | "V",
        status: s.status as string,
        isNieuw: bepaalIsNieuw(lidSindsStr, nieuwGrens),
        hasFoto: false, // wordt hieronder ingevuld
        memoStatus: null, // niet geladen op team-speler niveau — team-niveau werkitems zijn de focus
      };
    });

    // Foto-injectie
    const spelersIds = spelersRaw.map((s) => s.spelerId);
    const metFoto = await getSpelersMetFoto(spelersIds);
    const spelersMetFoto = spelersRaw.map((s) => ({ ...s, hasFoto: metFoto.has(s.spelerId) }));

    // ── Staf mappen ───────────────────────────────────────────────────────────

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stafRaw: TeamKaartStaf[] = team.staf.map((ts: any) => ({
      stafId: ts.staf.id as string,
      naam: ts.staf.naam as string,
      rollen: ts.staf.rollen as string[],
    }));

    // ── Werkitems mappen ──────────────────────────────────────────────────────

    const werkitemsArr = team.werkitems as Array<{
      id: string;
      titel: string | null;
      beschrijving: string;
      status: string;
      prioriteit: string;
      type: string;
      createdAt: Date;
      auteur: { naam: string; email: string };
    }>;

    const openMemoCount = werkitemsArr.filter(
      (w) => w.type === "MEMO" && (w.status === "OPEN" || w.status === "IN_BESPREKING")
    ).length;

    const werkitemsDetail: SpelerWerkitemDetail[] = werkitemsArr.map((w) => ({
      id: w.id,
      titel: w.titel ?? "",
      beschrijving: w.beschrijving ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      status: w.status as any,
      prioriteit: w.prioriteit,
      type: w.type,
      auteurNaam: w.auteur?.naam ?? w.auteur?.email ?? null,
      createdAt: w.createdAt,
    }));

    // ── Validatiemeldingen ────────────────────────────────────────────────────

    const validatieMeldingenRaw = team.validatieMeldingen;
    let validatieMeldingen: string[] | null = null;
    if (Array.isArray(validatieMeldingenRaw)) {
      validatieMeldingen = validatieMeldingenRaw as string[];
    }

    // ── Gemiddelde korfballeeftijd ────────────────────────────────────────────

    const alleLeeftijden = spelersRaw.map((s) => s.korfbalLeeftijd);
    const gemKorfbalLeeftijd =
      alleLeeftijden.length > 0
        ? Math.round((alleLeeftijden.reduce((a, b) => a + b, 0) / alleLeeftijden.length) * 10) / 10
        : 0;

    // ── USS-score: som van ussOverall per speler voor dit seizoen ─────────────
    // SpelerUSS bestaat in het schema (gecachte USS per speler per seizoen).

    let ussScore: number | null = null;
    try {
      const ussRows = await db.spelerUSS.findMany({
        where: {
          spelerId: { in: spelersIds },
          seizoen,
        },
        select: { ussOverall: true },
      });
      const ussArr = ussRows as Array<{ ussOverall: number | null }>;
      const metScore = ussArr.filter((r) => r.ussOverall !== null);
      if (metScore.length > 0) {
        ussScore = metScore.reduce((sum, r) => sum + (r.ussOverall ?? 0), 0);
      }
    } catch (ussErr) {
      logger.warn("getTeamDialogData: USS-query mislukt, ussScore=null:", ussErr);
      ussScore = null;
    }

    // ── Samenstellen ─────────────────────────────────────────────────────────

    const reserveringen: TeamReservering[] = (
      team.reserveringen as Array<{ id: string; titel: string; geslacht: string }>
    ).map((r) => ({
      id: r.id,
      titel: r.titel,
      geslacht: r.geslacht as "M" | "V",
    }));

    const result: TeamKaartData = {
      id: team.id as string,
      naam: team.naam as string,
      alias: (team.alias as string | null) ?? null,
      categorie: team.categorie as string,
      kleur: (team.kleur as string | null) ?? null,
      teamType: (team.teamType as string | null) ?? null,
      niveau: (team.niveau as string | null) ?? null,
      validatieStatus: (team.validatieStatus as string) ?? "ONBEKEND",
      validatieMeldingen,
      spelersDames: spelersMetFoto.filter((s) => s.geslacht === "V"),
      spelersHeren: spelersMetFoto.filter((s) => s.geslacht === "M"),
      staf: stafRaw,
      reserveringen,
      openMemoCount,
      werkitemsDetail,
      gemKorfbalLeeftijd,
      ussScore,
    };

    logger.info("getTeamDialogData: laadde team " + teamId);
    return { ok: true, data: result };
  } catch (err) {
    logger.warn("getTeamDialogData: fout bij laden team " + teamId + ":", err);
    return { ok: false, error: "Kon teamdata niet laden" };
  }
}
