/**
 * Smartlink-specifieke e-mail template en verzendfunctie.
 *
 * Verstuurt een dark-themed e-mail met een inloglink.
 * De link is typisch 14 dagen geldig (bepaald door de token-generatie).
 */

import { verstuurEmail } from "./email";

/**
 * Verstuur een smartlink e-mail naar een gebruiker.
 *
 * @returns true als de e-mail succesvol is verstuurd (of in dev: gelogd)
 */
export async function verstuurSmartlinkEmail(params: {
  email: string;
  naam: string;
  url: string;
}): Promise<boolean> {
  const begroeting = params.naam ? `Hoi ${params.naam}` : "Hoi";

  const html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inloggen bij c.k.v. Oranje Wit</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #141414; border-radius: 16px; overflow: hidden; border: 1px solid #262626;">

          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px 0; text-align: left;">
              <h1 style="margin: 0; color: #FF6B00; font-size: 20px; font-weight: 700; letter-spacing: 0.3px;">
                c.k.v. Oranje Wit
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 24px 32px 32px;">
              <p style="margin: 0 0 8px; color: #fafafa; font-size: 16px; font-weight: 500;">
                ${begroeting},
              </p>
              <p style="margin: 0 0 24px; color: #a3a3a3; font-size: 15px; line-height: 1.6;">
                Klik op de knop hieronder om in te loggen. Deze link is 14 dagen geldig.
              </p>

              <!-- Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${params.url}"
                       target="_blank"
                       style="display: inline-block; background-color: #FF6B00; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 12px; letter-spacing: 0.3px;">
                      Inloggen
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 8px; color: #666666; font-size: 13px; line-height: 1.5;">
                Werkt de knop niet? Kopieer deze link:
              </p>
              <p style="margin: 0 0 24px; word-break: break-all; color: #FF6B00; font-size: 13px; line-height: 1.5;">
                <a href="${params.url}" style="color: #FF6B00; text-decoration: none;">${params.url}</a>
              </p>

              <hr style="border: none; border-top: 1px solid #262626; margin: 24px 0;">

              <p style="margin: 0; color: #525252; font-size: 12px; line-height: 1.5;">
                Als je deze e-mail niet hebt aangevraagd, kun je hem veilig negeren.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0a0a0a; padding: 16px 32px; text-align: center; border-top: 1px solid #262626;">
              <p style="margin: 0; color: #525252; font-size: 12px;">
                c.k.v. Oranje Wit &mdash; Korfbal met plezier
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
