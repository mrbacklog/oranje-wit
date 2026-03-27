import { logger } from "@oranje-wit/types";
import { ok, fail } from "@/lib/api";
import { prisma } from "@/lib/db/prisma";
import { requireTC } from "@/lib/auth/requireTC";
import { valideerItemcatalogus, type ValidatiePijler } from "@/lib/admin/validatie";
import { LEEFTIJDSGROEP_CONFIG, type LeeftijdsgroepNaamV3 } from "@oranje-wit/types";

// Prisma 7 type recursion workaround
const db = prisma as any;

// ── GET /api/admin/validatie?band=geel ───────────────────────
// Validatieregels checken voor een leeftijdsgroep

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

    const geldige: LeeftijdsgroepNaamV3[] = ["paars", "blauw", "groen", "geel", "oranje", "rood"];

    if (!geldige.includes(band as LeeftijdsgroepNaamV3)) {
      return fail(`Ongeldige band '${band}'. Gebruik: ${geldige.join(", ")}`, 400, "INVALID_BAND");
    }

    const config = LEEFTIJDSGROEP_CONFIG[band as LeeftijdsgroepNaamV3];

    // Zoek de versie
    let versie;
    if (versieId) {
      versie = await db.raamwerkVersie.findUnique({ where: { id: versieId } });
    } else {
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

    // Haal de leeftijdsgroep op met items
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
      return fail(`Geen leeftijdsgroep '${band}' gevonden`, 404, "GROEP_NOT_FOUND");
    }

    // Map naar ValidatiePijler
    const pijlers: ValidatiePijler[] = groep.pijlers.map(
      (p: {
        id: string;
        code: string;
        naam: string;
        items: Array<{
          id: string;
          pijlerId: string;
          itemCode: string;
          label: string;
          vraagTekst: string;
          isKern: boolean;
          actief: boolean;
        }>;
      }) => ({
        id: p.id,
        code: p.code,
        naam: p.naam,
        items: p.items,
      })
    );

    const result = valideerItemcatalogus(pijlers, config);

    return ok({
      band,
      versieId: versie.id,
      ...result,
    });
  } catch (error) {
    logger.error("Fout bij validatie:", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}
