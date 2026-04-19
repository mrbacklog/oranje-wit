import { type NextRequest } from "next/server";
import { guardTC } from "@oranje-wit/auth/checks";
import { ok, fail, logger } from "@oranje-wit/types";
import { detecteerWijzigingen } from "@oranje-wit/sportlink";

export async function GET(req: NextRequest) {
  const guard = await guardTC();
  if (!guard.ok) return guard.response;

  try {
    const signalen = await detecteerWijzigingen();
    return ok({ signalen });
  } catch (error) {
    logger.error("[sportlink] Wijzigingsdetectie fout:", error);
    return fail(error instanceof Error ? error.message : "Detectie mislukt");
  }
}
