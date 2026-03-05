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
    const uitnodiging = await prisma.evaluatieUitnodiging.findUnique({
      where: { token: parsed.data.token },
      include: { ronde: { select: { status: true } } },
    });

    if (!uitnodiging || uitnodiging.type !== "coordinator") {
      return fail("Niet geautoriseerd", 403, "FORBIDDEN");
    }
    if (uitnodiging.ronde.status !== "actief") {
      return fail("Ronde is niet actief", 400, "RONDE_NIET_ACTIEF");
    }

    const evaluatie = await prisma.evaluatie.update({
      where: { id },
      data: { coordinatorMemo: parsed.data.memo },
    });

    return ok({ id: evaluatie.id });
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
