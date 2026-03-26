import { prisma } from "@/lib/db/prisma";
import { ok, fail, parseBody } from "@/lib/api";
import { z } from "zod";

const MemoSchema = z.object({
  memo: z.string(),
  token: z.string().min(1),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const parsed = await parseBody(request, MemoSchema);
    if (!parsed.ok) return parsed.response;

    // Valideer token — coordinator moet toegang hebben
    // Prisma 7 type recursie workaround (TS2321)
    const uitnodiging = await (prisma.evaluatieUitnodiging.findUnique as Function)({
      where: { token: parsed.data.token },
      include: { ronde: { select: { status: true } } },
    });

    if (!uitnodiging || uitnodiging.type !== "coordinator") {
      return fail("Niet geautoriseerd", 403, "FORBIDDEN");
    }
    if (uitnodiging.ronde.status !== "actief") {
      return fail("Ronde is niet actief", 400, "RONDE_NIET_ACTIEF");
    }

    // Prisma 7 type recursie workaround (TS2321)
    const evaluatie = await (prisma.evaluatie.update as Function)({
      where: { id },
      data: { coordinatorMemo: parsed.data.memo },
    });

    return ok({ id: evaluatie.id });
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
