import { z } from "zod";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { ok, fail } from "@/lib/teamindeling/api/response";
import { parseBody } from "@/lib/teamindeling/api/validate";
import { guardTC } from "@oranje-wit/auth/checks";

const Schema = z.object({
  ratings: z.array(
    z.object({
      spelerId: z.string().min(1),
      rating: z.number().int().min(0).max(200),
    })
  ),
});

export async function POST(request: Request) {
  const auth = await guardTC();
  if (!auth.ok) return auth.response;

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
