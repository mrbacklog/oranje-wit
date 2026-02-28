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
