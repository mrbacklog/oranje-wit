import { NextRequest } from "next/server";
import { guardTC } from "@oranje-wit/auth/checks";
import { ok, fail, parseBody } from "@oranje-wit/types";
import { z } from "zod";
import { sportlinkLogin, sportlinkZoekLeden } from "@/lib/sportlink/client";
import { berekenDiff } from "@/lib/sportlink/diff";

const SyncSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const guard = await guardTC();
  if (!guard.ok) return fail(guard.error, 401);

  const body = await parseBody(req, SyncSchema);
  if (!body.ok) return fail(body.error);

  try {
    const { navajoToken } = await sportlinkLogin(body.data.email, body.data.password);
    const leden = await sportlinkZoekLeden(navajoToken);
    const diff = await berekenDiff(leden);
    return ok(diff);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sportlink sync mislukt";
    return fail(message);
  }
}
