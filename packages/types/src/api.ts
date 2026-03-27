/** Standaard API error shape */
export interface ApiError {
  code: string;
  message: string;
}

/** Standaard API response wrapper */
export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: ApiError;
}

/**
 * Result type voor Server Actions.
 * Gebruik in plaats van lokale ActionResult definities.
 */
export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };
