"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma as _prisma, SpelerStatus, GezienStatus } from "@oranje-wit/database";
import { requireTC } from "@oranje-wit/auth/checks";
import {
  korfbalPeildatum,
  seizoenStart,
  berekenKorfbalLeeftijdExact,
  grofKorfbalLeeftijd,
  formatKorfbalLeeftijd,
  logger,
} from "@oranje-wit/types";
import type { ActionResult, Seizoen } from "@oranje-wit/types";
import type { SpelerRijData, LeeftijdCategorie, MemoBadge } from "@/components/personen/types";

// Workaround voor TS2321 Prisma v7 type-recursie
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = _prisma as any;

function genId(): string {
  return randomBytes(12).toString("hex");
}

// ── Status updaten ─────────────────────────────────────────────────────

const updateSpelerStatusSchema = z.object({
  spelerId: z.string().min(1),
  status: z.nativeEnum(SpelerStatus),
});

export async function updateSpelerStatus(
  formData: z.infer<typeof updateSpelerStatusSchema>
): Promise<ActionResult<{ spelerId: string; status: SpelerStatus }>> {
  await requireTC();

  const parsed = updateSpelerStatusSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: "Ongeldige invoer" };
  }

  try {
    await db.speler.update({
      where: { id: parsed.data.spelerId },
      data: { status: parsed.data.status },
    });
    revalidatePath("/personen/spelers");
    revalidatePath("/indeling");
    return { ok: true, data: { spelerId: parsed.data.spelerId, status: parsed.data.status } };
  } catch (error) {
    logger.warn("updateSpelerStatus mislukt:", error);
    return { ok: false, error: "Status bijwerken mislukt" };
  }
}

// ── Gezien-status updaten ──────────────────────────────────────────────

const updateGezienStatusSchema = z.object({
  kadersId: z.string().min(1),
  spelerId: z.string().min(1),
  gezienStatus: z.nativeEnum(GezienStatus),
});

export async function updateGezienStatus(
  formData: z.infer<typeof updateGezienStatusSchema>
): Promise<ActionResult<{ kadersSpelerId: string; gezienStatus: GezienStatus }>> {
  await requireTC();

  const parsed = updateGezienStatusSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: "Ongeldige invoer" };
  }

  try {
    const record = await db.kadersSpeler.upsert({
      where: {
        kadersId_spelerId: {
          kadersId: parsed.data.kadersId,
          spelerId: parsed.data.spelerId,
        },
      },
      update: { gezienStatus: parsed.data.gezienStatus },
      create: {
        kadersId: parsed.data.kadersId,
        spelerId: parsed.data.spelerId,
        gezienStatus: parsed.data.gezienStatus,
      },
      select: { id: true },
    });
    revalidatePath("/personen/spelers");
    return {
      ok: true,
      data: { kadersSpelerId: record.id, gezienStatus: parsed.data.gezienStatus },
    };
  } catch (error) {
    logger.warn("updateGezienStatus mislukt:", error);
    return { ok: false, error: "Gezien-status bijwerken mislukt" };
  }
}

// ── Indeling bijwerken ─────────────────────────────────────────────────

const updateIndelingSchema = z.object({
  spelerId: z.string().min(1),
  versieId: z.string().min(1),
  teamId: z.string().nullable(),
});

export async function updateSpelerIndeling(
  formData: z.infer<typeof updateIndelingSchema>
): Promise<ActionResult<{ spelerId: string; teamId: string | null }>> {
  await requireTC();

  const parsed = updateIndelingSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: "Ongeldige invoer" };
  }

  const { spelerId, versieId, teamId } = parsed.data;

  try {
    const teams = await db.team.findMany({
      where: { versieId },
      select: { id: true },
    });
    await db.teamSpeler.deleteMany({
      where: {
        spelerId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        teamId: { in: teams.map((t: any) => t.id) },
      },
    });
    if (teamId !== null) {
      await db.teamSpeler.upsert({
        where: { teamId_spelerId: { teamId, spelerId } },
        update: {},
        create: { teamId, spelerId },
      });
    }
    revalidatePath("/personen/spelers");
    revalidatePath("/indeling");
    return { ok: true, data: { spelerId, teamId } };
  } catch (error) {
    logger.warn("updateSpelerIndeling mislukt:", error);
    return { ok: false, error: "Indeling bijwerken mislukt" };
  }
}

// ── Nieuwe speler aanmaken ─────────────────────────────────────────────

const nieuweSpelerSchema = z.object({
  roepnaam: z.string().min(1).max(100),
  achternaam: z.string().min(1).max(100),
  geslacht: z.enum(["M", "V"]),
  geboortedatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.nativeEnum(SpelerStatus).default("NIEUW_POTENTIEEL"),
});

