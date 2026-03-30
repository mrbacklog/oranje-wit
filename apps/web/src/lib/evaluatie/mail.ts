import nodemailer from "nodemailer";
import { logger } from "@oranje-wit/types";
import { generateEmailHmacLink } from "@oranje-wit/auth/email-hmac";
import { prisma } from "@/lib/db/prisma";

// Prisma 7 type recursie workaround (TS2321)
type PrismaFn = (...args: any[]) => any;

// Re-export voor gebruik in API routes
export { generateEmailHmacLink };

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

/** Vervang {{sleutel}} placeholders in een HTML-template */
export function renderTemplate(html: string, variabelen: Record<string, string>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return variabelen[key] ?? match;
  });
}

/** Haal een e-mail template op uit de database en render met variabelen */
export async function haalTemplateOp(
  sleutel: string,
  variabelen: Record<string, string>
): Promise<{ onderwerp: string; html: string } | null> {
  const template = await (prisma.emailTemplate.findUnique as PrismaFn)({
    where: { sleutel },
  });

  if (!template) {
    logger.warn(`E-mail template '${sleutel}' niet gevonden`);
    return null;
  }

  return {
    onderwerp: renderTemplate(template.onderwerp, variabelen),
    html: renderTemplate(template.inhoudHtml, variabelen),
  };
}

/** Verstuur een e-mail */
export async function verstuurEmail(params: {
  aan: string;
  onderwerp: string;
  html: string;
}): Promise<void> {
  try {
    await transporter.sendMail({
      from: '"c.k.v. Oranje Wit" <noreply@ckvoranjewit.app>',
      to: params.aan,
      subject: params.onderwerp,
      html: params.html,
    });
    logger.info(`E-mail verstuurd naar ${params.aan}: ${params.onderwerp}`);
  } catch (error) {
    logger.error("E-mail versturen mislukt:", error);
    throw error;
  }
}

/** Haal template op, render, en verstuur in een stap */
export async function verstuurTemplateEmail(params: {
  aan: string;
  templateSleutel: string;
  variabelen: Record<string, string>;
}): Promise<boolean> {
  const template = await haalTemplateOp(params.templateSleutel, params.variabelen);
  if (!template) return false;

  await verstuurEmail({
    aan: params.aan,
    onderwerp: template.onderwerp,
    html: template.html,
  });
  return true;
}
