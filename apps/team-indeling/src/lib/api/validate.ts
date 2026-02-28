import type { ZodSchema } from "zod";
import { ZodError } from "zod";
import { fail } from "./response";

export async function parseBody<T>(request: Request, schema: ZodSchema<T>) {
  try {
    const body = await request.json();
    return { ok: true as const, data: schema.parse(body) };
  } catch (error) {
    if (error instanceof ZodError) {
      const msg = error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
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
