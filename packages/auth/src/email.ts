/**
 * Centraal e-mail versturen voor c.k.v. Oranje Wit.
 *
 * In development (NODE_ENV=development of geen EMAIL_SERVER):
 *   → log naar console, verstuur niet.
 * In productie met EMAIL_SERVER:
 *   → verstuur via SMTP (nodemailer).
 *
 * BELANGRIJK: importeer dit ALLEEN in server-side code (server actions,
 * API routes). Nodemailer gebruikt Node.js 'stream' module die
 * incompatibel is met Edge Runtime (middleware).
 */

import { logger } from "@oranje-wit/types";

export interface EmailOpties {
  aan: string;
  onderwerp: string;
  html: string;
}

const isDev = process.env.NODE_ENV === "development";

/**
 * Verstuur een e-mail. In development: log naar console.
 * In productie: gebruik SMTP via EMAIL_SERVER env var.
 *
 * EMAIL_SERVER formaat: smtp://user:pass@smtp.example.com:587
 * Of de Nodemailer connection string notatie.
 *
 * @returns true als de e-mail succesvol is verstuurd (of in dev: gelogd)
 */
export async function verstuurEmail(opties: EmailOpties): Promise<boolean> {
  if (isDev || !process.env.EMAIL_SERVER) {
    logger.info(`[DEV EMAIL] Aan: ${opties.aan}`);
    logger.info(`[DEV EMAIL] Onderwerp: ${opties.onderwerp}`);
    logger.info(`[DEV EMAIL] Body: ${opties.html.substring(0, 200)}...`);
    return true;
  }

  try {
    // Lazy import: nodemailer wordt pas geladen wanneer we echt versturen.
    // Dit voorkomt problemen in omgevingen waar nodemailer niet beschikbaar is.
    const nodemailer = await import("nodemailer");
    const transport = nodemailer.default.createTransport(process.env.EMAIL_SERVER);

    await transport.sendMail({
      from: process.env.EMAIL_FROM || '"c.k.v. Oranje Wit" <noreply@ckvoranjewit.app>',
      to: opties.aan,
      subject: opties.onderwerp,
      html: opties.html,
    });

    logger.info(`E-mail verstuurd naar ${opties.aan}: ${opties.onderwerp}`);
    return true;
  } catch (error) {
    logger.warn("E-mail versturen mislukt:", error);
    return false;
  }
}
