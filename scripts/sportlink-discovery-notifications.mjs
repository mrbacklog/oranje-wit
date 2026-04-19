/**
 * Sportlink Discovery — Notifications/Mutations endpoint zoeken
 *
 * Probeert alle mogelijke entity-namen voor de notifications/mutations pagina.
 */

import crypto from "crypto";

const KEYCLOAK_BASE = "https://idm.sportlink.com/realms/sportlink";
const NAVAJO_BASE = "https://clubweb.sportlink.com/navajo/entity/common/clubweb";
const CLIENT_ID = "sportlink-club-web";
const REDIRECT_URI = "https://clubweb.sportlink.com";
const CLUB_ID = "NCX19J3";

function extractCookies(h) {
  if (typeof h.getSetCookie === "function") return h.getSetCookie();
  const r = h.get("set-cookie");
  return r ? r.split(/,\s*(?=[A-Z_]+=)/i).filter(Boolean) : [];
}

async function login(email, password) {
  const cv = crypto.randomBytes(32).toString("base64url");
  const cc = crypto.createHash("sha256").update(cv).digest("base64url");
  const st = crypto.randomBytes(16).toString("hex");
  const authUrl =
    `${KEYCLOAK_BASE}/protocol/openid-connect/auth?` +
    new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: "openid",
      state: st,
      code_challenge: cc,
      code_challenge_method: "S256",
    });
  const ar = await fetch(authUrl, { redirect: "manual" });
  const ah = await ar.text();
  const ck = extractCookies(ar.headers);
  const cs = ck.map((c) => c.split(";")[0]).join("; ");
  const am = ah.match(/action="([^"]+)"/);
  if (!am) throw new Error("Geen form action");
  const lr = await fetch(am[1].replace(/&amp;/g, "&"), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: cs },
    body: new URLSearchParams({ username: email, password }),
    redirect: "manual",
  });
  let ru = lr.headers.get("location");
  if (!ru) {
    const lh = await lr.text();
    const om = lh.match(/action="([^"]+)"/);
    if (!om) throw new Error("Onverwacht");
    const lc = extractCookies(lr.headers);
    const ac = [...ck, ...lc].map((c) => c.split(";")[0]).join("; ");
    const or = await fetch(om[1].replace(/&amp;/g, "&"), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: ac },
      body: new URLSearchParams({}),
      redirect: "manual",
    });
    ru = or.headers.get("location");
  }
  if (!ru?.includes("code=")) throw new Error("Geen code");
  const tr = await fetch(`${KEYCLOAK_BASE}/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      code: new URL(ru).searchParams.get("code"),
      redirect_uri: REDIRECT_URI,
      code_verifier: cv,
    }),
  });
  const td = await tr.json();
  const ll = await fetch(`${NAVAJO_BASE}/user/LinkToPerson`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${td.access_token}`,
      "Content-Type": "text/plain;charset=UTF-8",
      "X-Navajo-Entity": "user/LinkToPerson",
      "X-Navajo-Instance": "Generic",
      "X-Navajo-Locale": "nl",
    },
    body: JSON.stringify({ ClubId: CLUB_ID, UnionId: "KNKV" }),
  });
  const ld = await ll.json();
  if (!ld.TokenObject?.accessToken) throw new Error("Geen sessie");
  console.log("✓ Ingelogd\n");
  return ld.TokenObject.accessToken;
}

function hdrs(entity, token, instance = "KNKV") {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "text/plain;charset=UTF-8",
    "X-Navajo-Entity": entity,
    "X-Navajo-Instance": instance,
    "X-Navajo-Locale": "nl",
  };
}

