import { prisma } from "@/lib/db/prisma";

// Prisma 7 type recursie workaround (TS2321)
type PrismaFn = (...args: any[]) => any;
import { ok, fail, parseBody } from "@/lib/api/response";
import { requireTC } from "@oranje-wit/auth/checks";
import { z } from "zod";

const LinkTeamSchema = z.object({
  owTeamId: z.number().int().positive(),
  seizoen: z.string().regex(/^\d{4}-\d{4}$/),
});

const UnlinkTeamSchema = z.object({
  owTeamId: z.number().int().positive(),
  seizoen: z.string().regex(/^\d{4}-\d{4}$/),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireTC();
    const { id } = await params;
    const parsed = await parseBody(request, LinkTeamSchema);
    if (!parsed.ok) return parsed.response;

    // Prisma 7 type recursie workaround (TS2321)
    const link = await (prisma.coordinatorTeam.create as PrismaFn)({
      data: {
        coordinatorId: id,
        owTeamId: parsed.data.owTeamId,
        seizoen: parsed.data.seizoen,
      },
    });
    return ok(link);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireTC();
    const { id } = await params;
    const parsed = await parseBody(request, UnlinkTeamSchema);
    if (!parsed.ok) return parsed.response;

    // Prisma 7 type recursie workaround (TS2321)
    await (prisma.coordinatorTeam.deleteMany as PrismaFn)({
      where: {
        coordinatorId: id,
        owTeamId: parsed.data.owTeamId,
        seizoen: parsed.data.seizoen,
      },
    });
    return ok({ deleted: true });
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
