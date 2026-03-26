import { prisma, PrismaFn } from "@/lib/db/prisma";
import { ok, fail, parseBody } from "@/lib/api";
import { requireEditor } from "@oranje-wit/auth/checks";
import { z } from "zod";

const UpdateCoordinatorSchema = z.object({
  naam: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireEditor();
    const { id } = await params;
    const parsed = await parseBody(request, UpdateCoordinatorSchema);
    if (!parsed.ok) return parsed.response;

    // Prisma 7 type recursie workaround (TS2321)
    const coordinator = await (prisma.coordinator.update as PrismaFn)({
      where: { id },
      data: parsed.data,
    });
    return ok(coordinator);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireEditor();
    const { id } = await params;
    // Prisma 7 type recursie workaround (TS2321)
    await (prisma.coordinator.delete as PrismaFn)({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
