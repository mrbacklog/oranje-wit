/**
 * Smartlink-specifieke e-mail template en verzendfunctie.
 *
 * Verstuurt een dark OW-stijl e-mail met een inloglink.
 * Ondersteunt twee link-methoden:
 *   1. ToegangsToken (default): URL met ?token= parameter, 14 dagen geldig
 *   2. HMAC (optioneel): stateless auto-login via /auth/email-link/[token]
 *
 * De methode wordt bepaald door de caller — backward compatible.
 */

import { verstuurEmail } from "./email";
import { generateEmailHmacLink } from "./email-hmac";
import { logger } from "@oranje-wit/types";

/** Dark OW kleuren (inline CSS, geen variabelen) */
const KLEUREN = {
  pagina: "#0a0a0a",
  kaart: "#141414",
  border: "#262626",
  tekst: "#fafafa",
  tekstSecundair: "#a3a3a3",
  tekstGedempt: "#666666",
  tekstFooter: "#525252",
  oranje: "#FF6B00",
} as const;

export interface SmartlinkEmailParams {
  email: string;
  naam: string;
  /** De volledige inloglink (ToegangsToken-methode) */
  url: string;
  /**
   * Gebruik HMAC-link i.p.v. de meegegeven url.
   * Wanneer true: genereert een stateless HMAC-link.
   * De `url` parameter wordt dan genegeerd.
   */
  gebruikHmac?: boolean;
  /**
   * Redirect-bestemming na HMAC-login (bijv. "/evaluatie").
   * Alleen gebruikt als `gebruikHmac` is true.
   */
  hmacDestination?: string;
}

/**
 * Verstuur een smartlink e-mail naar een gebruiker.
 *
 * @returns true als de e-mail succesvol is verstuurd (of in dev: gelogd)
 */
export async function verstuurSmartlinkEmail(params: SmartlinkEmailParams): Promise<boolean> {
  const begroeting = params.naam ? `Hoi ${params.naam}` : "Hoi";

  // Bepaal de link: HMAC of ToegangsToken
  let inlogUrl: string;
  let geldigheid: string;

  if (params.gebruikHmac) {
    inlogUrl = generateEmailHmacLink(params.email, params.hmacDestination);
    geldigheid = "90 dagen";
    logger.info(`Smartlink e-mail met HMAC-link voor ${params.email}`);
  } else {
    inlogUrl = params.url;
    geldigheid = "14 dagen";
  }

  const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || "https://ckvoranjewit.app";

  const html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inloggen bij c.k.v. Oranje Wit</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: ${KLEUREN.pagina};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${KLEUREN.pagina}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: ${KLEUREN.kaart}; border-radius: 16px; overflow: hidden; border: 1px solid ${KLEUREN.border};">

          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px 0; text-align: left;">
              <h1 style="margin: 0; color: ${KLEUREN.oranje}; font-family: Arial, Helvetica, sans-serif; font-size: 20px; font-weight: 700; letter-spacing: 0.3px;">
                c.k.v. Oranje Wit
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 24px 32px 32px;">
              <p style="margin: 0 0 8px; color: ${KLEUREN.tekst}; font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 500;">
                ${begroeting},
              </p>
              <p style="margin: 0 0 24px; color: ${KLEUREN.tekstSecundair}; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6;">
                Klik op de knop hieronder om in te loggen. Deze link is ${geldigheid} geldig.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${inlogUrl}"
                       target="_blank"
                       style="display: inline-block; background-color: ${KLEUREN.oranje}; color: #ffffff; text-decoration: none; font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 12px; letter-spacing: 0.3px;">
                      Inloggen &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Plaintext fallback -->
              <p style="margin: 0 0 8px; color: ${KLEUREN.tekstGedempt}; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.5;">
                Werkt de knop niet? Kopieer deze link:
              </p>
              <p style="margin: 0 0 24px; word-break: break-all; color: ${KLEUREN.oranje}; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.5;">
                <a href="${inlogUrl}" style="color: ${KLEUREN.oranje}; text-decoration: none;">${inlogUrl}</a>
              </p>

              <hr style="border: none; border-top: 1px solid ${KLEUREN.border}; margin: 24px 0;">

              <p style="margin: 0; color: ${KLEUREN.tekstFooter}; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 1.5;">
                Als je deze e-mail niet hebt aangevraagd, kun je hem veilig negeren.
              </p>
            </td>
          </tr>

          <!-- Footer met directe link naar de app -->
          <tr>
            <td style="background-color: ${KLEUREN.pagina}; padding: 16px 32px; text-align: center; border-top: 1px solid ${KLEUREN.border};">
              <p style="margin: 0 0 8px; color: ${KLEUREN.tekstFooter}; font-family: Arial, Helvetica, sans-serif; font-size: 12px;">
                c.k.v. Oranje Wit &mdash; Korfbal met plezier
              </p>
              <p style="margin: 0;">
                <a href="${baseUrl}" style="color: ${KLEUREN.tekstGedempt}; font-family: Arial, Helvetica, sans-serif; font-size: 11px; text-decoration: none;">
                  ${baseUrl.replace(/^https?:\/\//, "")}
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return verstuurEmail({
    aan: params.email,
    onderwerp: "Je inloglink voor c.k.v. Oranje Wit",
    html,
  });
}
