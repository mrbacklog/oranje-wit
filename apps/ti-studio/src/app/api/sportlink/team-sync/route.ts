import { NextRequest, NextResponse } from "next/server";
import { guardTC } from "@oranje-wit/auth/checks";
import { ok, fail, parseBody, logger, HUIDIG_SEIZOEN } from "@oranje-wit/types";
import { z } from "zod";
import { sportlinkLogin, zoekTeams, teamSyncDryRun, syncTeams } from "@oranje-wit/sportlink";

const DryRunSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  spelvorm: z.enum(["Veld", "Zaal"]),
  periode: z.enum(["veld_najaar", "veld_voorjaar", "zaal", "zaal_deel1", "zaal_deel2"]),
});

const ApplySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  spelvorm: z.enum(["Veld", "Zaal"]),
  periode: z.enum(["veld_najaar", "veld_voorjaar", "zaal", "zaal_deel1", "zaal_deel2"]),
  seizoen: z.string().optional().default(HUIDIG_SEIZOEN),
  nieuwRelCodes: z.array(z.string()).default([]),
  uitRelCodes: z.array(z.string()).default([]),
  wisselRelCodes: z.array(z.string()).default([]),
});

/** Stap 3: Dry run met SSE progress-stream */
export async function POST(req: NextRequest) {
  const guard = await guardTC();
  if (!guard.ok) return guard.response;

  const body = await parseBody(req, DryRunSchema);
  if (!body.ok) return body.response;

  const { email, password, spelvorm, periode } = body.data;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        send({ stap: "login", tekst: "Inloggen bij Sportlink..." });
        const { navajoToken } = await sportlinkLogin(email, password);

        send({ stap: "teams", tekst: "Teams ophalen..." });
        const teamleden = await zoekTeams(navajoToken, spelvorm);
        send({
          stap: "teams",
          tekst: `${teamleden.length} teamleden opgehaald`,
          aantal: teamleden.length,
        });

        send({ stap: "vergelijken", tekst: "Wijzigingen berekenen..." });
        const dryRun = await teamSyncDryRun(teamleden, HUIDIG_SEIZOEN, periode, spelvorm);

        send({
          stap: "klaar",
          tekst: "Dry-run voltooid",
          resultaat: dryRun,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Dry run mislukt";
        logger.error("[sportlink] Team-sync dry run fout:", message);
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

/** Stap 4: Apply — selectief per-item op basis van TC-keuzes */
export async function PUT(req: NextRequest) {
  const guard = await guardTC();
  if (!guard.ok) return guard.response;

  const body = await parseBody(req, ApplySchema);
  if (!body.ok) return body.response;

  try {
    const {
      email,
      password,
      spelvorm,
      periode,
      seizoen,
      nieuwRelCodes,
      uitRelCodes,
      wisselRelCodes,
    } = body.data;
    const { navajoToken } = await sportlinkLogin(email, password);
    const teamleden = await zoekTeams(navajoToken, spelvorm);
    const resultaat = await syncTeams(teamleden, seizoen ?? HUIDIG_SEIZOEN, periode, {
      nieuwRelCodes,
      uitRelCodes,
      wisselRelCodes,
    });
    return ok(resultaat);
  } catch (error) {
    logger.error("[sportlink] Team-sync apply fout:", error);
    return fail(error instanceof Error ? error.message : "Team-sync mislukt");
  }
}
