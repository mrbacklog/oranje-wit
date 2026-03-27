import { prisma } from "@/lib/db/prisma";

// Prisma 7 type recursie workaround (TS2321)
type PrismaFn = (...args: any[]) => any;
import { ok, fail, parseBody } from "@/lib/api/response";
import { requireTC } from "@oranje-wit/auth/checks";
import { z } from "zod";

const UpdateRondeSchema = z.object({
  status: z.enum(["concept", "actief", "gesloten"]).optional(),
  deadline: z.string().datetime().optional(),
  naam: z.string().min(1).optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireTC();
    const { id } = await params;
    // Prisma 7 type recursie workaround (TS2321)
    const ronde = await (prisma.evaluatieRonde.findUnique as PrismaFn)({
      where: { id },
      include: {
        uitnodigingen: {
          include: { owTeam: { select: { id: true, naam: true } } },
          orderBy: { createdAt: "desc" },
        },
        evaluaties: {
          select: {
            id: true,
            spelerId: true,
            status: true,
            teamNaam: true,
            coach: true,
            ingediendOp: true,
          },
        },
      },
    });
    if (!ronde) return fail("Ronde niet gevonden", 404, "NOT_FOUND");
    return ok(ronde);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireTC();
    const { id } = await params;
    const parsed = await parseBody(request, UpdateRondeSchema);
    if (!parsed.ok) return parsed.response;

    // Prisma 7 type recursie workaround (TS2321)
    const ronde = await (prisma.evaluatieRonde.update as PrismaFn)({
      where: { id },
      data: {
        ...parsed.data,
        deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : undefined,
      },
    });
    return ok(ronde);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
