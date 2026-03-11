import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ok, fail } from "@/lib/api/response";
import { parseBody } from "@/lib/api/validate";

const Schema = z.object({
  ratings: z.array(
    z.object({
      spelerId: z.string().min(1),
      rating: z.number().int().min(0).max(300),
    })
  ),
});

export async function POST(request: Request) {
  try {
    const parsed = await parseBody(request, Schema);
    if (!parsed.ok) return parsed.response;

    const { ratings } = parsed.data;

    await prisma.$transaction(
      ratings.map(({ spelerId, rating }) =>
        prisma.speler.update({
          where: { id: spelerId },
          data: { rating, ratingBerekend: rating },
        })
      )
    );

    return ok({ bijgewerkt: ratings.length });
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
