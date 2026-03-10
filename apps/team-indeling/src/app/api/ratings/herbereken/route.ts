import { HUIDIG_SEIZOEN } from "@oranje-wit/types";
import { prisma } from "@/lib/db/prisma";
import { ok, fail } from "@/lib/api/response";
import { berekenAlleRatings } from "@/lib/rating";

export async function POST() {
  try {
    const result = await berekenAlleRatings(HUIDIG_SEIZOEN, prisma);
    return ok(result);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
