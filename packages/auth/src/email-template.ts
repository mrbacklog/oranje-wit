/**
 * HTML email templates voor c.k.v. Oranje Wit authenticatie.
 *
 * Magic link email voor NextAuth EmailProvider.
 * Dark OW-stijl: donkere achtergrond, oranje accent, Arial font.
 */

/** Dark OW huisstijlkleuren (inline — e-mail clients ondersteunen geen CSS variabelen) */
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

/**
 * Genereer de HTML voor een magic link email.
 *
 * @param url - De volledige verificatie-URL die NextAuth genereert
 * @param host - Het domein (bijv. "ckvoranjewit.app")
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
              <p style="margin: 0 0 16px; color: ${KLEUREN.tekst}; font-family: Arial, Helvetica, sans-serif; font-size: 18px; font-weight: 600;">
                Inloggen bij ${escapedHost}
              </p>
              <p style="margin: 0 0 24px; color: ${KLEUREN.tekstSecundair}; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6;">
                Klik op de onderstaande knop om in te loggen. Deze link is 24 uur geldig en kan maar een keer worden gebruikt.
              </p>

              <!-- Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${url}"
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
                <a href="${url}" style="color: ${KLEUREN.oranje}; text-decoration: none;">${url}</a>
              </p>

              <hr style="border: none; border-top: 1px solid ${KLEUREN.border}; margin: 24px 0;">

              <p style="margin: 0; color: ${KLEUREN.tekstFooter}; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 1.5;">
                Als je deze e-mail niet hebt aangevraagd, kun je hem veilig negeren.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: ${KLEUREN.pagina}; padding: 16px 32px; text-align: center; border-top: 1px solid ${KLEUREN.border};">
              <p style="margin: 0; color: ${KLEUREN.tekstFooter}; font-family: Arial, Helvetica, sans-serif; font-size: 12px;">
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

Als je deze e-mail niet hebt aangevraagd, kun je hem veilig negeren.

---
c.k.v. Oranje Wit - Korfbal met plezier`;
}
