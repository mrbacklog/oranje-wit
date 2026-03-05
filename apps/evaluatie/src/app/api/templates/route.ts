import { prisma } from "@/lib/db/prisma";
import { ok, fail } from "@/lib/api";
import { requireEditor } from "@oranje-wit/auth/checks";

export async function GET() {
  try {
    await requireEditor();
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { sleutel: "asc" },
    });
    return ok(templates);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
