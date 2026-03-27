import { logger } from "@oranje-wit/types";
import { ok, fail } from "@/lib/scouting/api";
import { prisma } from "@/lib/scouting/db/prisma";
import { requireTC } from "@/lib/scouting/auth/helpers";

// Prisma 7 type recursion workaround
const db = prisma as any;

// ── GET /api/scouts ────────────────────────────────────────────
// Lijst van alle scouts met stats. Alleen TC.

export async function GET() {
  try {
    const authResult = await requireTC();
    if (!authResult.ok) return authResult.response;

    const scouts = await db.scout.findMany({
      select: {
        id: true,
        naam: true,
        email: true,
        rol: true,
        vrijScouten: true,
        xp: true,
        level: true,
        _count: {
          select: { rapporten: true },
        },
      },
      orderBy: [{ rol: "asc" }, { naam: "asc" }],
    });

    const data = scouts.map(
      (s: {
        id: string;
        naam: string;
        email: string;
        rol: string;
        vrijScouten: boolean;
        xp: number;
        level: number;
        _count: { rapporten: number };
      }) => ({
        id: s.id,
        naam: s.naam,
        email: s.email,
        rol: s.rol,
        vrijScouten: s.vrijScouten,
        xp: s.xp,
        level: s.level,
        aantalRapporten: s._count.rapporten,
      })
    );

    return ok(data);
  } catch (error) {
    logger.error("Fout bij ophalen scouts:", error);
    return fail(error instanceof Error ? error.message : String(error));
  }
}
