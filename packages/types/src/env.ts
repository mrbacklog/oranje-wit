import { z } from "zod";
import { logger } from "./logger";

/**
 * Environment variabelen validatie met Zod.
 *
 * Drie groepen:
 * 1. Altijd verplicht (DATABASE_URL, AUTH_SECRET)
 * 2. Verplicht in productie, optioneel in test/CI (Google OAuth)
 * 3. Optioneel (API keys, Railway, email)
 */

const isProduction = process.env.NODE_ENV === "production";

const envSchema = z.object({
  // === Altijd verplicht ===
  DATABASE_URL: z.string().min(1, "DATABASE_URL is verplicht"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is verplicht"),

  // === Verplicht in productie, optioneel in test/CI ===
  AUTH_GOOGLE_ID: isProduction
    ? z.string().min(1, "AUTH_GOOGLE_ID is verplicht in productie")
    : z.string().optional(),
  AUTH_GOOGLE_SECRET: isProduction
    ? z.string().min(1, "AUTH_GOOGLE_SECRET is verplicht in productie")
    : z.string().optional(),

  // === Optioneel ===
  AUTH_URL: z.string().optional(),
  NEXTAUTH_URL: z.string().optional(),
  EMAIL_LINK_SECRET: z.string().min(32).optional(),
  EMAIL_SERVER: z.string().optional(),
  CLEANUP_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  RAILWAY_GIT_COMMIT_SHA: z.string().optional(),
  E2E_TEST: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
});

export type EnvVars = z.infer<typeof envSchema>;

/**
 * Valideer process.env en retourneer typed object.
 *
 * Skip strenge validatie als:
 * - E2E_TEST === "true" (Playwright tests)
 * - DATABASE_URL begint met "postgresql://dummy:" (CI build dummy values)
 */
export function validateEnv(): EnvVars {
  const isE2E = process.env.E2E_TEST === "true";
  const isDummyDb = process.env.DATABASE_URL?.startsWith("postgresql://dummy:");

  if (isE2E || isDummyDb) {
    logger.info("Env validatie overgeslagen (E2E of dummy DB)");
    return process.env as unknown as EnvVars;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    const message = `Ongeldige environment variabelen:\n${missing}`;
    logger.error(message);
    throw new Error(message);
  }

  logger.info("Environment variabelen gevalideerd");
  return result.data;
}
