import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, fail } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";

const RatingSchema = z.object({
  rating: z.number().int().min(0).max(200),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const parsed = await parseBody(request, RatingSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const speler = await prisma.speler.update({
      where: { id },
      data: { rating: parsed.data.rating },
      select: { id: true, rating: true, ratingBerekend: true },
    });
    return ok(speler);
  } catch {
    return fail(`Speler ${id} niet gevonden`, 404, "NOT_FOUND");
  }
}
