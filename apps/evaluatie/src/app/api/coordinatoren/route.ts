import { prisma } from "@/lib/db/prisma";
import { ok, fail, parseBody } from "@/lib/api";
import { requireEditor } from "@oranje-wit/auth/checks";
import { z } from "zod";

const CreateCoordinatorSchema = z.object({
  naam: z.string().min(1),
  email: z.string().email(),
});

export async function GET() {
  try {
    await requireEditor();
    const coordinatoren = await prisma.coordinator.findMany({
      include: {
        teams: {
          include: { owTeam: { select: { id: true, naam: true } } },
          orderBy: { seizoen: "desc" },
        },
      },
      orderBy: { naam: "asc" },
    });
    return ok(coordinatoren);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}

export async function POST(request: Request) {
  try {
    await requireEditor();
    const parsed = await parseBody(request, CreateCoordinatorSchema);
    if (!parsed.ok) return parsed.response;

    const coordinator = await prisma.coordinator.create({
      data: parsed.data,
    });
    return ok(coordinator);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