async function tryEndpoint(method, entity, token, body = null, instance = "KNKV") {
  try {
    const opts = { method, headers: hdrs(entity, token, instance) };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${NAVAJO_BASE}/${entity}`, opts);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text.slice(0, 500);
    }
    const isError = data?.Error || res.status >= 400;
    if (!isError) {
      console.log(`✓ ${method} ${entity}${instance !== "KNKV" ? ` [${instance}]` : ""}`);
      console.log(`  ${JSON.stringify(data).slice(0, 300)}\n`);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function discover(token) {
  // Alle mogelijke entity-namen voor notifications/mutations
  const candidates = [
    // Notifications variaties
    "member/notifications",
    "member/notification",
    "member/notifications/Overview",
    "member/notifications/List",
    "member/notifications/Get",
    "member/notification/Overview",
    "member/notification/List",
    "notification/Overview",
    "notification/List",
    "notification/Get",
    "notifications/Overview",
    "notifications/List",
    "notifications/Get",
    "notifications/Members",
    "notifications/MemberNotifications",

    // Mutations variaties
    "member/mutations",
    "member/mutation",
    "member/mutations/Overview",
    "member/mutations/List",
    "member/mutation/Overview",
    "member/mutation/List",
    "mutation/Overview",
    "mutation/List",
    "mutation/Members",
    "mutations/Overview",
    "mutations/List",
    "mutations/Members",
    "member/search/Mutations",
    "member/search/MemberMutations",
    "member/search/Notifications",
    "member/search/MemberNotifications",
    "member/search/Changes",
    "member/search/MemberChanges",
    "member/search/History",
    "member/search/MemberHistory",
    "member/search/Log",
    "member/search/MemberLog",
    "member/search/Audit",
    "member/search/MemberAudit",

    // Wijzigingen
    "member/changes",
    "member/changes/Overview",
    "member/changes/List",
    "member/wijzigingen",
    "member/history",
    "member/log",
    "member/audit",
    "changes/Overview",
    "changes/List",
    "changes/Members",
    "wijzigingen/Overview",
    "history/Overview",
    "log/Overview",

    // Met filter prefix (zoals SearchMembers)
    "member/search/FilterNotifications",
    "member/search/FilterMutations",
    "member/search/FilterChanges",
    "member/search/FilterHistory",
    "member/search/SearchNotifications",
    "member/search/SearchMutations",
    "member/search/SearchChanges",
    "member/search/SearchHistory",

    // Member detail-achtige paden
    "member/detail/Notifications",
    "member/detail/Mutations",
    "member/detail/Changes",
    "member/detail/History",
    "member/overview/Notifications",
    "member/overview/Mutations",
    "member/overview/Changes",
    "member/overview/History",

    // Dashboard / home
    "dashboard/Overview",
    "dashboard/Notifications",
    "dashboard/Mutations",
    "home/Overview",
    "home/Notifications",
    "start/Overview",
    "start/Notifications",

    // Activity log
    "activity/Log",
    "activity/History",
    "activity/Changes",
    "activitylog/Overview",
    "activitylog/List",

    // Registraties specifiek
    "member/registration/Overview",
    "member/registration/List",
    "member/registration/History",
    "member/registration/Mutations",
    "member/deregistration/Overview",
    "member/deregistration/List",
    "registration/Overview",
    "registration/List",
    "registration/Members",
    "registration/New",
    "registration/Recent",
    "deregistration/Overview",
    "deregistration/List",

    // Aanmeldingen/afmeldingen
    "member/aanmeldingen",
    "member/afmeldingen",
    "aanmelding/Overview",
    "afmelding/Overview",

    // Club-niveau
    "club/notifications",
    "club/mutations",
    "club/changes",
    "club/Notifications",
    "club/Mutations",
    "club/Changes",
  ];

  let found = 0;
  for (const entity of candidates) {
    for (const method of ["GET", "POST"]) {
      const hit = await tryEndpoint(method, entity, token);
      if (hit) found++;
      await delay(80);
    }
    // Probeer ook met Generic instance
    const hit = await tryEndpoint("GET", entity, token, null, "Generic");
    if (hit) found++;
    await delay(80);
  }

  // Probeer ook de clubweb frontend JS op te halen voor hints
  console.log("\n═══ Frontend JS analyse ═══\n");
  try {
    const mainPage = await fetch("https://clubweb.sportlink.com", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const html = await mainPage.text();

    // Zoek naar JS bundle URLs
    const jsUrls = [...html.matchAll(/src="([^"]*\.js[^"]*)"/g)].map((m) => m[1]);
    console.log(`Gevonden JS bundles: ${jsUrls.length}`);

    for (const jsUrl of jsUrls.slice(0, 5)) {
      const fullUrl = jsUrl.startsWith("http") ? jsUrl : `https://clubweb.sportlink.com${jsUrl}`;
      console.log(`\nAnalyseren: ${fullUrl}`);
      try {
        const jsRes = await fetch(fullUrl);
        const jsText = await jsRes.text();

        // Zoek naar Navajo entity strings
        const entityMatches = [
          ...jsText.matchAll(
            /['"]((?:member|club|notification|mutation|change|history|registration|dashboard|activity|search|team|person|user)\/[a-zA-Z\/]+)['"]/gi
          ),
        ];
        const uniqueEntities = [...new Set(entityMatches.map((m) => m[1]))];

        if (uniqueEntities.length > 0) {
          console.log(`  Navajo entities gevonden in JS:`);
          for (const e of uniqueEntities) {
            console.log(`    - ${e}`);
          }
        }

        // Zoek ook naar "notification" of "mutation" in andere contexten
        const notifMatches = [
          ...jsText.matchAll(
            /["']([^"']*(?:notif|mutat|wijzig|change|history|aanmeld|afmeld)[^"']*?)["']/gi
          ),
        ];
        const uniqueNotif = [
          ...new Set(notifMatches.map((m) => m[1]).filter((s) => s.length > 5 && s.length < 80)),
        ];
        if (uniqueNotif.length > 0) {
          console.log(`  Notification/mutation gerelateerde strings:`);
          for (const n of uniqueNotif.slice(0, 30)) {
            console.log(`    - ${n}`);
          }
        }
      } catch (e) {
        console.log(`  Fout: ${e.message}`);
      }
    }
  } catch (e) {
    console.log(`Frontend ophalen mislukt: ${e.message}`);
  }

  console.log(`\n✓ Klaar. ${found} endpoints gevonden.`);
}

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Gebruik: node scripts/sportlink-discovery-notifications.mjs <email> <password>");
  process.exit(1);
}

try {
  const token = await login(email, password);
  await discover(token);
} catch (e) {
  console.error("✗ Fout:", e.message);
  process.exit(1);
}
