"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma as _prisma } from "@oranje-wit/database";
import { requireTC } from "@oranje-wit/auth/checks";
import { logger } from "@oranje-wit/types";
import type { ActionResult } from "@oranje-wit/types";
import type {
  StafRijData,
  SpelerWerkitemDetail,
  MemoBadge,
  StafSeizoenHistorie,
} from "@/components/personen/types";
import { getSpelersMetFoto } from "@/lib/queries/spelers-foto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = _prisma as any;

const nieuweStafSchema = z.object({
  naam: z.string().min(1).max(200),
  rollen: z.array(z.string()).default([]),
  email: z.string().email().optional(),
  geboortejaar: z.number().int().min(1940).max(2010).optional(),
});

export async function maakNieuweStaf(
  formData: z.infer<typeof nieuweStafSchema>
): Promise<ActionResult<{ stafId: string }>> {
  await requireTC();

  const parsed = nieuweStafSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, error: "Ongeldige invoer" };
  }

  try {
    const count = await db.staf.count();
    const stafId = `STAF-${String(count + 1).padStart(3, "0")}`;

    await db.staf.create({
      data: {
        id: stafId,
        naam: parsed.data.naam,
        rollen: parsed.data.rollen,
        email: parsed.data.email ?? null,
        geboortejaar: parsed.data.geboortejaar ?? null,
      },
    });
    revalidatePath("/personen/staf");
    return { ok: true, data: { stafId } };
  } catch (error) {
    logger.warn("maakNieuweStaf mislukt:", error);
    return { ok: false, error: "Staf aanmaken mislukt" };
  }
}

// ── Dialog-data laden ──────────────────────────────────────────────────
// Geeft één geconsolideerde StafRijData voor de StafDialog. Wordt
// aangeroepen vanuit useStafDialog().open(id) zodat elke pagina/component
// in v2 de dialoog kan openen op basis van alleen stafId.

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

export async function getStafDialogData(stafId: string): Promise<ActionResult<StafRijData>> {
  await requireTC();

  try {
    // Werkseizoen nodig voor teamKoppelingen filter
    const kaders = await db.kaders.findFirst({
      where: { isWerkseizoen: true },
      select: { id: true, seizoen: true },
    });
    if (!kaders) {
      return { ok: false, error: "Geen actief werkseizoen gevonden" };
    }

    const staf = await db.staf.findUnique({
      where: { id: stafId },
      select: {
        id: true,
        naam: true,
        rollen: true,
        email: true,
        geboortejaar: true,
        relCode: true,
        teamStaf: {
          select: {
            rol: true,
            team: {
              select: {
                id: true,
                naam: true,
                alias: true,
                kleur: true,
                versie: {
                  select: {
                    werkindeling: {
                      select: {
                        kaders: {
                          select: { id: true, seizoen: true, isWerkseizoen: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        werkitems: {
          select: {
            id: true,
            titel: true,
            beschrijving: true,
            status: true,
            prioriteit: true,
            type: true,
            createdAt: true,
            auteur: { select: { naam: true, email: true } },
          },
          orderBy: [{ status: "asc" }, { createdAt: "desc" }],
          take: 50,
        },
      },
    });

    if (!staf) {
      return { ok: false, error: "Staf niet gevonden" };
    }

    // ── TeamKoppelingen (alleen werkseizoen) ───────────────────────────
    type TeamStafRaw = {
      rol: string;
      team: {
        id: string;
        naam: string;
        alias: string | null;
        kleur: string | null;
        versie: {
          werkindeling: {
            kaders: { id: string; seizoen: string; isWerkseizoen: boolean };
          };
        };
      };
    };

    const alleTeamStaf = staf.teamStaf as TeamStafRaw[];

    const teamKoppelingen = alleTeamStaf
      .filter((ts) => ts.team.versie.werkindeling.kaders.isWerkseizoen === true)
      .map((ts) => ({
        teamId: ts.team.id,
        teamNaam: ts.team.alias ?? ts.team.naam,
        teamKleur: ts.team.kleur ?? null,
        rol: ts.rol,
      }));

    // ── Seizoenshistorie (alle seizoenen, gegroepeerd) ─────────────────
    const seizoenMap = new Map<
      string,
      { teamNaam: string; teamKleur: string | null; rol: string }[]
    >();
    for (const ts of alleTeamStaf) {
      const seizoen = ts.team.versie.werkindeling.kaders.seizoen as string;
      if (!seizoenMap.has(seizoen)) seizoenMap.set(seizoen, []);
      seizoenMap.get(seizoen)!.push({
        teamNaam: ts.team.alias ?? ts.team.naam,
        teamKleur: ts.team.kleur ?? null,
        rol: ts.rol,
      });
    }
    const seizoenshistorie: StafSeizoenHistorie[] = Array.from(seizoenMap.entries())
      .sort(([a], [b]) => b.localeCompare(a)) // nieuwste seizoen eerst
      .map(([seizoen, koppelingen]) => ({ seizoen, teamKoppelingen: koppelingen }));

    // ── Werkitems / memos ──────────────────────────────────────────────
    type WerkitemRaw = {
      id: string;
      titel: string | null;
      beschrijving: string;
      status: string;
      prioriteit: string;
      type: string;
      createdAt: Date;
      auteur: { naam: string; email: string };
    };
    const werkitemsArr = staf.werkitems as WerkitemRaw[];

    const memoItem = werkitemsArr.find(
      (w) => w.type === "MEMO" && (w.status === "OPEN" || w.status === "IN_BESPREKING")
    );
    const memoStatus = memoItem?.status ?? null;

    const werkitemsDetail: SpelerWerkitemDetail[] = werkitemsArr.map((w) => ({
      id: w.id,
      titel: w.titel ?? "",
      beschrijving: w.beschrijving,
      status: w.status as import("@oranje-wit/database").WerkitemStatus,
      prioriteit: w.prioriteit,
      type: w.type,
      auteurNaam: w.auteur?.naam ?? w.auteur?.email ?? null,
      createdAt: w.createdAt,
    }));

    // ── Foto via lid_fotos (relCode nodig) ────────────────────────────
    const relCode = staf.relCode as string | null;
    let hasFoto = false;
    if (relCode) {
      try {
        const fotoSet = await getSpelersMetFoto([relCode]);
        hasFoto = fotoSet.has(relCode);
      } catch (fotoErr) {
        logger.warn("getStafDialogData: foto-lookup mislukt:", fotoErr);
      }
    }

    // ── speelteamNaam: null (query te complex, acceptabele fallback) ───
    // Staf.relCode → Speler.id (zelfde rel_code) → TeamSpeler → Team
    // Via meerdere joins — bewust overgeslagen; null is acceptabel.
    const speelteamNaam: string | null = null;

    const data: StafRijData = {
      id: staf.id as string,
      naam: staf.naam as string,
      rollen: staf.rollen as string[],
      email: (staf.email as string | null) ?? null,
      geboortejaar: (staf.geboortejaar as number | null) ?? null,
      relCode,
      hasFoto,
      speelteamNaam,
      teamKoppelingen,
      heeftOpenMemo: werkitemsArr.some(
        (w) => w.type === "MEMO" && (w.status === "OPEN" || w.status === "IN_BESPREKING")
      ),
      memoBadge: memoBadgeFromStatus(memoStatus),
      werkitemsDetail,
      seizoenshistorie,
    };

    logger.info("getStafDialogData: laadde staf " + stafId);
    return { ok: true, data };
  } catch (error) {
    logger.warn("getStafDialogData mislukt:", error);
    return { ok: false, error: "Staf-data laden mislukt" };
  }
}
