// Mono-app: alle domeinen routeren naar dezelfde Railway service
const MONO_APP_TARGET = "ckvoranjewitapp-production.up.railway.app";

const DOMAIN_MAP = {
  "www.ckvoranjewit.app": MONO_APP_TARGET,
  "ckvoranjewit.app": MONO_APP_TARGET,
  "monitor.ckvoranjewit.app": MONO_APP_TARGET,
  "teamindeling.ckvoranjewit.app": MONO_APP_TARGET,
  "evaluaties.ckvoranjewit.app": MONO_APP_TARGET,
  "scout.ckvoranjewit.app": MONO_APP_TARGET,
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
