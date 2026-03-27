import { ok as baseOk, type OkOptions } from "@oranje-wit/types";
import type { NextResponse } from "next/server";
import type { ApiResponse } from "@oranje-wit/types";

export { fail } from "@oranje-wit/types";

/**
 * Team-Indeling variant van ok() met Cache-Control: no-store standaard.
 * Voorkomt dat Next.js gecachte data teruggeeft bij scenario-mutaties.
 */
export function ok<T>(data: T, options?: OkOptions): NextResponse<ApiResponse<T>> {
  return baseOk(data, { cacheControl: "no-store", ...options });
}
