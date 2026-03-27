import { prisma } from "@/lib/db/prisma";
import { ok, fail, parseBody } from "@/lib/api/response";
import { requireTC } from "@oranje-wit/auth/checks";
import { getCoordinatoren, createCoordinator } from "@oranje-wit/database";
import { z } from "zod";

const CreateCoordinatorSchema = z.object({
  naam: z.string().min(1),
  email: z.string().email(),
});

export async function GET() {
  try {
    await requireTC();
    const coordinatoren = await getCoordinatoren(prisma);
    return ok(coordinatoren);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}

export async function POST(request: Request) {
  try {
    await requireTC();
    const parsed = await parseBody(request, CreateCoordinatorSchema);
    if (!parsed.ok) return parsed.response;

    const result = await createCoordinator(prisma, {
      naam: parsed.data.naam,
      email: parsed.data.email,
    });

    if (!result.ok) {
      return fail(result.error, 409, "DUPLICATE");
    }

    return ok(result.data);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
