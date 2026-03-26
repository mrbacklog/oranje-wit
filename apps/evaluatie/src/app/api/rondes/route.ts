import { prisma } from "@/lib/db/prisma";
import { ok, fail, parseBody } from "@/lib/api";
import { requireEditor } from "@oranje-wit/auth/checks";
import { z } from "zod";

const CreateRondeSchema = z.object({
  seizoen: z.string().regex(/^\d{4}-\d{4}$/),
  ronde: z.number().int().positive(),
  naam: z.string().min(1),
  type: z.enum(["trainer", "speler"]),
  deadline: z.string().datetime(),
});

export async function GET() {
  try {
    await requireEditor();
    // Prisma 7 type recursie workaround (TS2321)
    const rondes = await (prisma.evaluatieRonde.findMany as Function)({
      orderBy: [{ seizoen: "desc" }, { ronde: "desc" }],
      include: {
        _count: { select: { uitnodigingen: true, evaluaties: true } },
      },
    });
    return ok(rondes);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}

export async function POST(request: Request) {
  try {
    await requireEditor();
    const parsed = await parseBody(request, CreateRondeSchema);
    if (!parsed.ok) return parsed.response;

    // Prisma 7 type recursie workaround (TS2321)
    const ronde = await (prisma.evaluatieRonde.create as Function)({
      data: {
        ...parsed.data,
        deadline: new Date(parsed.data.deadline),
      },
    });
    return ok(ronde);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
