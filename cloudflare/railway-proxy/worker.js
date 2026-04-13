const DOMAIN_MAP = {
  // Geconsolideerde app (main)
  "www.ckvoranjewit.app": "ckvoranjewitapp-production.up.railway.app",
  "monitor.ckvoranjewit.app": "ckvoranjewitapp-production.up.railway.app",
  "scout.ckvoranjewit.app": "ckvoranjewitapp-production.up.railway.app",
  // TI Studio — standalone app (Fase B splitsing)
  "teamindeling.ckvoranjewit.app": "ti-studio-production.up.railway.app",
  // Legacy evaluatie-app (Lovable, eigen service)
  "evaluaties.ckvoranjewit.app": "evaluatie-production.up.railway.app",
};

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const hostname = url.hostname;

  // Apex → redirect naar www
  if (hostname === "ckvoranjewit.app") {
    url.hostname = "www.ckvoranjewit.app";
    return Response.redirect(url.toString(), 301);
  }

  const target = DOMAIN_MAP[hostname];
  if (!target) return new Response("Not found", { status: 404 });

  url.hostname = target;
  const response = await fetch(url.toString(), {
    method: request.method,
    headers: new Headers(
      [...request.headers.entries()].map(([k, v]) =>
        k.toLowerCase() === "host" ? [k, target] : [k, v]
      )
    ),
    body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
    redirect: "manual",
  });
  const headers = new Headers(response.headers);
  const location = headers.get("Location");
  if (location) headers.set("Location", location.replaceAll(target, hostname));
  return new Response(response.body, { status: response.status, headers });
}
