const DOMAIN_MAP = {
  "monitor.ckvoranjewit.app": "monitor-production-b2b1.up.railway.app",
  "teamindeling.ckvoranjewit.app": "team-indeling-production.up.railway.app",
  "evaluaties.ckvoranjewit.app": "evaluatie-production.up.railway.app",
  "scout.ckvoranjewit.app": "scouting-production-6128.up.railway.app",
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = DOMAIN_MAP[url.hostname];
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
    if (location) headers.set("Location", location.replaceAll(target, url.hostname));
    return new Response(response.body, { status: response.status, headers });
  },
};
