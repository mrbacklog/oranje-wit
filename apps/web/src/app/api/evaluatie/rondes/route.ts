import { prisma } from "@/lib/db/prisma";
import { ok, fail, parseBody } from "@/lib/api/response";
import { requireEditor } from "@oranje-wit/auth/checks";
import { getRondes, createRonde } from "@oranje-wit/database";
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
    const rondes = await getRondes(prisma);
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

    const result = await createRonde(prisma, {
      seizoen: parsed.data.seizoen,
      ronde: parsed.data.ronde,
      naam: parsed.data.naam,
      type: parsed.data.type,
      deadline: new Date(parsed.data.deadline),
    });

    if (!result.ok) {
      return fail(result.error, 409, "DUPLICATE");
    }

    return ok(result.data);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
