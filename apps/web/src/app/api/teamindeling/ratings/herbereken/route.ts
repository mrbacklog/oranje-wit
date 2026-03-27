import { HUIDIG_SEIZOEN } from "@oranje-wit/types";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { ok, fail } from "@/lib/teamindeling/api/response";
import { berekenAlleRatings } from "@/lib/teamindeling/rating";
import { guardTC } from "@oranje-wit/auth/checks";

export async function POST() {
  const auth = await guardTC();
  if (!auth.ok) return auth.response;

  try {
    const result = await berekenAlleRatings(HUIDIG_SEIZOEN, prisma);
    return ok(result);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
