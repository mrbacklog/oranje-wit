import { prisma } from "@/lib/db/prisma";
import { ok, fail } from "@/lib/api/response";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { seizoen, codes } = body as { seizoen?: string; codes?: string[] };

    if (!seizoen || !Array.isArray(codes) || codes.length === 0) {
      return fail("seizoen en codes[] zijn verplicht", 400, "BAD_REQUEST");
    }

    // Zet sort_order per positie in de array
    await prisma.$transaction(
      codes.map((code, i) =>
        prisma.oWTeam.updateMany({
          where: { seizoen, owCode: code },
          data: { sortOrder: i + 1 },
        })
      )
    );

    return ok({ updated: codes.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return fail(`Sort order bijwerken mislukt: ${message}`);
  }
}
