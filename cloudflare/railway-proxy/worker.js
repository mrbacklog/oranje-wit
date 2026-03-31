// Mono-app: alle domeinen routeren naar dezelfde Railway service
const MONO_APP_TARGET = "ckvoranjewitapp-production.up.railway.app";
const CANONICAL_HOST = "www.ckvoranjewit.app";

// Subdomeinen die redirecten naar www + pad
const SUBDOMAIN_REDIRECTS = {
  "monitor.ckvoranjewit.app": "/monitor",
  "teamindeling.ckvoranjewit.app": "/teamindeling",
  "scout.ckvoranjewit.app": "/scouting",
};

// Domeinen die direct geproxied worden (niet redirecten)
const PROXY_DOMAINS = new Set([
  "www.ckvoranjewit.app",
  "ckvoranjewit.app",
  "evaluaties.ckvoranjewit.app", // Lovable app, niet redirecten
]);

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const hostname = url.hostname;

    // Apex → redirect naar www
    if (hostname === "ckvoranjewit.app") {
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }

    // Subdomeinen → redirect naar www + pad
    const redirectBase = SUBDOMAIN_REDIRECTS[hostname];
    if (redirectBase) {
      const path = url.pathname === "/" ? redirectBase : redirectBase + url.pathname;
      return Response.redirect(`https://${CANONICAL_HOST}${path}${url.search}`, 301);
    }

    // Proxy: www en evaluaties
    if (!PROXY_DOMAINS.has(hostname)) {
      return new Response("Not found", { status: 404 });
    }

    url.hostname = MONO_APP_TARGET;
    const response = await fetch(url.toString(), {
      method: request.method,
      headers: new Headers(
        [...request.headers.entries()].map(([k, v]) =>
          k.toLowerCase() === "host" ? [k, MONO_APP_TARGET] : [k, v]
        )
      ),
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
      redirect: "manual",
    });
    const headers = new Headers(response.headers);
    const location = headers.get("Location");
    if (location) headers.set("Location", location.replaceAll(MONO_APP_TARGET, hostname));
    return new Response(response.body, { status: response.status, headers });
  },
};
