import { prisma, PrismaFn } from "@/lib/db/prisma";
import { ok, fail } from "@/lib/api";
import { requireEditor } from "@oranje-wit/auth/checks";

export async function GET() {
  try {
    await requireEditor();
    // Prisma 7 type recursie workaround (TS2321)
    const templates = await (prisma.emailTemplate.findMany as PrismaFn)({
      orderBy: { sleutel: "asc" },
    });
    return ok(templates);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
