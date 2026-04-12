// apps/web/src/app/api/ti-studio/indeling/[versieId]/stream/route.ts
// SSE-endpoint: stuurt werkbord-events naar de browser via PostgreSQL LISTEN/NOTIFY.
// Elke browser-tab die dit endpoint opent krijgt een pg-verbinding.
// De verbinding wordt gesloten zodra de client weggaat (req.signal abort).
import { guardTC } from "@oranje-wit/auth/checks";
import { logger } from "@oranje-wit/types";
import { Client } from "pg";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ versieId: string }> }) {
  const auth = await guardTC();
  if (!auth.ok) return auth.response;

  const { versieId } = await params;
  const kanaal = `ti_studio_${versieId}`.slice(0, 63);

  // Gebruik DATABASE_DIRECT_URL als die beschikbaar is — PgBouncer (transaction-mode)
  // ondersteunt LISTEN/NOTIFY niet. DATABASE_DIRECT_URL bypassed de pooler.
  const connStr = process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL;

  const pgClient = new Client({
    connectionString: connStr,
    // Railway interne PostgreSQL (postgres.railway.internal) ondersteunt geen SSL.
    // ssl: false voorkomt dat pg een SSL-handshake probeert.
    ssl: false,
  });

  try {
    await pgClient.connect();
    await pgClient.query(`LISTEN "${kanaal}"`);
  } catch (error) {
    logger.warn("SSE stream: database verbinding mislukt", { versieId, error });
    return new Response("Database verbinding mislukt", { status: 503 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Stuur meteen een ping zodat de client weet dat de verbinding actief is
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "ping" })}\n\n`));

      pgClient.on("notification", (msg) => {
        if (!msg.payload) return;
        try {
          controller.enqueue(encoder.encode(`data: ${msg.payload}\n\n`));
        } catch {
          // Stream al gesloten
        }
      });

      pgClient.on("error", () => {
        try {
          controller.close();
        } catch {
          /* al gesloten */
        }
        pgClient.end().catch(() => {
          /* negeer */
        });
      });

      // Keepalive comment elke 25 seconden (proxies/nginx sluiten idle verbindingen)
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        } catch {
          clearInterval(keepalive);
        }
      }, 25000);

      request.signal.addEventListener("abort", () => {
        clearInterval(keepalive);
        try {
          controller.close();
        } catch {
          /* al gesloten */
        }
        pgClient.query(`UNLISTEN "${kanaal}"`).finally(() =>
          pgClient.end().catch(() => {
            /* negeer */
          })
        );
      });
    },
    cancel() {
      pgClient.query(`UNLISTEN "${kanaal}"`).finally(() =>
        pgClient.end().catch(() => {
          /* negeer */
        })
      );
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
