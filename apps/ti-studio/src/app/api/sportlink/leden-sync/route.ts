import { NextRequest, NextResponse } from "next/server";
import { guardTC } from "@oranje-wit/auth/checks";
import { parseBody, logger } from "@oranje-wit/types";
import { z } from "zod";
import {
  sportlinkLogin,
  zoekLeden,
  syncLeden,
  haalNotificatiesOp,
  syncNotificaties,
} from "@oranje-wit/sportlink";

const SyncSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

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

        send({ stap: "leden", tekst: "Leden ophalen..." });
        const leden = await zoekLeden(navajoToken);
        send({ stap: "leden", tekst: `${leden.length} leden opgehaald`, aantal: leden.length });

        send({ stap: "sync", tekst: "Leden synchroniseren..." });
        const resultaat = await syncLeden(leden);
        send({
          stap: "sync",
          tekst: `${resultaat.nieuw} nieuw, ${resultaat.bijgewerkt} bijgewerkt`,
          resultaat,
        });

        send({ stap: "notificaties", tekst: "Notificaties ophalen..." });
        const dertigDagenGeleden = new Date();
        dertigDagenGeleden.setDate(dertigDagenGeleden.getDate() - 30);
        const datumVanaf = dertigDagenGeleden.toISOString().slice(0, 10);
        const notificaties = await haalNotificatiesOp(navajoToken, datumVanaf);
        const notifResultaat = await syncNotificaties(notificaties);
        send({
          stap: "notificaties",
          tekst: `${notifResultaat.opgeslagen} notificaties opgeslagen`,
          notifResultaat,
        });

        send({ stap: "klaar", tekst: "Sync voltooid", resultaat, notifResultaat });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Leden-sync mislukt";
        logger.error("[sportlink] Leden-sync fout:", message);
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
