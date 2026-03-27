/**
 * HTML email templates voor c.k.v. Oranje Wit authenticatie.
 *
 * Magic link email voor NextAuth EmailProvider.
 * Professioneel maar informeel, in lijn met de vereniging.
 */

/** Oranje Wit huisstijlkleuren */
const KLEUREN = {
  oranje: "#F97316",
  oranjeHover: "#EA580C",
  wit: "#FFFFFF",
  grijs: "#6B7280",
  lichtGrijs: "#F3F4F6",
  tekst: "#1F2937",
} as const;

/**
 * Genereer de HTML voor een magic link email.
 *
 * @param url - De volledige verificatie-URL die NextAuth genereert
 * @param host - Het domein (bijv. "teamindeling.ckvoranjewit.app")
 */
export function magicLinkEmail({ url, host }: { url: string; host: string }): string {
  const escapedHost = host.replace(/\./g, "&#8203;.");

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inloggen bij c.k.v. Oranje Wit</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: ${KLEUREN.lichtGrijs};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${KLEUREN.lichtGrijs}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: ${KLEUREN.wit}; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: ${KLEUREN.oranje}; padding: 24px 32px; text-align: center;">
              <h1 style="margin: 0; color: ${KLEUREN.wit}; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">
                c.k.v. Oranje Wit
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px; color: ${KLEUREN.tekst}; font-size: 18px; font-weight: 600;">
                Inloggen bij ${escapedHost}
              </h2>
              <p style="margin: 0 0 24px; color: ${KLEUREN.grijs}; font-size: 15px; line-height: 1.6;">
                Klik op de onderstaande knop om in te loggen. Deze link is 24 uur geldig en kan maar een keer worden gebruikt.
              </p>

              <!-- Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${url}"
                       target="_blank"
                       style="display: inline-block; background-color: ${KLEUREN.oranje}; color: ${KLEUREN.wit}; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px; letter-spacing: 0.3px;">
                      Inloggen
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 8px; color: ${KLEUREN.grijs}; font-size: 13px; line-height: 1.5;">
                Als de knop niet werkt, kopieer dan deze link in je browser:
              </p>
              <p style="margin: 0 0 24px; word-break: break-all; color: ${KLEUREN.oranje}; font-size: 13px; line-height: 1.5;">
                ${url}
              </p>

              <hr style="border: none; border-top: 1px solid ${KLEUREN.lichtGrijs}; margin: 24px 0;">

              <p style="margin: 0; color: ${KLEUREN.grijs}; font-size: 12px; line-height: 1.5;">
                Als je deze email niet hebt aangevraagd, kun je hem veilig negeren. Iemand heeft mogelijk per ongeluk jouw emailadres ingevuld.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: ${KLEUREN.lichtGrijs}; padding: 16px 32px; text-align: center;">
              <p style="margin: 0; color: ${KLEUREN.grijs}; font-size: 12px;">
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
}

/**
 * Platte-tekst versie van de magic link email (voor email clients zonder HTML).
 */
export function magicLinkEmailText({ url, host }: { url: string; host: string }): string {
  return `Inloggen bij ${host}

Klik op de onderstaande link om in te loggen bij c.k.v. Oranje Wit.
Deze link is 24 uur geldig en kan maar een keer worden gebruikt.

${url}

Als je deze email niet hebt aangevraagd, kun je hem veilig negeren.

---
c.k.v. Oranje Wit - Korfbal met plezier`;
}
