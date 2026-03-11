/**
 * Helper voor het testen van Next.js API route handlers.
 *
 * Roept de handler direct aan met een mock Request,
 * zonder HTTP server. Prisma en auth worden apart gemockt.
 */

interface CallRouteOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
  headers?: Record<string, string>;
  searchParams?: Record<string, string>;
}

interface CallRouteResult {
  status: number;
  data: unknown;
  headers: Headers;
}

export async function callRoute(
  handler: (req: Request, ctx?: { params: Promise<Record<string, string>> }) => Promise<Response>,
  options: CallRouteOptions = {}
): Promise<CallRouteResult> {
  const { method = "GET", body, params, headers = {}, searchParams } = options;

  let url = "http://localhost/test";
  if (searchParams) {
    const sp = new URLSearchParams(searchParams);
    url += `?${sp.toString()}`;
  }

  const requestInit: RequestInit = {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
  };

  if (body && method !== "GET") {
    requestInit.body = JSON.stringify(body);
  }

  const req = new Request(url, requestInit);

  const ctx = params ? { params: Promise.resolve(params) } : undefined;

  const res = await handler(req, ctx);

  let data: unknown;
  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return {
    status: res.status,
    data,
    headers: res.headers,
  };
}
