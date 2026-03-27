import { HUIDIG_SEIZOEN } from "@oranje-wit/types";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { ok, fail } from "@/lib/teamindeling/api/response";
import { berekenAlleRatings } from "@/lib/teamindeling/rating";

export async function POST() {
  try {
    const result = await berekenAlleRatings(HUIDIG_SEIZOEN, prisma);
    return ok(result);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
