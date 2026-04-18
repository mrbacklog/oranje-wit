import { NextRequest, NextResponse } from "next/server";
import { guardTC } from "@oranje-wit/auth/checks";
import { parseBody } from "@oranje-wit/types";
import { logger } from "@oranje-wit/types";
import { z } from "zod";
import { sportlinkLogin, sportlinkZoekLeden } from "@/lib/sportlink/client";
import { berekenDiff } from "@/lib/sportlink/diff";

const SyncSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * Streaming sync endpoint — stuurt voortgang als SSE events.
 *
 * Events:
 *   { stap: "login", tekst: "Inloggen bij Sportlink..." }
 *   { stap: "filters", tekst: "Filters ophalen..." }
 *   { stap: "leden", tekst: "1707 leden opgehaald", aantal: 1707 }
 *   { stap: "diff", tekst: "Vergelijken met 234 spelers...", aantal: 234 }
 *   { stap: "klaar", diff: { nieuwe: [...], afgemeld: [...], fuzzyMatches: [...] } }
 *   { stap: "fout", tekst: "Foutmelding" }
 */
export async function POST(req: NextRequest) {
  const guard = await guardTC();
  if (!guard.ok) return guard.response;

  const body = await parseBody(req, SyncSchema);
  if (!body.ok) return body.response;

  const { email, password } = body.data;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        send({ stap: "login", tekst: "Inloggen bij Sportlink..." });
        const { navajoToken } = await sportlinkLogin(email, password);

        send({ stap: "filters", tekst: "Filters ophalen..." });
        const leden = await sportlinkZoekLeden(navajoToken);

        send({
          stap: "leden",
          tekst: `${leden.length} leden opgehaald`,
          aantal: leden.length,
        });

        send({ stap: "diff", tekst: "Vergelijken met spelerspool..." });
        const diff = await berekenDiff(leden);

        const totaal = diff.nieuwe.length + diff.afgemeld.length + diff.fuzzyMatches.length;
        send({
          stap: "klaar",
          tekst: `${totaal} wijzigingen gevonden`,
          diff,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Sportlink sync mislukt";
        logger.error("[sportlink] Sync fout:", message);
        send({ stap: "fout", tekst: message });
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
