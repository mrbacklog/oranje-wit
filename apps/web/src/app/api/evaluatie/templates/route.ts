import { prisma } from "@/lib/db/prisma";
import { ok, fail } from "@/lib/api/response";
import { requireEditor } from "@oranje-wit/auth/checks";
import { getTemplates } from "@oranje-wit/database";

export async function GET() {
  try {
    await requireEditor();
    const templates = await getTemplates(prisma);
    return ok(templates);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
