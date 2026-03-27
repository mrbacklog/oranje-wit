"use server";

import { getCapabilities } from "@oranje-wit/auth/allowlist";
import { verstuurSmartlinkEmail } from "@oranje-wit/auth/smartlink-email";
import { maakToegangsToken } from "@oranje-wit/auth/tokens";
import { logger, type ActionResult } from "@oranje-wit/types";
import { z } from "zod";

const EmailSchema = z
  .string()
  .email()
  .transform((e) => e.toLowerCase());

export async function vraagSmartlinkAan(
  email: string
): Promise<ActionResult<{ methode: "google" | "smartlink" }>> {
  const parsed = EmailSchema.safeParse(email);
  if (!parsed.success) {
    return { ok: false, error: "Ongeldig e-mailadres" };
  }

  const cap = await getCapabilities(parsed.data);
  if (!cap) {
    // Gebruiker bestaat niet — GEEN foutmelding tonen (privacy)
    // Toch "check je inbox" tonen zodat je niet kunt achterhalen wie er bestaat
    return { ok: true, data: { methode: "smartlink" } };
  }

  // TC-lid -> stuur naar Google OAuth
  if (cap.isTC) {
    return { ok: true, data: { methode: "google" } };
  }

  // Anders -> genereer smartlink en stuur e-mail
  try {
    const token = await maakToegangsToken({
      email: parsed.data,
      type: "sessie",
      scope: {
        isTC: cap.isTC,
        isScout: cap.isScout,
        clearance: cap.clearance,
        doelgroepen: cap.doelgroepen,
      },
      verlooptOverDagen: 14,
    });

    const baseUrl = process.env.NEXTAUTH_URL || "https://ckvoranjewit.app";
    const link = `${baseUrl}/login/smartlink/${token}`;

    // Verstuur e-mail (in dev: gelogd naar console)
    await verstuurSmartlinkEmail({
      email: parsed.data,
      naam: "",
      url: link,
    });

    return { ok: true, data: { methode: "smartlink" } };
  } catch (error) {
    logger.warn("Smartlink generatie mislukt:", error);
    return { ok: false, error: "Er ging iets mis. Probeer het opnieuw." };
  }
}
