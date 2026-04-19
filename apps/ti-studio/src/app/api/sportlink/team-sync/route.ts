import { NextRequest } from "next/server";
import { guardTC } from "@oranje-wit/auth/checks";
import { ok, fail, parseBody, logger } from "@oranje-wit/types";
import { z } from "zod";
import { sportlinkLogin, zoekTeams, teamSyncDryRun, syncTeams } from "@oranje-wit/sportlink";
import { HUIDIG_SEIZOEN } from "@oranje-wit/types";

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
});

/** Stap 3: Dry run */
export async function POST(req: NextRequest) {
  const guard = await guardTC();
  if (!guard.ok) return guard.response;

  const body = await parseBody(req, DryRunSchema);
  if (!body.ok) return body.response;

  try {
    const { email, password, spelvorm, periode } = body.data;
    const { navajoToken } = await sportlinkLogin(email, password);
    const teamleden = await zoekTeams(navajoToken, spelvorm);
    const dryRun = await teamSyncDryRun(teamleden, HUIDIG_SEIZOEN, periode, spelvorm);
    return ok(dryRun);
  } catch (error) {
    logger.error("[sportlink] Team-sync dry run fout:", error);
    return fail(error instanceof Error ? error.message : "Dry run mislukt");
  }
}

/** Stap 4: Apply */
export async function PUT(req: NextRequest) {
  const guard = await guardTC();
  if (!guard.ok) return guard.response;

  const body = await parseBody(req, ApplySchema);
  if (!body.ok) return body.response;

  try {
    const { email, password, spelvorm, periode, seizoen } = body.data;
    const { navajoToken } = await sportlinkLogin(email, password);
    const teamleden = await zoekTeams(navajoToken, spelvorm);
    const resultaat = await syncTeams(teamleden, seizoen, periode);
    return ok(resultaat);
  } catch (error) {
    logger.error("[sportlink] Team-sync apply fout:", error);
    return fail(error instanceof Error ? error.message : "Team-sync mislukt");
  }
}