export async function maakNieuweSpeler(
  formData: z.infer<typeof nieuweSpelerSchema>
): Promise<ActionResult<{ spelerId: string }>> {
  await requireTC();

  const parsed = nieuweSpelerSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: "Ongeldige invoer" };
  }

  const { roepnaam, achternaam, geslacht, geboortedatum, status } = parsed.data;
  const gebDatum = new Date(geboortedatum);
  const geboortejaar = gebDatum.getFullYear();
  const spelerId = `OW-${genId()}`;

  try {
    await db.speler.create({
      data: {
        id: spelerId,
        roepnaam,
        achternaam,
        geslacht: geslacht as "M" | "V",
        geboortedatum: gebDatum,
        geboortejaar,
        status,
      },
    });
    revalidatePath("/personen/spelers");
    return { ok: true, data: { spelerId } };
  } catch (error) {
    logger.warn("maakNieuweSpeler mislukt:", error);
    return { ok: false, error: "Speler aanmaken mislukt" };
  }
}

// ── Dialog-data laden ──────────────────────────────────────────────────
// Geeft één geconsolideerde SpelerRijData voor de SpelerDialog. Wordt
// aangeroepen vanuit useSpelerDialog().open(id) zodat elke pagina/component
// in v2 de dialoog kan openen op basis van alleen rel_code.

function catFromGrof(grof: number): LeeftijdCategorie {
  if (grof <= 5) return "kangoeroe";
  if (grof <= 7) return "blauw";
  if (grof <= 9) return "groen";
  if (grof <= 12) return "geel";
  if (grof <= 15) return "oranje";
  if (grof <= 18) return "rood";
  return "senior";
}

function memoBadgeFromStatus(status: string | null): MemoBadge {
  if (!status) return "geen";
  const map: Record<string, MemoBadge> = {
    OPEN: "open",
    IN_BESPREKING: "bespreking",
    RISICO: "risico",
    OPGELOST: "opgelost",
  };
  return map[status] ?? "geen";
}

export async function getSpelerDialogData(spelerId: string): Promise<ActionResult<SpelerRijData>> {
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
    const peildatum = korfbalPeildatum(seizoen as Seizoen);
    const start = seizoenStart(seizoen as Seizoen);
    const nieuwGrens = new Date(start.getFullYear() - 1, 6, 1);

    const speler = await db.speler.findUnique({
      where: { id: spelerId },
      select: {
        id: true,
        roepnaam: true,
        achternaam: true,
        geslacht: true,
        geboortejaar: true,
        geboortedatum: true,
        status: true,
        lidSinds: true,
        heeftFoto: true,
        huidig: true,
        werkitems: {
          where: { type: "MEMO", status: { in: ["OPEN", "IN_BESPREKING"] } },
          select: { status: true },
          orderBy: { createdAt: "desc" },
        },
        teams: {
          where: { team: { versie: { werkindeling: { kadersId: kaders.id } } } },
          select: {
            team: {
              select: { id: true, naam: true, alias: true, versieId: true },
            },
          },
          take: 1,
        },
        kaders: {
          where: { kadersId: kaders.id },
          select: { id: true, gezienStatus: true },
          take: 1,
        },
      },
    });

    if (!speler) {
      return { ok: false, error: "Speler niet gevonden" };
    }

    const leeftijd = berekenKorfbalLeeftijdExact(
      (speler.geboortedatum as Date | null) ?? null,
      speler.geboortejaar as number,
      peildatum
    );
    const grof = grofKorfbalLeeftijd(speler.geboortejaar as number, peildatum);
    const huidigJson = speler.huidig as Record<string, unknown> | null;
    const teamRel = (
      speler.teams as Array<{ team: { id: string; naam: string; alias: string | null } }>
    )[0];
    const kadersSpeler = (speler.kaders as Array<{ id: string; gezienStatus: string | null }>)[0];
    const werkitemsArr = speler.werkitems as Array<{ status: string }>;
    const memoStatus = werkitemsArr[0]?.status ?? null;
    const lidSindsStr = speler.lidSinds as string | null;
    const lidSindsDate = lidSindsStr ? new Date(lidSindsStr) : null;

    const data: SpelerRijData = {
      id: speler.id as string,
      roepnaam: speler.roepnaam as string,
      tussenvoegsel: null,
      achternaam: speler.achternaam as string,
      geslacht: speler.geslacht as "M" | "V",
      geboortedatum: (speler.geboortedatum as Date | null) ?? null,
      geboortejaar: speler.geboortejaar as number,
      status: speler.status as string,
      gezienStatus: (kadersSpeler?.gezienStatus as string) ?? "ONGEZIEN",
      huidigTeam: huidigJson?.team ? String(huidigJson.team) : null,
      indelingTeamNaam: teamRel ? (teamRel.team.alias ?? teamRel.team.naam) : null,
      indelingTeamId: teamRel?.team.id ?? null,
      heeftOpenMemo: werkitemsArr.length > 0,
      memoBadge: memoBadgeFromStatus(memoStatus),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      memoStatus: (memoStatus as any) ?? null,
      leeftijdscategorie: catFromGrof(grof),
      leeftijd,
      korfbalLeeftijd: formatKorfbalLeeftijd(leeftijd),
      isNieuw: lidSindsDate ? !isNaN(lidSindsDate.getTime()) && lidSindsDate >= nieuwGrens : false,
      hasFoto: Boolean(speler.heeftFoto),
      kadersSpelerId: kadersSpeler?.id ?? null,
      kadersId: kaders.id as string,
    };

    return { ok: true, data };
  } catch (error) {
    logger.warn("getSpelerDialogData mislukt:", error);
    return { ok: false, error: "Speler-data laden mislukt" };
  }
}
