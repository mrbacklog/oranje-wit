// apps/ti-studio/src/app/api/indeling/[versieId]/audit/route.ts
// Read-only audit-trail per werkindeling-versie. Toont de laatste 100
// WerkbordMutatie-rijen met gebruiker-naam en speler-naam.
import { guardTC } from "@oranje-wit/auth/checks";
import { ok, fail } from "@oranje-wit/types";
import { prisma } from "@/lib/teamindeling/db/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ versieId: string }> }
) {
  const auth = await guardTC();
  if (!auth.ok) return auth.response;

  const { versieId } = await params;
  try {
    const mutaties = await prisma.werkbordMutatie.findMany({
      where: { versieId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        door: { select: { naam: true, email: true } },
        speler: { select: { roepnaam: true, achternaam: true } },
      },
    });
    return ok(mutaties);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
