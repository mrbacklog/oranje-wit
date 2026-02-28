import { NextResponse } from "next/server";
import type { ApiResponse } from "@oranje-wit/types";
import { logger } from "@oranje-wit/types";

export function ok<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ ok: true, data });
}

export function fail(
  message: string,
  status = 500,
  code = "INTERNAL_ERROR"
): NextResponse<ApiResponse<never>> {
  if (status >= 500) logger.error(`[API] ${code}: ${message}`);
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}
