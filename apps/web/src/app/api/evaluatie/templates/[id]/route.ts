import { prisma } from "@/lib/db/prisma";
import { ok, fail, parseBody } from "@/lib/api/response";
import { requireEditor } from "@oranje-wit/auth/checks";
import { updateTemplate } from "@oranje-wit/database";
import { z } from "zod";

const UpdateTemplateSchema = z.object({
  onderwerp: z.string().min(1).optional(),
  inhoudHtml: z.string().min(1).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireEditor();
    const { id } = await params;
    const parsed = await parseBody(request, UpdateTemplateSchema);
    if (!parsed.ok) return parsed.response;

    const result = await updateTemplate(prisma, id, parsed.data);

    if (!result.ok) {
      return fail(result.error, 400);
    }

    return ok({ updated: true });
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
