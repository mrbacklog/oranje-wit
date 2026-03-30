/**
 * HMAC-gesignde e-mail links — URL-generatie en e-mail template.
 *
 * Combineert signEmailLink() uit hmac-link.ts met een dark OW-stijl
 * e-mail template. Elke systeemmail bevat een auto-login link die
 * de ontvanger direct inlogt zonder wachtwoord of token-lookup.
 *
 * Gebruik:
 *   import { generateEmailHmacLink, hmacEmailTemplate } from "@oranje-wit/auth/email-hmac";
 *   const url = generateEmailHmacLink("trainer@example.com", "/evaluatie/invullen/abc123");
 *   const html = hmacEmailTemplate({ url, naam: "Jan", ... });
 */

import { signEmailLink } from "./hmac-link";
import { logger } from "@oranje-wit/types";

// ── Kleuren (inline, e-mail clients ondersteunen geen CSS variabelen) ──

const KLEUREN = {
  /** Pagina-achtergrond */
  pagina: "#0a0a0a",
  /** Kaart-achtergrond */
  kaart: "#141414",
  /** Kaart border */
  border: "#262626",
  /** Primaire tekst */
  tekst: "#fafafa",
  /** Secundaire tekst */
  tekstSecundair: "#a3a3a3",
  /** Gedempte tekst */
  tekstGedempt: "#666666",
  /** Footer tekst */
  tekstFooter: "#525252",
  /** OW Oranje (CTA-knop) */
  oranje: "#FF6B00",
  /** Separator */
  separator: "#262626",
} as const;

// ── URL-generatie ──────────────────────────────────────────────

/**
 * Genereer een volledige HMAC-gesignde auto-login URL.
 *
 * De URL wijst naar /auth/email-link/[token] waar de app het token
 * valideert en de gebruiker automatisch inlogt.
 *
 * @param email - E-mailadres van de ontvanger
 * @param destination - Optionele redirect na inloggen (bijv. "/evaluatie/invullen/abc123")
 * @param expiryDays - Geldigheid in dagen (default: 90)
 * @returns Volledige URL (bijv. "https://ckvoranjewit.app/auth/email-link/abc...xyz")
 */
export function generateEmailHmacLink(
  email: string,
  destination?: string,
  expiryDays?: number
): string {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || "http://localhost:3000";
  const token = signEmailLink(email, destination, expiryDays);
  const url = `${baseUrl}/auth/email-link/${token}`;

  logger.info(`HMAC e-mail link gegenereerd: ${email} -> ${destination ?? "/"}`);

  return url;
}

// ── E-mail template ────────────────────────────────────────────

export interface HmacEmailTemplateOpties {
  /** HMAC-gesignde auto-login URL (primaire CTA) */
  url: string;
  /** Naam van de ontvanger (voor begroeting) */
  naam?: string;
  /** Onderwerpregel context (bijv. "Evaluatie invullen") */
  actie: string;
  /** Beschrijvende tekst onder de begroeting */
  beschrijving: string;
  /** Tekst op de CTA-knop (default: actie + " ->") */
  knopTekst?: string;
  /** Optionele deadline tekst (bijv. "voor 15 april 2026") */
  deadline?: string;
}

/**
 * Genereer een dark OW-stijl e-mail HTML met HMAC auto-login link.
 *
 * Ontwerp:
 * - Dark achtergrond (#0a0a0a) met donkere kaart (#141414)
 * - Oranje CTA-knop (#FF6B00)
 * - Witte tekst, Arial/Helvetica
 * - Inline CSS (geen variabelen)
 * - Plaintext fallback-link onder de knop
 * - Footer met directe link naar de app
 */
export function hmacEmailTemplate(opties: HmacEmailTemplateOpties): string {
  const { url, naam, actie, beschrijving, knopTekst, deadline } = opties;
  const begroeting = naam ? `Hoi ${naam}` : "Hoi";
  const knop = knopTekst ?? `${actie} &rarr;`;
  const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || "https://ckvoranjewit.app";

  const deadlineHtml = deadline
    ? `<p style="margin: 0 0 24px; color: ${KLEUREN.tekstSecundair}; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.6;">
                  <strong style="color: ${KLEUREN.tekst};">Deadline:</strong> ${deadline}
                </p>`
    : "";

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${actie} — c.k.v. Oranje Wit</title>
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
                ${beschrijving}
              </p>

              ${deadlineHtml}

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${url}"
                       target="_blank"
                       style="display: inline-block; background-color: ${KLEUREN.oranje}; color: #ffffff; text-decoration: none; font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 12px; letter-spacing: 0.3px;">
                      ${knop}
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

              <hr style="border: none; border-top: 1px solid ${KLEUREN.separator}; margin: 24px 0;">

              <p style="margin: 0; color: ${KLEUREN.tekstFooter}; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 1.5;">
                Als je deze e-mail niet hebt aangevraagd, kun je hem veilig negeren.
              </p>
            </td>
          </tr>

          <!-- Footer met directe app-link -->
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
}

/**
 * Platte-tekst versie van de HMAC e-mail (voor e-mail clients zonder HTML).
 */
export function hmacEmailTemplateText(opties: HmacEmailTemplateOpties): string {
  const begroeting = opties.naam ? `Hoi ${opties.naam}` : "Hoi";
  const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || "https://ckvoranjewit.app";
  const deadlineTekst = opties.deadline ? `\nDeadline: ${opties.deadline}\n` : "";

  return `${begroeting},

${opties.beschrijving}
${deadlineTekst}
${opties.actie}:
${opties.url}

---
c.k.v. Oranje Wit - Korfbal met plezier
${baseUrl}

Als je deze e-mail niet hebt aangevraagd, kun je hem veilig negeren.`;
}
