import { z } from "zod";
import { logger } from "@oranje-wit/types";
import { ok, fail, parseBody } from "@/lib/api";
import { prisma } from "@/lib/db/prisma";
import { requireTC } from "@/lib/auth/requireTC";

// Prisma 7 type recursion workaround
const db = prisma as any;

// ── GET /api/admin/raamwerk ──────────────────────────────────
// Haal het actieve raamwerk op met leeftijdsgroepen en item-tellingen

export async function GET() {
  try {
    const authResult = await requireTC();
    if (!authResult.ok) return authResult.response;

    // Haal alle versies op, ACTIEF eerst
    const versies = await db.raamwerkVersie.findMany({
      orderBy: [
        { status: "asc" }, // ACTIEF komt voor CONCEPT en GEARCHIVEERD
        { createdAt: "desc" },
      ],
      include: {
        groepen: {
          orderBy: { band: "asc" },
          include: {
            pijlers: {
              orderBy: { volgorde: "asc" },
              include: {
                _count: {
                  select: { items: true },
                },
                items: {
                  where: { actief: true },
                  select: { isKern: true },
                },
              },
            },
          },
        },
      },
    });

    const result = versies.map(
      (v: {
        id: string;
        seizoen: string;
        naam: string;
        status: string;
        opmerking: string | null;
        createdAt: Date;
        updatedAt: Date;
        gepubliceerdOp: Date | null;
        groepen: Array<{
          id: string;
          band: string;
          schaalType: string;
          kernItemsTarget: number | null;
          pijlers: Array<{
            id: string;
            code: string;
            naam: string;
            _count: { items: number };
            items: Array<{ isKern: boolean }>;
          }>;
        }>;
      }) => ({
        id: v.id,
        seizoen: v.seizoen,
        naam: v.naam,
        status: v.status,
        opmerking: v.opmerking,
        createdAt: v.createdAt.toISOString(),
        updatedAt: v.updatedAt.toISOString(),
        gepubliceerdOp: v.gepubliceerdOp?.toISOString() ?? null,
        groepen: v.groepen.map((g) => {
          const totaalItems = g.pijlers.reduce((sum, p) => sum + p.items.length, 0);
          const kernItems = g.pijlers.reduce(
            (sum, p) => sum + p.items.filter((i) => i.isKern).length,
            0
          );
          return {
            id: g.id,
            band: g.band,
            schaalType: g.schaalType,
            kernItemsTarget: g.kernItemsTarget,
            aantalPijlers: g.pijlers.length,
            totaalItems,
            kernItems,
            pijlers: g.pijlers.map((p) => ({
              id: p.id,
              code: p.code,
              naam: p.naam,
              totaalItems: p._count.items,
              kernItems: p.items.filter((i) => i.isKern).length,
            })),
          };
        }),
      })
    );

    return ok(result);
  } catch (error) {
    logger.error("Fout bij ophalen raamwerk:", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}

// ── POST /api/admin/raamwerk ─────────────────────────────────
// Maak een nieuw raamwerk aan door het actieve te kopieren

const CreateRaamwerkSchema = z.object({
  seizoen: z.string().regex(/^\d{4}-\d{4}$/, "Gebruik formaat '2025-2026'"),
  naam: z.string().min(3).max(200),
  opmerking: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  try {
    const authResult = await requireTC();
    if (!authResult.ok) return authResult.response;

    const parsed = await parseBody(request, CreateRaamwerkSchema);
    if (!parsed.ok) return parsed.response;

    const { seizoen, naam, opmerking } = parsed.data;

    // Check of er al een versie is voor dit seizoen
    const bestaand = await db.raamwerkVersie.findUnique({
      where: { seizoen },
    });
    if (bestaand) {
      return fail(
        `Er bestaat al een raamwerkversie voor seizoen ${seizoen}`,
        409,
        "DUPLICATE_SEIZOEN"
      );
    }

    // Zoek de actieve versie om te kopieren
    const actieveVersie = await db.raamwerkVersie.findFirst({
      where: { status: "ACTIEF" },
      include: {
        groepen: {
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
        },
      },
    });

    // Maak de nieuwe versie aan
    const nieuweVersie = await db.raamwerkVersie.create({
      data: {
        seizoen,
        naam,
        status: "CONCEPT",
        opmerking: opmerking ?? null,
        bronVersieId: actieveVersie?.id ?? null,
      },
    });

    // Als er een actieve versie is, kopieer alle groepen, pijlers en items
    if (actieveVersie) {
      for (const groep of actieveVersie.groepen) {
        const nieuweGroep = await db.leeftijdsgroep.create({
          data: {
            versieId: nieuweVersie.id,
            band: groep.band,
            schaalType: groep.schaalType,
            maxScore: groep.maxScore,
            doelAantal: groep.doelAantal,
            schaalMin: groep.schaalMin,
            schaalMax: groep.schaalMax,
            schaalMediaan: groep.schaalMediaan,
            halveBereik: groep.halveBereik,
            bandbreedteCoach: groep.bandbreedteCoach,
            bandbreedteScout: groep.bandbreedteScout,
            kernItemsTarget: groep.kernItemsTarget,
          },
        });

        for (const pijler of groep.pijlers) {
          const nieuwePijler = await db.pijler.create({
            data: {
              groepId: nieuweGroep.id,
              code: pijler.code,
              naam: pijler.naam,
              icoon: pijler.icoon,
              volgorde: pijler.volgorde,
              blok: pijler.blok,
              gewicht: pijler.gewicht,
            },
          });

          if (pijler.items.length > 0) {
            await db.ontwikkelItem.createMany({
              data: pijler.items.map(
                (item: {
                  itemCode: string;
                  label: string;
                  vraagTekst: string;
                  laag: string | null;
                  isKern: boolean;
                  categorie: string | null;
                  volgorde: number;
                  actief: boolean;
                }) => ({
                  pijlerId: nieuwePijler.id,
                  itemCode: item.itemCode,
                  label: item.label,
                  vraagTekst: item.vraagTekst,
                  laag: item.laag,
                  isKern: item.isKern,
                  categorie: item.categorie,
                  volgorde: item.volgorde,
                  actief: item.actief,
                })
              ),
            });
          }
        }
      }
    }

    logger.info(`Raamwerk ${nieuweVersie.id} aangemaakt: ${naam} (${seizoen})`);

    return ok({
      id: nieuweVersie.id,
      seizoen: nieuweVersie.seizoen,
      naam: nieuweVersie.naam,
      status: nieuweVersie.status,
      bronVersieId: nieuweVersie.bronVersieId,
      createdAt: nieuweVersie.createdAt.toISOString(),
    });
  } catch (error) {
    logger.error("Fout bij aanmaken raamwerk:", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}
