import { z } from "zod";
import { logger } from "@oranje-wit/types";
import { ok, fail, parseBody } from "@/lib/api";
import { prisma } from "@/lib/db/prisma";
import { requireTC } from "@/lib/auth/requireTC";

// Prisma 7 type recursion workaround
const db = prisma as any;

// ── GET /api/admin/items?band=geel ───────────────────────────
// Items ophalen per leeftijdsgroep (actief raamwerk of specifieke versie)

export async function GET(request: Request) {
  try {
    const authResult = await requireTC();
    if (!authResult.ok) return authResult.response;

    const { searchParams } = new URL(request.url);
    const band = searchParams.get("band");
    const versieId = searchParams.get("versieId");

    if (!band) {
      return fail("Query parameter 'band' is verplicht", 400, "MISSING_PARAM");
    }

    const geldige = ["paars", "blauw", "groen", "geel", "oranje", "rood"];
    if (!geldige.includes(band)) {
      return fail(`Ongeldige band '${band}'. Gebruik: ${geldige.join(", ")}`, 400, "INVALID_BAND");
    }

    // Zoek de versie
    let versie;
    if (versieId) {
      versie = await db.raamwerkVersie.findUnique({ where: { id: versieId } });
    } else {
      // Zoek eerst CONCEPT (bewerkbaar), anders ACTIEF
      versie = await db.raamwerkVersie.findFirst({
        where: { status: "CONCEPT" },
        orderBy: { createdAt: "desc" },
      });
      if (!versie) {
        versie = await db.raamwerkVersie.findFirst({
          where: { status: "ACTIEF" },
        });
      }
    }

    if (!versie) {
      return fail("Geen raamwerkversie gevonden", 404, "NO_VERSION");
    }

    // Haal de leeftijdsgroep op met pijlers en items
    const groep = await db.leeftijdsgroep.findUnique({
      where: {
        versieId_band: {
          versieId: versie.id,
          band,
        },
      },
      include: {
        pijlers: {
          orderBy: { volgorde: "asc" },
          include: {
            items: {
              orderBy: { volgorde: "asc" },
            },
          },
        },
      },
    });

    if (!groep) {
      return fail(
        `Geen leeftijdsgroep '${band}' gevonden in versie ${versie.id}`,
        404,
        "GROEP_NOT_FOUND"
      );
    }

    return ok({
      versie: {
        id: versie.id,
        seizoen: versie.seizoen,
        naam: versie.naam,
        status: versie.status,
      },
      groep: {
        id: groep.id,
        band: groep.band,
        schaalType: groep.schaalType,
        kernItemsTarget: groep.kernItemsTarget,
      },
      pijlers: groep.pijlers.map(
        (p: {
          id: string;
          code: string;
          naam: string;
          icoon: string | null;
          volgorde: number;
          blok: string | null;
          items: Array<{
            id: string;
            itemCode: string;
            label: string;
            vraagTekst: string;
            isKern: boolean;
            categorie: string | null;
            volgorde: number;
            actief: boolean;
          }>;
        }) => ({
          id: p.id,
          code: p.code,
          naam: p.naam,
          icoon: p.icoon,
          volgorde: p.volgorde,
          blok: p.blok,
          items: p.items.map((i) => ({
            id: i.id,
            itemCode: i.itemCode,
            label: i.label,
            vraagTekst: i.vraagTekst,
            isKern: i.isKern,
            categorie: i.categorie,
            volgorde: i.volgorde,
            actief: i.actief,
          })),
        })
      ),
    });
  } catch (error) {
    logger.error("Fout bij ophalen items:", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}

// ── POST /api/admin/items ────────────────────────────────────
// Nieuw item toevoegen aan een pijler

const ItemCreateSchema = z.object({
  pijlerId: z.string().min(1),
  itemCode: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z_]+$/, "Item-code moet lowercase zijn met underscores"),
  label: z.string().min(3).max(100),
  vraagTekst: z.string().min(10).max(500),
  isKern: z.boolean().default(false),
  categorie: z.enum(["KERN", "ONDERSCHEIDEND"]).optional(),
  volgorde: z.number().int().min(0).default(0),
});

export async function POST(request: Request) {
  try {
    const authResult = await requireTC();
    if (!authResult.ok) return authResult.response;

    const parsed = await parseBody(request, ItemCreateSchema);
    if (!parsed.ok) return parsed.response;

    const { pijlerId, itemCode, label, vraagTekst, isKern, categorie, volgorde } = parsed.data;

    // Verifieer dat de pijler bestaat en bij een CONCEPT-versie hoort
    const pijler = await db.pijler.findUnique({
      where: { id: pijlerId },
      include: {
        groep: {
          include: {
            versie: { select: { id: true, status: true } },
          },
        },
      },
    });

    if (!pijler) {
      return fail(`Pijler met id '${pijlerId}' niet gevonden`, 404, "PIJLER_NOT_FOUND");
    }

    if (pijler.groep.versie.status !== "CONCEPT") {
      return fail(
        "Items kunnen alleen worden toegevoegd aan een CONCEPT-versie",
        400,
        "VERSION_NOT_EDITABLE"
      );
    }

    // Check of itemCode al bestaat bij deze pijler
    const bestaand = await db.ontwikkelItem.findUnique({
      where: {
        pijlerId_itemCode: {
          pijlerId,
          itemCode,
        },
      },
    });

    if (bestaand) {
      return fail(
        `Item-code '${itemCode}' bestaat al bij pijler '${pijler.naam}'`,
        409,
        "DUPLICATE_ITEM_CODE"
      );
    }

    // Bepaal de volgorde als niet meegegeven (achteraan)
    let finalVolgorde = volgorde;
    if (finalVolgorde === 0) {
      const laatsteItem = await db.ontwikkelItem.findFirst({
        where: { pijlerId },
        orderBy: { volgorde: "desc" },
        select: { volgorde: true },
      });
      finalVolgorde = (laatsteItem?.volgorde ?? 0) + 1;
    }

    const item = await db.ontwikkelItem.create({
      data: {
        pijlerId,
        itemCode,
        label,
        vraagTekst,
        isKern,
        categorie: categorie ?? null,
        volgorde: finalVolgorde,
        actief: true,
      },
    });

    logger.info(`Item ${item.id} aangemaakt: ${itemCode} (${label})`);

    return ok({
      id: item.id,
      pijlerId: item.pijlerId,
      itemCode: item.itemCode,
      label: item.label,
      vraagTekst: item.vraagTekst,
      isKern: item.isKern,
      categorie: item.categorie,
      volgorde: item.volgorde,
      actief: item.actief,
    });
  } catch (error) {
    logger.error("Fout bij aanmaken item:", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}
