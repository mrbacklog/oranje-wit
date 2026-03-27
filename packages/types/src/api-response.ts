/**
 * Gedeelde API route helpers voor Next.js apps.
 *
 * ok()       — 200 JSON response
 * fail()     — error JSON response
 * parseBody() — Zod-validatie van request body
 *
 * Vereist `next` als peer dependency (alle apps in deze monorepo hebben dat).
 */

import { NextResponse } from "next/server";
import type { ZodSchema } from "zod";
import { ZodError } from "zod";
import type { ApiResponse } from "./api";
import { logger } from "./logger";

/** Opties voor ok() response */
export interface OkOptions {
  /** Cache-Control header waarde (bijv. "no-store") */
  cacheControl?: string;
}

/**
 * Standaard 200 JSON response.
 *
 * @param data - Response data
 * @param options - Optionele headers (bijv. { cacheControl: "no-store" })
 */
export function ok<T>(data: T, options?: OkOptions): NextResponse<ApiResponse<T>> {
  const headers: HeadersInit = {};
  if (options?.cacheControl) {
    headers["Cache-Control"] = options.cacheControl;
  }
  return NextResponse.json(
    { ok: true, data },
    Object.keys(headers).length > 0 ? { headers } : undefined
  );
}

/**
 * Error JSON response.
 *
 * @param message - Foutmelding
 * @param status - HTTP status code (default 500)
 * @param code - Foutcode (default "INTERNAL_ERROR")
 */
export function fail(
  message: string,
  status = 500,
  code = "INTERNAL_ERROR"
): NextResponse<ApiResponse<never>> {
  if (status >= 500) logger.error(`[API] ${code}: ${message}`);
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

/** Resultaat van parseBody: ok met data, of fout met response */
export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse<ApiResponse<never>> };

/**
 * Parse en valideer de JSON body van een Request met een Zod schema.
 *
 * @param request - Inkomend Request object
 * @param schema - Zod schema voor validatie
 * @returns ParseResult met data bij succes, of fail-response bij fout
 */
export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<ParseResult<T>> {
  try {
    const body = await request.json();
    return { ok: true as const, data: schema.parse(body) };
  } catch (error) {
    if (error instanceof ZodError) {
      const msg = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
      return {
        ok: false as const,
        response: fail(msg, 422, "VALIDATION_ERROR"),
      };
    }
    return {
      ok: false as const,
      response: fail("Ongeldige JSON", 400, "BAD_REQUEST"),
    };
  }
}
