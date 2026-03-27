import { prisma } from "@/lib/db/prisma";
import { ok, fail, parseBody } from "@/lib/api/response";
import { requireTC } from "@oranje-wit/auth/checks";
import { updateCoordinator, deleteCoordinator } from "@oranje-wit/database";
import { z } from "zod";

const UpdateCoordinatorSchema = z.object({
  naam: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireTC();
    const { id } = await params;
    const parsed = await parseBody(request, UpdateCoordinatorSchema);
    if (!parsed.ok) return parsed.response;

    const result = await updateCoordinator(prisma, id, parsed.data);

    if (!result.ok) {
      return fail(result.error, 400);
    }

    return ok(result.data);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireTC();
    const { id } = await params;

    const result = await deleteCoordinator(prisma, id);

    if (!result.ok) {
      return fail(result.error, 400);
    }

    return ok({ deleted: true });
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
