import { prisma } from "@/lib/db/prisma";
import { ok, fail, parseBody } from "@/lib/api";
import { requireEditor } from "@oranje-wit/auth/checks";
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

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: parsed.data,
    });
    return ok(template);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
